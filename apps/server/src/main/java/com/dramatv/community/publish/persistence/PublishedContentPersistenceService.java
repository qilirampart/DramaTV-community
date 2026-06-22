package com.dramatv.community.publish.persistence;

import com.dramatv.community.shared.error.ApiBusinessException;
import com.dramatv.community.shared.support.RichTextExcerptSupport;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.sql.Array;
import java.sql.PreparedStatement;
import java.sql.Types;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class PublishedContentPersistenceService {

    private static final String CATEGORY_VIDEO_PROMPT = "video_prompt";
    private static final String CATEGORY_IMAGE_PROMPT = "image_prompt";
    private static final Set<String> PROMPT_TAXONOMY_TAGS = Set.of(
            "image-prompt",
            "video-prompt",
            "gpt-image-2",
            "nanobanana",
            "midjourney",
            "other-image-model",
            "seedance",
            "kling",
            "happyhorse",
            "wan",
            "other-video-model",
            "real-person",
            "animation",
            "scene",
            "prop",
            "other",
            "single-model",
            "multi-model"
    );

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
        ReadyAsset coverAsset = resolveOptionalReadyAsset(
                nullableText(payloadJson, "coverAssetId"),
                "WORKFLOW_COVER_ASSET_INVALID",
                "workflow cover asset is invalid or not ready"
        );
        if (coverAsset != null && !"image".equals(coverAsset.assetKind())) {
            throw ApiBusinessException.badRequest("WORKFLOW_COVER_ASSET_KIND_INVALID", "workflow cover asset must be an image");
        }

        ReadyAsset exampleAsset = resolveRequiredReadyAsset(
                nullableText(payloadJson, "exampleAssetId"),
                "WORKFLOW_EXAMPLE_ASSET_REQUIRED",
                "WORKFLOW_EXAMPLE_ASSET_INVALID",
                "workflow example asset is invalid or not ready"
        );
        if (!"video".equals(exampleAsset.assetKind())) {
            throw ApiBusinessException.badRequest(
                    "WORKFLOW_EXAMPLE_ASSET_KIND_INVALID",
                    "workflow example asset must be a video"
            );
        }

        UUID coverAssetId = coverAsset == null ? null : coverAsset.id();
        UUID exampleAssetId = exampleAsset.id();

        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    insert into workflows (
                        id, author_id, title, summary, scenario_text, tag_names, visibility,
                        publish_status, allow_copy, allow_fork, cover_asset_id, example_asset_id, published_at, created_at, updated_at
                    )
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), now())
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
                        example_asset_id = excluded.example_asset_id,
                        published_at = excluded.published_at,
                        updated_at = now()
                    """);
            statement.setObject(1, workflowId);
            statement.setObject(2, authorId);
            statement.setString(3, title);
            statement.setString(4, summary);
            statement.setString(5, scenarioText);
            statement.setArray(6, createTextArray(connection.createArrayOf("text", tagNames.toArray(String[]::new))));
            statement.setString(7, visibility);
            statement.setString(8, "published");
            statement.setBoolean(9, allowCopy);
            statement.setBoolean(10, allowFork);
            setNullableUuid(statement, 11, coverAssetId);
            setNullableUuid(statement, 12, exampleAssetId);
            statement.setObject(13, OffsetDateTime.now());
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
        String categoryCode = nullableText(payloadJson, "categoryCode");
        if (isPromptCategory(categoryCode)) {
            upsertPromptForReview(videoId, authorId, payloadJson, titleDraft, submitMode, categoryCode);
            return;
        }

        UUID previousWorkflowId = findExistingVideoWorkflowId(videoId);

        String title = textOrFallback(payloadJson, "title", titleDraft, "Untitled video");
        String summary = nullableText(payloadJson, "summary");
        List<String> tagNames = stringList(payloadJson.get("tagNames"));
        String visibility = textOrFallback(payloadJson, "visibility", null, "public");
        UUID workflowId = resolveExistingWorkflowId(nullableText(payloadJson, "workflowId"));
        ReadyAsset coverAsset = resolveOptionalReadyAsset(
                nullableText(payloadJson, "coverAssetId"),
                "VIDEO_COVER_ASSET_INVALID",
                "video cover asset is invalid or not ready"
        );
        if (coverAsset != null && !"image".equals(coverAsset.assetKind())) {
            throw ApiBusinessException.badRequest("VIDEO_COVER_ASSET_KIND_INVALID", "video cover asset must be an image");
        }

        ReadyAsset sourceAsset = resolveRequiredReadyAsset(
                nullableText(payloadJson, "sourceAssetId"),
                "VIDEO_SOURCE_ASSET_REQUIRED",
                "VIDEO_SOURCE_ASSET_INVALID",
                "video source asset is invalid or not ready"
        );
        if (!"video".equals(sourceAsset.assetKind())) {
            throw ApiBusinessException.badRequest("VIDEO_SOURCE_ASSET_KIND_INVALID", "video source asset must be a video");
        }

        UUID coverAssetId = coverAsset == null ? null : coverAsset.id();
        UUID sourceAssetId = sourceAsset.id();
        Integer durationMs = sourceAsset.durationMs();

        OffsetDateTime now = OffsetDateTime.now();

        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    insert into videos (
                        id, author_id, workflow_id, title, summary, category_code, tag_names,
                        visibility, publish_status, cover_asset_id, source_asset_id, duration_ms,
                        published_at, created_at, updated_at
                    )
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), now())
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
                        published_at = excluded.published_at,
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
            statement.setString(9, "published");
            setNullableUuid(statement, 10, coverAssetId);
            setNullableUuid(statement, 11, sourceAssetId);
            setNullableInteger(statement, 12, durationMs);
            statement.setObject(13, now);
            return statement;
        });

        insertAuditRecord("video", videoId, authorId, submitMode);
        syncCreatorProfileCounts(authorId);
        syncWorkflowVideoBindCount(previousWorkflowId);
        syncWorkflowVideoBindCount(workflowId);
    }

    private void upsertPromptForReview(
            UUID promptId,
            UUID authorId,
            ObjectNode payloadJson,
            String titleDraft,
            String submitMode,
            String categoryCode
    ) {
        String modality = promptModalityFromCategoryCode(categoryCode);
        if (modality == null) {
            throw ApiBusinessException.badRequest("PROMPT_MODALITY_INVALID", "prompt modality is invalid");
        }

        String title = textOrFallback(payloadJson, "title", titleDraft, "Untitled prompt");
        String summary = nullableText(payloadJson, "summary");
        String promptText = nullableText(payloadJson, "promptText");
        if (promptText == null) {
            throw ApiBusinessException.badRequest("PROMPT_TEXT_REQUIRED", "prompt text is required");
        }
        String promptTextZh = nullableText(payloadJson, "promptTextZh");
        String promptTextEn = nullableText(payloadJson, "promptTextEn");
        String promptTextRaw = textOrFallback(payloadJson, "promptTextRaw", promptText, promptText);
        String modelName = nullableText(payloadJson, "modelName");
        String modelCategory = nullableText(payloadJson, "modelCategory");
        String contentCategory = nullableText(payloadJson, "contentCategory");
        String rawCompositionCategory = nullableText(payloadJson, "compositionCategory");
        String compositionCategory = CATEGORY_IMAGE_PROMPT.equals(categoryCode) ? null : rawCompositionCategory;
        String sourcePlatform = nullableText(payloadJson, "sourcePlatform");
        String sourceCampaign = nullableText(payloadJson, "sourceCampaign");
        String sourceItemId = nullableText(payloadJson, "sourceItemId");
        String sourceUrl = nullableText(payloadJson, "sourceUrl");

        List<String> tagNames = normalizePromptTagNames(
                stringList(payloadJson.get("tagNames")),
                modality,
                modelCategory,
                contentCategory,
                compositionCategory
        );
        String visibility = textOrFallback(payloadJson, "visibility", null, "public");
        ReadyAsset coverAsset = resolveOptionalReadyAsset(
                nullableText(payloadJson, "coverAssetId"),
                "PROMPT_COVER_ASSET_INVALID",
                "prompt cover asset is invalid or not ready"
        );
        if (coverAsset != null && !"image".equals(coverAsset.assetKind())) {
            throw ApiBusinessException.badRequest("PROMPT_COVER_ASSET_KIND_INVALID", "prompt cover asset must be an image");
        }

        ReadyAsset exampleAsset = resolveRequiredReadyAsset(
                nullableText(payloadJson, "sourceAssetId"),
                "PROMPT_EXAMPLE_ASSET_REQUIRED",
                "PROMPT_EXAMPLE_ASSET_INVALID",
                "prompt example asset is invalid or not ready"
        );
        if (!modality.equals(exampleAsset.assetKind())) {
            throw ApiBusinessException.badRequest(
                    "PROMPT_EXAMPLE_ASSET_KIND_INVALID",
                    "prompt example asset kind does not match prompt modality"
            );
        }

        List<ReadyAsset> referenceImageAssets = resolveReferenceReadyAssets(
                stringList(payloadJson.get("referenceImageAssetIds")),
                "image",
                "PROMPT_REFERENCE_IMAGE_ASSET_INVALID",
                "prompt reference image asset is invalid or not ready",
                "PROMPT_REFERENCE_IMAGE_ASSET_KIND_INVALID",
                "prompt reference image asset must be an image"
        );
        List<ReadyAsset> referenceAudioAssets = resolveReferenceReadyAssets(
                stringList(payloadJson.get("referenceAudioAssetIds")),
                "audio",
                "PROMPT_REFERENCE_AUDIO_ASSET_INVALID",
                "prompt reference audio asset is invalid or not ready",
                "PROMPT_REFERENCE_AUDIO_ASSET_KIND_INVALID",
                "prompt reference audio asset must be an audio file"
        );
        if ("image".equals(modality) && !referenceAudioAssets.isEmpty()) {
            throw ApiBusinessException.badRequest(
                    "PROMPT_REFERENCE_AUDIO_NOT_ALLOWED",
                    "image prompt does not support reference audio assets"
            );
        }

        List<UUID> referenceImageAssetIds = referenceImageAssets.stream()
                .map(ReadyAsset::id)
                .filter(assetId -> !assetId.equals(exampleAsset.id()))
                .toList();
        List<UUID> referenceAudioAssetIds = referenceAudioAssets.stream()
                .map(ReadyAsset::id)
                .filter(assetId -> !assetId.equals(exampleAsset.id()))
                .toList();
        int exampleCount = 1 + referenceImageAssetIds.size();
        OffsetDateTime publishedAt = parsePublishedAt(nullableText(payloadJson, "publishedAt"), OffsetDateTime.now());

        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    insert into prompt_entries (
                        id, author_id, title, summary, modality, prompt_text, prompt_text_zh, prompt_text_en, prompt_text_raw,
                        model_name, model_category, content_category, composition_category,
                        source_platform, source_campaign, source_item_id, source_url,
                        visibility, publish_status, cover_asset_id, primary_example_asset_id, tag_names,
                        example_count, published_at, created_at, updated_at
                    )
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?, ?, ?, now(), now())
                    on conflict (id) do update
                    set title = excluded.title,
                        summary = excluded.summary,
                        modality = excluded.modality,
                        prompt_text = excluded.prompt_text,
                        prompt_text_zh = excluded.prompt_text_zh,
                        prompt_text_en = excluded.prompt_text_en,
                        prompt_text_raw = excluded.prompt_text_raw,
                        model_name = excluded.model_name,
                        model_category = excluded.model_category,
                        content_category = excluded.content_category,
                        composition_category = excluded.composition_category,
                        source_platform = excluded.source_platform,
                        source_campaign = excluded.source_campaign,
                        source_item_id = excluded.source_item_id,
                        source_url = excluded.source_url,
                        visibility = excluded.visibility,
                        publish_status = excluded.publish_status,
                        cover_asset_id = excluded.cover_asset_id,
                        primary_example_asset_id = excluded.primary_example_asset_id,
                        tag_names = excluded.tag_names,
                        example_count = excluded.example_count,
                        published_at = excluded.published_at,
                        updated_at = now()
                    """);
            statement.setObject(1, promptId);
            statement.setObject(2, authorId);
            statement.setString(3, title);
            statement.setString(4, summary);
            statement.setString(5, modality);
            statement.setString(6, promptText);
            statement.setString(7, promptTextZh);
            statement.setString(8, promptTextEn);
            statement.setString(9, promptTextRaw);
            statement.setString(10, modelName);
            statement.setString(11, modelCategory);
            statement.setString(12, contentCategory);
            statement.setString(13, compositionCategory);
            statement.setString(14, sourcePlatform);
            statement.setString(15, sourceCampaign);
            statement.setString(16, sourceItemId);
            statement.setString(17, sourceUrl);
            statement.setString(18, visibility);
            setNullableUuid(statement, 19, coverAsset == null ? null : coverAsset.id());
            statement.setObject(20, exampleAsset.id());
            statement.setArray(21, createTextArray(connection.createArrayOf("text", tagNames.toArray(String[]::new))));
            statement.setInt(22, exampleCount);
            statement.setObject(23, publishedAt);
            return statement;
        });

        replacePromptExampleLinks(promptId, exampleAsset.id(), referenceImageAssetIds, referenceAudioAssetIds);
        insertAuditRecord("prompt", promptId, authorId, submitMode);
        syncCreatorProfileCounts(authorId);
        syncPublishedPromptFeed(promptId, publishedAt);
    }

    private List<String> normalizePromptTagNames(
            List<String> existingTagNames,
            String modality,
            String modelCategory,
            String contentCategory,
            String compositionCategory
    ) {
        LinkedHashSet<String> normalizedTags = new LinkedHashSet<>();
        for (String existingTagName : existingTagNames) {
            if (existingTagName == null) {
                continue;
            }

            String trimmed = existingTagName.trim();
            if (trimmed.isEmpty() || PROMPT_TAXONOMY_TAGS.contains(trimmed)) {
                continue;
            }
            normalizedTags.add(trimmed);
        }

        normalizedTags.add("image".equals(modality) ? "image-prompt" : "video-prompt");
        if (modelCategory != null && !modelCategory.isBlank()) {
            normalizedTags.add(modelCategory);
        }
        if (contentCategory != null && !contentCategory.isBlank()) {
            normalizedTags.add(contentCategory);
        }
        if ("video".equals(modality) && compositionCategory != null && !compositionCategory.isBlank()) {
            normalizedTags.add(compositionCategory);
        }

        return List.copyOf(normalizedTags);
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

        insertAuditRecord("post", threadId, authorId, submitMode);
        syncPublishedPostFeed(threadId, now);
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
                "not_required",
                "creator",
                operatorId,
                detailJson.toString()
        );
    }

    public void syncCreatorProfileCounts(UUID authorId) {
        jdbcTemplate.update("""
                update creator_profiles
                set video_count = (
                        (
                            select count(*) from videos
                            where author_id = ? and publish_status = 'published' and deleted_at is null
                        ) + (
                            select count(*) from prompt_entries
                            where author_id = ? and publish_status = 'published' and deleted_at is null
                        )
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

    private ReadyAsset loadReadyAsset(String candidate) {
        UUID assetId = parseUuid(candidate);
        if (assetId == null) {
            return null;
        }

        return jdbcTemplate.query("""
                select id, asset_kind, asset_role, duration_ms
                from media_assets
                where id = ?
                  and status_code = 'ready'
                """,
                resultSet -> resultSet.next()
                        ? new ReadyAsset(
                                (UUID) resultSet.getObject("id"),
                                resultSet.getString("asset_kind"),
                                resultSet.getString("asset_role"),
                                (Integer) resultSet.getObject("duration_ms")
                        )
                        : null,
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
        return RichTextExcerptSupport.toExcerpt(content, 140);
    }

    private ReadyAsset resolveRequiredReadyAsset(
            String candidate,
            String requiredErrorCode,
            String invalidErrorCode,
            String invalidMessage
    ) {
        if (candidate == null) {
            throw ApiBusinessException.badRequest(requiredErrorCode, invalidMessage.replace(" is invalid or not ready", " is required"));
        }

        ReadyAsset asset = loadReadyAsset(candidate);
        if (asset == null) {
            throw ApiBusinessException.badRequest(invalidErrorCode, invalidMessage);
        }

        return asset;
    }

    private ReadyAsset resolveOptionalReadyAsset(
            String candidate,
            String invalidErrorCode,
            String invalidMessage
    ) {
        if (candidate == null) {
            return null;
        }

        ReadyAsset asset = loadReadyAsset(candidate);
        if (asset == null) {
            throw ApiBusinessException.badRequest(invalidErrorCode, invalidMessage);
        }

        return asset;
    }

    private List<ReadyAsset> resolveReferenceReadyAssets(
            List<String> candidates,
            String expectedKind,
            String invalidErrorCode,
            String invalidMessage,
            String kindErrorCode,
            String kindMessage
    ) {
        if (candidates.isEmpty()) {
            return List.of();
        }

        List<ReadyAsset> assets = new ArrayList<>();
        Set<UUID> seen = new LinkedHashSet<>();
        for (String candidate : candidates) {
            ReadyAsset asset = loadReadyAsset(candidate);
            if (asset == null) {
                throw ApiBusinessException.badRequest(invalidErrorCode, invalidMessage);
            }
            if (!expectedKind.equals(asset.assetKind())) {
                throw ApiBusinessException.badRequest(kindErrorCode, kindMessage);
            }
            if (seen.add(asset.id())) {
                assets.add(asset);
            }
        }
        return assets;
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

    private void syncPublishedPostFeed(UUID threadId, OffsetDateTime publishedAt) {
        BigDecimal rankScore = BigDecimal.valueOf(publishedAt.toEpochSecond())
                .movePointLeft(2)
                .setScale(4);

        upsertFeedItem("recommend", "post", "post", threadId, rankScore, publishedAt);
        upsertFeedItem("hot", "post", "post", threadId, rankScore, publishedAt);
    }

    private void syncPublishedPromptFeed(UUID promptId, OffsetDateTime publishedAt) {
        BigDecimal rankScore = BigDecimal.valueOf(publishedAt.toEpochSecond())
                .movePointLeft(2)
                .setScale(4);

        upsertFeedItem("recommend", "prompt", "prompt", promptId, rankScore, publishedAt);
        upsertFeedItem("hot", "prompt", "prompt", promptId, rankScore, publishedAt);
    }

    private void replacePromptExampleLinks(
            UUID promptId,
            UUID exampleAssetId,
            List<UUID> referenceImageAssetIds,
            List<UUID> referenceAudioAssetIds
    ) {
        jdbcTemplate.update("""
                delete from prompt_example_links
                where prompt_id = ?
                """,
                promptId
        );

        insertPromptExampleLink(promptId, exampleAssetId, "example", 0);
        for (int index = 0; index < referenceImageAssetIds.size(); index++) {
            insertPromptExampleLink(promptId, referenceImageAssetIds.get(index), "reference_image", index);
        }
        for (int index = 0; index < referenceAudioAssetIds.size(); index++) {
            insertPromptExampleLink(promptId, referenceAudioAssetIds.get(index), "reference_audio", index);
        }
    }

    private void insertPromptExampleLink(UUID promptId, UUID mediaAssetId, String roleCode, int sortOrder) {
        jdbcTemplate.update("""
                insert into prompt_example_links (
                    id, prompt_id, media_asset_id, role_code, sort_order, created_at
                )
                values (?, ?, ?, ?, ?, now())
                """,
                UUID.randomUUID(),
                promptId,
                mediaAssetId,
                roleCode,
                sortOrder
        );
    }

    private void upsertFeedItem(
            String channelCode,
            String contentKind,
            String targetType,
            UUID targetId,
            BigDecimal rankScore,
            OffsetDateTime publishedAt
    ) {
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

    private String legacyItemType(String targetType) {
        if (targetType == null || targetType.isBlank()) {
            return "video";
        }
        return targetType;
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

    private boolean isPromptCategory(String categoryCode) {
        return CATEGORY_VIDEO_PROMPT.equals(categoryCode) || CATEGORY_IMAGE_PROMPT.equals(categoryCode);
    }

    private String promptModalityFromCategoryCode(String categoryCode) {
        if (CATEGORY_VIDEO_PROMPT.equals(categoryCode)) {
            return "video";
        }
        if (CATEGORY_IMAGE_PROMPT.equals(categoryCode)) {
            return "image";
        }
        return null;
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

    private OffsetDateTime parsePublishedAt(String candidate, OffsetDateTime fallback) {
        if (candidate == null || candidate.isBlank()) {
            return fallback;
        }

        try {
            return OffsetDateTime.parse(candidate.trim());
        } catch (DateTimeParseException ex) {
            return fallback;
        }
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

    private record ReadyAsset(
            UUID id,
            String assetKind,
            String assetRole,
            Integer durationMs
    ) {
    }
}
