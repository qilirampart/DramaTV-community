package com.dramatv.community.admin.auditlogs;

import com.dramatv.community.admin.auditlogs.dto.response.AdminAuditLogDetailResponse;
import com.dramatv.community.admin.auditlogs.dto.response.AdminAuditLogListResponse;
import com.dramatv.community.admin.auth.AdminAccessService;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.shared.error.ApiBusinessException;
import com.dramatv.community.shared.request.RequestIdContext;
import com.dramatv.community.shared.request.TraceIdContext;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AdminAuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AdminAuditLogService.class);

    private static final String[] MANAGE_ROLES = {"admin", "operator", "moderator"};
    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_PAGE_SIZE = 15;
    private static final int MAX_PAGE_SIZE = 100;

    private static final String FILTERED_LOG_ROWS_CTE = String.join("\n",
            "with log_rows as (",
            "    select",
            "        log.id,",
            "        log.operator_id,",
            "        log.operator_username,",
            "        log.operator_display_name,",
            "        log.operator_role_code,",
            "        log.module_code,",
            "        log.module_label,",
            "        log.action_code,",
            "        log.action_label,",
            "        log.target_type,",
            "        log.target_id,",
            "        log.target_title,",
            "        log.risk_level,",
            "        log.result_status,",
            "        log.note_text,",
            "        log.request_path,",
            "        log.request_method,",
            "        log.response_status,",
            "        log.request_id,",
            "        log.trace_id,",
            "        log.metadata_text,",
            "        log.created_at",
            "    from admin_operation_logs log",
            "    where (",
            "            cast(? as varchar) is null",
            "            or log.operator_username ilike ?",
            "            or log.operator_display_name ilike ?",
            "            or log.module_label ilike ?",
            "            or log.action_label ilike ?",
            "            or coalesce(log.target_title, '') ilike ?",
            "            or coalesce(log.target_id, '') ilike ?",
            "            or coalesce(log.note_text, '') ilike ?",
            "            or coalesce(log.request_id, '') ilike ?",
            "            or coalesce(log.trace_id, '') ilike ?",
            "            or coalesce(log.request_path, '') ilike ?",
            "        )",
            "      and (cast(? as varchar) is null or log.module_code = cast(? as varchar))",
            "      and (cast(? as varchar) is null or log.result_status = cast(? as varchar))",
            "      and (cast(? as varchar) is null or log.risk_level = cast(? as varchar))",
            ")"
    );

    private static final String SUMMARY_SQL = FILTERED_LOG_ROWS_CTE + String.join("\n",
            "select",
            "    count(*) filter (where created_at >= date_trunc('day', now())) as total_logs,",
            "    count(*) filter (where created_at >= date_trunc('day', now()) and risk_level = 'sensitive') as sensitive_logs,",
            "    count(*) filter (where created_at >= date_trunc('day', now()) and module_code in ('comments', 'moderation', 'reports')) as review_logs,",
            "    count(*) filter (where created_at >= date_trunc('day', now()) and module_code in ('taxonomy', 'feed_ops')) as publish_logs",
            "from log_rows"
    );

    private static final String LIST_SQL = FILTERED_LOG_ROWS_CTE + String.join("\n",
            "select *",
            "from log_rows",
            "order by created_at desc, id desc",
            "limit ?",
            "offset ?"
    );

    private static final String COUNT_SQL = FILTERED_LOG_ROWS_CTE + "select count(*) from log_rows";

    private static final String DETAIL_SQL = String.join("\n",
            "select",
            "    log.id,",
            "    log.operator_id,",
            "    log.operator_username,",
            "    log.operator_display_name,",
            "    log.operator_role_code,",
            "    log.module_code,",
            "    log.module_label,",
            "    log.action_code,",
            "    log.action_label,",
            "    log.target_type,",
            "    log.target_id,",
            "    log.target_title,",
            "    log.risk_level,",
            "    log.result_status,",
            "    log.note_text,",
            "    log.request_path,",
            "    log.request_method,",
            "    log.response_status,",
            "    log.request_id,",
            "    log.trace_id,",
            "    log.metadata_text,",
            "    log.created_at",
            "from admin_operation_logs log",
            "where log.id = ?",
            "limit 1"
    );

    private static final String INSERT_SQL = String.join("\n",
            "insert into admin_operation_logs (",
            "    id,",
            "    operator_id,",
            "    operator_username,",
            "    operator_display_name,",
            "    operator_role_code,",
            "    module_code,",
            "    module_label,",
            "    action_code,",
            "    action_label,",
            "    target_type,",
            "    target_id,",
            "    target_title,",
            "    risk_level,",
            "    result_status,",
            "    note_text,",
            "    request_path,",
            "    request_method,",
            "    response_status,",
            "    request_id,",
            "    trace_id,",
            "    metadata_text,",
            "    created_at",
            ")",
            "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now())"
    );

    private final JdbcTemplate jdbcTemplate;
    private final AdminAccessService adminAccessService;

    public AdminAuditLogService(
            JdbcTemplate jdbcTemplate,
            AdminAccessService adminAccessService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.adminAccessService = adminAccessService;
    }

    public AdminAuditLogListResponse listLogs(String query, String module, String result, String risk, Integer page, Integer pageSize) {
        adminAccessService.requireAnyRole(MANAGE_ROLES);

        String normalizedQuery = normalizeQuery(query);
        String likeQuery = normalizedQuery == null ? null : "%" + normalizedQuery + "%";
        String normalizedModule = normalizeModule(module);
        String normalizedResult = normalizeResult(result);
        String normalizedRisk = normalizeRisk(risk);
        int safePage = normalizePage(page);
        int safePageSize = normalizePageSize(pageSize);

        AdminAuditLogListResponse.Summary summary = jdbcTemplate.queryForObject(
                SUMMARY_SQL,
                (resultSet, rowNum) -> new AdminAuditLogListResponse.Summary(
                        resultSet.getLong("total_logs"),
                        resultSet.getLong("sensitive_logs"),
                        resultSet.getLong("review_logs"),
                        resultSet.getLong("publish_logs")
                ),
                normalizedQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                normalizedModule,
                normalizedModule,
                normalizedResult,
                normalizedResult,
                normalizedRisk,
                normalizedRisk
        );
        long totalItems = jdbcTemplate.queryForObject(
                COUNT_SQL,
                Long.class,
                normalizedQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                normalizedModule,
                normalizedModule,
                normalizedResult,
                normalizedResult,
                normalizedRisk,
                normalizedRisk
        );
        int totalPages = totalItems == 0 ? 1 : (int) Math.ceil((double) totalItems / safePageSize);
        int effectivePage = Math.min(safePage, totalPages);
        int offset = (effectivePage - 1) * safePageSize;

        List<AdminAuditLogListResponse.Item> items = jdbcTemplate.query(
                LIST_SQL,
                (resultSet, rowNum) -> toListItem(mapLogRow(resultSet)),
                normalizedQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                normalizedModule,
                normalizedModule,
                normalizedResult,
                normalizedResult,
                normalizedRisk,
                normalizedRisk,
                safePageSize,
                offset
        );

        return new AdminAuditLogListResponse(
                summary == null ? new AdminAuditLogListResponse.Summary(0, 0, 0, 0) : summary,
                new AdminAuditLogListResponse.Pagination(
                        effectivePage,
                        safePageSize,
                        totalItems,
                        totalPages,
                        effectivePage > 1,
                        effectivePage < totalPages
                ),
                items
        );
    }

    private int normalizePage(Integer page) {
        if (page == null || page < 1) {
            return DEFAULT_PAGE;
        }
        return page;
    }

    private int normalizePageSize(Integer pageSize) {
        if (pageSize == null || pageSize < 1) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(pageSize, MAX_PAGE_SIZE);
    }

    public AdminAuditLogDetailResponse getLog(String logIdText) {
        adminAccessService.requireAnyRole(MANAGE_ROLES);
        AuditLogRow row = loadLogRow(logIdText);
        return toDetailResponse(row);
    }

    public void recordAdminLoginSuccess(CurrentUser currentUser) {
        if (currentUser == null) {
            return;
        }

        recordSuccessfulOperation(
                currentUser,
                "auth",
                "后台认证",
                "login",
                "登录",
                "session",
                currentUser.id().toString(),
                currentUser.displayName(),
                "normal",
                "后台登录成功",
                "/api/admin/auth/login",
                "POST",
                "login-mode=password"
        );
    }

    public void recordSuccessfulOperation(
            CurrentUser currentUser,
            String moduleCode,
            String moduleLabel,
            String actionCode,
            String actionLabel,
            String targetType,
            String targetId,
            String targetTitle,
            String riskLevel,
            String noteText,
            String requestPath,
            String requestMethod
    ) {
        recordSuccessfulOperation(
                currentUser,
                moduleCode,
                moduleLabel,
                actionCode,
                actionLabel,
                targetType,
                targetId,
                targetTitle,
                riskLevel,
                noteText,
                requestPath,
                requestMethod,
                null
        );
    }

    public void recordSuccessfulOperation(
            CurrentUser currentUser,
            String moduleCode,
            String moduleLabel,
            String actionCode,
            String actionLabel,
            String targetType,
            String targetId,
            String targetTitle,
            String riskLevel,
            String noteText,
            String requestPath,
            String requestMethod,
            String metadataText
    ) {
        if (currentUser == null) {
            return;
        }

        recordAdminOperation(new AdminOperationLogEntry(
                currentUser.id(),
                currentUser.username(),
                currentUser.displayName(),
                currentUser.roleCode(),
                moduleCode,
                moduleLabel,
                actionCode,
                actionLabel,
                targetType,
                targetId,
                targetTitle,
                riskLevel,
                "success",
                noteText,
                requestPath,
                requestMethod,
                200,
                RequestIdContext.currentOrFallback(),
                TraceIdContext.currentOrFallback(),
                metadataText
        ));
    }

    public void recordAdminOperation(AdminOperationLogEntry entry) {
        if (entry == null || entry.operatorId() == null) {
            return;
        }

        try {
            jdbcTemplate.update(
                    INSERT_SQL,
                    UUID.randomUUID(),
                    entry.operatorId(),
                    requiredSnapshot(entry.operatorUsername(), "operatorUsername"),
                    requiredSnapshot(entry.operatorDisplayName(), "operatorDisplayName"),
                    requiredSnapshot(entry.operatorRoleCode(), "operatorRoleCode"),
                    requiredSnapshot(entry.moduleCode(), "moduleCode"),
                    requiredSnapshot(entry.moduleLabel(), "moduleLabel"),
                    requiredSnapshot(entry.actionCode(), "actionCode"),
                    requiredSnapshot(entry.actionLabel(), "actionLabel"),
                    nullableText(entry.targetType()),
                    nullableText(entry.targetId()),
                    nullableText(entry.targetTitle()),
                    normalizeRiskValue(entry.riskLevel()),
                    normalizeResultValue(entry.resultStatus()),
                    nullableText(entry.noteText()),
                    requiredSnapshot(entry.requestPath(), "requestPath"),
                    requiredSnapshot(entry.requestMethod(), "requestMethod"),
                    entry.responseStatus(),
                    nullableText(entry.requestId()),
                    nullableText(entry.traceId()),
                    nullableText(entry.metadataText())
            );
        } catch (Exception ex) {
            log.warn(
                    "Failed to persist admin audit log: module={} action={} targetType={} targetId={} requestId={}",
                    entry.moduleCode(),
                    entry.actionCode(),
                    entry.targetType(),
                    entry.targetId(),
                    entry.requestId(),
                    ex
            );
        }
    }

    private AdminAuditLogListResponse.Item toListItem(AuditLogRow row) {
        return new AdminAuditLogListResponse.Item(
                row.id().toString(),
                toIsoString(row.createdAt()),
                nullableUuidText(row.operatorId()),
                row.operatorUsername(),
                row.operatorDisplayName(),
                row.operatorRoleCode(),
                row.moduleCode(),
                row.moduleLabel(),
                row.actionCode(),
                row.actionLabel(),
                row.targetType(),
                row.targetId(),
                row.targetTitle(),
                row.resultStatus(),
                row.riskLevel(),
                row.noteText(),
                row.requestId(),
                row.traceId(),
                row.requestPath(),
                row.requestMethod(),
                row.responseStatus()
        );
    }

    private AdminAuditLogDetailResponse toDetailResponse(AuditLogRow row) {
        return new AdminAuditLogDetailResponse(
                row.id().toString(),
                toIsoString(row.createdAt()),
                nullableUuidText(row.operatorId()),
                row.operatorUsername(),
                row.operatorDisplayName(),
                row.operatorRoleCode(),
                row.moduleCode(),
                row.moduleLabel(),
                row.actionCode(),
                row.actionLabel(),
                row.targetType(),
                row.targetId(),
                row.targetTitle(),
                row.resultStatus(),
                row.riskLevel(),
                row.noteText(),
                row.requestId(),
                row.traceId(),
                row.requestPath(),
                row.requestMethod(),
                row.responseStatus(),
                row.metadataText()
        );
    }

    private AuditLogRow loadLogRow(String logIdText) {
        UUID logId = parseRequiredLogId(logIdText);
        AuditLogRow row = jdbcTemplate.query(
                DETAIL_SQL,
                resultSet -> resultSet.next() ? mapLogRow(resultSet) : null,
                logId
        );

        if (row == null) {
            throw ApiBusinessException.notFound("ADMIN_AUDIT_LOG_NOT_FOUND", "admin audit log not found");
        }

        return row;
    }

    private AuditLogRow mapLogRow(ResultSet resultSet) throws SQLException {
        return new AuditLogRow(
                resultSet.getObject("id", UUID.class),
                resultSet.getObject("operator_id", UUID.class),
                resultSet.getString("operator_username"),
                resultSet.getString("operator_display_name"),
                resultSet.getString("operator_role_code"),
                resultSet.getString("module_code"),
                resultSet.getString("module_label"),
                resultSet.getString("action_code"),
                resultSet.getString("action_label"),
                nullableText(resultSet, "target_type"),
                nullableText(resultSet, "target_id"),
                nullableText(resultSet, "target_title"),
                resultSet.getString("risk_level"),
                resultSet.getString("result_status"),
                nullableText(resultSet, "note_text"),
                resultSet.getString("request_path"),
                resultSet.getString("request_method"),
                resultSet.getInt("response_status"),
                nullableText(resultSet, "request_id"),
                nullableText(resultSet, "trace_id"),
                nullableText(resultSet, "metadata_text"),
                resultSet.getObject("created_at", OffsetDateTime.class)
        );
    }

    private String normalizeQuery(String query) {
        if (query == null) {
            return null;
        }

        String normalized = query.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeModule(String module) {
        if (module == null || module.isBlank()) {
            return null;
        }

        String normalized = module.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "auth", "comments", "moderation", "reports", "taxonomy", "feed_ops", "media_tasks" -> normalized;
            default -> throw ApiBusinessException.badRequest("ADMIN_AUDIT_LOG_FILTER_INVALID", "admin audit log filter is invalid");
        };
    }

    private String normalizeResult(String result) {
        if (result == null || result.isBlank()) {
            return null;
        }

        String normalized = result.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "success", "failed" -> normalized;
            default -> throw ApiBusinessException.badRequest("ADMIN_AUDIT_LOG_FILTER_INVALID", "admin audit log filter is invalid");
        };
    }

    private String normalizeRisk(String risk) {
        if (risk == null || risk.isBlank()) {
            return null;
        }

        String normalized = risk.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "normal", "sensitive" -> normalized;
            default -> throw ApiBusinessException.badRequest("ADMIN_AUDIT_LOG_FILTER_INVALID", "admin audit log filter is invalid");
        };
    }

    private String normalizeRiskValue(String riskLevel) {
        String normalized = normalizeRisk(riskLevel);
        return normalized == null ? "normal" : normalized;
    }

    private String normalizeResultValue(String resultStatus) {
        String normalized = normalizeResult(resultStatus);
        return normalized == null ? "success" : normalized;
    }

    private UUID parseRequiredLogId(String logIdText) {
        try {
            return UUID.fromString(logIdText);
        } catch (Exception ex) {
            throw ApiBusinessException.badRequest("ADMIN_AUDIT_LOG_ID_INVALID", "admin audit log id is invalid");
        }
    }

    private String requiredSnapshot(String value, String fieldName) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return normalized;
    }

    private String nullableText(ResultSet resultSet, String columnName) throws SQLException {
        String value = resultSet.getString(columnName);
        return value == null || value.isBlank() ? null : value;
    }

    private String nullableText(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String nullableUuidText(UUID value) {
        return value == null ? null : value.toString();
    }

    private String toIsoString(OffsetDateTime value) {
        return value == null ? null : value.toString();
    }

    private record AuditLogRow(
            UUID id,
            UUID operatorId,
            String operatorUsername,
            String operatorDisplayName,
            String operatorRoleCode,
            String moduleCode,
            String moduleLabel,
            String actionCode,
            String actionLabel,
            String targetType,
            String targetId,
            String targetTitle,
            String riskLevel,
            String resultStatus,
            String noteText,
            String requestPath,
            String requestMethod,
            int responseStatus,
            String requestId,
            String traceId,
            String metadataText,
            OffsetDateTime createdAt
    ) {
    }

    public record AdminOperationLogEntry(
            UUID operatorId,
            String operatorUsername,
            String operatorDisplayName,
            String operatorRoleCode,
            String moduleCode,
            String moduleLabel,
            String actionCode,
            String actionLabel,
            String targetType,
            String targetId,
            String targetTitle,
            String riskLevel,
            String resultStatus,
            String noteText,
            String requestPath,
            String requestMethod,
            int responseStatus,
            String requestId,
            String traceId,
            String metadataText
    ) {
    }
}
