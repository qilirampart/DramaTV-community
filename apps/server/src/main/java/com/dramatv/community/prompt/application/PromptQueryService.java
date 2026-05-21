package com.dramatv.community.prompt.application;

import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserContext;
import com.dramatv.community.prompt.dto.response.PromptDetailResponse;
import com.dramatv.community.prompt.dto.response.PromptSummaryResponse;
import com.dramatv.community.shared.error.ApiBusinessException;
import com.dramatv.community.shared.media.JdbcMediaUrlResolver;
import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class PromptQueryService {

    private static final Set<String> SUPPORTED_MODALITIES = Set.of("all", "image", "video");
    private static final Set<String> SUPPORTED_SORTS = Set.of("latest", "hot");
    private static final int DEFAULT_LIST_LIMIT = 24;
    private static final int DEFAULT_LIST_OFFSET = 0;
    private static final int MAX_LIST_LIMIT = 10000;

    private final JdbcTemplate jdbcTemplate;
    private final JdbcMediaUrlResolver jdbcMediaUrlResolver;

    public PromptQueryService(
            JdbcTemplate jdbcTemplate,
            JdbcMediaUrlResolver jdbcMediaUrlResolver
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.jdbcMediaUrlResolver = jdbcMediaUrlResolver;
    }

    public List<PromptSummaryResponse> listPublished(String modality, String sort, Integer limit, Integer offset) {
        String normalizedModality = normalizeFilter(modality, "all", SUPPORTED_MODALITIES, "PROMPT_MODALITY_INVALID");
        String normalizedSort = normalizeFilter(sort, "latest", SUPPORTED_SORTS, "PROMPT_SORT_INVALID");
        int normalizedLimit = normalizeLimit(limit);
        int normalizedOffset = normalizeOffset(offset);
        UUID viewerId = optionalViewerId();

        StringBuilder sql = new StringBuilder("""
                select
                    prompt.id,
                    prompt.title,
                    prompt.summary,
                    prompt.modality,
                    cover.storage_provider as cover_storage_provider,
                    cover.bucket_name as cover_bucket_name,
                    cover.object_key as cover_url,
                    cover.asset_kind as cover_asset_kind,
                    primary_example.storage_provider as primary_example_storage_provider,
                    primary_example.bucket_name as primary_example_bucket_name,
                    primary_example.object_key as primary_example_url,
                    primary_example.asset_kind as primary_example_asset_kind,
                    preview_example.storage_provider as preview_example_storage_provider,
                    preview_example.bucket_name as preview_example_bucket_name,
                    preview_example.object_key as preview_example_url,
                    preview_example.asset_kind as preview_example_asset_kind,
                    prompt.model_category,
                    prompt.content_category,
                    prompt.composition_category,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    prompt.tag_names,
                    prompt.like_count,
                    prompt.favorite_count,
                    prompt.example_count,
                    exists(
                        select 1
                        from interaction_actions action
                        where action.actor_id = ?
                          and action.action_type = 'like'
                          and action.target_type = 'prompt'
                          and action.target_id = prompt.id
                          and action.status_code = 'active'
                    ) as viewer_liked
                from prompt_entries prompt
                join users author on author.id = prompt.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join media_assets cover on cover.id = prompt.cover_asset_id
                left join media_assets primary_example on primary_example.id = prompt.primary_example_asset_id
                left join media_assets preview_example on preview_example.id = (
                    select link.media_asset_id
                    from prompt_example_links link
                    where link.prompt_id = prompt.id
                      and link.role_code = 'preview'
                    order by link.sort_order asc, link.created_at asc
                    limit 1
                )
                where prompt.publish_status = 'published'
                  and prompt.deleted_at is null
                """);

        if (!"all".equals(normalizedModality)) {
            sql.append("""
                      and prompt.modality = ?
                    """);
        }

        if ("hot".equals(normalizedSort)) {
            sql.append("""
                    order by prompt.like_count desc,
                             prompt.favorite_count desc,
                             coalesce(prompt.published_at, prompt.updated_at) desc
                    """);
        } else {
            sql.append("""
                    order by coalesce(prompt.published_at, prompt.updated_at) desc,
                             prompt.like_count desc
                    """);
        }

        sql.append("""
                limit ?
                offset ?
                """);

        Object[] params = "all".equals(normalizedModality)
                ? new Object[] { viewerId, normalizedLimit, normalizedOffset }
                : new Object[] { viewerId, normalizedModality, normalizedLimit, normalizedOffset };

        return jdbcTemplate.query(
                sql.toString(),
                (resultSet, rowNum) -> mapPromptSummary(resultSet),
                params
        );
    }

    public Optional<PromptDetailResponse> findDetail(String id) {
        UUID promptId = parseUuid(id);
        if (promptId == null) {
            return Optional.empty();
        }

        UUID viewerId = optionalViewerId();

        return jdbcTemplate.query("""
                select
                    prompt.id,
                    prompt.title,
                    prompt.summary,
                    prompt.modality,
                    prompt.prompt_text,
                    prompt.prompt_text_zh,
                    prompt.prompt_text_en,
                    prompt.prompt_text_raw,
                    prompt.source_platform,
                    prompt.source_campaign,
                    prompt.source_item_id,
                    prompt.source_url,
                    prompt.model_name,
                    prompt.model_category,
                    prompt.content_category,
                    prompt.composition_category,
                    prompt.tag_names,
                    prompt.like_count,
                    prompt.favorite_count,
                    prompt.comment_count,
                    prompt.comments_enabled,
                    prompt.example_count,
                    cover.storage_provider as cover_storage_provider,
                    cover.bucket_name as cover_bucket_name,
                    cover.object_key as cover_url,
                    cover.asset_kind as cover_asset_kind,
                    primary_example.storage_provider as primary_example_storage_provider,
                    primary_example.bucket_name as primary_example_bucket_name,
                    primary_example.object_key as primary_example_url,
                    primary_example.asset_kind as primary_example_asset_kind,
                    preview_example.storage_provider as preview_example_storage_provider,
                    preview_example.bucket_name as preview_example_bucket_name,
                    preview_example.object_key as preview_example_url,
                    preview_example.asset_kind as preview_example_asset_kind,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    exists(
                        select 1
                        from interaction_actions action
                        where action.actor_id = ?
                          and action.action_type = 'like'
                          and action.target_type = 'prompt'
                          and action.target_id = prompt.id
                          and action.status_code = 'active'
                    ) as viewer_liked,
                    exists(
                        select 1
                        from interaction_actions action
                        where action.actor_id = ?
                          and action.action_type = 'favorite'
                          and action.target_type = 'prompt'
                          and action.target_id = prompt.id
                          and action.status_code = 'active'
                    ) as viewer_favorited,
                    exists(
                        select 1
                        from follow_relations relation
                        where relation.follower_id = ?
                          and relation.followee_id = author.id
                          and relation.status_code = 'active'
                    ) as viewer_followed_author
                from prompt_entries prompt
                join users author on author.id = prompt.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join media_assets cover on cover.id = prompt.cover_asset_id
                left join media_assets primary_example on primary_example.id = prompt.primary_example_asset_id
                left join media_assets preview_example on preview_example.id = (
                    select link.media_asset_id
                    from prompt_example_links link
                    where link.prompt_id = prompt.id
                      and link.role_code = 'preview'
                    order by link.sort_order asc, link.created_at asc
                    limit 1
                )
                where prompt.id = ?
                  and prompt.publish_status = 'published'
                  and prompt.deleted_at is null
                """,
                resultSet -> {
                    if (!resultSet.next()) {
                        return Optional.empty();
                    }

                    return Optional.of(new PromptDetailResponse(
                            resultSet.getObject("id").toString(),
                            resultSet.getString("title"),
                            resultSet.getString("summary"),
                            resultSet.getString("modality"),
                            resultSet.getString("prompt_text"),
                            resultSet.getString("prompt_text_zh"),
                            resultSet.getString("prompt_text_en"),
                            resultSet.getString("prompt_text_raw"),
                            new PromptDetailResponse.Taxonomy(
                                    resultSet.getString("model_category"),
                                    resultSet.getString("content_category"),
                                    resultSet.getString("composition_category")
                            ),
                            new PromptDetailResponse.Source(
                                    resultSet.getString("source_platform"),
                                    resultSet.getString("source_campaign"),
                                    resultSet.getString("source_item_id"),
                                    resultSet.getString("source_url"),
                                    resultSet.getString("model_name")
                            ),
                            new PromptDetailResponse.Author(
                                    resultSet.getObject("author_id").toString(),
                                    resultSet.getString("author_display_name"),
                                    jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                            ),
                            resolvePromptCoverUrl(resultSet),
                            resolvePromptPosterUrl(resultSet),
                            resolvePromptPreviewUrl(resultSet),
                            resolvePromptSourceUrl(resultSet),
                            toStringList(resultSet.getArray("tag_names")),
                            loadExampleAssets(promptId),
                            new PromptDetailResponse.CommentPolicy(
                                    resultSet.getBoolean("comments_enabled"),
                                    canManageContent((UUID) resultSet.getObject("author_id"))
                            ),
                            new PromptDetailResponse.Stats(
                                    resultSet.getLong("like_count"),
                                    resultSet.getLong("favorite_count"),
                                    resultSet.getLong("comment_count"),
                                    resultSet.getLong("example_count")
                            ),
                            new PromptDetailResponse.ViewerActions(
                                    resultSet.getBoolean("viewer_liked"),
                                    resultSet.getBoolean("viewer_favorited"),
                                    resultSet.getBoolean("viewer_followed_author")
                            )
                    ));
                },
                viewerId,
                viewerId,
                viewerId,
                promptId
        );
    }

    public List<PromptSummaryResponse> relatedPrompts(String id) {
        UUID promptId = parseUuid(id);
        if (promptId == null) {
            return List.of();
        }

        PromptSeed seed = jdbcTemplate.query("""
                select
                    id,
                    author_id,
                    modality,
                    model_category,
                    content_category,
                    composition_category,
                    tag_names,
                    published_at,
                    updated_at
                from prompt_entries
                where id = ?
                  and publish_status = 'published'
                  and deleted_at is null
                """,
                resultSet -> resultSet.next()
                        ? new PromptSeed(
                                resultSet.getObject("id", UUID.class),
                                resultSet.getObject("author_id", UUID.class),
                                resultSet.getString("modality"),
                                resultSet.getString("model_category"),
                                resultSet.getString("content_category"),
                                resultSet.getString("composition_category"),
                                toStringList(resultSet.getArray("tag_names")),
                                resultSet.getObject("published_at", OffsetDateTime.class),
                                resultSet.getObject("updated_at", OffsetDateTime.class)
                        )
                        : null,
                promptId
        );

        if (seed == null) {
            return List.of();
        }

        List<PromptRecommendationCandidate> candidates = jdbcTemplate.query("""
                select
                    prompt.id,
                    prompt.title,
                    prompt.summary,
                    prompt.modality,
                    cover.storage_provider as cover_storage_provider,
                    cover.bucket_name as cover_bucket_name,
                    cover.object_key as cover_url,
                    cover.asset_kind as cover_asset_kind,
                    primary_example.storage_provider as primary_example_storage_provider,
                    primary_example.bucket_name as primary_example_bucket_name,
                    primary_example.object_key as primary_example_url,
                    primary_example.asset_kind as primary_example_asset_kind,
                    preview_example.storage_provider as preview_example_storage_provider,
                    preview_example.bucket_name as preview_example_bucket_name,
                    preview_example.object_key as preview_example_url,
                    preview_example.asset_kind as preview_example_asset_kind,
                    prompt.model_category,
                    prompt.content_category,
                    prompt.composition_category,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    prompt.tag_names,
                    prompt.like_count,
                    prompt.favorite_count,
                    prompt.example_count,
                    prompt.published_at,
                    prompt.updated_at,
                    exists(
                        select 1
                        from interaction_actions action
                        where action.actor_id = ?
                          and action.action_type = 'like'
                          and action.target_type = 'prompt'
                          and action.target_id = prompt.id
                          and action.status_code = 'active'
                    ) as viewer_liked
                from prompt_entries prompt
                join users author on author.id = prompt.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join media_assets cover on cover.id = prompt.cover_asset_id
                left join media_assets primary_example on primary_example.id = prompt.primary_example_asset_id
                left join media_assets preview_example on preview_example.id = (
                    select link.media_asset_id
                    from prompt_example_links link
                    where link.prompt_id = prompt.id
                      and link.role_code = 'preview'
                    order by link.sort_order asc, link.created_at asc
                    limit 1
                )
                where prompt.publish_status = 'published'
                  and prompt.deleted_at is null
                  and prompt.id <> ?
                order by prompt.like_count desc,
                         prompt.favorite_count desc,
                         coalesce(prompt.published_at, prompt.updated_at) desc
                limit 48
                """,
                (resultSet, rowNum) -> new PromptRecommendationCandidate(
                        mapPromptSummary(resultSet),
                        resultSet.getObject("author_id", UUID.class),
                        resultSet.getString("modality"),
                        resultSet.getString("model_category"),
                        resultSet.getString("content_category"),
                        resultSet.getString("composition_category"),
                        toStringList(resultSet.getArray("tag_names")),
                        resultSet.getObject("published_at", OffsetDateTime.class),
                        resultSet.getObject("updated_at", OffsetDateTime.class)
                ),
                optionalViewerId(),
                seed.id()
        );

        return candidates.stream()
                .sorted((left, right) -> Integer.compare(
                        scorePromptRecommendation(seed, right),
                        scorePromptRecommendation(seed, left)
                ))
                .limit(6)
                .map(PromptRecommendationCandidate::summary)
                .toList();
    }

    private List<PromptDetailResponse.ExampleAsset> loadExampleAssets(UUID promptId) {
        return jdbcTemplate.query("""
                select
                    asset.id,
                    asset.asset_kind,
                    asset.storage_provider as object_key_storage_provider,
                    asset.bucket_name as object_key_bucket_name,
                    asset.object_key,
                    asset.mime_type,
                    asset.width,
                    asset.height,
                    asset.duration_ms
                from prompt_example_links link
                join media_assets asset on asset.id = link.media_asset_id
                where link.prompt_id = ?
                  and link.role_code = 'example'
                order by link.sort_order asc, link.created_at asc
                """,
                (resultSet, rowNum) -> new PromptDetailResponse.ExampleAsset(
                        resultSet.getObject("id").toString(),
                        resultSet.getString("asset_kind"),
                        jdbcMediaUrlResolver.resolve(resultSet, "object_key"),
                        resultSet.getString("mime_type"),
                        resultSet.getObject("width", Integer.class),
                        resultSet.getObject("height", Integer.class),
                        resultSet.getObject("duration_ms", Integer.class)
                ),
                promptId
        );
    }

    private int scorePromptRecommendation(PromptSeed seed, PromptRecommendationCandidate candidate) {
        int score = 0;

        if (seed.authorId() != null && seed.authorId().equals(candidate.authorId())) {
            score += 90;
        }

        if (seed.modality() != null && seed.modality().equals(candidate.modality())) {
            score += 18;
        }

        if (seed.modelCategory() != null && seed.modelCategory().equals(candidate.modelCategory())) {
            score += 55;
        }

        if (seed.contentCategory() != null && seed.contentCategory().equals(candidate.contentCategory())) {
            score += 40;
        }

        if (seed.compositionCategory() != null && seed.compositionCategory().equals(candidate.compositionCategory())) {
            score += 30;
        }

        score += overlapCount(seed.tagNames(), candidate.tagNames()) * 14;
        score += Math.min(24, (int) (candidate.summary().stats().likeCount() / 5));
        score += Math.min(18, (int) (candidate.summary().stats().favoriteCount() / 4));
        score += Math.min(12, (int) (candidate.summary().stats().exampleCount() / 2));
        score += recencyBonus(candidate.publishedAt(), candidate.updatedAt());

        return score;
    }

    private int overlapCount(List<String> left, List<String> right) {
        if (left.isEmpty() || right.isEmpty()) {
            return 0;
        }

        int count = 0;
        for (String value : left) {
            if (value != null && right.contains(value)) {
                count += 1;
            }
        }
        return count;
    }

    private int recencyBonus(OffsetDateTime publishedAt, OffsetDateTime updatedAt) {
        OffsetDateTime timestamp = publishedAt != null ? publishedAt : updatedAt;
        if (timestamp == null) {
            return 0;
        }

        long days = Math.max(0, Duration.between(timestamp, OffsetDateTime.now()).toDays());
        if (days == 0) {
            return 10;
        }
        if (days == 1) {
            return 8;
        }
        if (days <= 3) {
            return 6;
        }
        if (days <= 7) {
            return 4;
        }
        if (days <= 14) {
            return 2;
        }
        return 0;
    }

    private PromptSummaryResponse mapPromptSummary(ResultSet resultSet) throws SQLException {
        return new PromptSummaryResponse(
                resultSet.getObject("id").toString(),
                resultSet.getString("title"),
                resultSet.getString("summary"),
                resultSet.getString("modality"),
                resolvePromptCoverUrl(resultSet),
                resolvePromptPosterUrl(resultSet),
                resolvePromptPreviewUrl(resultSet),
                resolvePromptSourceUrl(resultSet),
                new PromptSummaryResponse.Taxonomy(
                        resultSet.getString("model_category"),
                        resultSet.getString("content_category"),
                        resultSet.getString("composition_category")
                ),
                new PromptSummaryResponse.AuthorSummary(
                        resultSet.getObject("author_id").toString(),
                        resultSet.getString("author_display_name"),
                        jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                ),
                toStringList(resultSet.getArray("tag_names")),
                new PromptSummaryResponse.Stats(
                        resultSet.getLong("like_count"),
                        resultSet.getLong("favorite_count"),
                        resultSet.getLong("example_count")
                ),
                new PromptSummaryResponse.ViewerActions(
                        resultSet.getBoolean("viewer_liked")
                )
        );
    }

    private String resolvePromptCoverUrl(ResultSet resultSet) throws SQLException {
        String explicitCoverUrl = resolveImageMediaUrl(resultSet, "cover_url", "cover_asset_kind");
        return explicitCoverUrl != null
                ? explicitCoverUrl
                : resolveImageMediaUrl(resultSet, "primary_example_url", "primary_example_asset_kind");
    }

    private String resolvePromptPosterUrl(ResultSet resultSet) throws SQLException {
        return resolvePromptCoverUrl(resultSet);
    }

    private String resolvePromptPreviewUrl(ResultSet resultSet) throws SQLException {
        String previewUrl = resolveVideoMediaUrl(resultSet, "preview_example_url", "preview_example_asset_kind");
        return previewUrl != null
                ? previewUrl
                : resolveVideoMediaUrl(resultSet, "primary_example_url", "primary_example_asset_kind");
    }

    private String resolvePromptSourceUrl(ResultSet resultSet) throws SQLException {
        return resolveVideoMediaUrl(resultSet, "primary_example_url", "primary_example_asset_kind");
    }

    private String resolveImageMediaUrl(ResultSet resultSet, String columnName, String assetKindColumn) throws SQLException {
        return "image".equalsIgnoreCase(resultSet.getString(assetKindColumn))
                ? jdbcMediaUrlResolver.resolve(resultSet, columnName)
                : null;
    }

    private String resolveVideoMediaUrl(ResultSet resultSet, String columnName, String assetKindColumn) throws SQLException {
        return "video".equalsIgnoreCase(resultSet.getString(assetKindColumn))
                ? jdbcMediaUrlResolver.resolve(resultSet, columnName)
                : null;
    }

    private String normalizeFilter(
            String value,
            String fallback,
            Set<String> supportedValues,
            String errorCode
    ) {
        String normalized = value == null || value.isBlank()
                ? fallback
                : value.trim().toLowerCase(Locale.ROOT);
        if (!supportedValues.contains(normalized)) {
            throw ApiBusinessException.badRequest(errorCode, "unsupported filter");
        }
        return normalized;
    }

    private int normalizeLimit(Integer value) {
        if (value == null) {
            return DEFAULT_LIST_LIMIT;
        }

        if (value <= 0) {
            throw ApiBusinessException.badRequest("PROMPT_LIMIT_INVALID", "limit must be positive");
        }

        return Math.min(value, MAX_LIST_LIMIT);
    }

    private int normalizeOffset(Integer value) {
        if (value == null) {
            return DEFAULT_LIST_OFFSET;
        }

        if (value < 0) {
            throw ApiBusinessException.badRequest("PROMPT_OFFSET_INVALID", "offset must not be negative");
        }

        return value;
    }

    private UUID optionalViewerId() {
        CurrentUser currentUser = CurrentUserContext.currentOrNull();
        return currentUser == null ? null : currentUser.id();
    }

    private boolean canManageContent(UUID authorId) {
        if (authorId == null) {
            return false;
        }
        CurrentUser currentUser = CurrentUserContext.currentOrNull();
        if (currentUser == null) {
            return false;
        }
        if (currentUser.id().equals(authorId)) {
            return true;
        }

        String roleCode = currentUser.roleCode() == null ? "" : currentUser.roleCode().toLowerCase(Locale.ROOT);
        return "admin".equals(roleCode) || "operator".equals(roleCode) || "moderator".equals(roleCode);
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

    private List<String> toStringList(Array sqlArray) throws SQLException {
        if (sqlArray == null) {
            return List.of();
        }

        Object raw = sqlArray.getArray();
        if (raw instanceof String[] values) {
            return List.of(values);
        }

        return List.of();
    }

    private record PromptSeed(
            UUID id,
            UUID authorId,
            String modality,
            String modelCategory,
            String contentCategory,
            String compositionCategory,
            List<String> tagNames,
            OffsetDateTime publishedAt,
            OffsetDateTime updatedAt
    ) {
    }

    private record PromptRecommendationCandidate(
            PromptSummaryResponse summary,
            UUID authorId,
            String modality,
            String modelCategory,
            String contentCategory,
            String compositionCategory,
            List<String> tagNames,
            OffsetDateTime publishedAt,
            OffsetDateTime updatedAt
    ) {
    }
}
