package com.dramatv.community.publish.application;

import com.dramatv.community.publish.dto.response.DraftLifecycleResponse;
import com.dramatv.community.publish.dto.response.MediaTaskSummaryResponse;
import com.dramatv.community.publish.persistence.PersistedPublishDraft;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Locale;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class PublishDraftLifecycleQueryService {

    private final JdbcTemplate jdbcTemplate;
    private final MediaTaskApplicationService mediaTaskApplicationService;

    public PublishDraftLifecycleQueryService(
            JdbcTemplate jdbcTemplate,
            MediaTaskApplicationService mediaTaskApplicationService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.mediaTaskApplicationService = mediaTaskApplicationService;
    }

    public DraftLifecycleResponse resolve(PersistedPublishDraft draft) {
        String draftStatus = draft.submittedAt() == null ? "draft" : "submitted";
        String moderationStatus = resolveModerationStatus(draft, draftStatus);
        String processingStatus = resolveProcessingStatus(draft, draftStatus);
        MediaTaskSummaryResponse mediaTask = resolveMediaTask(draft, draftStatus);
        return new DraftLifecycleResponse(
                draftStatus,
                moderationStatus,
                moderationMessage(moderationStatus),
                processingStatus,
                resolveProcessingMessage(draft, draftStatus, processingStatus),
                mediaTask,
                draft.submittedAt() == null,
                draft.submittedAt() == null ? null : draft.submittedAt().toString()
        );
    }

    private MediaTaskSummaryResponse resolveMediaTask(PersistedPublishDraft draft, String draftStatus) {
        String targetType = processingTargetType(draft);
        if (targetType == null || draft.targetId() == null || "draft".equals(draftStatus)) {
            return null;
        }

        return mediaTaskApplicationService.latestSummaryForTarget(targetType, draft.targetId());
    }

    private String resolveModerationStatus(PersistedPublishDraft draft, String draftStatus) {
        String targetType = moderationTargetType(draft);
        if (targetType == null) {
            return "not_applicable";
        }
        if (draft.targetId() == null || "draft".equals(draftStatus)) {
            return "not_submitted";
        }

        String latestStatus = jdbcTemplate.query("""
                select status_code
                from audit_records
                where target_type = ?
                  and target_id = ?
                order by created_at desc
                limit 1
                """,
                resultSet -> resultSet.next() ? normalizeModerationStatus(resultSet.getString("status_code")) : null,
                targetType,
                draft.targetId()
        );

        return latestStatus == null ? "not_applicable" : latestStatus;
    }

    private String resolveProcessingStatus(PersistedPublishDraft draft, String draftStatus) {
        String targetType = processingTargetType(draft);
        if (targetType == null) {
            return "not_applicable";
        }
        if (draft.targetId() == null || "draft".equals(draftStatus)) {
            return "not_submitted";
        }

        String latestStatus = jdbcTemplate.query("""
                select status_code
                from async_task_records
                where task_type = 'video_media_process'
                  and target_type = ?
                  and target_id = ?
                order by created_at desc
                limit 1
                """,
                resultSet -> resultSet.next() ? normalizeProcessingStatus(resultSet.getString("status_code")) : null,
                targetType,
                draft.targetId()
        );

        return latestStatus == null ? "not_requested" : latestStatus;
    }

    private String moderationTargetType(PersistedPublishDraft draft) {
        return switch (draft.draftType()) {
            case "video" -> isPromptDraft(draft.payloadJson()) ? "prompt" : "video";
            case "workflow" -> "workflow";
            default -> null;
        };
    }

    private String processingTargetType(PersistedPublishDraft draft) {
        if (!"video".equals(draft.draftType())) {
            return null;
        }

        String categoryCode = nullableText(draft.payloadJson(), "categoryCode");
        if ("image_prompt".equals(categoryCode)) {
            return null;
        }

        return "video_prompt".equals(categoryCode) ? "prompt" : "video";
    }

    private boolean isPromptDraft(ObjectNode payloadJson) {
        String categoryCode = nullableText(payloadJson, "categoryCode");
        return "video_prompt".equals(categoryCode) || "image_prompt".equals(categoryCode);
    }

    private String nullableText(ObjectNode payloadJson, String fieldName) {
        if (payloadJson == null) {
            return null;
        }

        JsonNode node = payloadJson.get(fieldName);
        if (node == null || node.isNull()) {
            return null;
        }

        String value = node.asText().trim();
        return value.isEmpty() ? null : value;
    }

    private String normalizeModerationStatus(String statusCode) {
        String normalized = normalizeStatusCode(statusCode);
        if (normalized == null) {
            return null;
        }

        return switch (normalized) {
            case "approved", "published", "passed", "succeeded" -> "approved";
            case "pending_review", "in_review", "reviewing" -> "pending_review";
            case "not_required", "not_needed", "skipped", "bypassed", "disabled" -> "not_applicable";
            case "rejected", "failed", "blocked" -> "rejected";
            case "taken_down" -> "taken_down";
            default -> normalized;
        };
    }

    private String normalizeProcessingStatus(String statusCode) {
        String normalized = normalizeStatusCode(statusCode);
        if (normalized == null) {
            return null;
        }

        return switch (normalized) {
            case "queued", "scheduled", "pending" -> "queued";
            case "processing", "running" -> "processing";
            case "succeeded", "success", "completed", "ready" -> "succeeded";
            case "failed", "error", "rejected", "blocked" -> "failed";
            default -> normalized;
        };
    }

    private String normalizeStatusCode(String statusCode) {
        if (statusCode == null || statusCode.isBlank()) {
            return null;
        }

        return statusCode.trim().toLowerCase(Locale.ROOT);
    }

    private String moderationMessage(String moderationStatus) {
        if (moderationStatus == null) {
            return null;
        }

        return switch (moderationStatus) {
            case "not_applicable" -> "当前阶段发布后直接可见，审核链路仅做预留";
            case "not_submitted" -> "草稿尚未提交，未进入审核";
            case "pending_review" -> "内容已提交，等待审核确认";
            case "approved" -> "审核已通过";
            case "rejected" -> "审核未通过";
            case "taken_down" -> "内容已下架";
            default -> null;
        };
    }

    private String resolveProcessingMessage(PersistedPublishDraft draft, String draftStatus, String processingStatus) {
        if (processingStatus == null || "not_applicable".equals(processingStatus)) {
            return null;
        }

        if ("not_submitted".equals(processingStatus)) {
            return "草稿尚未提交，媒体处理尚未开始";
        }

        if ("not_requested".equals(processingStatus)) {
            return "当前内容已提交，但暂未触发媒体处理任务";
        }

        if ("queued".equals(processingStatus)) {
            return "媒体任务已排队，等待处理";
        }

        if ("processing".equals(processingStatus)) {
            return "媒体处理中，系统正在生成封面、预览或压缩结果";
        }

        if ("succeeded".equals(processingStatus)) {
            return "媒体处理已完成";
        }

        if (!"failed".equals(processingStatus)) {
            return null;
        }

        if (draft.targetId() == null || "draft".equals(draftStatus)) {
            return "媒体处理失败";
        }

        String errorMessage = jdbcTemplate.query("""
                select error_message
                from async_task_records
                where task_type = 'video_media_process'
                  and target_type = ?
                  and target_id = ?
                order by created_at desc
                limit 1
                """,
                resultSet -> resultSet.next() ? normalizeErrorMessage(resultSet.getString("error_message")) : null,
                processingTargetType(draft),
                draft.targetId()
        );

        return errorMessage == null ? "媒体处理失败" : errorMessage;
    }

    private String normalizeErrorMessage(String errorMessage) {
        if (errorMessage == null) {
            return null;
        }

        String normalized = errorMessage.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
