package com.dramatv.community.admin.users;

import com.dramatv.community.admin.auditlogs.AdminAuditLogService;
import com.dramatv.community.admin.auth.AdminAccessService;
import com.dramatv.community.admin.users.dto.request.AdminUserCreateRequest;
import com.dramatv.community.admin.users.dto.request.AdminUserGovernanceUpdateRequest;
import com.dramatv.community.admin.users.dto.response.AdminUserCreateResponse;
import com.dramatv.community.admin.users.dto.response.AdminUserDetailResponse;
import com.dramatv.community.admin.users.dto.response.AdminUserGovernanceUpdateResponse;
import com.dramatv.community.admin.users.dto.response.AdminUserPasswordGovernanceResponse;
import com.dramatv.community.admin.users.dto.response.AdminUserPasswordResetResponse;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.shared.error.ApiBusinessException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.security.SecureRandom;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminUserGovernanceService {

    private static final Logger log = LoggerFactory.getLogger(AdminUserGovernanceService.class);
    private static final String[] READ_ROLES = {"admin", "operator", "moderator"};
    private static final String[] MANAGE_ROLES = {"admin", "operator"};
    private static final Set<String> ALLOWED_ROLE_CODES = Set.of("creator", "admin", "operator", "moderator");
    private static final Set<String> ALLOWED_STATUS_CODES = Set.of("active", "pending", "disabled");
    private static final String LOCAL_IDENTITY_PROVIDER = "local";
    private static final String DEFAULT_CREATED_USER_PASSWORD = "dramatv-local-dev";
    private static final String PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    private static final SecureRandom PASSWORD_RANDOM = new SecureRandom();

    private static final String DETAIL_SQL = """
            select
                user_account.id,
                user_account.username,
                user_account.display_name,
                user_account.role_code,
                user_account.status_code,
                user_account.identity_provider,
                user_account.external_subject,
                user_account.password_hash,
                user_account.email,
                user_account.phone,
                user_account.bio,
                profile.headline,
                user_account.created_at,
                user_account.last_login_at,
                coalesce((
                    select count(*)
                    from videos video
                    where video.author_id = user_account.id
                      and video.publish_status = 'published'
                      and video.deleted_at is null
                ), 0) as video_count,
                coalesce((
                    select count(*)
                    from workflows workflow
                    where workflow.author_id = user_account.id
                      and workflow.publish_status = 'published'
                      and workflow.deleted_at is null
                ), 0) as workflow_count,
                coalesce((
                    select count(*)
                    from prompt_entries prompt
                    where prompt.author_id = user_account.id
                      and prompt.publish_status = 'published'
                      and prompt.deleted_at is null
                ), 0) as prompt_count,
                coalesce((
                    select count(*)
                    from discussion_threads thread
                    where thread.author_id = user_account.id
                      and thread.publish_status = 'published'
                      and thread.deleted_at is null
                ), 0) as post_count,
                coalesce(profile.follower_count, 0) as follower_count,
                coalesce(profile.like_received_count, 0) as like_received_count,
                coalesce((
                    select count(*)
                    from report_tickets report
                    where report.reporter_id = user_account.id
                ), 0) as reported_tickets,
                coalesce((
                    select count(*)
                    from report_tickets report
                    where report.assignee_id = user_account.id
                      and report.status_code in ('pending', 'processing')
                ), 0) as assigned_open_tickets,
                coalesce((
                    select count(*)
                    from report_tickets report
                    where report.status_code in ('pending', 'processing')
                      and (
                        (report.target_type = 'video' and exists (
                            select 1 from videos video
                            where video.id = report.target_id
                              and video.author_id = user_account.id
                        ))
                        or (report.target_type = 'workflow' and exists (
                            select 1 from workflows workflow
                            where workflow.id = report.target_id
                              and workflow.author_id = user_account.id
                        ))
                        or (report.target_type = 'prompt' and exists (
                            select 1 from prompt_entries prompt
                            where prompt.id = report.target_id
                              and prompt.author_id = user_account.id
                        ))
                        or (report.target_type = 'post' and exists (
                            select 1 from discussion_threads thread
                            where thread.id = report.target_id
                              and thread.author_id = user_account.id
                        ))
                      )
                ), 0) as open_reports_against_user
            from users user_account
            left join creator_profiles profile
              on profile.user_id = user_account.id
            where user_account.id = ?
              and user_account.deleted_at is null
            limit 1
            """;

    private static final String RECENT_CONTENT_SQL = """
            with recent_content as (
                select
                    'video' as target_type,
                    video.id as target_id,
                    video.title,
                    video.publish_status,
                    coalesce(video.published_at, video.created_at) as sort_at
                from videos video
                where video.author_id = ?
                  and video.deleted_at is null

                union all

                select
                    'workflow' as target_type,
                    workflow.id as target_id,
                    workflow.title,
                    workflow.publish_status,
                    coalesce(workflow.published_at, workflow.created_at) as sort_at
                from workflows workflow
                where workflow.author_id = ?
                  and workflow.deleted_at is null

                union all

                select
                    'prompt' as target_type,
                    prompt.id as target_id,
                    prompt.title,
                    prompt.publish_status,
                    coalesce(prompt.published_at, prompt.created_at) as sort_at
                from prompt_entries prompt
                where prompt.author_id = ?
                  and prompt.deleted_at is null

                union all

                select
                    'post' as target_type,
                    thread.id as target_id,
                    thread.title,
                    thread.publish_status,
                    coalesce(thread.published_at, thread.created_at) as sort_at
                from discussion_threads thread
                where thread.author_id = ?
                  and thread.deleted_at is null
            )
            select target_type, target_id, title, publish_status, sort_at
            from recent_content
            order by sort_at desc, target_type asc
            limit 6
            """;

    private final JdbcTemplate jdbcTemplate;
    private final AdminAccessService adminAccessService;
    private final AdminAuditLogService adminAuditLogService;
    private final PasswordEncoder passwordEncoder;

    public AdminUserGovernanceService(
            JdbcTemplate jdbcTemplate,
            AdminAccessService adminAccessService,
            AdminAuditLogService adminAuditLogService,
            PasswordEncoder passwordEncoder
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.adminAccessService = adminAccessService;
        this.adminAuditLogService = adminAuditLogService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AdminUserCreateResponse createUser(AdminUserCreateRequest request) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);

        String normalizedUsername = normalizeUsername(request.username());
        String normalizedDisplayName = normalizeDisplayName(request.displayName());
        String normalizedRoleCode = normalizeRoleCode(request.roleCode());
        String normalizedEmail = normalizeOptionalEmail(request.email());
        String normalizedPhone = normalizeOptionalPhone(request.phone());

        if (!ALLOWED_ROLE_CODES.contains(normalizedRoleCode)) {
            throw ApiBusinessException.badRequest("ADMIN_USER_ROLE_INVALID", "unsupported admin user role");
        }

        if ("admin".equals(normalizedRoleCode) && !"admin".equals(normalizeRoleCode(operator.roleCode()))) {
            throw ApiBusinessException.forbidden("ADMIN_USER_ASSIGN_ADMIN_FORBIDDEN", "only admin can assign admin role");
        }

        if (usernameExists(normalizedUsername)) {
            throw ApiBusinessException.conflict("ADMIN_USER_USERNAME_CONFLICT", "username already exists");
        }
        if (normalizedEmail != null && emailExists(normalizedEmail)) {
            throw ApiBusinessException.conflict("ADMIN_USER_EMAIL_CONFLICT", "email already exists");
        }
        if (normalizedPhone != null && phoneExists(normalizedPhone)) {
            throw ApiBusinessException.conflict("ADMIN_USER_PHONE_CONFLICT", "phone already exists");
        }

        UUID userId = UUID.randomUUID();
        String initialPassword = resolveCreatePassword(request.password());
        String passwordHash = passwordEncoder.encode(initialPassword);

        jdbcTemplate.update("""
                insert into users (
                    id,
                    username,
                    display_name,
                    password_hash,
                    identity_provider,
                    external_subject,
                    email,
                    phone,
                    role_code,
                    status_code,
                    created_at,
                    updated_at
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', now(), now())
                """,
                userId,
                normalizedUsername,
                normalizedDisplayName,
                passwordHash,
                LOCAL_IDENTITY_PROVIDER,
                normalizedUsername,
                normalizedEmail,
                normalizedPhone,
                normalizedRoleCode
        );

        jdbcTemplate.update("""
                insert into creator_profiles (
                    id, user_id, headline, featured_status, created_at, updated_at
                )
                values (?, ?, ?, 'normal', now(), now())
                """,
                UUID.randomUUID(),
                userId,
                buildCreatorHeadline(normalizedRoleCode)
        );

        log.info(
                "admin user create success: operatorId={} createdUserId={} username={} roleCode={}",
                operator.id(),
                userId,
                normalizedUsername,
                normalizedRoleCode
        );

        List<String> metadataParts = new ArrayList<>();
        metadataParts.add("username=" + normalizedUsername);
        metadataParts.add("displayName=" + normalizedDisplayName);
        metadataParts.add("roleCode=" + normalizedRoleCode);
        metadataParts.add("email=" + nullableMetadata(normalizedEmail));
        metadataParts.add("phone=" + nullableMetadata(normalizedPhone));
        metadataParts.add("passwordMode=" + (DEFAULT_CREATED_USER_PASSWORD.equals(initialPassword) ? "default" : "custom"));

        adminAuditLogService.recordSuccessfulOperation(
                operator,
                "users",
                "账号治理",
                "create_user",
                "创建账号",
                "user",
                userId.toString(),
                normalizedDisplayName,
                "admin".equals(normalizedRoleCode) ? "sensitive" : "normal",
                "已创建本地账号并设置初始密码",
                "/api/admin/users",
                "POST",
                String.join(", ", metadataParts)
        );

        return new AdminUserCreateResponse(
                userId.toString(),
                normalizedUsername,
                normalizedDisplayName,
                normalizedRoleCode,
                "active",
                initialPassword,
                adminAccessService.isAdminRole(normalizedRoleCode),
                true
        );
    }

    public AdminUserDetailResponse getUserDetail(String userIdText) {
        adminAccessService.requireAnyRole(READ_ROLES);

        UUID userId = parseUserId(userIdText);
        UserDetailRow row = jdbcTemplate.query(
                DETAIL_SQL,
                resultSet -> resultSet.next() ? mapUserDetailRow(resultSet) : null,
                userId
        );

        if (row == null) {
            throw ApiBusinessException.notFound("ADMIN_USER_NOT_FOUND", "admin user detail not found");
        }

        List<AdminUserDetailResponse.RecentContentItem> recentContents = jdbcTemplate.query(
                RECENT_CONTENT_SQL,
                (resultSet, rowNum) -> new AdminUserDetailResponse.RecentContentItem(
                        resultSet.getString("target_type"),
                        resultSet.getObject("target_id", UUID.class).toString(),
                        resultSet.getString("title"),
                        resultSet.getString("publish_status"),
                        resultSet.getObject("sort_at", OffsetDateTime.class)
                ),
                userId,
                userId,
                userId,
                userId
        );

        return new AdminUserDetailResponse(
                row.id().toString(),
                row.username(),
                row.displayName(),
                row.roleCode(),
                row.statusCode(),
                row.identityProvider(),
                row.email(),
                row.phone(),
                row.bio(),
                row.headline(),
                row.createdAt(),
                row.lastLoginAt(),
                new AdminUserDetailResponse.ContentStats(
                        row.videoCount(),
                        row.workflowCount(),
                        row.promptCount(),
                        row.postCount()
                ),
                new AdminUserDetailResponse.EngagementStats(
                        row.followerCount(),
                        row.likeReceivedCount()
                ),
                new AdminUserDetailResponse.ModerationStats(
                        row.reportedTickets(),
                        row.assignedOpenTickets(),
                        row.openReportsAgainstUser()
                ),
                buildGovernanceSummary(row),
                buildPasswordGovernanceSummary(row),
                recentContents
        );
    }

    @Transactional
    public AdminUserGovernanceUpdateResponse updateGovernance(String userIdText, AdminUserGovernanceUpdateRequest request) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);
        UUID userId = parseUserId(userIdText);
        UserDetailRow existing = jdbcTemplate.query(
                DETAIL_SQL,
                resultSet -> resultSet.next() ? mapUserDetailRow(resultSet) : null,
                userId
        );

        if (existing == null) {
            log.warn(
                    "admin user governance rejected: action=update operatorId={} managedUserId={} reason=user_not_found",
                    operator.id(),
                    userId
            );
            throw ApiBusinessException.notFound("ADMIN_USER_NOT_FOUND", "admin user detail not found");
        }

        String normalizedRoleCode = normalizeRoleCode(request.roleCode());
        String normalizedStatusCode = normalizeStatusCode(request.statusCode());

        if (!ALLOWED_ROLE_CODES.contains(normalizedRoleCode)) {
            throw ApiBusinessException.badRequest("ADMIN_USER_ROLE_INVALID", "unsupported admin user role");
        }
        if (!ALLOWED_STATUS_CODES.contains(normalizedStatusCode)) {
            throw ApiBusinessException.badRequest("ADMIN_USER_STATUS_INVALID", "unsupported admin user status");
        }

        if (operator.id().equals(existing.id())) {
            if (!"active".equals(normalizedStatusCode)) {
                log.warn(
                        "admin user governance rejected: action=update operatorId={} managedUserId={} reason=self_status_change_forbidden nextStatusCode={}",
                        operator.id(),
                        existing.id(),
                        normalizedStatusCode
                );
                throw ApiBusinessException.conflict("ADMIN_USER_SELF_STATUS_FORBIDDEN", "cannot disable current admin session user");
            }
            if (!normalizeRoleCode(operator.roleCode()).equals(normalizedRoleCode)) {
                log.warn(
                        "admin user governance rejected: action=update operatorId={} managedUserId={} reason=self_role_change_forbidden nextRoleCode={}",
                        operator.id(),
                        existing.id(),
                        normalizedRoleCode
                );
                throw ApiBusinessException.conflict("ADMIN_USER_SELF_ROLE_FORBIDDEN", "cannot change current admin session role");
            }
        }

        if ("admin".equals(normalizeRoleCode(existing.roleCode())) && "operator".equals(normalizeRoleCode(operator.roleCode()))) {
            log.warn(
                    "admin user governance rejected: action=update operatorId={} managedUserId={} reason=operator_cannot_manage_admin",
                    operator.id(),
                    existing.id()
            );
            throw ApiBusinessException.forbidden("ADMIN_USER_MANAGE_SUPERIOR_FORBIDDEN", "operator cannot manage admin account");
        }

        if ("admin".equals(normalizedRoleCode) && !"admin".equals(normalizeRoleCode(operator.roleCode()))) {
            log.warn(
                    "admin user governance rejected: action=update operatorId={} managedUserId={} reason=assign_admin_forbidden",
                    operator.id(),
                    existing.id()
            );
            throw ApiBusinessException.forbidden("ADMIN_USER_ASSIGN_ADMIN_FORBIDDEN", "only admin can assign admin role");
        }

        if ("admin".equals(normalizeRoleCode(existing.roleCode())) && !"admin".equals(normalizeRoleCode(operator.roleCode()))) {
            log.warn(
                    "admin user governance rejected: action=update operatorId={} managedUserId={} reason=change_admin_role_forbidden",
                    operator.id(),
                    existing.id()
            );
            throw ApiBusinessException.forbidden("ADMIN_USER_ADMIN_ROLE_PROTECTED", "only admin can change admin role");
        }

        jdbcTemplate.update(
                """
                update users
                set role_code = ?,
                    status_code = ?,
                    updated_at = now()
                where id = ?
                """,
                normalizedRoleCode,
                normalizedStatusCode,
                existing.id()
        );

        int revokedSessions = 0;
        if (!"active".equals(normalizedStatusCode)) {
            revokedSessions = jdbcTemplate.update(
                    """
                    update auth_sessions
                    set status_code = 'revoked',
                        revoked_at = now(),
                        updated_at = now()
                    where user_id = ?
                      and status_code = 'active'
                    """,
                    existing.id()
            );
        }

        log.info(
                "admin user governance update success: operatorId={} managedUserId={} previousRoleCode={} nextRoleCode={} previousStatusCode={} nextStatusCode={} revokedSessions={}",
                operator.id(),
                existing.id(),
                existing.roleCode(),
                normalizedRoleCode,
                existing.statusCode(),
                normalizedStatusCode,
                revokedSessions
        );
        String metadataText = buildMetadata(existing, normalizedRoleCode, normalizedStatusCode);
        adminAuditLogService.recordSuccessfulOperation(
                operator,
                "users",
                "账号治理",
                "update_user_governance",
                "更新账号治理",
                "user",
                existing.id().toString(),
                existing.displayName(),
                "admin".equals(normalizedRoleCode) || !"active".equals(normalizedStatusCode) ? "sensitive" : "normal",
                "更新账号角色与状态",
                "/api/admin/users/" + existing.id() + "/governance",
                "PUT",
                metadataText
        );

        return new AdminUserGovernanceUpdateResponse(
                existing.id().toString(),
                normalizedRoleCode,
                normalizedStatusCode,
                adminAccessService.isAdminRole(normalizedRoleCode),
                "active".equals(normalizedStatusCode),
                "active".equals(normalizedStatusCode)
        );
    }

    @Transactional
    public AdminUserPasswordResetResponse resetPassword(String userIdText) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);
        UUID userId = parseUserId(userIdText);
        UserDetailRow existing = jdbcTemplate.query(
                DETAIL_SQL,
                resultSet -> resultSet.next() ? mapUserDetailRow(resultSet) : null,
                userId
        );

        if (existing == null) {
            log.warn(
                    "admin user password reset rejected: operatorId={} managedUserId={} reason=user_not_found",
                    operator.id(),
                    userId
            );
            throw ApiBusinessException.notFound("ADMIN_USER_NOT_FOUND", "admin user detail not found");
        }

        if (operator.id().equals(existing.id())) {
            log.warn(
                    "admin user password reset rejected: operatorId={} managedUserId={} reason=self_reset_forbidden",
                    operator.id(),
                    existing.id()
            );
            throw ApiBusinessException.conflict("ADMIN_USER_SELF_PASSWORD_FORBIDDEN", "cannot reset current admin session password");
        }

        if ("admin".equals(normalizeRoleCode(existing.roleCode())) && !"admin".equals(normalizeRoleCode(operator.roleCode()))) {
            log.warn(
                    "admin user password reset rejected: operatorId={} managedUserId={} reason=admin_reset_forbidden",
                    operator.id(),
                    existing.id()
            );
            throw ApiBusinessException.forbidden("ADMIN_USER_ADMIN_PASSWORD_FORBIDDEN", "only admin can reset admin password");
        }

        String temporaryPassword = generateTemporaryPassword();
        String passwordHash = passwordEncoder.encode(temporaryPassword);
        boolean hasLocalPassword = existing.passwordHash() != null && !existing.passwordHash().isBlank();
        String passwordAction = hasLocalPassword ? "reset" : "initialize";

        jdbcTemplate.update(
                """
                update users
                set password_hash = ?,
                    identity_provider = ?,
                    external_subject = coalesce(external_subject, username),
                    updated_at = now()
                where id = ?
                """,
                passwordHash,
                LOCAL_IDENTITY_PROVIDER,
                existing.id()
        );

        int revokedSessions = jdbcTemplate.update(
                """
                update auth_sessions
                set status_code = 'revoked',
                    revoked_at = now(),
                    updated_at = now()
                where user_id = ?
                  and status_code = 'active'
                """,
                existing.id()
        );

        log.info(
                "admin user password reset success: operatorId={} managedUserId={} passwordAction={} identityProviderBefore={} identityProviderAfter={} revokedSessions={}",
                operator.id(),
                existing.id(),
                passwordAction,
                nullableMetadata(existing.identityProvider()),
                LOCAL_IDENTITY_PROVIDER,
                revokedSessions
        );
        String metadataText = String.join(
                ", ",
                "passwordAction=" + passwordAction,
                "identityProviderBefore=" + nullableMetadata(existing.identityProvider()),
                "identityProviderAfter=" + LOCAL_IDENTITY_PROVIDER,
                "revokedSessions=" + revokedSessions
        );
        adminAuditLogService.recordSuccessfulOperation(
                operator,
                "users",
                "账号治理",
                "reset_user_password",
                "重置账号密码",
                "user",
                existing.id().toString(),
                existing.displayName(),
                "sensitive",
                hasLocalPassword ? "已重置账号密码并撤销现有登录态" : "已初始化本地密码并撤销现有登录态",
                "/api/admin/users/" + existing.id() + "/password/reset",
                "POST",
                metadataText
        );

        return new AdminUserPasswordResetResponse(
                existing.id().toString(),
                passwordAction,
                temporaryPassword,
                "active".equals(normalizeStatusCode(existing.statusCode())),
                revokedSessions > 0
        );
    }

    private AdminUserDetailResponse.GovernanceSummary buildGovernanceSummary(UserDetailRow row) {
        boolean adminRole = adminAccessService.isAdminRole(row.roleCode());
        boolean canLogin = "active".equals(normalizeStatusCode(row.statusCode()));
        boolean canPublish = "active".equals(normalizeStatusCode(row.statusCode()));
        String statusNote = switch (normalizeStatusCode(row.statusCode())) {
            case "disabled" -> "账号已禁用，现有登录态会被撤销。";
            case "pending" -> "账号处于观察中，建议结合内容与举报记录继续复核。";
            default -> adminRole ? "账号具备后台权限，关键操作会进入审计日志。" : "账号当前处于正常可用状态。";
        };

        return new AdminUserDetailResponse.GovernanceSummary(
                adminRole,
                canLogin,
                canPublish,
                adminRole,
                statusNote
        );
    }

    private AdminUserPasswordGovernanceResponse buildPasswordGovernanceSummary(UserDetailRow row) {
        boolean hasLocalPassword = row.passwordHash() != null && !row.passwordHash().isBlank();
        String identityProvider = normalizeIdentityProvider(row.identityProvider());
        String passwordActionLabel = hasLocalPassword ? "重置密码" : "初始化密码";
        String passwordHint = hasLocalPassword
                ? "执行后会生成新的临时密码，并撤销该账号现有登录态。"
                : ("local".equals(identityProvider)
                ? "该账号尚未设置本地密码，初始化后可通过用户名和临时密码登录。"
                : "该账号当前不是本地密码登录，初始化后会补齐本地密码并切换到本地登录口径。");

        return new AdminUserPasswordGovernanceResponse(
                hasLocalPassword,
                !hasLocalPassword,
                hasLocalPassword,
                passwordActionLabel,
                passwordHint
        );
    }

    private UserDetailRow mapUserDetailRow(ResultSet resultSet) throws SQLException {
        return new UserDetailRow(
                resultSet.getObject("id", UUID.class),
                resultSet.getString("username"),
                resultSet.getString("display_name"),
                resultSet.getString("role_code"),
                resultSet.getString("status_code"),
                resultSet.getString("identity_provider"),
                resultSet.getString("password_hash"),
                resultSet.getString("email"),
                resultSet.getString("phone"),
                resultSet.getString("bio"),
                resultSet.getString("headline"),
                resultSet.getObject("created_at", OffsetDateTime.class),
                resultSet.getObject("last_login_at", OffsetDateTime.class),
                resultSet.getInt("video_count"),
                resultSet.getInt("workflow_count"),
                resultSet.getInt("prompt_count"),
                resultSet.getInt("post_count"),
                resultSet.getLong("follower_count"),
                resultSet.getLong("like_received_count"),
                resultSet.getLong("reported_tickets"),
                resultSet.getLong("assigned_open_tickets"),
                resultSet.getLong("open_reports_against_user")
        );
    }

    private UUID parseUserId(String userIdText) {
        try {
            return UUID.fromString(userIdText);
        } catch (Exception exception) {
            throw new ApiBusinessException(HttpStatus.BAD_REQUEST, "ADMIN_USER_ID_INVALID", "admin user id is invalid");
        }
    }

    private String normalizeRoleCode(String roleCode) {
        return roleCode == null ? "" : roleCode.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeUsername(String username) {
        String normalized = username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
        if (normalized.isEmpty()) {
            throw ApiBusinessException.badRequest("ADMIN_USER_USERNAME_REQUIRED", "username is required");
        }
        if (!normalized.matches("[a-z0-9][a-z0-9._-]{2,63}")) {
            throw ApiBusinessException.badRequest("ADMIN_USER_USERNAME_INVALID", "username format is invalid");
        }
        return normalized;
    }

    private String normalizeDisplayName(String displayName) {
        String normalized = displayName == null ? "" : displayName.trim();
        if (normalized.isEmpty()) {
            throw ApiBusinessException.badRequest("ADMIN_USER_DISPLAY_NAME_REQUIRED", "display name is required");
        }
        if (normalized.length() > 64) {
            throw ApiBusinessException.badRequest("ADMIN_USER_DISPLAY_NAME_INVALID", "display name is invalid");
        }
        return normalized;
    }

    private String normalizeStatusCode(String statusCode) {
        return statusCode == null ? "" : statusCode.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeIdentityProvider(String identityProvider) {
        return identityProvider == null ? "" : identityProvider.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeOptionalEmail(String email) {
        if (email == null) {
            return null;
        }

        String normalized = email.trim().toLowerCase(Locale.ROOT);
        if (normalized.isEmpty()) {
            return null;
        }
        if (normalized.length() > 128 || !normalized.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw ApiBusinessException.badRequest("ADMIN_USER_EMAIL_INVALID", "email format is invalid");
        }
        return normalized;
    }

    private String normalizeOptionalPhone(String phone) {
        if (phone == null) {
            return null;
        }

        String normalized = phone.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        if (normalized.length() > 32 || !normalized.matches("^[0-9+\\-()\\s]{6,32}$")) {
            throw ApiBusinessException.badRequest("ADMIN_USER_PHONE_INVALID", "phone format is invalid");
        }
        return normalized;
    }

    private boolean usernameExists(String username) {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                """
                select exists(
                    select 1
                    from users
                    where lower(username) = ?
                      and deleted_at is null
                )
                """,
                Boolean.class,
                username
        ));
    }

    private boolean emailExists(String email) {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                """
                select exists(
                    select 1
                    from users
                    where lower(email) = ?
                      and deleted_at is null
                )
                """,
                Boolean.class,
                email
        ));
    }

    private boolean phoneExists(String phone) {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                """
                select exists(
                    select 1
                    from users
                    where phone = ?
                      and deleted_at is null
                )
                """,
                Boolean.class,
                phone
        ));
    }

    private String buildCreatorHeadline(String roleCode) {
        return switch (roleCode) {
            case "admin" -> "系统管理员";
            case "operator" -> "社区运营";
            case "moderator" -> "内容审核";
            default -> "社区创作者";
        };
    }

    private String resolveCreatePassword(String password) {
        if (password == null) {
            return DEFAULT_CREATED_USER_PASSWORD;
        }

        String normalized = password.trim();
        if (normalized.isEmpty()) {
            return DEFAULT_CREATED_USER_PASSWORD;
        }
        return normalized;
    }

    private String buildMetadata(UserDetailRow existing, String nextRoleCode, String nextStatusCode) {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("previousRoleCode", existing.roleCode());
        fields.put("nextRoleCode", nextRoleCode);
        fields.put("previousStatusCode", existing.statusCode());
        fields.put("nextStatusCode", nextStatusCode);

        List<String> parts = new ArrayList<>();
        fields.forEach((key, value) -> parts.add(key + "=" + value));
        return String.join(", ", parts);
    }

    private String nullableMetadata(String value) {
        if (value == null || value.isBlank()) {
            return "null";
        }
        return value.trim();
    }

    private String generateTemporaryPassword() {
        StringBuilder builder = new StringBuilder("DT");
        for (int index = 0; index < 10; index += 1) {
            builder.append(PASSWORD_ALPHABET.charAt(PASSWORD_RANDOM.nextInt(PASSWORD_ALPHABET.length())));
        }
        return builder.toString();
    }

    private record UserDetailRow(
            UUID id,
            String username,
            String displayName,
            String roleCode,
            String statusCode,
            String identityProvider,
            String passwordHash,
            String email,
            String phone,
            String bio,
            String headline,
            OffsetDateTime createdAt,
            OffsetDateTime lastLoginAt,
            int videoCount,
            int workflowCount,
            int promptCount,
            int postCount,
            long followerCount,
            long likeReceivedCount,
            long reportedTickets,
            long assignedOpenTickets,
            long openReportsAgainstUser
    ) {
    }
}
