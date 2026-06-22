package com.dramatv.community.feed.application;

import com.dramatv.community.feed.dto.response.FeaturedInventoryResponse;
import com.dramatv.community.feed.dto.response.HomeFeedResponse;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserContext;
import com.dramatv.community.shared.error.ApiBusinessException;
import com.dramatv.community.shared.media.JdbcMediaUrlResolver;
import com.dramatv.community.shared.response.CursorPageResponse;
import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class FeaturedInventoryQueryService {

    private static final Set<String> SUPPORTED_FILTERS = Set.of(
            "all",
            "workflow",
            "video_prompt",
            "image_prompt",
            "activity"
    );
    private static final Set<String> SUPPORTED_SORTS = Set.of("latest", "hot");
    private static final Set<String> SUPPORTED_WORKFLOW_TYPES = Set.of("copyable", "placeholder");
    private static final int DEFAULT_LIMIT = 24;
    private static final int MAX_LIMIT = 48;
    private static final int DEFAULT_OFFSET = 0;
    private static final String OFFSET_CURSOR_PREFIX = "offset:";

    private final JdbcTemplate jdbcTemplate;
    private final JdbcMediaUrlResolver jdbcMediaUrlResolver;

    public FeaturedInventoryQueryService(
            JdbcTemplate jdbcTemplate,
            JdbcMediaUrlResolver jdbcMediaUrlResolver
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.jdbcMediaUrlResolver = jdbcMediaUrlResolver;
    }

    public FeaturedInventoryResponse loadInventory(
            String filter,
            String sort,
            String query,
            String modelCategory,
            String contentCategory,
            String workflowType,
            Integer limit,
            String cursor
    ) {
        String normalizedFilter = normalizeFilter(filter, "all", SUPPORTED_FILTERS, "FEATURED_FILTER_INVALID");
        String normalizedSort = normalizeFilter(sort, "latest", SUPPORTED_SORTS, "FEATURED_SORT_INVALID");
        String normalizedQuery = normalizeSearchQuery(query);
        String normalizedModelCategory = isPromptFilter(normalizedFilter)
                ? normalizeOptionalFilterValue(modelCategory)
                : null;
        String normalizedContentCategory = isPromptFilter(normalizedFilter)
                ? normalizeOptionalFilterValue(contentCategory)
                : null;
        String normalizedWorkflowType = "workflow".equals(normalizedFilter)
                ? normalizeWorkflowType(workflowType)
                : null;
        int normalizedLimit = normalizeLimit(limit);
        int normalizedOffset = decodeOffsetCursor(cursor);

        FeaturedInventoryResponse.Summary summary = new FeaturedInventoryResponse.Summary(
                loadCounts(normalizedQuery),
                loadWorkflowFacetSummary(normalizedQuery),
                loadPromptFacetSummary("video", normalizedQuery),
                loadPromptFacetSummary("image", normalizedQuery)
        );

        CursorPageResponse<FeaturedInventoryResponse.Item> page = switch (normalizedFilter) {
            case "workflow" -> buildCursorPage(
                    queryWorkflowCandidates(normalizedSort, normalizedQuery, normalizedWorkflowType, normalizedLimit + 1, normalizedOffset),
                    normalizedLimit,
                    normalizedOffset
            );
            case "activity" -> buildCursorPage(List.of(), normalizedLimit, normalizedOffset);
            case "video_prompt", "image_prompt" -> buildCursorPage(
                    queryPromptCandidates(
                            normalizedFilter,
                            normalizedSort,
                            normalizedQuery,
                            normalizedModelCategory,
                            normalizedContentCategory,
                            normalizedLimit + 1,
                            normalizedOffset
                    ),
                    normalizedLimit,
                    normalizedOffset
            );
            default -> buildAllCursorPage(normalizedSort, normalizedQuery, normalizedLimit, normalizedOffset);
        };

        return new FeaturedInventoryResponse(summary, page);
    }

    private CursorPageResponse<FeaturedInventoryResponse.Item> buildAllCursorPage(
            String normalizedSort,
            String normalizedQuery,
            int normalizedLimit,
            int normalizedOffset
    ) {
        int requestedWindow = normalizedOffset + normalizedLimit + 1;
        List<InventoryCandidate> candidates = buildMixedAllCandidates(normalizedSort, normalizedQuery, requestedWindow);

        if (normalizedOffset >= candidates.size()) {
            return new CursorPageResponse<>(List.of(), null, false);
        }

        int endExclusive = Math.min(normalizedOffset + normalizedLimit, candidates.size());
        List<FeaturedInventoryResponse.Item> items = candidates.subList(normalizedOffset, endExclusive).stream()
                .map(InventoryCandidate::item)
                .toList();
        boolean hasMore = candidates.size() > normalizedOffset + normalizedLimit;
        String nextCursor = hasMore ? encodeOffsetCursor(normalizedOffset + items.size()) : null;
        return new CursorPageResponse<>(items, nextCursor, hasMore);
    }

    private CursorPageResponse<FeaturedInventoryResponse.Item> buildCursorPage(
            List<InventoryCandidate> rows,
            int normalizedLimit,
            int normalizedOffset
    ) {
        boolean hasMore = rows.size() > normalizedLimit;
        List<FeaturedInventoryResponse.Item> items = rows.stream()
                .limit(normalizedLimit)
                .map(InventoryCandidate::item)
                .toList();
        String nextCursor = hasMore ? encodeOffsetCursor(normalizedOffset + items.size()) : null;
        return new CursorPageResponse<>(items, nextCursor, hasMore);
    }

    private FeaturedInventoryResponse.Counts loadCounts(String normalizedQuery) {
        PromptCountSnapshot promptCounts = loadPromptCounts(normalizedQuery);
        long workflowCount = loadWorkflowCount(normalizedQuery);
        long activityCount = 0L;
        return new FeaturedInventoryResponse.Counts(
                promptCounts.all() + workflowCount + activityCount,
                workflowCount,
                promptCounts.videoPrompt(),
                promptCounts.imagePrompt(),
                activityCount
        );
    }

    private List<InventoryCandidate> buildMixedAllCandidates(
            String normalizedSort,
            String normalizedQuery,
            int requestedWindow
    ) {
        List<InventoryCandidate> videoPromptCandidates = queryPromptCandidates(
                "video_prompt",
                normalizedSort,
                normalizedQuery,
                null,
                null,
                requestedWindow,
                0
        );
        List<InventoryCandidate> imagePromptCandidates = queryPromptCandidates(
                "image_prompt",
                normalizedSort,
                normalizedQuery,
                null,
                null,
                requestedWindow,
                0
        );
        List<InventoryCandidate> workflowCandidates = queryWorkflowCandidates(
                normalizedSort,
                normalizedQuery,
                null,
                requestedWindow,
                0
        );

        List<InventoryCandidate> mergedCandidates = new ArrayList<>(requestedWindow);
        int videoIndex = 0;
        int imageIndex = 0;
        int workflowIndex = 0;
        String lastPromptModality = null;

        while (mergedCandidates.size() < requestedWindow) {
            InventoryCandidate nextVideoCandidate = videoIndex < videoPromptCandidates.size()
                    ? videoPromptCandidates.get(videoIndex)
                    : null;
            InventoryCandidate nextImageCandidate = imageIndex < imagePromptCandidates.size()
                    ? imagePromptCandidates.get(imageIndex)
                    : null;
            InventoryCandidate nextWorkflowCandidate = workflowIndex < workflowCandidates.size()
                    ? workflowCandidates.get(workflowIndex)
                    : null;

            InventoryCandidate nextCandidate = pickNextAllCandidate(
                    nextVideoCandidate,
                    nextImageCandidate,
                    nextWorkflowCandidate,
                    lastPromptModality,
                    normalizedSort
            );
            if (nextCandidate == null) {
                break;
            }

            mergedCandidates.add(nextCandidate);
            if (nextVideoCandidate != null && nextCandidate == nextVideoCandidate) {
                videoIndex += 1;
                lastPromptModality = "video";
                continue;
            }
            if (nextImageCandidate != null && nextCandidate == nextImageCandidate) {
                imageIndex += 1;
                lastPromptModality = "image";
                continue;
            }

            workflowIndex += 1;
        }

        return mergedCandidates;
    }

    private InventoryCandidate pickNextAllCandidate(
            InventoryCandidate nextVideoCandidate,
            InventoryCandidate nextImageCandidate,
            InventoryCandidate nextWorkflowCandidate,
            String lastPromptModality,
            String normalizedSort
    ) {
        InventoryCandidate preferredPromptCandidate = pickPreferredPromptCandidate(
                nextVideoCandidate,
                nextImageCandidate,
                lastPromptModality,
                normalizedSort
        );
        if (preferredPromptCandidate == null) {
            return nextWorkflowCandidate;
        }
        if (nextWorkflowCandidate == null) {
            return preferredPromptCandidate;
        }

        return compareInventoryCandidates(nextWorkflowCandidate, preferredPromptCandidate, normalizedSort) <= 0
                ? nextWorkflowCandidate
                : preferredPromptCandidate;
    }

    private InventoryCandidate pickPreferredPromptCandidate(
            InventoryCandidate nextVideoCandidate,
            InventoryCandidate nextImageCandidate,
            String lastPromptModality,
            String normalizedSort
    ) {
        if (nextVideoCandidate == null) {
            return nextImageCandidate;
        }
        if (nextImageCandidate == null) {
            return nextVideoCandidate;
        }
        if ("video".equals(lastPromptModality)) {
            return nextImageCandidate;
        }
        if ("image".equals(lastPromptModality)) {
            return nextVideoCandidate;
        }

        return compareInventoryCandidates(nextVideoCandidate, nextImageCandidate, normalizedSort) <= 0
                ? nextVideoCandidate
                : nextImageCandidate;
    }

    private PromptCountSnapshot loadPromptCounts(String normalizedQuery) {
        StringBuilder sql = new StringBuilder("""
                select prompt.modality, count(*) as total
                from prompt_entries prompt
                join users author on author.id = prompt.author_id
                where prompt.publish_status = 'published'
                  and prompt.deleted_at is null
                """);
        List<Object> params = new ArrayList<>();
        appendPromptSearchClause(sql, params, normalizedQuery);
        sql.append("""
                group by prompt.modality
                """);

        Map<String, Long> totals = jdbcTemplate.query(
                sql.toString(),
                resultSet -> {
                    LinkedHashMap<String, Long> counts = new LinkedHashMap<>();
                    while (resultSet.next()) {
                        counts.put(resultSet.getString("modality"), resultSet.getLong("total"));
                    }
                    return counts;
                },
                params.toArray()
        );

        long imagePromptCount = totals.getOrDefault("image", 0L);
        long videoPromptCount = totals.getOrDefault("video", 0L);
        return new PromptCountSnapshot(imagePromptCount + videoPromptCount, videoPromptCount, imagePromptCount);
    }

    private long loadWorkflowCount(String normalizedQuery) {
        StringBuilder sql = new StringBuilder("""
                select count(*)
                from workflows workflow
                join users author on author.id = workflow.author_id
                where workflow.publish_status = 'published'
                  and workflow.deleted_at is null
                """);
        List<Object> params = new ArrayList<>();
        appendWorkflowSearchClause(sql, params, normalizedQuery);
        return jdbcTemplate.queryForObject(sql.toString(), Long.class, params.toArray());
    }

    private long loadActivityCount(String normalizedQuery) {
        StringBuilder sql = new StringBuilder("""
                select count(*)
                from discussion_threads thread
                join discussion_channels channel on channel.id = thread.channel_id
                join users author on author.id = thread.author_id
                where thread.publish_status = 'published'
                  and thread.deleted_at is null
                """);
        List<Object> params = new ArrayList<>();
        appendActivitySearchClause(sql, params, normalizedQuery);
        return jdbcTemplate.queryForObject(sql.toString(), Long.class, params.toArray());
    }

    private FeaturedInventoryResponse.WorkflowFacetSummary loadWorkflowFacetSummary(String normalizedQuery) {
        StringBuilder sql = new StringBuilder("""
                select workflow.allow_copy, count(*) as total
                from workflows workflow
                join users author on author.id = workflow.author_id
                where workflow.publish_status = 'published'
                  and workflow.deleted_at is null
                """);
        List<Object> params = new ArrayList<>();
        appendWorkflowSearchClause(sql, params, normalizedQuery);
        sql.append("""
                group by workflow.allow_copy
                """);

        Map<Boolean, Long> totals = jdbcTemplate.query(
                sql.toString(),
                resultSet -> {
                    LinkedHashMap<Boolean, Long> counts = new LinkedHashMap<>();
                    while (resultSet.next()) {
                        counts.put(resultSet.getBoolean("allow_copy"), resultSet.getLong("total"));
                    }
                    return counts;
                },
                params.toArray()
        );

        return new FeaturedInventoryResponse.WorkflowFacetSummary(
                totals.getOrDefault(Boolean.TRUE, 0L),
                totals.getOrDefault(Boolean.FALSE, 0L)
        );
    }

    private FeaturedInventoryResponse.PromptFacetSummary loadPromptFacetSummary(
            String modality,
            String normalizedQuery
    ) {
        return new FeaturedInventoryResponse.PromptFacetSummary(
                loadPromptFacetCountMap(modality, normalizedQuery, "model_category"),
                loadPromptFacetCountMap(modality, normalizedQuery, "content_category")
        );
    }

    private Map<String, Long> loadPromptFacetCountMap(String modality, String normalizedQuery, String columnName) {
        StringBuilder sql = new StringBuilder("""
                select prompt.""");
        sql.append(columnName).append("""
                 as facet_value,
                       count(*) as total
                from prompt_entries prompt
                join users author on author.id = prompt.author_id
                where prompt.publish_status = 'published'
                  and prompt.deleted_at is null
                  and prompt.modality = ?
                  and prompt.""");
        sql.append(columnName).append(" is not null\n");
        sql.append("                  and prompt.").append(columnName).append(" <> ''\n");
        List<Object> params = new ArrayList<>();
        params.add(modality);
        appendPromptSearchClause(sql, params, normalizedQuery);
        sql.append("                group by prompt.").append(columnName).append('\n');
        sql.append("                order by count(*) desc, prompt.").append(columnName).append(" asc\n");

        return jdbcTemplate.query(
                sql.toString(),
                resultSet -> {
                    LinkedHashMap<String, Long> counts = new LinkedHashMap<>();
                    while (resultSet.next()) {
                        counts.put(resultSet.getString("facet_value"), resultSet.getLong("total"));
                    }
                    return counts;
                },
                params.toArray()
        );
    }

    private List<InventoryCandidate> queryPromptCandidates(
            String normalizedFilter,
            String normalizedSort,
            String normalizedQuery,
            String normalizedModelCategory,
            String normalizedContentCategory,
            int limit,
            int offset
    ) {
        UUID viewerId = optionalViewerId();
        StringBuilder sql = new StringBuilder("""
                select
                    prompt.id,
                    prompt.title,
                    prompt.summary,
                    prompt.modality,
                    prompt.model_category,
                    prompt.content_category,
                    prompt.tag_names,
                    prompt.like_count,
                    coalesce(prompt.published_at, prompt.updated_at) as sort_at,
                    cover.storage_provider as cover_storage_provider,
                    cover.bucket_name as cover_bucket_name,
                    cover.object_key as cover_url,
                    cover.width as cover_width,
                    cover.height as cover_height,
                    cover.asset_kind as cover_asset_kind,
                    primary_example.storage_provider as primary_example_storage_provider,
                    primary_example.bucket_name as primary_example_bucket_name,
                    primary_example.object_key as primary_example_url,
                    primary_example.width as primary_example_width,
                    primary_example.height as primary_example_height,
                    primary_example.asset_kind as primary_example_asset_kind,
                    preview_example.storage_provider as preview_example_storage_provider,
                    preview_example.bucket_name as preview_example_bucket_name,
                    preview_example.object_key as preview_example_url,
                    preview_example.width as preview_example_width,
                    preview_example.height as preview_example_height,
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
        List<Object> params = new ArrayList<>();
        params.add(viewerId);

        String modality = toPromptModality(normalizedFilter);
        if (modality != null) {
            sql.append("""
                      and prompt.modality = ?
                    """);
            params.add(modality);
        }

        appendPromptSearchClause(sql, params, normalizedQuery);

        if (modality != null && normalizedModelCategory != null) {
            sql.append("""
                      and prompt.model_category = ?
                    """);
            params.add(normalizedModelCategory);
        }

        if (modality != null && normalizedContentCategory != null) {
            sql.append("""
                      and prompt.content_category = ?
                    """);
            params.add(normalizedContentCategory);
        }

        appendSortClause(sql, "prompt.like_count", "coalesce(prompt.published_at, prompt.updated_at)", "prompt.id", normalizedSort);
        sql.append("""
                limit ?
                offset ?
                """);
        params.add(limit);
        params.add(offset);

        return jdbcTemplate.query(
                sql.toString(),
                (resultSet, rowNum) -> mapPromptCandidate(resultSet),
                params.toArray()
        );
    }

    private List<InventoryCandidate> queryWorkflowCandidates(
            String normalizedSort,
            String normalizedQuery,
            String normalizedWorkflowType,
            int limit,
            int offset
    ) {
        StringBuilder sql = new StringBuilder("""
                select
                    workflow.id,
                    workflow.title,
                    workflow.summary,
                    workflow.tag_names,
                    workflow.like_count,
                    workflow.allow_copy,
                    coalesce(workflow.published_at, workflow.updated_at) as sort_at,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    cover.storage_provider as cover_storage_provider,
                    cover.bucket_name as cover_bucket_name,
                    cover.object_key as cover_url,
                    cover.width as cover_width,
                    cover.height as cover_height
                from workflows workflow
                join users author on author.id = workflow.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join media_assets cover on cover.id = workflow.cover_asset_id
                where workflow.publish_status = 'published'
                  and workflow.deleted_at is null
                """);
        List<Object> params = new ArrayList<>();
        appendWorkflowSearchClause(sql, params, normalizedQuery);

        if ("copyable".equals(normalizedWorkflowType)) {
            sql.append("""
                      and workflow.allow_copy = true
                    """);
        } else if ("placeholder".equals(normalizedWorkflowType)) {
            sql.append("""
                      and workflow.allow_copy = false
                    """);
        }

        appendSortClause(sql, "workflow.like_count", "coalesce(workflow.published_at, workflow.updated_at)", "workflow.id", normalizedSort);
        sql.append("""
                limit ?
                offset ?
                """);
        params.add(limit);
        params.add(offset);

        return jdbcTemplate.query(
                sql.toString(),
                (resultSet, rowNum) -> mapWorkflowCandidate(resultSet),
                params.toArray()
        );
    }

    private List<InventoryCandidate> queryActivityCandidates(
            String normalizedSort,
            String normalizedQuery,
            int limit,
            int offset
    ) {
        StringBuilder sql = new StringBuilder("""
                select
                    thread.id,
                    thread.slug,
                    channel.slug as channel_slug,
                    thread.title,
                    thread.excerpt_text,
                    thread.tag_names,
                    thread.like_count,
                    coalesce(thread.last_activity_at, thread.published_at, thread.updated_at) as sort_at,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    video_cover.storage_provider as video_cover_storage_provider,
                    video_cover.bucket_name as video_cover_bucket_name,
                    video_cover.object_key as video_cover_url,
                    video_cover.width as video_cover_width,
                    video_cover.height as video_cover_height,
                    video_poster.storage_provider as video_poster_storage_provider,
                    video_poster.bucket_name as video_poster_bucket_name,
                    video_poster.object_key as video_poster_url,
                    video_poster.width as video_poster_width,
                    video_poster.height as video_poster_height,
                    video_preview.storage_provider as video_preview_storage_provider,
                    video_preview.bucket_name as video_preview_bucket_name,
                    video_preview.object_key as video_preview_url,
                    video_preview.width as video_preview_width,
                    video_preview.height as video_preview_height,
                    video_source.storage_provider as video_source_storage_provider,
                    video_source.bucket_name as video_source_bucket_name,
                    video_source.object_key as video_source_url,
                    video_source.width as video_source_width,
                    video_source.height as video_source_height,
                    workflow_cover.storage_provider as workflow_cover_storage_provider,
                    workflow_cover.bucket_name as workflow_cover_bucket_name,
                    workflow_cover.object_key as workflow_cover_url,
                    workflow_cover.width as workflow_cover_width,
                    workflow_cover.height as workflow_cover_height
                from discussion_threads thread
                join discussion_channels channel on channel.id = thread.channel_id
                join users author on author.id = thread.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join videos binding_video on thread.binding_target_type = 'video'
                    and binding_video.id = thread.binding_target_id
                    and binding_video.publish_status = 'published'
                    and binding_video.deleted_at is null
                left join workflows binding_workflow on thread.binding_target_type = 'workflow'
                    and binding_workflow.id = thread.binding_target_id
                    and binding_workflow.publish_status = 'published'
                    and binding_workflow.deleted_at is null
                left join media_assets video_cover on video_cover.id = binding_video.cover_asset_id
                left join media_assets video_poster on video_poster.id = binding_video.poster_asset_id
                left join media_assets video_preview on video_preview.id = binding_video.preview_asset_id
                left join media_assets video_source on video_source.id = binding_video.source_asset_id
                left join media_assets workflow_cover on workflow_cover.id = binding_workflow.cover_asset_id
                where thread.publish_status = 'published'
                  and thread.deleted_at is null
                """);
        List<Object> params = new ArrayList<>();
        appendActivitySearchClause(sql, params, normalizedQuery);
        appendSortClause(
                sql,
                "thread.like_count",
                "coalesce(thread.last_activity_at, thread.published_at, thread.updated_at)",
                "thread.id",
                normalizedSort
        );
        sql.append("""
                limit ?
                offset ?
                """);
        params.add(limit);
        params.add(offset);

        return jdbcTemplate.query(
                sql.toString(),
                (resultSet, rowNum) -> mapActivityCandidate(resultSet),
                params.toArray()
        );
    }

    private InventoryCandidate mapPromptCandidate(ResultSet resultSet) throws SQLException {
        String targetId = resultSet.getObject("id").toString();
        long likeCount = resultSet.getLong("like_count");
        return new InventoryCandidate(
                new FeaturedInventoryResponse.Item(
                        "prompt",
                        resultSet.getString("modality"),
                        "prompt",
                        targetId,
                        null,
                        null,
                        resultSet.getString("title"),
                        resultSet.getString("summary"),
                        resolvePromptCoverUrl(resultSet),
                        resolvePromptPosterUrl(resultSet),
                        resolvePromptPreviewUrl(resultSet),
                        resolvePromptSourceUrl(resultSet),
                        resolvePromptWidth(resultSet),
                        resolvePromptHeight(resultSet),
                        new HomeFeedResponse.AuthorSummary(
                                resultSet.getObject("author_id").toString(),
                                resultSet.getString("author_display_name"),
                                jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                        ),
                        new HomeFeedResponse.ItemStats(null, likeCount),
                        toStringList(resultSet.getArray("tag_names")),
                        resultSet.getString("model_category"),
                        resultSet.getString("content_category"),
                        null,
                        new FeaturedInventoryResponse.ViewerActions(resultSet.getBoolean("viewer_liked"))
                ),
                resultSet.getObject("sort_at", OffsetDateTime.class),
                likeCount,
                targetId
        );
    }

    private InventoryCandidate mapWorkflowCandidate(ResultSet resultSet) throws SQLException {
        String targetId = resultSet.getObject("id").toString();
        long likeCount = resultSet.getLong("like_count");
        return new InventoryCandidate(
                new FeaturedInventoryResponse.Item(
                        "workflow_work",
                        null,
                        "workflow",
                        targetId,
                        null,
                        null,
                        resultSet.getString("title"),
                        resultSet.getString("summary"),
                        resolveMediaUrl(resultSet, "cover_url"),
                        null,
                        null,
                        null,
                        toInteger(resultSet, "cover_width"),
                        toInteger(resultSet, "cover_height"),
                        new HomeFeedResponse.AuthorSummary(
                                resultSet.getObject("author_id").toString(),
                                resultSet.getString("author_display_name"),
                                jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                        ),
                        new HomeFeedResponse.ItemStats(null, likeCount),
                        toStringList(resultSet.getArray("tag_names")),
                        null,
                        null,
                        resultSet.getBoolean("allow_copy"),
                        null
                ),
                resultSet.getObject("sort_at", OffsetDateTime.class),
                likeCount,
                targetId
        );
    }

    private InventoryCandidate mapActivityCandidate(ResultSet resultSet) throws SQLException {
        String targetId = resultSet.getObject("id").toString();
        long likeCount = resultSet.getLong("like_count");
        return new InventoryCandidate(
                new FeaturedInventoryResponse.Item(
                        "post",
                        null,
                        "post",
                        targetId,
                        resultSet.getString("slug"),
                        resultSet.getString("channel_slug"),
                        resultSet.getString("title"),
                        resultSet.getString("excerpt_text"),
                        resolveActivityCoverUrl(resultSet),
                        resolveActivityPosterUrl(resultSet),
                        resolveActivityPreviewUrl(resultSet),
                        resolveActivitySourceUrl(resultSet),
                        resolveActivityWidth(resultSet),
                        resolveActivityHeight(resultSet),
                        new HomeFeedResponse.AuthorSummary(
                                resultSet.getObject("author_id").toString(),
                                resultSet.getString("author_display_name"),
                                jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                        ),
                        new HomeFeedResponse.ItemStats(null, likeCount),
                        toStringList(resultSet.getArray("tag_names")),
                        null,
                        null,
                        null,
                        null
                ),
                resultSet.getObject("sort_at", OffsetDateTime.class),
                likeCount,
                targetId
        );
    }

    private void sortCandidates(List<InventoryCandidate> candidates, String normalizedSort) {
        candidates.sort((left, right) -> compareInventoryCandidates(left, right, normalizedSort));
    }

    private int compareInventoryCandidates(
            InventoryCandidate left,
            InventoryCandidate right,
            String normalizedSort
    ) {
        if ("hot".equals(normalizedSort)) {
            int likeCompare = Long.compare(right.likeCount(), left.likeCount());
            if (likeCompare != 0) {
                return likeCompare;
            }
        }

        int sortCompare = compareOffsetDateTimeDesc(left.sortAt(), right.sortAt());
        if (sortCompare != 0) {
            return sortCompare;
        }

        if (!"hot".equals(normalizedSort)) {
            int likeCompare = Long.compare(right.likeCount(), left.likeCount());
            if (likeCompare != 0) {
                return likeCompare;
            }
        }

        return right.stableId().compareTo(left.stableId());
    }

    private int compareOffsetDateTimeDesc(OffsetDateTime left, OffsetDateTime right) {
        if (left == null && right == null) {
            return 0;
        }
        if (left == null) {
            return 1;
        }
        if (right == null) {
            return -1;
        }
        return right.compareTo(left);
    }

    private void appendPromptSearchClause(StringBuilder sql, List<Object> params, String normalizedQuery) {
        if (normalizedQuery == null) {
            return;
        }

        String likePattern = "%" + escapeSqlLike(normalizedQuery.toLowerCase(Locale.ROOT)) + "%";
        List<String> semanticContentCategories = new ArrayList<>();
        if (containsAny(normalizedQuery, "真人", "real-person", "real person", "portrait", "photo", "photography", "realistic", "live action", "实拍", "人像")) {
            semanticContentCategories.add("real-person");
        }
        if (containsAny(normalizedQuery, "动画", "animation", "anime", "cartoon", "manga")) {
            semanticContentCategories.add("animation");
        }

        sql.append("""
                  and (
                          lower(prompt.title) like ? escape '\\'
                       or lower(coalesce(prompt.summary, '')) like ? escape '\\'
                       or lower(coalesce(prompt.prompt_text, '')) like ? escape '\\'
                       or lower(coalesce(prompt.prompt_text_zh, '')) like ? escape '\\'
                       or lower(coalesce(prompt.prompt_text_en, '')) like ? escape '\\'
                       or lower(coalesce(prompt.prompt_text_raw, '')) like ? escape '\\'
                       or lower(coalesce(author.display_name, '')) like ? escape '\\'
                       or exists(
                              select 1
                              from unnest(coalesce(prompt.tag_names, array[]::text[])) as tag_name
                              where lower(tag_name) like ? escape '\\'
                          )
                       or lower(coalesce(prompt.model_category, '')) like ? escape '\\'
                       or lower(coalesce(prompt.content_category, '')) like ? escape '\\'
                       or lower(coalesce(prompt.composition_category, '')) like ? escape '\\'
                """);
        params.add(likePattern);
        params.add(likePattern);
        params.add(likePattern);
        params.add(likePattern);
        params.add(likePattern);
        params.add(likePattern);
        params.add(likePattern);
        params.add(likePattern);
        params.add(likePattern);
        params.add(likePattern);
        params.add(likePattern);
        for (String contentCategory : semanticContentCategories) {
            sql.append("""
                       or lower(coalesce(prompt.content_category, '')) = ?
                """);
            params.add(contentCategory);
        }
        sql.append("""
                  )
                """);
    }

    private boolean containsAny(String normalizedQuery, String... tokens) {
        String normalized = normalizedQuery.toLowerCase(Locale.ROOT);
        for (String token : tokens) {
            if (token != null && !token.isBlank() && normalized.contains(token.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private void appendWorkflowSearchClause(StringBuilder sql, List<Object> params, String normalizedQuery) {
        if (normalizedQuery == null) {
            return;
        }

        String likePattern = "%" + escapeSqlLike(normalizedQuery.toLowerCase(Locale.ROOT)) + "%";
        sql.append("""
                  and (
                          lower(workflow.title) like ? escape '\\'
                       or lower(coalesce(workflow.summary, '')) like ? escape '\\'
                       or lower(coalesce(author.display_name, '')) like ? escape '\\'
                       or exists(
                              select 1
                              from unnest(coalesce(workflow.tag_names, array[]::text[])) as tag_name
                              where lower(tag_name) like ? escape '\\'
                          )
                  )
                """);
        params.add(likePattern);
        params.add(likePattern);
        params.add(likePattern);
        params.add(likePattern);
    }

    private void appendActivitySearchClause(StringBuilder sql, List<Object> params, String normalizedQuery) {
        if (normalizedQuery == null) {
            return;
        }

        String likePattern = "%" + escapeSqlLike(normalizedQuery.toLowerCase(Locale.ROOT)) + "%";
        sql.append("""
                  and (
                          lower(thread.title) like ? escape '\\'
                       or lower(coalesce(thread.excerpt_text, '')) like ? escape '\\'
                       or lower(coalesce(author.display_name, '')) like ? escape '\\'
                       or lower(coalesce(channel.title, '')) like ? escape '\\'
                       or exists(
                              select 1
                              from unnest(coalesce(thread.tag_names, array[]::text[])) as tag_name
                              where lower(tag_name) like ? escape '\\'
                          )
                  )
                """);
        params.add(likePattern);
        params.add(likePattern);
        params.add(likePattern);
        params.add(likePattern);
        params.add(likePattern);
    }

    private void appendSortClause(
            StringBuilder sql,
            String likeCountExpression,
            String sortAtExpression,
            String stableIdExpression,
            String normalizedSort
    ) {
        if ("hot".equals(normalizedSort)) {
            sql.append(" order by ")
                    .append(likeCountExpression)
                    .append(" desc, ")
                    .append(sortAtExpression)
                    .append(" desc, ")
                    .append(stableIdExpression)
                    .append(" desc\n");
            return;
        }

        sql.append(" order by ")
                .append(sortAtExpression)
                .append(" desc, ")
                .append(likeCountExpression)
                .append(" desc, ")
                .append(stableIdExpression)
                .append(" desc\n");
    }

    private String toPromptModality(String normalizedFilter) {
        if ("video_prompt".equals(normalizedFilter)) {
            return "video";
        }
        if ("image_prompt".equals(normalizedFilter)) {
            return "image";
        }
        return null;
    }

    private boolean isPromptFilter(String normalizedFilter) {
        return "video_prompt".equals(normalizedFilter) || "image_prompt".equals(normalizedFilter);
    }

    private String normalizeFilter(String value, String fallback, Set<String> supportedValues, String errorCode) {
        if (value == null || value.isBlank()) {
            return fallback;
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (!supportedValues.contains(normalized)) {
            throw ApiBusinessException.badRequest(errorCode, "unsupported filter");
        }
        return normalized;
    }

    private String normalizeSearchQuery(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeOptionalFilterValue(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeWorkflowType(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (!SUPPORTED_WORKFLOW_TYPES.contains(normalized)) {
            throw ApiBusinessException.badRequest("FEATURED_WORKFLOW_TYPE_INVALID", "unsupported workflow type");
        }
        return normalized;
    }

    private int normalizeLimit(Integer value) {
        if (value == null) {
            return DEFAULT_LIMIT;
        }

        if (value <= 0) {
            throw ApiBusinessException.badRequest("FEATURED_LIMIT_INVALID", "limit must be positive");
        }

        return Math.min(value, MAX_LIMIT);
    }

    private int decodeOffsetCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return DEFAULT_OFFSET;
        }

        String normalized = cursor.trim();
        if (!normalized.startsWith(OFFSET_CURSOR_PREFIX)) {
            throw ApiBusinessException.badRequest("FEATURED_CURSOR_INVALID", "unsupported cursor");
        }

        try {
            int offset = Integer.parseInt(normalized.substring(OFFSET_CURSOR_PREFIX.length()));
            if (offset < 0) {
                throw ApiBusinessException.badRequest("FEATURED_CURSOR_INVALID", "cursor must not be negative");
            }
            return offset;
        } catch (NumberFormatException ex) {
            throw ApiBusinessException.badRequest("FEATURED_CURSOR_INVALID", "unsupported cursor");
        }
    }

    private String encodeOffsetCursor(int offset) {
        return OFFSET_CURSOR_PREFIX + offset;
    }

    private String resolveMediaUrl(ResultSet resultSet, String columnName) throws SQLException {
        return jdbcMediaUrlResolver.resolve(resultSet, columnName);
    }

    private String resolveFirstAvailableMediaUrl(ResultSet resultSet, String... columnNames) throws SQLException {
        for (String columnName : columnNames) {
            if (columnName == null || columnName.isBlank()) {
                continue;
            }
            String storedReference = jdbcMediaUrlResolver.nullableTextIfPresent(resultSet, columnName);
            if (storedReference == null) {
                continue;
            }

            String resolvedUrl = jdbcMediaUrlResolver.resolve(resultSet, columnName);
            if (resolvedUrl != null && !resolvedUrl.isBlank()) {
                return resolvedUrl;
            }
        }

        return null;
    }

    private String resolveFirstAvailableText(ResultSet resultSet, String... columnNames) throws SQLException {
        for (String columnName : columnNames) {
            if (columnName == null || columnName.isBlank()) {
                continue;
            }
            String value = jdbcMediaUrlResolver.nullableTextIfPresent(resultSet, columnName);
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private Integer resolveFirstAvailableInteger(ResultSet resultSet, String... columnNames) throws SQLException {
        for (String columnName : columnNames) {
            if (columnName == null || columnName.isBlank()) {
                continue;
            }
            Integer value = toInteger(resultSet, columnName);
            if (value != null && value > 0) {
                return value;
            }
        }
        return null;
    }

    private String resolveImageMediaUrl(
            ResultSet resultSet,
            String preferredColumnName,
            String fallbackColumnName,
            String... assetKindColumns
    ) throws SQLException {
        return "image".equalsIgnoreCase(resolveFirstAvailableText(resultSet, assetKindColumns))
                ? resolveFirstAvailableMediaUrl(resultSet, preferredColumnName, fallbackColumnName)
                : null;
    }

    private String resolveVideoMediaUrl(
            ResultSet resultSet,
            String preferredColumnName,
            String fallbackColumnName,
            String... assetKindColumns
    ) throws SQLException {
        return "video".equalsIgnoreCase(resolveFirstAvailableText(resultSet, assetKindColumns))
                ? resolveFirstAvailableMediaUrl(resultSet, preferredColumnName, fallbackColumnName)
                : null;
    }

    private Integer resolveImageMediaDimension(
            ResultSet resultSet,
            String preferredColumnName,
            String fallbackColumnName,
            String... assetKindColumns
    ) throws SQLException {
        return "image".equalsIgnoreCase(resolveFirstAvailableText(resultSet, assetKindColumns))
                ? resolveFirstAvailableInteger(resultSet, preferredColumnName, fallbackColumnName)
                : null;
    }

    private Integer resolveVideoMediaDimension(
            ResultSet resultSet,
            String preferredColumnName,
            String fallbackColumnName,
            String... assetKindColumns
    ) throws SQLException {
        return "video".equalsIgnoreCase(resolveFirstAvailableText(resultSet, assetKindColumns))
                ? resolveFirstAvailableInteger(resultSet, preferredColumnName, fallbackColumnName)
                : null;
    }

    private String resolvePromptCoverUrl(ResultSet resultSet) throws SQLException {
        return resolveImageMediaUrl(
                resultSet,
                "cover_url",
                "primary_example_url",
                "cover_asset_kind",
                "primary_example_asset_kind"
        );
    }

    private String resolvePromptPosterUrl(ResultSet resultSet) throws SQLException {
        return resolvePromptCoverUrl(resultSet);
    }

    private String resolvePromptPreviewUrl(ResultSet resultSet) throws SQLException {
        return resolveVideoMediaUrl(
                resultSet,
                "preview_example_url",
                null,
                "preview_example_asset_kind"
        );
    }

    private String resolvePromptSourceUrl(ResultSet resultSet) throws SQLException {
        return resolveVideoMediaUrl(
                resultSet,
                "primary_example_url",
                null,
                "primary_example_asset_kind"
        );
    }

    private Integer resolvePromptWidth(ResultSet resultSet) throws SQLException {
        Integer imageWidth = resolveImageMediaDimension(
                resultSet,
                "cover_width",
                "primary_example_width",
                "cover_asset_kind",
                "primary_example_asset_kind"
        );
        if (imageWidth != null) {
            return imageWidth;
        }

        Integer previewWidth = resolveVideoMediaDimension(
                resultSet,
                "preview_example_width",
                null,
                "preview_example_asset_kind"
        );
        if (previewWidth != null) {
            return previewWidth;
        }

        return resolveVideoMediaDimension(
                resultSet,
                "primary_example_width",
                null,
                "primary_example_asset_kind"
        );
    }

    private Integer resolvePromptHeight(ResultSet resultSet) throws SQLException {
        Integer imageHeight = resolveImageMediaDimension(
                resultSet,
                "cover_height",
                "primary_example_height",
                "cover_asset_kind",
                "primary_example_asset_kind"
        );
        if (imageHeight != null) {
            return imageHeight;
        }

        Integer previewHeight = resolveVideoMediaDimension(
                resultSet,
                "preview_example_height",
                null,
                "preview_example_asset_kind"
        );
        if (previewHeight != null) {
            return previewHeight;
        }

        return resolveVideoMediaDimension(
                resultSet,
                "primary_example_height",
                null,
                "primary_example_asset_kind"
        );
    }

    private String resolveActivityCoverUrl(ResultSet resultSet) throws SQLException {
        return resolveFirstAvailableMediaUrl(resultSet, "video_poster_url", "video_cover_url", "workflow_cover_url");
    }

    private String resolveActivityPosterUrl(ResultSet resultSet) throws SQLException {
        return resolveFirstAvailableMediaUrl(resultSet, "video_poster_url", "video_cover_url", "workflow_cover_url");
    }

    private String resolveActivityPreviewUrl(ResultSet resultSet) throws SQLException {
        return resolveFirstAvailableMediaUrl(resultSet, "video_preview_url");
    }

    private String resolveActivitySourceUrl(ResultSet resultSet) throws SQLException {
        return resolveFirstAvailableMediaUrl(resultSet, "video_source_url");
    }

    private Integer resolveActivityWidth(ResultSet resultSet) throws SQLException {
        return resolveFirstAvailableInteger(
                resultSet,
                "video_poster_width",
                "video_cover_width",
                "workflow_cover_width",
                "video_preview_width",
                "video_source_width"
        );
    }

    private Integer resolveActivityHeight(ResultSet resultSet) throws SQLException {
        return resolveFirstAvailableInteger(
                resultSet,
                "video_poster_height",
                "video_cover_height",
                "workflow_cover_height",
                "video_preview_height",
                "video_source_height"
        );
    }

    private String escapeSqlLike(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }

    private UUID optionalViewerId() {
        CurrentUser currentUser = CurrentUserContext.currentOrNull();
        return currentUser == null ? null : currentUser.id();
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

    private Integer toInteger(ResultSet resultSet, String columnName) throws SQLException {
        Object value = resultSet.getObject(columnName);
        if (!(value instanceof Number number)) {
            return null;
        }
        int normalized = number.intValue();
        return normalized > 0 ? normalized : null;
    }

    private record PromptCountSnapshot(
            long all,
            long videoPrompt,
            long imagePrompt
    ) {
    }

    private record InventoryCandidate(
            FeaturedInventoryResponse.Item item,
            OffsetDateTime sortAt,
            long likeCount,
            String stableId
    ) {
    }
}
