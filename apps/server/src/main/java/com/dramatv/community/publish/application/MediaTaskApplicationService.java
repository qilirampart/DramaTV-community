package com.dramatv.community.publish.application;

import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserService;
import com.dramatv.community.publish.dto.response.MediaTaskResponse;
import com.dramatv.community.publish.dto.response.MediaTaskSummaryResponse;
import com.dramatv.community.shared.error.ApiBusinessException;
import com.dramatv.community.shared.request.MdcBusinessContextScope;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MediaTaskApplicationService {

    private static final Logger log = LoggerFactory.getLogger(MediaTaskApplicationService.class);
    private static final String VIDEO_MEDIA_PROCESS = "video_media_process";
    private static final String IMAGE_MEDIA_PROCESS = "image_media_process";

    private final JdbcTemplate jdbcTemplate;
    private final CurrentUserService currentUserService;

    public MediaTaskApplicationService(
            JdbcTemplate jdbcTemplate,
            CurrentUserService currentUserService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.currentUserService = currentUserService;
    }

    public Optional<MediaTaskResponse> findOwnedTask(String taskIdText) {
        UUID taskId = parseRequiredTaskId(taskIdText);
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        return findOwnedTask(taskId, currentUser.id()).map(this::toDetailResponse);
    }

    @Transactional
    public MediaTaskResponse retryOwnedTask(String taskIdText) {
        UUID taskId = parseRequiredTaskId(taskIdText);
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        OwnedMediaTaskRecord task = findOwnedTask(taskId, currentUser.id())
                .orElseThrow(() -> ApiBusinessException.notFound("MEDIA_TASK_NOT_FOUND", "media task not found"));

        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(retryContext(task))) {
            if (!isSupportedTaskType(task.taskType())) {
                log.warn(
                        "media task retry rejected: ownerId={} taskId={} targetType={} targetId={} taskType={} reason=unsupported_type",
                        currentUser.id(),
                        task.id(),
                        task.targetType(),
                        task.targetId(),
                        task.taskType()
                );
                throw ApiBusinessException.badRequest("MEDIA_TASK_TYPE_UNSUPPORTED", "media task type is unsupported");
            }
            if (!isRetryable(task.statusCode(), task.retryCount(), task.maxRetryCount())) {
                log.warn(
                        "media task retry rejected: ownerId={} taskId={} targetType={} targetId={} statusCode={} retryCount={} maxRetryCount={}",
                        currentUser.id(),
                        task.id(),
                        task.targetType(),
                        task.targetId(),
                        task.statusCode(),
                        task.retryCount(),
                        task.maxRetryCount()
                );
                throw ApiBusinessException.conflict("MEDIA_TASK_RETRY_FORBIDDEN", "media task cannot be retried");
            }

            int nextRetryCount = task.retryCount() + 1;
            jdbcTemplate.update("""
                    update async_task_records
                    set status_code = 'queued',
                        retry_count = ?,
                        error_message = null,
                        result_json = null,
                        scheduled_at = now(),
                        started_at = null,
                        finished_at = null,
                        updated_at = now()
                    where id = ?
                    """,
                    nextRetryCount,
                    task.id()
            );

            MediaTaskResponse response = findOwnedTask(task.id(), currentUser.id())
                    .map(this::toDetailResponse)
                    .orElseThrow(() -> ApiBusinessException.notFound("MEDIA_TASK_NOT_FOUND", "media task not found"));

            log.info(
                    "media task retry success: ownerId={} taskId={} targetType={} targetId={} previousStatus={} nextStatus={} previousRetryCount={} nextRetryCount={} maxRetryCount={}",
                    currentUser.id(),
                    task.id(),
                    task.targetType(),
                    task.targetId(),
                    task.statusCode(),
                    response.statusCode(),
                    task.retryCount(),
                    response.retryCount(),
                    response.maxRetryCount()
            );
            return response;
        }
    }

    public MediaTaskSummaryResponse latestSummaryForTarget(String targetType, UUID targetId) {
        if (targetType == null || targetType.isBlank() || targetId == null) {
            return null;
        }

        return jdbcTemplate.query("""
                select
                    task.id,
                    task.task_type,
                    task.target_type,
                    task.target_id,
                    null::uuid as author_id,
                    task.queue_name,
                    task.priority_level,
                    task.status_code,
                    task.retry_count,
                    task.max_retry_count,
                    task.error_message,
                    task.created_at,
                    task.started_at,
                    task.finished_at
                from async_task_records task
                where task.task_type in ('video_media_process', 'image_media_process')
                  and task.target_type = ?
                  and task.target_id = ?
                order by task.created_at desc
                limit 1
                """,
                resultSet -> resultSet.next() ? toSummaryResponse(mapOwnedTask(resultSet, null)) : null,
                targetType,
                targetId
        );
    }

    private Optional<OwnedMediaTaskRecord> findOwnedTask(UUID taskId, UUID ownerId) {
        return jdbcTemplate.query("""
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
                    task.created_at,
                    task.started_at,
                    task.finished_at,
                    owner.author_id
                from async_task_records task
                left join lateral (
                    select video.author_id
                    from videos video
                    where task.target_type = 'video'
                      and video.id = task.target_id
                    union all
                    select prompt.author_id
                    from prompt_entries prompt
                    where task.target_type = 'prompt'
                      and prompt.id = task.target_id
                    limit 1
                ) owner on true
                where task.id = ?
                  and task.task_type in ('video_media_process', 'image_media_process')
                """,
                resultSet -> {
                    if (!resultSet.next()) {
                        return Optional.empty();
                    }
                    OwnedMediaTaskRecord task = mapOwnedTask(resultSet, ownerId);
                    if (task.authorId() == null || !task.authorId().equals(ownerId)) {
                        throw ApiBusinessException.notFound("MEDIA_TASK_NOT_FOUND", "media task not found");
                    }
                    return Optional.of(task);
                },
                taskId
        );
    }

    private OwnedMediaTaskRecord mapOwnedTask(ResultSet resultSet, UUID ignoredOwnerId) throws SQLException {
        return new OwnedMediaTaskRecord(
                (UUID) resultSet.getObject("id"),
                resultSet.getString("task_type"),
                resultSet.getString("target_type"),
                (UUID) resultSet.getObject("target_id"),
                nullableUuid(resultSet, "author_id"),
                nullableText(resultSet, "queue_name"),
                resultSet.getObject("priority_level") == null ? 0 : resultSet.getInt("priority_level"),
                resultSet.getString("status_code"),
                resultSet.getObject("retry_count") == null ? 0 : resultSet.getInt("retry_count"),
                resultSet.getObject("max_retry_count") == null ? 0 : resultSet.getInt("max_retry_count"),
                nullableText(resultSet, "error_message"),
                resultSet.getObject("created_at", OffsetDateTime.class),
                resultSet.getObject("started_at", OffsetDateTime.class),
                resultSet.getObject("finished_at", OffsetDateTime.class)
        );
    }

    private MediaTaskResponse toDetailResponse(OwnedMediaTaskRecord task) {
        return new MediaTaskResponse(
                task.id().toString(),
                task.taskType(),
                task.targetType(),
                task.targetId().toString(),
                task.queueName(),
                task.priorityLevel(),
                task.statusCode(),
                task.retryCount(),
                task.maxRetryCount(),
                task.errorMessage(),
                toIsoString(task.createdAt()),
                toIsoString(task.startedAt()),
                toIsoString(task.finishedAt()),
                isRetryable(task.statusCode(), task.retryCount(), task.maxRetryCount())
        );
    }

    private MediaTaskSummaryResponse toSummaryResponse(OwnedMediaTaskRecord task) {
        return new MediaTaskSummaryResponse(
                task.id().toString(),
                task.taskType(),
                task.targetType(),
                task.targetId().toString(),
                task.statusCode(),
                task.retryCount(),
                task.maxRetryCount(),
                task.errorMessage(),
                toIsoString(task.createdAt()),
                toIsoString(task.startedAt()),
                toIsoString(task.finishedAt()),
                isRetryable(task.statusCode(), task.retryCount(), task.maxRetryCount())
        );
    }

    private boolean isRetryable(String statusCode, int retryCount, int maxRetryCount) {
        if (statusCode == null) {
            return false;
        }
        return "failed".equalsIgnoreCase(statusCode.trim()) && retryCount < Math.max(0, maxRetryCount);
    }

    private boolean isSupportedTaskType(String taskType) {
        return VIDEO_MEDIA_PROCESS.equals(taskType) || IMAGE_MEDIA_PROCESS.equals(taskType);
    }

    private Map<String, String> retryContext(OwnedMediaTaskRecord task) {
        LinkedHashMap<String, String> context = new LinkedHashMap<>();
        context.put("taskId", task.id().toString());
        context.put("targetType", task.targetType());
        context.put("targetId", task.targetId().toString());
        return context;
    }

    private UUID parseRequiredTaskId(String taskIdText) {
        try {
            return UUID.fromString(taskIdText);
        } catch (Exception ex) {
            throw ApiBusinessException.badRequest("MEDIA_TASK_ID_INVALID", "media task id is invalid");
        }
    }

    private String nullableText(ResultSet resultSet, String columnName) throws SQLException {
        String value = resultSet.getString(columnName);
        return value == null || value.isBlank() ? null : value;
    }

    private UUID nullableUuid(ResultSet resultSet, String columnName) throws SQLException {
        return (UUID) resultSet.getObject(columnName);
    }

    private String toIsoString(OffsetDateTime value) {
        return value == null ? null : value.toString();
    }

    private record OwnedMediaTaskRecord(
            UUID id,
            String taskType,
            String targetType,
            UUID targetId,
            UUID authorId,
            String queueName,
            int priorityLevel,
            String statusCode,
            int retryCount,
            int maxRetryCount,
            String errorMessage,
            OffsetDateTime createdAt,
            OffsetDateTime startedAt,
            OffsetDateTime finishedAt
    ) {
    }
}
