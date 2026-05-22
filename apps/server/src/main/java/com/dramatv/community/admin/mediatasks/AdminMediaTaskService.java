package com.dramatv.community.admin.mediatasks;

import com.dramatv.community.admin.auditlogs.AdminAuditLogService;
import com.dramatv.community.admin.auth.AdminAccessService;
import com.dramatv.community.admin.mediatasks.dto.response.AdminMediaTaskActionResponse;
import com.dramatv.community.admin.mediatasks.dto.response.AdminMediaTaskDetailResponse;
import com.dramatv.community.admin.mediatasks.dto.response.AdminMediaTaskListResponse;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.shared.error.ApiBusinessException;
import com.dramatv.community.shared.request.MdcBusinessContextScope;
import com.dramatv.community.shared.security.SensitivePayloadSanitizer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminMediaTaskService {

    private static final Logger log = LoggerFactory.getLogger(AdminMediaTaskService.class);
    private static final String[] MANAGE_ROLES = {"admin", "operator", "moderator"};
    private static final String VIDEO_MEDIA_PROCESS = "video_media_process";
    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_PAGE_SIZE = 15;
    private static final int MAX_PAGE_SIZE = 100;
    private static final int CALLBACK_LOG_LIMIT = 8;

    private static final String BASE_TASK_ROWS_CTE = """
            with task_rows as (
                select
                    task.id,
                    task.task_type,
                    task.target_type,
                    task.target_id,
                    task.queue_name,
                    task.priority_level,
                    task.status_code,
                    task.retry_count,
                    task.max_retry_count,
                    task.error_message,
                    task.payload_json::text as payload_json,
                    task.result_json::text as result_json,
                    task.scheduled_at,
                    task.started_at,
                    task.finished_at,
                    task.created_at,
                    task.updated_at,
                    coalesce(
                        video.title,
                        prompt.title,
                        case
                            when task.target_type = 'video' then '已删除视频'
                            when task.target_type = 'prompt' then '已删除提示词'
                            else '已删除内容'
                        end
                    ) as target_title,
                    coalesce(video.summary, prompt.summary, '') as target_summary,
                    coalesce(video.publish_status, prompt.publish_status, 'unknown') as target_status_code,
                    coalesce(video_author.id, prompt_author.id) as target_author_id,
                    coalesce(video_author.display_name, prompt_author.display_name, '未知用户') as target_author_display_name
                from async_task_records task
                left join videos video
                    on task.target_type = 'video'
                   and video.id = task.target_id
                left join users video_author on video_author.id = video.author_id
                left join prompt_entries prompt
                    on task.target_type = 'prompt'
                   and prompt.id = task.target_id
                left join users prompt_author on prompt_author.id = prompt.author_id
                where task.task_type = 'video_media_process'
            )
            """;

    private static final String FILTERED_TASK_ROWS_CTE = BASE_TASK_ROWS_CTE + """
            ,
            filtered_task_rows as (
                select *
                from task_rows task
                where (
                        cast(? as varchar) is null
                        or task.id::text ilike ?
                        or task.target_title ilike ?
                        or task.target_summary ilike ?
                        or coalesce(task.target_author_display_name, '') ilike ?
                        or coalesce(task.error_message, '') ilike ?
                    )
                  and (cast(? as varchar) is null or task.status_code = cast(? as varchar))
                  and (cast(? as varchar) is null or task.target_type = cast(? as varchar))
            )
            """;

    private static final String SUMMARY_SQL = BASE_TASK_ROWS_CTE + """
            select
                count(*) as total_tasks,
                count(*) filter (where status_code = 'failed') as failed_tasks,
                count(*) filter (where status_code = 'failed' and retry_count < max_retry_count) as retryable_tasks,
                count(*) filter (where created_at >= date_trunc('day', now())) as today_tasks,
                count(*) filter (where status_code = 'processing') as processing_tasks
            from task_rows task
            where (
                    cast(? as varchar) is null
                    or task.id::text ilike ?
                    or task.target_title ilike ?
                    or task.target_summary ilike ?
                    or coalesce(task.target_author_display_name, '') ilike ?
                    or coalesce(task.error_message, '') ilike ?
                )
              and (cast(? as varchar) is null or task.status_code = cast(? as varchar))
              and (cast(? as varchar) is null or task.target_type = cast(? as varchar))
            """;

    private static final String LIST_SQL = FILTERED_TASK_ROWS_CTE + """
            select *
            from filtered_task_rows task
            order by
                case
                    when task.status_code = 'failed' then 0
                    when task.status_code = 'processing' then 1
                    when task.status_code = 'queued' then 2
                    else 3
                end,
                task.created_at desc,
                task.id desc
            limit ?
            offset ?
            """;

    private static final String COUNT_SQL = FILTERED_TASK_ROWS_CTE + """
            select count(*) from filtered_task_rows task
            """;

    private static final String DETAIL_SQL = BASE_TASK_ROWS_CTE + """
            select *
            from task_rows task
            where task.id = ?
            limit 1
            """;

    private static final String CALLBACK_LOG_SQL = """
            select
                log.id,
                log.callback_type,
                log.source_name,
                log.request_id,
                log.verify_status,
                log.process_status,
                log.raw_payload_json::text as raw_payload_json,
                log.created_at
            from task_callback_logs log
            where log.task_id = ?
            order by log.created_at desc
            limit ?
            """;

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final AdminAccessService adminAccessService;
    private final AdminAuditLogService adminAuditLogService;
    private final SensitivePayloadSanitizer sensitivePayloadSanitizer;

    public AdminMediaTaskService(
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            AdminAccessService adminAccessService,
            AdminAuditLogService adminAuditLogService,
            SensitivePayloadSanitizer sensitivePayloadSanitizer
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.adminAccessService = adminAccessService;
        this.adminAuditLogService = adminAuditLogService;
        this.sensitivePayloadSanitizer = sensitivePayloadSanitizer;
    }

    public AdminMediaTaskListResponse listTasks(String query, String status, String targetType, Integer page, Integer pageSize) {
        adminAccessService.requireAnyRole(MANAGE_ROLES);

        String normalizedQuery = normalizeQuery(query);
        String likeQuery = normalizedQuery == null ? null : "%" + normalizedQuery + "%";
        String normalizedStatus = normalizeStatus(status);
        String normalizedTargetType = normalizeTargetType(targetType);
        int safePage = normalizePage(page);
        int safePageSize = normalizePageSize(pageSize);

        AdminMediaTaskListResponse.Summary summary = jdbcTemplate.queryForObject(
                SUMMARY_SQL,
                (resultSet, rowNum) -> new AdminMediaTaskListResponse.Summary(
                        resultSet.getLong("total_tasks"),
                        resultSet.getLong("failed_tasks"),
                        resultSet.getLong("retryable_tasks"),
                        resultSet.getLong("today_tasks"),
                        resultSet.getLong("processing_tasks")
                ),
                normalizedQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                normalizedStatus,
                normalizedStatus,
                normalizedTargetType,
                normalizedTargetType
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
                normalizedStatus,
                normalizedStatus,
                normalizedTargetType,
                normalizedTargetType
        );
        int totalPages = totalItems == 0 ? 1 : (int) Math.ceil((double) totalItems / safePageSize);
        int effectivePage = Math.min(safePage, totalPages);
        int offset = (effectivePage - 1) * safePageSize;

        List<AdminMediaTaskListResponse.Item> items = jdbcTemplate.query(
                LIST_SQL,
                (resultSet, rowNum) -> mapListItem(resultSet),
                normalizedQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                normalizedStatus,
                normalizedStatus,
                normalizedTargetType,
                normalizedTargetType,
                safePageSize,
                offset
        );

        return new AdminMediaTaskListResponse(
                summary == null ? new AdminMediaTaskListResponse.Summary(0, 0, 0, 0, 0) : summary,
                new AdminMediaTaskListResponse.Pagination(
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

    public AdminMediaTaskDetailResponse getTask(String taskIdText) {
        adminAccessService.requireAnyRole(MANAGE_ROLES);
        MediaTaskRow task = loadTaskRow(taskIdText);
        return toDetailResponse(task, loadCallbackLogs(task.id()));
    }

    @Transactional
    public AdminMediaTaskActionResponse retryTask(String taskIdText) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);
        MediaTaskRow task = loadTaskRow(taskIdText);
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(retryContext(task))) {

            if (!isRetryable(task.statusCode(), task.retryCount(), task.maxRetryCount())) {
                log.warn(
                        "admin media task retry rejected: operatorId={} taskId={} targetType={} targetId={} statusCode={} retryCount={} maxRetryCount={}",
                        operator.id(),
                        task.id(),
                        task.targetType(),
                        task.targetId(),
                        task.statusCode(),
                        task.retryCount(),
                        task.maxRetryCount()
                );
                throw ApiBusinessException.conflict("ADMIN_MEDIA_TASK_RETRY_FORBIDDEN", "media task cannot be retried");
            }

            jdbcTemplate.update("""
                    update async_task_records
                    set status_code = 'queued',
                        retry_count = retry_count + 1,
                        error_message = null,
                        result_json = null,
                        scheduled_at = now(),
                        started_at = null,
                        finished_at = null,
                        updated_at = now()
                    where id = ?
                    """,
                    task.id()
            );

            MediaTaskRow reloaded = loadTaskRow(taskIdText);
            log.info(
                    "admin media task retry success: operatorId={} taskId={} targetType={} targetId={} previousStatus={} nextStatus={} previousRetryCount={} nextRetryCount={} maxRetryCount={}",
                    operator.id(),
                    reloaded.id(),
                    reloaded.targetType(),
                    reloaded.targetId(),
                    task.statusCode(),
                    reloaded.statusCode(),
                    task.retryCount(),
                    reloaded.retryCount(),
                    reloaded.maxRetryCount()
            );
            adminAuditLogService.recordSuccessfulOperation(
                    operator,
                    "media_tasks",
                    "媒体任务",
                    "retry",
                    "任务重试",
                    "media_task",
                    reloaded.id().toString(),
                    "媒体任务 " + reloaded.id(),
                    "normal",
                    "媒体任务已重新入队",
                    "/api/admin/media-tasks/" + reloaded.id() + "/retry",
                    "POST",
                    "taskType=%s,targetType=%s,targetId=%s".formatted(
                            reloaded.taskType(),
                            reloaded.targetType(),
                            reloaded.targetId()
                    )
            );
            return new AdminMediaTaskActionResponse(
                    "retry",
                    reloaded.id().toString(),
                    reloaded.statusCode(),
                    reloaded.retryCount(),
                    isRetryable(reloaded.statusCode(), reloaded.retryCount(), reloaded.maxRetryCount())
            );
        }
    }

    private AdminMediaTaskListResponse.Item mapListItem(ResultSet resultSet) throws SQLException {
        MediaTaskRow task = mapTaskRow(resultSet);
        return new AdminMediaTaskListResponse.Item(
                task.id().toString(),
                task.taskType(),
                task.targetType(),
                task.targetId().toString(),
                task.targetTitle(),
                task.targetSummary(),
                nullableUuidText(task.targetAuthorId()),
                task.targetAuthorDisplayName(),
                task.queueName(),
                task.priorityLevel(),
                task.statusCode(),
                task.retryCount(),
                task.maxRetryCount(),
                sensitivePayloadSanitizer.sanitizeText(task.errorMessage()),
                toIsoString(task.createdAt()),
                toIsoString(task.startedAt()),
                toIsoString(task.finishedAt()),
                isRetryable(task.statusCode(), task.retryCount(), task.maxRetryCount())
        );
    }

    private AdminMediaTaskDetailResponse toDetailResponse(MediaTaskRow task, List<AdminMediaTaskDetailResponse.CallbackLog> callbackLogs) {
        AdminMediaTaskDetailResponse.PayloadSummary payloadSummary = parsePayloadSummary(task.payloadJson());
        return new AdminMediaTaskDetailResponse(
                task.id().toString(),
                task.taskType(),
                task.targetType(),
                task.targetId().toString(),
                task.targetTitle(),
                task.targetSummary(),
                task.targetStatusCode(),
                nullableUuidText(task.targetAuthorId()),
                task.targetAuthorDisplayName(),
                task.queueName(),
                task.priorityLevel(),
                task.statusCode(),
                task.retryCount(),
                task.maxRetryCount(),
                sensitivePayloadSanitizer.sanitizeText(task.errorMessage()),
                toIsoString(task.createdAt()),
                toIsoString(task.startedAt()),
                toIsoString(task.finishedAt()),
                isRetryable(task.statusCode(), task.retryCount(), task.maxRetryCount()),
                payloadSummary,
                sensitivePayloadSanitizer.sanitizeJsonText(task.resultJson()),
                callbackLogs
        );
    }

    private MediaTaskRow loadTaskRow(String taskIdText) {
        UUID taskId = parseRequiredTaskId(taskIdText);
        MediaTaskRow task = jdbcTemplate.query(
                DETAIL_SQL,
                resultSet -> resultSet.next() ? mapTaskRow(resultSet) : null,
                taskId
        );

        if (task == null) {
            throw ApiBusinessException.notFound("ADMIN_MEDIA_TASK_NOT_FOUND", "media task not found");
        }

        return task;
    }

    private List<AdminMediaTaskDetailResponse.CallbackLog> loadCallbackLogs(UUID taskId) {
        return jdbcTemplate.query(
                CALLBACK_LOG_SQL,
                (resultSet, rowNum) -> new AdminMediaTaskDetailResponse.CallbackLog(
                        resultSet.getObject("id", UUID.class).toString(),
                        resultSet.getString("callback_type"),
                        resultSet.getString("source_name"),
                        nullableText(resultSet, "request_id"),
                        resultSet.getString("verify_status"),
                        resultSet.getString("process_status"),
                        sensitivePayloadSanitizer.sanitizeJsonText(nullableText(resultSet, "raw_payload_json")),
                        toIsoString(resultSet.getObject("created_at", OffsetDateTime.class))
                ),
                taskId,
                CALLBACK_LOG_LIMIT
        );
    }

    private MediaTaskRow mapTaskRow(ResultSet resultSet) throws SQLException {
        return new MediaTaskRow(
                resultSet.getObject("id", UUID.class),
                resultSet.getString("task_type"),
                resultSet.getString("target_type"),
                resultSet.getObject("target_id", UUID.class),
                resultSet.getString("queue_name"),
                resultSet.getObject("priority_level") == null ? 0 : resultSet.getInt("priority_level"),
                resultSet.getString("status_code"),
                resultSet.getObject("retry_count") == null ? 0 : resultSet.getInt("retry_count"),
                resultSet.getObject("max_retry_count") == null ? 0 : resultSet.getInt("max_retry_count"),
                nullableText(resultSet, "error_message"),
                nullableText(resultSet, "payload_json"),
                nullableText(resultSet, "result_json"),
                resultSet.getObject("scheduled_at", OffsetDateTime.class),
                resultSet.getObject("started_at", OffsetDateTime.class),
                resultSet.getObject("finished_at", OffsetDateTime.class),
                resultSet.getObject("created_at", OffsetDateTime.class),
                resultSet.getObject("updated_at", OffsetDateTime.class),
                nullableText(resultSet, "target_title"),
                nullableText(resultSet, "target_summary"),
                nullableText(resultSet, "target_status_code"),
                (UUID) resultSet.getObject("target_author_id"),
                nullableText(resultSet, "target_author_display_name")
        );
    }

    private AdminMediaTaskDetailResponse.PayloadSummary parsePayloadSummary(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return new AdminMediaTaskDetailResponse.PayloadSummary(null, null, null, null, null, List.of());
        }

        try {
            JsonNode payload = objectMapper.readTree(payloadJson);
            return new AdminMediaTaskDetailResponse.PayloadSummary(
                    nullablePayloadText(payload, "draftId"),
                    nullablePayloadText(payload, "submitMode"),
                    nullablePayloadText(payload, "sourceAssetId"),
                    nullablePayloadText(payload, "coverAssetId"),
                    nullablePayloadText(payload, "workflowId"),
                    readStringList(payload.get("desiredOutputs"))
            );
        } catch (Exception ex) {
            return new AdminMediaTaskDetailResponse.PayloadSummary(null, null, null, null, null, List.of());
        }
    }

    private List<String> readStringList(JsonNode node) {
        if (node == null || !node.isArray()) {
            return List.of();
        }

        List<String> values = new ArrayList<>();
        for (JsonNode item : node) {
            if (item == null || item.isNull()) {
                continue;
            }
            String value = item.asText().trim();
            if (!value.isEmpty()) {
                values.add(value);
            }
        }
        return List.copyOf(values);
    }

    private String nullablePayloadText(JsonNode payload, String fieldName) {
        if (payload == null) {
            return null;
        }

        JsonNode node = payload.get(fieldName);
        if (node == null || node.isNull()) {
            return null;
        }

        String value = node.asText().trim();
        return value.isEmpty() ? null : value;
    }

    private boolean isRetryable(String statusCode, int retryCount, int maxRetryCount) {
        if (statusCode == null) {
            return false;
        }
        return "failed".equalsIgnoreCase(statusCode.trim()) && retryCount < Math.max(0, maxRetryCount);
    }

    private Map<String, String> retryContext(MediaTaskRow task) {
        LinkedHashMap<String, String> context = new LinkedHashMap<>();
        context.put("taskId", task.id().toString());
        context.put("targetType", task.targetType());
        context.put("targetId", task.targetId().toString());
        return context;
    }

    private String normalizeQuery(String query) {
        if (query == null) {
            return null;
        }

        String normalized = query.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        String normalized = status.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "queued", "pending", "waiting" -> "queued";
            case "processing", "running" -> "processing";
            case "failed", "error" -> "failed";
            case "succeeded", "success", "completed", "ready" -> "succeeded";
            default -> throw ApiBusinessException.badRequest("ADMIN_MEDIA_TASK_FILTER_INVALID", "media task filter is invalid");
        };
    }

    private String normalizeTargetType(String targetType) {
        if (targetType == null || targetType.isBlank()) {
            return null;
        }

        String normalized = targetType.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "video", "prompt" -> normalized;
            default -> throw ApiBusinessException.badRequest("ADMIN_MEDIA_TASK_FILTER_INVALID", "media task filter is invalid");
        };
    }

    private UUID parseRequiredTaskId(String taskIdText) {
        try {
            return UUID.fromString(taskIdText);
        } catch (Exception ex) {
            throw ApiBusinessException.badRequest("ADMIN_MEDIA_TASK_ID_INVALID", "media task id is invalid");
        }
    }

    private String nullableText(ResultSet resultSet, String columnName) throws SQLException {
        String value = resultSet.getString(columnName);
        return value == null || value.isBlank() ? null : value;
    }

    private String nullableUuidText(UUID value) {
        return value == null ? null : value.toString();
    }

    private String toIsoString(OffsetDateTime value) {
        return value == null ? null : value.toString();
    }

    private record MediaTaskRow(
            UUID id,
            String taskType,
            String targetType,
            UUID targetId,
            String queueName,
            int priorityLevel,
            String statusCode,
            int retryCount,
            int maxRetryCount,
            String errorMessage,
            String payloadJson,
            String resultJson,
            OffsetDateTime scheduledAt,
            OffsetDateTime startedAt,
            OffsetDateTime finishedAt,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt,
            String targetTitle,
            String targetSummary,
            String targetStatusCode,
            UUID targetAuthorId,
            String targetAuthorDisplayName
    ) {
    }
}
