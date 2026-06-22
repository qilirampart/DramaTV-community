package com.dramatv.community.admin.auth;

import com.dramatv.community.admin.auditlogs.AdminAuditLogService;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.dto.request.LoginRequest;
import com.dramatv.community.identity.dto.response.AuthSessionResponse;
import com.dramatv.community.identity.dto.response.LoginResponse;
import com.dramatv.community.shared.error.ApiBusinessException;
import com.dramatv.community.shared.request.MdcBusinessContextScope;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
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
public class AdminAuthApplicationService {

    private static final Logger log = LoggerFactory.getLogger(AdminAuthApplicationService.class);
    private static final long SESSION_EXPIRES_IN_SECONDS = 7200;
    private static final String LOCAL_IDENTITY_PROVIDER = "local";
    private static final Map<String, String> LOCAL_BOOTSTRAP_ROLES = Map.of(
            "admin-chief", "admin",
            "operator-floor", "operator",
            "moderator-desk", "moderator"
    );

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final AdminAuthProperties adminAuthProperties;
    private final AdminAccessService adminAccessService;
    private final AdminAuditLogService adminAuditLogService;

    public AdminAuthApplicationService(
            JdbcTemplate jdbcTemplate,
            PasswordEncoder passwordEncoder,
            AdminAuthProperties adminAuthProperties,
            AdminAccessService adminAccessService,
            AdminAuditLogService adminAuditLogService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.adminAuthProperties = adminAuthProperties;
        this.adminAccessService = adminAccessService;
        this.adminAuditLogService = adminAuditLogService;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        if (!"password".equalsIgnoreCase(request.loginType())) {
            throw ApiBusinessException.badRequest("AUTH_LOGIN_TYPE_UNSUPPORTED", "login type is unsupported");
        }

        String normalizedUsername = normalizeUsername(request.username());
        LocalUser user = findLocalUser(normalizedUsername);
        user = ensureBootstrapUser(user, normalizedUsername, request.password());

        if (user == null || user.passwordHash() == null || user.passwordHash().isBlank()) {
            throw new ApiBusinessException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS", "username or password is invalid");
        }

        if (!passwordEncoder.matches(request.password(), user.passwordHash())) {
            throw new ApiBusinessException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS", "username or password is invalid");
        }

        if (!adminAccessService.isAdminRole(user.roleCode())) {
            throw ApiBusinessException.forbidden("ADMIN_ROLE_REQUIRED", "admin role is required");
        }

        String accessToken = AdminTokenSupport.newToken();
        String tokenHash = AdminTokenSupport.sha256(accessToken);
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

        CurrentUser currentUser = new CurrentUser(
                user.id(),
                user.username(),
                user.displayName(),
                null,
                null,
                null,
                user.roleCode(),
                LOCAL_IDENTITY_PROVIDER,
                user.username()
        );
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(sessionContext(user.id()))) {
            log.info(
                    "admin auth login success: operatorId={} username={} roleCode={} sessionExpiresInSeconds={}",
                    user.id(),
                    user.username(),
                    user.roleCode(),
                    SESSION_EXPIRES_IN_SECONDS
            );
            adminAuditLogService.recordAdminLoginSuccess(currentUser);
        }

        return new LoginResponse(
                accessToken,
                SESSION_EXPIRES_IN_SECONDS,
                new LoginResponse.AuthUser(user.id().toString(), user.displayName(), user.roleCode())
        );
    }

    public void logout(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        CurrentUser currentUser = null;
        try {
            currentUser = adminAccessService.requireAdminUser();
        } catch (ApiBusinessException ignored) {
            // Ignore missing/expired admin session on logout.
        }

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
                AdminTokenSupport.sha256(token)
        );

        if (currentUser != null) {
            try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(sessionContext(currentUser.id()))) {
                log.info(
                        "admin auth logout success: operatorId={} username={} roleCode={}",
                        currentUser.id(),
                        currentUser.username(),
                        currentUser.roleCode()
                );
                adminAuditLogService.recordSuccessfulOperation(
                        currentUser,
                        "auth",
                        "后台认证",
                        "logout",
                        "退出登录",
                        "session",
                        currentUser.id().toString(),
                        currentUser.displayName(),
                        "normal",
                        "后台退出登录",
                        "/api/admin/auth/logout",
                        "POST"
                );
            }
        }
    }

    public AuthSessionResponse currentSession() {
        CurrentUser currentUser = adminAccessService.requireAdminUser();
        return new AuthSessionResponse(
                currentUser.id().toString(),
                currentUser.username(),
                currentUser.displayName(),
                currentUser.avatarUrl(),
                currentUser.roleCode(),
                currentUser.identityProvider(),
                currentUser.externalSubject(),
                new AuthSessionResponse.CreatorProfile(currentUser.bio(), currentUser.headline())
        );
    }

    private LocalUser ensureBootstrapUser(LocalUser currentUser, String username, String password) {
        String bootstrapRole = LOCAL_BOOTSTRAP_ROLES.get(username);
        if (bootstrapRole == null || !adminAuthProperties.isAllowLocalBootstrap()) {
            return currentUser;
        }

        String configuredPassword = adminAuthProperties.getBootstrapPassword() == null
                ? ""
                : adminAuthProperties.getBootstrapPassword().trim();
        if (configuredPassword.isEmpty() || !configuredPassword.equals(password)) {
            return currentUser;
        }

        if (currentUser == null) {
            return createBootstrapUser(username, bootstrapRole, configuredPassword);
        }

        if (currentUser.passwordHash() == null || currentUser.passwordHash().isBlank() || !bootstrapRole.equals(currentUser.roleCode())) {
            String passwordHash = passwordEncoder.encode(configuredPassword);
            jdbcTemplate.update("""
                    update users
                    set password_hash = ?,
                        role_code = ?,
                        identity_provider = ?,
                        external_subject = coalesce(external_subject, username),
                        updated_at = now()
                    where id = ?
                    """,
                    passwordHash,
                    bootstrapRole,
                    LOCAL_IDENTITY_PROVIDER,
                    currentUser.id()
            );
            return new LocalUser(currentUser.id(), currentUser.username(), currentUser.displayName(), passwordHash, bootstrapRole);
        }

        return currentUser;
    }

    private LocalUser createBootstrapUser(String username, String roleCode, String password) {
        UUID userId = UUID.randomUUID();
        String passwordHash = passwordEncoder.encode(password);

        jdbcTemplate.update("""
                insert into users (
                    id, username, display_name, password_hash, identity_provider, external_subject,
                    role_code, status_code, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, ?, ?, 'active', now(), now())
                """,
                userId,
                username,
                username,
                passwordHash,
                LOCAL_IDENTITY_PROVIDER,
                username,
                roleCode
        );

        return new LocalUser(userId, username, username, passwordHash, roleCode);
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
                username,
                LOCAL_IDENTITY_PROVIDER
        );
    }

    private String normalizeUsername(String username) {
        String normalized = username == null ? "" : username.trim();
        if (normalized.isEmpty()) {
            throw ApiBusinessException.badRequest("AUTH_USERNAME_REQUIRED", "username is required");
        }
        return normalized;
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return null;
        }

        String token = authorizationHeader.substring("Bearer ".length()).trim();
        return token.isEmpty() ? null : token;
    }

    private Map<String, String> sessionContext(UUID userId) {
        LinkedHashMap<String, String> context = new LinkedHashMap<>();
        context.put("targetType", "session");
        context.put("targetId", userId.toString());
        return context;
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
