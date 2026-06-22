package com.dramatv.community.identity.application;

import com.dramatv.community.identity.dto.request.LoginRequest;
import com.dramatv.community.identity.dto.response.AuthProviderConfigResponse;
import com.dramatv.community.identity.dto.response.AuthSessionResponse;
import com.dramatv.community.identity.dto.response.LoginResponse;
import com.dramatv.community.shared.error.ApiBusinessException;
import com.dramatv.community.shared.request.MdcBusinessContextScope;
import com.dramatv.community.shared.request.RequestClientIpResolver;
import com.dramatv.community.shared.security.ActionRateLimiter;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthApplicationService {

    private static final Logger log = LoggerFactory.getLogger(AuthApplicationService.class);
    private static final long SESSION_EXPIRES_IN_SECONDS = 7200;
    private static final String LOCAL_IDENTITY_PROVIDER = "local";
    private static final String LOCAL_PASSWORD_LOGIN_TYPE = "local_password";

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUserService;
    private final CommunityAuthProperties communityAuthProperties;
    private final RequestClientIpResolver requestClientIpResolver;
    private final ActionRateLimiter actionRateLimiter;

    public AuthApplicationService(
            JdbcTemplate jdbcTemplate,
            PasswordEncoder passwordEncoder,
            CurrentUserService currentUserService,
            CommunityAuthProperties communityAuthProperties,
            RequestClientIpResolver requestClientIpResolver,
            ActionRateLimiter actionRateLimiter
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.currentUserService = currentUserService;
        this.communityAuthProperties = communityAuthProperties;
        this.requestClientIpResolver = requestClientIpResolver;
        this.actionRateLimiter = actionRateLimiter;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        if (!LOCAL_PASSWORD_LOGIN_TYPE.equalsIgnoreCase(request.loginType())
                && !"password".equalsIgnoreCase(request.loginType())) {
            throw ApiBusinessException.badRequest("AUTH_LOGIN_TYPE_UNSUPPORTED", "login type is unsupported");
        }
        if (!communityAuthProperties.getProvider().isLocalPasswordEnabled()) {
            throw ApiBusinessException.badRequest("AUTH_LOGIN_TYPE_DISABLED", "login type is disabled");
        }

        String normalizedUsername = request.username().trim();
        actionRateLimiter.checkLogin(requestClientIpResolver.currentOrFallback(), normalizedUsername);

        LocalUser user = findLocalUser(normalizedUsername);
        if (user == null) {
            user = createLocalDeveloperUser(normalizedUsername, request.password());
        }
        if (user.passwordHash() == null || user.passwordHash().isBlank()) {
            user = initializeLocalDeveloperPassword(user, request.password());
        }
        if (!passwordEncoder.matches(request.password(), user.passwordHash())) {
            throw new ApiBusinessException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS", "username or password is invalid");
        }

        String accessToken = AuthTokenSupport.newToken();
        String tokenHash = AuthTokenSupport.sha256(accessToken);
        OffsetDateTime expiresAt = OffsetDateTime.now().plusSeconds(SESSION_EXPIRES_IN_SECONDS);

        jdbcTemplate.update("""
                insert into auth_sessions (
                    id, user_id, token_hash, status_code, issued_at, expires_at, created_at, updated_at
                )
                values (?, ?, ?, 'active', now(), ?, now(), now())
                """,
                UUID.randomUUID(),
                user.id(),
                tokenHash,
                expiresAt
        );

        jdbcTemplate.update("update users set last_login_at = now(), updated_at = now() where id = ?", user.id());

        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(sessionContext(user.id()))) {
            log.info(
                    "auth login success: userId={} username={} roleCode={} sessionExpiresInSeconds={}",
                    user.id(),
                    user.username(),
                    user.roleCode(),
                    SESSION_EXPIRES_IN_SECONDS
            );
        }

        return new LoginResponse(
                accessToken,
                SESSION_EXPIRES_IN_SECONDS,
                new LoginResponse.AuthUser(user.id().toString(), user.displayName(), user.roleCode())
        );
    }

    public AuthProviderConfigResponse getProviderConfig() {
        CommunityAuthProperties.Provider provider = communityAuthProperties.getProvider();
        return new AuthProviderConfigResponse(
                provider.getPrimary(),
                List.of(new AuthProviderConfigResponse.LoginProvider(
                        LOCAL_PASSWORD_LOGIN_TYPE,
                        provider.getLocalPasswordDisplayName(),
                        provider.getLocalPasswordDescription(),
                        provider.isLocalPasswordEnabled(),
                        "password"
                ))
        );
    }

    public void logout(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        if (token == null) {
            return;
        }

        jdbcTemplate.update("""
                update auth_sessions
                set status_code = 'revoked',
                    revoked_at = now(),
                    updated_at = now()
                where token_hash = ?
                """,
                AuthTokenSupport.sha256(token)
        );

        CurrentUser currentUser = CurrentUserContext.currentOrNull();
        if (currentUser != null) {
            try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(sessionContext(currentUser.id()))) {
                log.info(
                        "auth logout success: userId={} username={} roleCode={}",
                        currentUser.id(),
                        currentUser.username(),
                        currentUser.roleCode()
                );
            }
        }
    }

    public AuthSessionResponse currentUser() {
        CurrentUser user = currentUserService.requireCurrentUser();
        return new AuthSessionResponse(
                user.id().toString(),
                user.username(),
                user.displayName(),
                user.avatarUrl(),
                user.roleCode(),
                user.identityProvider(),
                user.externalSubject(),
                new AuthSessionResponse.CreatorProfile(user.bio(), user.headline())
        );
    }

    private LocalUser findLocalUser(String username) {
        return jdbcTemplate.query("""
                select id, username, display_name, password_hash, role_code
                from users
                where username = ?
                  and identity_provider = ?
                  and status_code = 'active'
                  and deleted_at is null
                """,
                resultSet -> resultSet.next()
                        ? new LocalUser(
                                (UUID) resultSet.getObject("id"),
                                resultSet.getString("username"),
                                resultSet.getString("display_name"),
                                resultSet.getString("password_hash"),
                                resultSet.getString("role_code")
                        )
                        : null,
                username.trim(),
                LOCAL_IDENTITY_PROVIDER
        );
    }

    private LocalUser createLocalDeveloperUser(String username, String password) {
        requireLocalPasswordBootstrapSecret(password);

        UUID userId = UUID.randomUUID();
        String normalizedUsername = username.trim();
        String displayName = normalizedUsername;
        String passwordHash = passwordEncoder.encode(password);

        jdbcTemplate.update("""
                insert into users (
                    id, username, display_name, password_hash, identity_provider, external_subject,
                    role_code, status_code, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, ?, 'creator', 'active', now(), now())
                """,
                userId,
                normalizedUsername,
                displayName,
                passwordHash,
                LOCAL_IDENTITY_PROVIDER,
                normalizedUsername
        );

        jdbcTemplate.update("""
                insert into creator_profiles (
                    id, user_id, headline, featured_status, created_at, updated_at
                )
                values (?, ?, ?, 'normal', now(), now())
                """,
                UUID.randomUUID(),
                userId,
                "Local creator"
        );

        return new LocalUser(userId, normalizedUsername, displayName, passwordHash, "creator");
    }

    private LocalUser initializeLocalDeveloperPassword(LocalUser user, String password) {
        requireLocalPasswordBootstrapSecret(password);

        String passwordHash = passwordEncoder.encode(password);
        jdbcTemplate.update(
                "update users set password_hash = ?, identity_provider = ?, external_subject = coalesce(external_subject, username), updated_at = now() where id = ?",
                passwordHash,
                LOCAL_IDENTITY_PROVIDER,
                user.id()
        );

        return new LocalUser(user.id(), user.username(), user.displayName(), passwordHash, user.roleCode());
    }

    private void requireLocalPasswordBootstrapSecret(String password) {
        String configuredSecret = communityAuthProperties.getProvider().getLocalPasswordBootstrapSecret();
        if (configuredSecret == null || configuredSecret.isBlank() || !configuredSecret.equals(password)) {
            throw new ApiBusinessException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS", "username or password is invalid");
        }
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return null;
        }

        String token = authorizationHeader.substring("Bearer ".length()).trim();
        return token.isEmpty() ? null : token;
    }

    private Map<String, String> sessionContext(UUID userId) {
        return Map.of(
                "targetType", "session",
                "targetId", userId.toString()
        );
    }

    private record LocalUser(
            UUID id,
            String username,
            String displayName,
            String passwordHash,
            String roleCode
    ) {
    }
}
