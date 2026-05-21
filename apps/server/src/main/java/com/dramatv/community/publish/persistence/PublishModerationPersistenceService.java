package com.dramatv.community.publish.persistence;

import com.dramatv.community.internal.dto.request.AuditCallbackRequest;
import com.dramatv.community.internal.dto.request.MediaCallbackRequest;
import com.dramatv.community.shared.request.MdcBusinessContextScope;
import com.dramatv.community.shared.security.SensitivePayloadSanitizer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
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
public class PublishModerationPersistenceService {

    private static final Logger log = LoggerFactory.getLogger(PublishModerationPersistenceService.class);

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final PublishedContentPersistenceService publishedContentPersistenceService;
    private final SensitivePayloadSanitizer sensitivePayloadSanitizer;

    public PublishModerationPersistenceService(
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            PublishedContentPersistenceService publishedContentPersistenceService,
            SensitivePayloadSanitizer sensitivePayloadSanitizer
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.publishedContentPersistenceService = publishedContentPersistenceService;
        this.sensitivePayloadSanitizer = sensitivePayloadSanitizer;
    }

    @Transactional
    public String applyAuditCallback(AuditCallbackRequest request) {
        String targetType = normalizeAuditTargetType(request.targetType());
        UUID targetId = parseUuid(request.targetId());
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(
                callbackContext(request.taskId(), request.targetType(), request.targetId()))) {
            if (targetType == null || targetId == null) {
                log.warn(
                        "audit callback ignored: taskId={} requestTargetType={} requestTargetId={} requestStatus={} reason=invalid_target",
                        request.taskId(),
                        request.targetType(),
                        request.targetId(),
                        request.statusCode()
                );
                return request.statusCode();
            }

            ModerationDecision decision = ModerationDecision.from(request.statusCode());
            OffsetDateTime operatedAt = OffsetDateTime.now();

            UUID authorId = findAuthorId(targetType, targetId);
            UUID workflowId = "video".equals(targetType) ? findVideoWorkflowId(targetId) : targetId;

            applyPublishStatus(targetType, targetId, decision, operatedAt);
            syncDraftStatus(targetType, targetId, decision.contentStatus());
            upsertAuditRecord(request, targetType, targetId, decision, operatedAt);

            if (decision.shouldBeVisibleInCommunity()) {
                upsertFeedItems(targetType, targetId, operatedAt);
            } else if (decision.shouldDeactivateFeed()) {
                deactivateFeedItems(targetType, targetId);
            }

            if (workflowId != null) {
                publishedContentPersistenceService.syncWorkflowVideoBindCount(workflowId);
            }
            if (authorId != null) {
                publishedContentPersistenceService.syncCreatorProfileCounts(authorId);
            }

            log.info(
                    "audit callback applied: taskId={} targetType={} targetId={} requestStatus={} auditStatus={} contentStatus={} visibleInCommunity={} deactivatedFeed={} riskTagCount={}",
                    request.taskId(),
                    targetType,
                    targetId,
                    request.statusCode(),
                    decision.auditStatus(),
                    decision.contentStatus(),
                    decision.shouldBeVisibleInCommunity(),
                    decision.shouldDeactivateFeed(),
                    request.riskTags() == null ? 0 : request.riskTags().size()
            );
            return decision.callbackStatus();
        }
    }

    @Transactional
    public String applyMediaCallback(MediaCallbackRequest request) {
        String targetType = normalizeMediaTargetType(request.targetType());
        UUID targetId = parseUuid(request.targetId());
        UUID callbackTaskId = resolveExistingAsyncTaskId(parseUuid(request.taskId()));
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(
                callbackContext(request.taskId(), request.targetType(), request.targetId()))) {
            MediaCallbackDecision decision = MediaCallbackDecision.from(request.statusCode());

            MediaCallbackRequest.Result result = request.result();
            UUID coverAssetId = resolveReadyAssetId(result == null ? null : result.coverAssetId(), "image");
            UUID previewAssetId = resolveReadyAssetId(result == null ? null : result.previewAssetId(), "video");
            Integer durationMs = sanitizeDurationMs(result == null ? null : result.durationMs());
            String taskErrorMessage = decision.errorMessage(result == null ? null : result.errorMessage());

            boolean applied = false;
            if (decision.shouldApplyToTarget() && targetId != null) {
                if ("video".equals(targetType)) {
                    applyVideoMediaResult(targetId, coverAssetId, previewAssetId, durationMs);
                    applied = true;
                } else if ("prompt".equals(targetType)) {
                    applyPromptMediaResult(targetId, coverAssetId, previewAssetId, durationMs);
                    applied = true;
                }
            }

            upsertAsyncTaskRecord(callbackTaskId, decision, targetType, targetId, coverAssetId, previewAssetId, durationMs, taskErrorMessage);
            insertTaskCallbackLog(callbackTaskId, request, targetType, targetId, decision, applied);
            log.info(
                    "media callback applied: taskId={} resolvedTaskId={} targetType={} targetId={} requestStatus={} taskStatus={} applied={} coverAssetId={} previewAssetId={} durationMs={} errorMessagePresent={}",
                    request.taskId(),
                    callbackTaskId,
                    targetType,
                    targetId,
                    request.statusCode(),
                    decision.taskStatus(),
                    applied,
                    coverAssetId,
                    previewAssetId,
                    durationMs,
                    taskErrorMessage != null && !taskErrorMessage.isBlank()
            );
            return decision.callbackStatus();
        }
    }

    private Map<String, String> callbackContext(String taskId, String rawTargetType, String rawTargetId) {
        if (taskId == null && rawTargetType == null && rawTargetId == null) {
            return Map.of();
        }

        ObjectNode context = objectMapper.createObjectNode();
        if (taskId != null && !taskId.isBlank()) {
            context.put("taskId", taskId.trim());
        }
        if (rawTargetType != null && !rawTargetType.isBlank()) {
            context.put("targetType", rawTargetType.trim());
        }
        if (rawTargetId != null && !rawTargetId.isBlank()) {
            context.put("targetId", rawTargetId.trim());
        }
        return objectMapper.convertValue(context, Map.class);
    }

    private void applyPublishStatus(
            String targetType,
            UUID targetId,
            ModerationDecision decision,
            OffsetDateTime operatedAt
    ) {
        if ("video".equals(targetType)) {
            jdbcTemplate.update("""
                    update videos
                    set publish_status = ?,
                        published_at = ?,
                        updated_at = now()
                    where id = ? and deleted_at is null
                    """,
                    decision.contentStatus(),
                    decision.publishedAtValue(operatedAt),
                    targetId
            );
            return;
        }

        jdbcTemplate.update("""
                update workflows
                set publish_status = ?,
                    published_at = ?,
                    updated_at = now()
                where id = ? and deleted_at is null
                """,
                decision.contentStatus(),
                decision.publishedAtValue(operatedAt),
                targetId
        );
    }

    private void syncDraftStatus(String targetType, UUID targetId, String statusCode) {
        jdbcTemplate.update("""
                update publish_drafts
                set status_code = ?,
                    updated_at = now()
                where draft_type = ? and target_id = ?
                """,
                statusCode,
                targetType,
                targetId
        );
    }

    private void upsertAuditRecord(
            AuditCallbackRequest request,
            String targetType,
            UUID targetId,
            ModerationDecision decision,
            OffsetDateTime operatedAt
    ) {
        ObjectNode detailJson = objectMapper.createObjectNode();
        detailJson.put("taskId", request.taskId());
        detailJson.put("sourceStatusCode", request.statusCode());
        detailJson.put("handledAt", operatedAt.toString());

        ArrayNode riskTags = detailJson.putArray("riskTags");
        if (request.riskTags() != null) {
            request.riskTags().stream()
                    .filter(tag -> tag != null && !tag.isBlank())
                    .map(String::trim)
                    .distinct()
                    .forEach(riskTags::add);
        }

        Integer updatedRows = jdbcTemplate.query("""
                with latest as (
                    select id
                    from audit_records
                    where target_type = ? and target_id = ?
                    order by created_at desc
                    limit 1
                )
                update audit_records
                set status_code = ?,
                    risk_level = ?,
                    reason_code = ?,
                    detail_json = coalesce(detail_json, '{}'::jsonb) || cast(? as jsonb)
                where id in (select id from latest)
                returning 1
                """,
                resultSet -> resultSet.next() ? resultSet.getInt(1) : 0,
                targetType,
                targetId,
                decision.auditStatus(),
                decision.riskLevel(request.riskTags()),
                primaryRiskTag(request.riskTags()),
                detailJson.toString()
        );

        if (updatedRows != null && updatedRows > 0) {
            return;
        }

        jdbcTemplate.update("""
                insert into audit_records (
                    id, target_type, target_id, audit_type, status_code, risk_level, reason_code,
                    operator_type, operator_id, detail_json, created_at
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, null, cast(? as jsonb), now())
                """,
                UUID.randomUUID(),
                targetType,
                targetId,
                "publish_review",
                decision.auditStatus(),
                decision.riskLevel(request.riskTags()),
                primaryRiskTag(request.riskTags()),
                "system",
                detailJson.toString()
        );
    }

    private void upsertFeedItems(String targetType, UUID targetId, OffsetDateTime publishedAt) {
        BigDecimal recommendRank = BigDecimal.valueOf(publishedAt.toEpochSecond())
                .movePointLeft(2)
                .setScale(4);
        BigDecimal hotRank = recommendRank;

        upsertFeedItem("recommend", targetType, targetId, recommendRank, publishedAt);
        upsertFeedItem("hot", targetType, targetId, hotRank, publishedAt);
    }

    private void upsertFeedItem(
            String channelCode,
            String targetType,
            UUID targetId,
            BigDecimal rankScore,
            OffsetDateTime publishedAt
    ) {
        String contentKind = toContentKind(targetType);
        jdbcTemplate.update("""
                insert into feed_items (
                    id, channel_code, content_kind, item_type, target_type, target_id, rank_score, status_code, published_at, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, ?, ?, 'active', ?, now(), now())
                on conflict (channel_code, target_type, target_id) do update
                set content_kind = excluded.content_kind,
                    item_type = excluded.item_type,
                    rank_score = excluded.rank_score,
                    status_code = 'active',
                    published_at = excluded.published_at,
                    updated_at = now()
                """,
                UUID.randomUUID(),
                channelCode,
                contentKind,
                legacyItemType(targetType),
                targetType,
                targetId,
                rankScore,
                publishedAt
        );
    }

    private void deactivateFeedItems(String targetType, UUID targetId) {
        jdbcTemplate.update("""
                update feed_items
                set status_code = 'inactive',
                    updated_at = now()
                where target_type = ? and target_id = ?
                """,
                targetType,
                targetId
        );
    }

    private String legacyItemType(String targetType) {
        if (targetType == null || targetType.isBlank()) {
            return "video";
        }
        return targetType;
    }

    private UUID findAuthorId(String targetType, UUID targetId) {
        String tableName = "video".equals(targetType) ? "videos" : "workflows";
        return jdbcTemplate.query(
                "select author_id from " + tableName + " where id = ?",
                resultSet -> resultSet.next() ? (UUID) resultSet.getObject("author_id") : null,
                targetId
        );
    }

    private UUID findVideoWorkflowId(UUID videoId) {
        return jdbcTemplate.query("""
                select workflow_id
                from videos
                where id = ?
                """,
                resultSet -> resultSet.next() ? (UUID) resultSet.getObject("workflow_id") : null,
                videoId
        );
    }

    private UUID findVideoSourceAssetId(UUID videoId) {
        return jdbcTemplate.query("""
                select source_asset_id
                from videos
                where id = ?
                """,
                resultSet -> resultSet.next() ? (UUID) resultSet.getObject("source_asset_id") : null,
                videoId
        );
    }

    private UUID findPromptPrimaryExampleAssetId(UUID promptId) {
        return jdbcTemplate.query("""
                select primary_example_asset_id
                from prompt_entries
                where id = ?
                """,
                resultSet -> resultSet.next() ? (UUID) resultSet.getObject("primary_example_asset_id") : null,
                promptId
        );
    }

    private UUID resolveExistingAsyncTaskId(UUID taskId) {
        if (taskId == null) {
            return null;
        }

        Boolean exists = jdbcTemplate.queryForObject(
                "select exists(select 1 from async_task_records where id = ?)",
                Boolean.class,
                taskId
        );
        return Boolean.TRUE.equals(exists) ? taskId : null;
    }

    private void applyVideoMediaResult(
            UUID targetId,
            UUID coverAssetId,
            UUID previewAssetId,
            Integer durationMs
    ) {
        jdbcTemplate.update(connection -> {
            java.sql.PreparedStatement statement = connection.prepareStatement("""
                    update videos
                    set cover_asset_id = coalesce(cover_asset_id, ?),
                        poster_asset_id = coalesce(poster_asset_id, cover_asset_id, ?),
                        preview_asset_id = coalesce(?, preview_asset_id),
                        duration_ms = coalesce(?, duration_ms),
                        updated_at = now()
                    where id = ? and deleted_at is null
                    """);
            setNullableUuid(statement, 1, coverAssetId);
            setNullableUuid(statement, 2, coverAssetId);
            setNullableUuid(statement, 3, previewAssetId);
            setNullableInteger(statement, 4, durationMs);
            statement.setObject(5, targetId);
            return statement;
        });

        if (durationMs == null) {
            return;
        }

        UUID sourceAssetId = findVideoSourceAssetId(targetId);
        updateMediaDuration(sourceAssetId, durationMs);
        updateMediaDuration(previewAssetId, durationMs);
    }

    private void applyPromptMediaResult(
            UUID targetId,
            UUID coverAssetId,
            UUID previewAssetId,
            Integer durationMs
    ) {
        jdbcTemplate.update(connection -> {
            java.sql.PreparedStatement statement = connection.prepareStatement("""
                    update prompt_entries
                    set cover_asset_id = coalesce(cover_asset_id, ?),
                        updated_at = now()
                    where id = ? and deleted_at is null
                    """);
            setNullableUuid(statement, 1, coverAssetId);
            statement.setObject(2, targetId);
            return statement;
        });

        if (previewAssetId != null) {
            jdbcTemplate.update("""
                    delete from prompt_example_links
                    where prompt_id = ?
                      and role_code = 'preview'
                    """,
                    targetId
            );

            jdbcTemplate.update("""
                    insert into prompt_example_links (
                        id, prompt_id, media_asset_id, role_code, sort_order, created_at
                    )
                    values (?, ?, ?, 'preview', 1, now())
                    """,
                    UUID.randomUUID(),
                    targetId,
                    previewAssetId
            );
        }

        if (durationMs == null) {
            return;
        }

        UUID sourceAssetId = findPromptPrimaryExampleAssetId(targetId);
        updateMediaDuration(sourceAssetId, durationMs);
        updateMediaDuration(previewAssetId, durationMs);
    }

    private void updateMediaDuration(UUID assetId, Integer durationMs) {
        if (assetId == null || durationMs == null) {
            return;
        }

        jdbcTemplate.update("""
                update media_assets
                set duration_ms = ?,
                    updated_at = now()
                where id = ?
                  and status_code = 'ready'
                """,
                durationMs,
                assetId
        );
    }

    private void upsertAsyncTaskRecord(
            UUID taskId,
            MediaCallbackDecision decision,
            String targetType,
            UUID targetId,
            UUID coverAssetId,
            UUID previewAssetId,
            Integer durationMs,
            String errorMessage
    ) {
        if (taskId == null) {
            return;
        }

        ObjectNode resultJson = objectMapper.createObjectNode();
        if (targetType != null) {
            resultJson.put("targetType", targetType);
        }
        if (targetId != null) {
            resultJson.put("targetId", targetId.toString());
        }
        if (coverAssetId != null) {
            resultJson.put("coverAssetId", coverAssetId.toString());
        }
        if (previewAssetId != null) {
            resultJson.put("previewAssetId", previewAssetId.toString());
        }
        if (durationMs != null) {
            resultJson.put("durationMs", durationMs);
        }

        jdbcTemplate.update("""
                update async_task_records
                set status_code = ?,
                    result_json = cast(? as jsonb),
                    error_message = ?,
                    finished_at = case when ? then now() else finished_at end,
                    updated_at = now()
                where id = ?
                """,
                decision.taskStatus(),
                resultJson.toString(),
                sensitivePayloadSanitizer.sanitizeText(errorMessage),
                decision.isTerminal(),
                taskId
        );
    }

    private void insertTaskCallbackLog(
            UUID taskId,
            MediaCallbackRequest request,
            String targetType,
            UUID targetId,
            MediaCallbackDecision decision,
            boolean applied
    ) {
        String rawPayloadJson = sensitivePayloadSanitizer.sanitizeJsonValue(request);
        String verifyStatus = targetType != null && targetId != null ? "verified" : "invalid_target";
        String processStatus = applied ? "applied" : decision.processStatus();

        jdbcTemplate.update("""
                insert into task_callback_logs (
                    id, task_id, callback_type, source_name, request_id, verify_status, process_status, raw_payload_json, created_at
                )
                values (?, ?, 'media', 'internal-media-callback', null, ?, ?, cast(? as jsonb), now())
                """,
                UUID.randomUUID(),
                taskId,
                verifyStatus,
                processStatus,
                rawPayloadJson
        );
    }

    private UUID resolveReadyAssetId(String value, String assetKind) {
        UUID assetId = parseUuid(value);
        if (assetId == null) {
            return null;
        }

        Boolean exists = jdbcTemplate.queryForObject("""
                select exists(
                    select 1
                    from media_assets
                    where id = ?
                      and asset_kind = ?
                      and status_code = 'ready'
                )
                """,
                Boolean.class,
                assetId,
                assetKind
        );
        return Boolean.TRUE.equals(exists) ? assetId : null;
    }

    private Integer sanitizeDurationMs(Long durationMs) {
        if (durationMs == null || durationMs <= 0) {
            return null;
        }

        return durationMs > Integer.MAX_VALUE ? Integer.MAX_VALUE : durationMs.intValue();
    }

    private String normalizeAuditTargetType(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return ("video".equals(normalized) || "workflow".equals(normalized)) ? normalized : null;
    }

    private String normalizeMediaTargetType(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return ("video".equals(normalized) || "prompt".equals(normalized)) ? normalized : null;
    }

    private String toContentKind(String itemType) {
        if (itemType == null) {
            return "workflow_work";
        }

        return switch (itemType) {
            case "prompt" -> "prompt";
            case "post" -> "post";
            default -> "workflow_work";
        };
    }

    private String primaryRiskTag(List<String> riskTags) {
        if (riskTags == null) {
            return null;
        }

        return riskTags.stream()
                .filter(tag -> tag != null && !tag.isBlank())
                .map(String::trim)
                .findFirst()
                .orElse(null);
    }

    private UUID parseUuid(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private void setNullableUuid(java.sql.PreparedStatement statement, int index, UUID value) throws java.sql.SQLException {
        if (value == null) {
            statement.setNull(index, java.sql.Types.OTHER);
            return;
        }
        statement.setObject(index, value);
    }

    private void setNullableInteger(java.sql.PreparedStatement statement, int index, Integer value) throws java.sql.SQLException {
        if (value == null) {
            statement.setNull(index, java.sql.Types.INTEGER);
            return;
        }
        statement.setInt(index, value);
    }

    private enum ModerationDecision {
        APPROVED("approved", "published", true, false),
        REJECTED("rejected", "rejected", false, true),
        TAKEN_DOWN("taken_down", "taken_down", false, true),
        IN_REVIEW("pending_review", "in_review", false, false);

        private final String auditStatus;
        private final String contentStatus;
        private final boolean visibleInCommunity;
        private final boolean deactivateFeed;

        ModerationDecision(
                String auditStatus,
                String contentStatus,
                boolean visibleInCommunity,
                boolean deactivateFeed
        ) {
            this.auditStatus = auditStatus;
            this.contentStatus = contentStatus;
            this.visibleInCommunity = visibleInCommunity;
            this.deactivateFeed = deactivateFeed;
        }

        static ModerationDecision from(String statusCode) {
            if (statusCode == null) {
                return IN_REVIEW;
            }

            String normalized = statusCode.trim().toLowerCase(Locale.ROOT);
            return switch (normalized) {
                case "approved", "published", "passed", "succeeded" -> APPROVED;
                case "rejected", "failed", "blocked" -> REJECTED;
                case "taken_down" -> TAKEN_DOWN;
                default -> IN_REVIEW;
            };
        }

        String auditStatus() {
            return auditStatus;
        }

        String contentStatus() {
            return contentStatus;
        }

        String callbackStatus() {
            return auditStatus;
        }

        boolean shouldBeVisibleInCommunity() {
            return visibleInCommunity;
        }

        boolean shouldDeactivateFeed() {
            return deactivateFeed;
        }

        OffsetDateTime publishedAtValue(OffsetDateTime operatedAt) {
            return visibleInCommunity ? operatedAt : null;
        }

        String riskLevel(List<String> riskTags) {
            if (this == APPROVED || riskTags == null || riskTags.isEmpty()) {
                return null;
            }
            return this == TAKEN_DOWN ? "high" : "medium";
        }
    }

    private enum MediaCallbackDecision {
        SUCCEEDED("succeeded", "succeeded", true, true, null),
        FAILED("failed", "failed", true, false, "media callback failed"),
        PROCESSING("processing", "processing", false, false, null);

        private final String callbackStatus;
        private final String taskStatus;
        private final boolean terminal;
        private final boolean applyToTarget;
        private final String errorMessage;

        MediaCallbackDecision(
                String callbackStatus,
                String taskStatus,
                boolean terminal,
                boolean applyToTarget,
                String errorMessage
        ) {
            this.callbackStatus = callbackStatus;
            this.taskStatus = taskStatus;
            this.terminal = terminal;
            this.applyToTarget = applyToTarget;
            this.errorMessage = errorMessage;
        }

        static MediaCallbackDecision from(String statusCode) {
            if (statusCode == null) {
                return PROCESSING;
            }

            String normalized = statusCode.trim().toLowerCase(Locale.ROOT);
            return switch (normalized) {
                case "approved", "published", "passed", "succeeded", "success", "completed", "ready" -> SUCCEEDED;
                case "rejected", "failed", "blocked", "error" -> FAILED;
                default -> PROCESSING;
            };
        }

        String callbackStatus() {
            return callbackStatus;
        }

        String taskStatus() {
            return taskStatus;
        }

        boolean isTerminal() {
            return terminal;
        }

        boolean shouldApplyToTarget() {
            return applyToTarget;
        }

        String errorMessage(String callbackErrorMessage) {
            if (callbackErrorMessage != null && !callbackErrorMessage.isBlank()) {
                return callbackErrorMessage.trim();
            }
            return errorMessage;
        }

        String processStatus() {
            return terminal ? taskStatus : "accepted";
        }
    }
}
