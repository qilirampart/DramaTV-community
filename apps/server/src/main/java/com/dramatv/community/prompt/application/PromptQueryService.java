package com.dramatv.community.prompt.application;

import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserContext;
import com.dramatv.community.prompt.dto.response.PromptDetailResponse;
import com.dramatv.community.prompt.dto.response.PromptSummaryResponse;
import com.dramatv.community.shared.error.ApiBusinessException;
import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
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

    private final JdbcTemplate jdbcTemplate;

    public PromptQueryService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<PromptSummaryResponse> listPublished(String modality, String sort) {
        String normalizedModality = normalizeFilter(modality, "all", SUPPORTED_MODALITIES, "PROMPT_MODALITY_INVALID");
        String normalizedSort = normalizeFilter(sort, "latest", SUPPORTED_SORTS, "PROMPT_SORT_INVALID");

        StringBuilder sql = new StringBuilder("""
                select
                    prompt.id,
                    prompt.title,
                    prompt.summary,
                    prompt.modality,
                    coalesce(cover.object_key, primary_example.object_key) as cover_url,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    author.avatar_url as author_avatar_url,
                    prompt.tag_names,
                    prompt.like_count,
                    prompt.favorite_count,
                    prompt.example_count
                from prompt_entries prompt
                join users author on author.id = prompt.author_id
                left join media_assets cover on cover.id = prompt.cover_asset_id
                left join media_assets primary_example on primary_example.id = prompt.primary_example_asset_id
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
                limit 24
                """);

        Object[] params = "all".equals(normalizedModality) ? new Object[0] : new Object[] { normalizedModality };

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
                    prompt.tag_names,
                    prompt.like_count,
                    prompt.favorite_count,
                    prompt.comment_count,
                    prompt.example_count,
                    coalesce(cover.object_key, primary_example.object_key) as cover_url,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    author.avatar_url as author_avatar_url,
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
                left join media_assets cover on cover.id = prompt.cover_asset_id
                left join media_assets primary_example on primary_example.id = prompt.primary_example_asset_id
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
                                    resultSet.getString("author_avatar_url")
                            ),
                            resultSet.getString("cover_url"),
                            toStringList(resultSet.getArray("tag_names")),
                            loadExampleAssets(promptId),
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
                select id, author_id, modality
                from prompt_entries
                where id = ?
                  and publish_status = 'published'
                  and deleted_at is null
                """,
                resultSet -> resultSet.next()
                        ? new PromptSeed(
                                resultSet.getObject("id", UUID.class),
                                resultSet.getObject("author_id", UUID.class),
                                resultSet.getString("modality")
                        )
                        : null,
                promptId
        );

        if (seed == null) {
            return List.of();
        }

        return jdbcTemplate.query("""
                select
                    prompt.id,
                    prompt.title,
                    prompt.summary,
                    prompt.modality,
                    coalesce(cover.object_key, primary_example.object_key) as cover_url,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    author.avatar_url as author_avatar_url,
                    prompt.tag_names,
                    prompt.like_count,
                    prompt.favorite_count,
                    prompt.example_count
                from prompt_entries prompt
                join users author on author.id = prompt.author_id
                left join media_assets cover on cover.id = prompt.cover_asset_id
                left join media_assets primary_example on primary_example.id = prompt.primary_example_asset_id
                where prompt.publish_status = 'published'
                  and prompt.deleted_at is null
                  and prompt.id <> ?
                  and (prompt.author_id = ? or prompt.modality = ?)
                order by
                    case when prompt.author_id = ? then 0 else 1 end asc,
                    prompt.like_count desc,
                    coalesce(prompt.published_at, prompt.updated_at) desc
                limit 6
                """,
                (resultSet, rowNum) -> mapPromptSummary(resultSet),
                seed.id(),
                seed.authorId(),
                seed.modality(),
                seed.authorId()
        );
    }

    private List<PromptDetailResponse.ExampleAsset> loadExampleAssets(UUID promptId) {
        return jdbcTemplate.query("""
                select
                    asset.id,
                    asset.asset_kind,
                    asset.object_key,
                    asset.mime_type,
                    asset.width,
                    asset.height,
                    asset.duration_ms
                from prompt_example_links link
                join media_assets asset on asset.id = link.media_asset_id
                where link.prompt_id = ?
                order by link.sort_order asc, link.created_at asc
                """,
                (resultSet, rowNum) -> new PromptDetailResponse.ExampleAsset(
                        resultSet.getObject("id").toString(),
                        resultSet.getString("asset_kind"),
                        resultSet.getString("object_key"),
                        resultSet.getString("mime_type"),
                        resultSet.getObject("width", Integer.class),
                        resultSet.getObject("height", Integer.class),
                        resultSet.getObject("duration_ms", Integer.class)
                ),
                promptId
        );
    }

    private PromptSummaryResponse mapPromptSummary(ResultSet resultSet) throws SQLException {
        return new PromptSummaryResponse(
                resultSet.getObject("id").toString(),
                resultSet.getString("title"),
                resultSet.getString("summary"),
                resultSet.getString("modality"),
                resultSet.getString("cover_url"),
                new PromptSummaryResponse.AuthorSummary(
                        resultSet.getObject("author_id").toString(),
                        resultSet.getString("author_display_name"),
                        resultSet.getString("author_avatar_url")
                ),
                toStringList(resultSet.getArray("tag_names")),
                new PromptSummaryResponse.Stats(
                        resultSet.getLong("like_count"),
                        resultSet.getLong("favorite_count"),
                        resultSet.getLong("example_count")
                )
        );
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

    private UUID optionalViewerId() {
        CurrentUser currentUser = CurrentUserContext.currentOrNull();
        return currentUser == null ? null : currentUser.id();
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
            String modality
    ) {
    }
}
