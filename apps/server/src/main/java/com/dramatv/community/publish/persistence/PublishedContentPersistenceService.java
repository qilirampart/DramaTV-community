package com.dramatv.community.publish.persistence;

import com.dramatv.community.shared.error.ApiBusinessException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.sql.Array;
import java.sql.PreparedStatement;
import java.sql.Types;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class PublishedContentPersistenceService {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public PublishedContentPersistenceService(
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public void upsertWorkflowForReview(
            UUID workflowId,
            UUID authorId,
            ObjectNode payloadJson,
            String titleDraft,
            String submitMode
    ) {
        String title = textOrFallback(payloadJson, "title", titleDraft, "Untitled workflow");
        String summary = nullableText(payloadJson, "summary");
        String scenarioText = nullableText(payloadJson, "scenarioText");
        List<String> tagNames = stringList(payloadJson.get("tagNames"));
        String visibility = textOrFallback(payloadJson, "visibility", null, "public");
        boolean allowCopy = booleanOrDefault(payloadJson, "allowCopy", true);
        boolean allowFork = booleanOrDefault(payloadJson, "allowFork", false);
        UUID coverAssetId = resolveReadyAssetId(nullableText(payloadJson, "coverAssetId"));

        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    insert into workflows (
                        id, author_id, title, summary, scenario_text, tag_names, visibility,
                        publish_status, allow_copy, allow_fork, cover_asset_id, published_at, created_at, updated_at
                    )
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, now(), now())
                    on conflict (id) do update
                    set title = excluded.title,
                        summary = excluded.summary,
                        scenario_text = excluded.scenario_text,
                        tag_names = excluded.tag_names,
                        visibility = excluded.visibility,
                        publish_status = excluded.publish_status,
                        allow_copy = excluded.allow_copy,
                        allow_fork = excluded.allow_fork,
                        cover_asset_id = excluded.cover_asset_id,
                        updated_at = now()
                    """);
            statement.setObject(1, workflowId);
            statement.setObject(2, authorId);
            statement.setString(3, title);
            statement.setString(4, summary);
            statement.setString(5, scenarioText);
            statement.setArray(6, createTextArray(connection.createArrayOf("text", tagNames.toArray(String[]::new))));
            statement.setString(7, visibility);
            statement.setString(8, "in_review");
            statement.setBoolean(9, allowCopy);
            statement.setBoolean(10, allowFork);
            setNullableUuid(statement, 11, coverAssetId);
            return statement;
        });

        insertAuditRecord("workflow", workflowId, authorId, submitMode);
        syncCreatorProfileCounts(authorId);
    }

    public void upsertVideoForReview(
            UUID videoId,
            UUID authorId,
            ObjectNode payloadJson,
            String titleDraft,
            String submitMode
    ) {
        UUID previousWorkflowId = findExistingVideoWorkflowId(videoId);

        String title = textOrFallback(payloadJson, "title", titleDraft, "Untitled video");
        String summary = nullableText(payloadJson, "summary");
        String categoryCode = nullableText(payloadJson, "categoryCode");
        List<String> tagNames = stringList(payloadJson.get("tagNames"));
        String visibility = textOrFallback(payloadJson, "visibility", null, "public");
        UUID workflowId = resolveExistingWorkflowId(nullableText(payloadJson, "workflowId"));
        UUID coverAssetId = resolveReadyAssetId(nullableText(payloadJson, "coverAssetId"));
        String sourceAssetIdText = nullableText(payloadJson, "sourceAssetId");
        UUID sourceAssetId = resolveReadyAssetId(sourceAssetIdText);
        if (sourceAssetIdText == null) {
            throw ApiBusinessException.badRequest("VIDEO_SOURCE_ASSET_REQUIRED", "video source asset is required");
        }
        if (sourceAssetId == null) {
            throw ApiBusinessException.badRequest("VIDEO_SOURCE_ASSET_INVALID", "video source asset is invalid or not ready");
        }
        Integer durationMs = sourceAssetId == null ? null : findAssetDurationMs(sourceAssetId);

        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    insert into videos (
                        id, author_id, workflow_id, title, summary, category_code, tag_names,
                        visibility, publish_status, cover_asset_id, source_asset_id, duration_ms,
                        published_at, created_at, updated_at
                    )
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, now(), now())
                    on conflict (id) do update
                    set workflow_id = excluded.workflow_id,
                        title = excluded.title,
                        summary = excluded.summary,
                        category_code = excluded.category_code,
                        tag_names = excluded.tag_names,
                        visibility = excluded.visibility,
                        publish_status = excluded.publish_status,
                        cover_asset_id = excluded.cover_asset_id,
                        source_asset_id = excluded.source_asset_id,
                        duration_ms = excluded.duration_ms,
                        updated_at = now()
                    """);
            statement.setObject(1, videoId);
            statement.setObject(2, authorId);
            setNullableUuid(statement, 3, workflowId);
            statement.setString(4, title);
            statement.setString(5, summary);
            statement.setString(6, categoryCode);
            statement.setArray(7, createTextArray(connection.createArrayOf("text", tagNames.toArray(String[]::new))));
            statement.setString(8, visibility);
            statement.setString(9, "in_review");
            setNullableUuid(statement, 10, coverAssetId);
            setNullableUuid(statement, 11, sourceAssetId);
            setNullableInteger(statement, 12, durationMs);
            return statement;
        });

        insertAuditRecord("video", videoId, authorId, submitMode);
        syncCreatorProfileCounts(authorId);
        syncWorkflowVideoBindCount(previousWorkflowId);
        syncWorkflowVideoBindCount(workflowId);
    }

    public void upsertDiscussionThreadForPublish(
            UUID threadId,
            UUID authorId,
            ObjectNode payloadJson,
            String titleDraft,
            String submitMode
    ) {
        UUID existingChannelId = findExistingDiscussionChannelId(threadId);
        String existingSlug = findExistingDiscussionSlug(threadId);

        String title = textOrFallback(payloadJson, "title", titleDraft, "Untitled post");
        String content = textOrFallback(payloadJson, "content", null, "");
        String channelSlug = textOrFallback(payloadJson, "channelSlug", null, "video-production");
        UUID channelId = resolveDiscussionChannelId(channelSlug);
        if (channelId == null) {
            throw ApiBusinessException.badRequest("POST_CHANNEL_INVALID", "post channel is invalid");
        }

        if (existingChannelId != null) {
            channelId = existingChannelId;
        }

        List<String> tagNames = stringList(payloadJson.get("tagNames"));
        BindingTarget bindingTarget = resolveBindingTarget(
                nullableText(payloadJson, "bindingTargetType"),
                nullableText(payloadJson, "bindingTargetId")
        );
        String excerpt = buildExcerpt(content);
        String slug = existingSlug == null ? nextDiscussionSlug(title, threadId) : existingSlug;
        OffsetDateTime now = OffsetDateTime.now();
        UUID finalChannelId = channelId;

        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    insert into discussion_threads (
                        id, slug, channel_id, author_id, title, content_text, excerpt_text, tag_names,
                        binding_target_type, binding_target_id, publish_status, reply_count, published_at,
                        last_activity_at, created_at, updated_at
                    )
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 0, ?, ?, now(), now())
                    on conflict (id) do update
                    set slug = excluded.slug,
                        channel_id = excluded.channel_id,
                        title = excluded.title,
                        content_text = excluded.content_text,
                        excerpt_text = excluded.excerpt_text,
                        tag_names = excluded.tag_names,
                        binding_target_type = excluded.binding_target_type,
                        binding_target_id = excluded.binding_target_id,
                        publish_status = excluded.publish_status,
                        published_at = excluded.published_at,
                        last_activity_at = excluded.last_activity_at,
                        updated_at = now()
                    """);
            statement.setObject(1, threadId);
            statement.setString(2, slug);
            statement.setObject(3, finalChannelId);
            statement.setObject(4, authorId);
            statement.setString(5, title);
            statement.setString(6, content);
            statement.setString(7, excerpt);
            statement.setArray(8, createTextArray(connection.createArrayOf("text", tagNames.toArray(String[]::new))));
            statement.setString(9, bindingTarget == null ? null : bindingTarget.targetType());
            setNullableUuid(statement, 10, bindingTarget == null ? null : bindingTarget.targetId());
            statement.setObject(11, now);
            statement.setObject(12, now);
            return statement;
        });
    }

    private void insertAuditRecord(
            String targetType,
            UUID targetId,
            UUID operatorId,
            String submitMode
    ) {
        ObjectNode detailJson = objectMapper.createObjectNode();
        detailJson.put("submitMode", submitMode);

        jdbcTemplate.update("""
                insert into audit_records (
                    id, target_type, target_id, audit_type, status_code, operator_type, operator_id, detail_json, created_at
                )
                values (?, ?, ?, ?, ?, ?, ?, cast(? as jsonb), now())
                """,
                UUID.randomUUID(),
                targetType,
                targetId,
                "publish_review",
                "pending_review",
                "creator",
                operatorId,
                detailJson.toString()
        );
    }

    public void syncCreatorProfileCounts(UUID authorId) {
        jdbcTemplate.update("""
                update creator_profiles
                set video_count = (
                        select count(*) from videos
                        where author_id = ? and publish_status = 'published' and deleted_at is null
                    ),
                    workflow_count = (
                        select count(*) from workflows
                        where author_id = ? and publish_status = 'published' and deleted_at is null
                    ),
                    updated_at = now()
                where user_id = ?
                """,
                authorId,
                authorId,
                authorId
        );
    }

    public void syncWorkflowVideoBindCount(UUID workflowId) {
        if (workflowId == null) {
            return;
        }

        jdbcTemplate.update("""
                update workflows
                set video_bind_count = (
                        select count(*) from videos
                        where workflow_id = ? and publish_status = 'published' and deleted_at is null
                    ),
                    updated_at = now()
                where id = ?
                """,
                workflowId,
                workflowId
        );
    }

    private UUID findExistingVideoWorkflowId(UUID videoId) {
        return jdbcTemplate.query("""
                select workflow_id
                from videos
                where id = ?
                """,
                resultSet -> resultSet.next() ? (UUID) resultSet.getObject("workflow_id") : null,
                videoId
        );
    }

    private UUID findExistingDiscussionChannelId(UUID threadId) {
        return jdbcTemplate.query("""
                select channel_id
                from discussion_threads
                where id = ?
                """,
                resultSet -> resultSet.next() ? (UUID) resultSet.getObject("channel_id") : null,
                threadId
        );
    }

    private String findExistingDiscussionSlug(UUID threadId) {
        return jdbcTemplate.query("""
                select slug
                from discussion_threads
                where id = ?
                """,
                resultSet -> resultSet.next() ? resultSet.getString("slug") : null,
                threadId
        );
    }

    private Integer findAssetDurationMs(UUID assetId) {
        return jdbcTemplate.query("""
                select duration_ms
                from media_assets
                where id = ?
                """,
                resultSet -> resultSet.next() ? (Integer) resultSet.getObject("duration_ms") : null,
                assetId
        );
    }

    private UUID resolveExistingWorkflowId(String candidate) {
        UUID workflowId = parseUuid(candidate);
        if (workflowId == null) {
            return null;
        }

        Boolean exists = jdbcTemplate.queryForObject(
                "select exists(select 1 from workflows where id = ? and deleted_at is null)",
                Boolean.class,
                workflowId
        );
        return Boolean.TRUE.equals(exists) ? workflowId : null;
    }

    private UUID resolveDiscussionChannelId(String channelSlug) {
        if (channelSlug == null || channelSlug.isBlank()) {
            return null;
        }

        return jdbcTemplate.query("""
                select id
                from discussion_channels
                where slug = ?
                  and status_code = 'active'
                """,
                resultSet -> resultSet.next() ? (UUID) resultSet.getObject("id") : null,
                channelSlug.trim()
        );
    }

    private UUID resolveReadyAssetId(String candidate) {
        UUID assetId = parseUuid(candidate);
        if (assetId == null) {
            return null;
        }

        Boolean exists = jdbcTemplate.queryForObject(
                "select exists(select 1 from media_assets where id = ? and status_code = 'ready')",
                Boolean.class,
                assetId
        );
        return Boolean.TRUE.equals(exists) ? assetId : null;
    }

    private BindingTarget resolveBindingTarget(String targetType, String targetId) {
        if ((targetType == null || targetType.isBlank()) && (targetId == null || targetId.isBlank())) {
            return null;
        }

        if (targetType == null || targetType.isBlank() || targetId == null || targetId.isBlank()) {
            throw ApiBusinessException.badRequest("POST_BINDING_INVALID", "post binding is invalid");
        }

        String normalizedTargetType = targetType.trim().toLowerCase();
        if (!"video".equals(normalizedTargetType) && !"workflow".equals(normalizedTargetType)) {
            throw ApiBusinessException.badRequest("POST_BINDING_TYPE_INVALID", "post binding type is invalid");
        }

        UUID parsedTargetId = parseUuid(targetId);
        if (parsedTargetId == null) {
            throw ApiBusinessException.badRequest("POST_BINDING_INVALID", "post binding is invalid");
        }

        String tableName = "video".equals(normalizedTargetType) ? "videos" : "workflows";
        Boolean exists = jdbcTemplate.queryForObject(
                "select exists(select 1 from " + tableName + " where id = ? and publish_status = 'published' and deleted_at is null)",
                Boolean.class,
                parsedTargetId
        );
        if (!Boolean.TRUE.equals(exists)) {
            throw ApiBusinessException.badRequest("POST_BINDING_TARGET_NOT_FOUND", "post binding target does not exist");
        }

        return new BindingTarget(normalizedTargetType, parsedTargetId);
    }

    private String buildExcerpt(String content) {
        String normalized = content == null ? "" : content.trim().replaceAll("\\s+", " ");
        if (normalized.length() <= 140) {
            return normalized;
        }
        return normalized.substring(0, 140) + "...";
    }

    private String nextDiscussionSlug(String title, UUID threadId) {
        String base = slugify(title);
        String existing = jdbcTemplate.query("""
                select slug
                from discussion_threads
                where slug = ?
                """,
                resultSet -> resultSet.next() ? resultSet.getString("slug") : null,
                base
        );

        if (existing == null) {
            return base;
        }

        return base + "-" + threadId.toString().substring(0, 8);
    }

    private String slugify(String title) {
        String normalized = title == null ? "" : title.trim().toLowerCase();
        normalized = normalized.replaceAll("[^a-z0-9\\u4e00-\\u9fa5]+", "-");
        normalized = normalized.replaceAll("(^-+|-+$)", "");

        if (normalized.isBlank()) {
            return "discussion-thread";
        }

        return normalized.length() > 96 ? normalized.substring(0, 96) : normalized;
    }

    private UUID parseUuid(String candidate) {
        if (candidate == null || candidate.isBlank()) {
            return null;
        }

        try {
            return UUID.fromString(candidate);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String nullableText(ObjectNode payload, String fieldName) {
        JsonNode node = payload.get(fieldName);
        if (node == null || node.isNull()) {
            return null;
        }

        String value = node.asText().trim();
        return value.isEmpty() ? null : value;
    }

    private String textOrFallback(ObjectNode payload, String fieldName, String fallback, String defaultValue) {
        String value = nullableText(payload, fieldName);
        if (value != null) {
            return value;
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback.trim();
        }
        return defaultValue;
    }

    private boolean booleanOrDefault(ObjectNode payload, String fieldName, boolean fallback) {
        JsonNode node = payload.get(fieldName);
        return node == null || node.isNull() ? fallback : node.asBoolean();
    }

    private List<String> stringList(JsonNode node) {
        if (node == null || !node.isArray()) {
            return List.of();
        }

        return java.util.stream.StreamSupport.stream(node.spliterator(), false)
                .map(JsonNode::asText)
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .distinct()
                .toList();
    }

    private Array createTextArray(Array array) {
        return array;
    }

    private void setNullableUuid(PreparedStatement statement, int index, UUID value) throws java.sql.SQLException {
        if (value == null) {
            statement.setNull(index, Types.OTHER);
            return;
        }
        statement.setObject(index, value);
    }

    private void setNullableInteger(PreparedStatement statement, int index, Integer value) throws java.sql.SQLException {
        if (value == null) {
            statement.setNull(index, Types.INTEGER);
            return;
        }
        statement.setInt(index, value);
    }

    private record BindingTarget(
            String targetType,
            UUID targetId
    ) {
    }
}
