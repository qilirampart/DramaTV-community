package com.dramatv.community.publish.persistence;

import com.dramatv.community.internal.dto.request.AuditCallbackRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PublishModerationPersistenceService {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final PublishedContentPersistenceService publishedContentPersistenceService;

    public PublishModerationPersistenceService(
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            PublishedContentPersistenceService publishedContentPersistenceService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.publishedContentPersistenceService = publishedContentPersistenceService;
    }

    @Transactional
    public String applyAuditCallback(AuditCallbackRequest request) {
        String targetType = normalizeTargetType(request.targetType());
        UUID targetId = parseUuid(request.targetId());
        if (targetType == null || targetId == null) {
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

        return decision.callbackStatus();
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
            String itemType,
            UUID targetId,
            BigDecimal rankScore,
            OffsetDateTime publishedAt
    ) {
        jdbcTemplate.update("""
                insert into feed_items (
                    id, channel_code, item_type, target_id, rank_score, status_code, published_at, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, 'active', ?, now(), now())
                on conflict (channel_code, item_type, target_id) do update
                set rank_score = excluded.rank_score,
                    status_code = 'active',
                    published_at = excluded.published_at,
                    updated_at = now()
                """,
                UUID.randomUUID(),
                channelCode,
                itemType,
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
                where item_type = ? and target_id = ?
                """,
                targetType,
                targetId
        );
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

    private String normalizeTargetType(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return ("video".equals(normalized) || "workflow".equals(normalized)) ? normalized : null;
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
}
