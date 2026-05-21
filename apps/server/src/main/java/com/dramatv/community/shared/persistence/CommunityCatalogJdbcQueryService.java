package com.dramatv.community.shared.persistence;

import com.dramatv.community.admin.feedops.AdminFeedOpsService;
import com.dramatv.community.admin.feedops.dto.response.AdminFeedOpsPageResponse;
import com.dramatv.community.feed.dto.response.FeaturedArchiveResponse;
import com.dramatv.community.creator.dto.response.CreatorProfileResponse;
import com.dramatv.community.feed.dto.response.HomeFeedResponse;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserContext;
import com.dramatv.community.shared.media.JdbcMediaUrlResolver;
import com.dramatv.community.video.dto.response.VideoDetailResponse;
import com.dramatv.community.video.dto.response.VideoSummaryResponse;
import com.dramatv.community.workflow.dto.response.WorkflowDetailResponse;
import com.dramatv.community.workflow.dto.response.WorkflowSummaryResponse;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class CommunityCatalogJdbcQueryService {

    private final JdbcTemplate jdbcTemplate;
    private final JdbcMediaUrlResolver jdbcMediaUrlResolver;
    private final AdminFeedOpsService adminFeedOpsService;

    public CommunityCatalogJdbcQueryService(
            JdbcTemplate jdbcTemplate,
            JdbcMediaUrlResolver jdbcMediaUrlResolver,
            AdminFeedOpsService adminFeedOpsService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.jdbcMediaUrlResolver = jdbcMediaUrlResolver;
        this.adminFeedOpsService = adminFeedOpsService;
    }

    public Optional<VideoDetailResponse> findVideoDetail(String id) {
        UUID videoId = parseUuid(id);
        if (videoId == null) {
            return Optional.empty();
        }

        Optional<VideoDetailResponse> detail = jdbcTemplate.query("""
                select
                    v.id,
                    v.title,
                    v.summary,
                    v.tag_names,
                    v.duration_ms,
                    v.comment_count,
                    v.comments_enabled,
                    v.like_count,
                    v.favorite_count,
                    v.play_count,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    workflow.id as workflow_id,
                    workflow.title as workflow_title,
                    workflow.allow_copy as workflow_allow_copy,
                    cover.storage_provider as cover_storage_provider,
                    cover.bucket_name as cover_bucket_name,
                    cover.object_key as cover_url,
                    poster.storage_provider as poster_storage_provider,
                    poster.bucket_name as poster_bucket_name,
                    poster.object_key as poster_url,
                    preview.storage_provider as preview_storage_provider,
                    preview.bucket_name as preview_bucket_name,
                    preview.object_key as preview_url,
                    source.storage_provider as source_storage_provider,
                    source.bucket_name as source_bucket_name,
                    source.object_key as source_url
                from videos v
                join users author on author.id = v.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join workflows workflow on workflow.id = v.workflow_id
                    and workflow.publish_status = 'published'
                    and workflow.deleted_at is null
                left join media_assets cover on cover.id = v.cover_asset_id
                left join media_assets poster on poster.id = v.poster_asset_id
                left join media_assets preview on preview.id = v.preview_asset_id
                left join media_assets source on source.id = v.source_asset_id
                where v.id = ? and v.publish_status = 'published' and v.deleted_at is null
                """,
                resultSet -> resultSet.next() ? Optional.of(mapVideoDetail(resultSet)) : Optional.empty(),
                videoId
        );

        return detail.map(this::enrichVideoViewerActions);
    }

    public List<VideoSummaryResponse> relatedVideos(String id) {
        UUID videoId = parseUuid(id);
        if (videoId == null) {
            return List.of();
        }

        VideoSeed seed = jdbcTemplate.query("""
                select id, author_id, workflow_id, tag_names, published_at, updated_at
                from videos
                where id = ? and publish_status = 'published' and deleted_at is null
                """,
                resultSet -> resultSet.next()
                        ? new VideoSeed(
                                (UUID) resultSet.getObject("id"),
                                (UUID) resultSet.getObject("author_id"),
                                (UUID) resultSet.getObject("workflow_id"),
                                toStringList(resultSet.getArray("tag_names")),
                                resultSet.getObject("published_at", OffsetDateTime.class),
                                resultSet.getObject("updated_at", OffsetDateTime.class)
                        )
                        : null,
                videoId
        );

        if (seed == null) {
            return List.of();
        }

        List<VideoRecommendationCandidate> candidates = jdbcTemplate.query("""
                select
                    v.id,
                    v.title,
                    v.summary,
                    v.duration_ms,
                    v.like_count,
                    v.play_count,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    workflow.id as workflow_id,
                    workflow.title as workflow_title,
                    cover.storage_provider as cover_storage_provider,
                    cover.bucket_name as cover_bucket_name,
                    cover.object_key as cover_url,
                    poster.storage_provider as poster_storage_provider,
                    poster.bucket_name as poster_bucket_name,
                    poster.object_key as poster_url,
                    preview.storage_provider as preview_storage_provider,
                    preview.bucket_name as preview_bucket_name,
                    preview.object_key as preview_url,
                    source.storage_provider as source_storage_provider,
                    source.bucket_name as source_bucket_name,
                    source.object_key as source_url,
                    v.tag_names,
                    v.published_at,
                    v.updated_at
                from videos v
                join users author on author.id = v.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join workflows workflow on workflow.id = v.workflow_id
                    and workflow.publish_status = 'published'
                    and workflow.deleted_at is null
                left join media_assets cover on cover.id = v.cover_asset_id
                left join media_assets poster on poster.id = v.poster_asset_id
                left join media_assets preview on preview.id = v.preview_asset_id
                left join media_assets source on source.id = v.source_asset_id
                where v.deleted_at is null
                  and v.publish_status = 'published'
                  and v.id <> ?
                order by v.like_count desc,
                         v.play_count desc,
                         coalesce(v.published_at, v.updated_at) desc,
                         v.created_at desc
                limit 48
                """,
                (resultSet, rowNum) -> new VideoRecommendationCandidate(
                        mapVideoSummary(resultSet),
                        resultSet.getObject("author_id", UUID.class),
                        resultSet.getObject("workflow_id", UUID.class),
                        toStringList(resultSet.getArray("tag_names")),
                        resultSet.getObject("published_at", OffsetDateTime.class),
                        resultSet.getObject("updated_at", OffsetDateTime.class)
                ),
                seed.id()
        );

        return candidates.stream()
                .sorted((left, right) -> Integer.compare(
                        scoreVideoRecommendation(seed, right),
                        scoreVideoRecommendation(seed, left)
                ))
                .limit(6)
                .map(VideoRecommendationCandidate::summary)
                .toList();
    }

    public List<VideoSummaryResponse> videosForAuthor(String creatorId) {
        UUID authorId = resolveAuthorId(creatorId);
        if (authorId == null) {
            return List.of();
        }

        return jdbcTemplate.query("""
                select
                    v.id,
                    v.title,
                    v.summary,
                    v.duration_ms,
                    v.like_count,
                    v.play_count,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    workflow.id as workflow_id,
                    workflow.title as workflow_title,
                    cover.storage_provider as cover_storage_provider,
                    cover.bucket_name as cover_bucket_name,
                    cover.object_key as cover_url,
                    poster.storage_provider as poster_storage_provider,
                    poster.bucket_name as poster_bucket_name,
                    poster.object_key as poster_url,
                    preview.storage_provider as preview_storage_provider,
                    preview.bucket_name as preview_bucket_name,
                    preview.object_key as preview_url,
                    source.storage_provider as source_storage_provider,
                    source.bucket_name as source_bucket_name,
                    source.object_key as source_url
                from videos v
                join users author on author.id = v.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join workflows workflow on workflow.id = v.workflow_id
                    and workflow.publish_status = 'published'
                    and workflow.deleted_at is null
                left join media_assets cover on cover.id = v.cover_asset_id
                left join media_assets poster on poster.id = v.poster_asset_id
                left join media_assets preview on preview.id = v.preview_asset_id
                left join media_assets source on source.id = v.source_asset_id
                where v.author_id = ? and v.publish_status = 'published' and v.deleted_at is null
                order by v.updated_at desc
                """,
                (resultSet, rowNum) -> mapVideoSummary(resultSet),
                authorId
        );
    }

    public Optional<WorkflowDetailResponse> findWorkflowDetail(String id) {
        UUID workflowId = parseUuid(id);
        if (workflowId == null) {
            return Optional.empty();
        }

        Optional<WorkflowDetailResponse> workflowDetail = jdbcTemplate.query("""
                select
                    workflow.id,
                    workflow.title,
                    workflow.summary,
                    workflow.scenario_text,
                    workflow.tag_names,
                    workflow.allow_copy,
                    workflow.allow_fork,
                    workflow.like_count,
                    workflow.favorite_count,
                    workflow.comment_count,
                    workflow.comments_enabled,
                    workflow.video_bind_count,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    cover.storage_provider as cover_storage_provider,
                    cover.bucket_name as cover_bucket_name,
                    cover.object_key as cover_url,
                    example.asset_kind as example_asset_kind,
                    example.storage_provider as example_storage_provider,
                    example.bucket_name as example_bucket_name,
                    example.object_key as example_url,
                    binding.id as binding_id,
                    binding.binding_type,
                    binding.open_url
                from workflows workflow
                join users author on author.id = workflow.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join media_assets cover on cover.id = workflow.cover_asset_id
                left join media_assets example on example.id = workflow.example_asset_id
                left join canvas_bindings binding
                    on binding.workflow_id = workflow.id
                   and binding.binding_status = 'active'
                where workflow.id = ? and workflow.publish_status = 'published' and workflow.deleted_at is null
                """,
                resultSet -> {
                    if (!resultSet.next()) {
                        return Optional.empty();
                    }

                    WorkflowDetailResponse response = new WorkflowDetailResponse(
                            resultSet.getObject("id").toString(),
                            resultSet.getString("title"),
                            resultSet.getString("summary"),
                            resultSet.getString("scenario_text"),
                            resolveMediaUrl(resultSet, "cover_url"),
                            nullableWorkflowExampleMedia(resultSet),
                            toStringList(resultSet, "tag_names"),
                            new WorkflowDetailResponse.Author(
                                    resultSet.getObject("author_id").toString(),
                                    resultSet.getString("author_display_name"),
                                    jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                            ),
                            new WorkflowDetailResponse.Permissions(
                                    resultSet.getBoolean("allow_copy"),
                                    resultSet.getBoolean("allow_fork")
                            ),
                            nullableCanvasBinding(resultSet),
                            new WorkflowDetailResponse.CommentPolicy(
                                    resultSet.getBoolean("comments_enabled"),
                                    canManageContent((UUID) resultSet.getObject("author_id"))
                            ),
                            new WorkflowDetailResponse.Stats(
                                    resultSet.getLong("like_count"),
                                    resultSet.getLong("favorite_count"),
                                    resultSet.getLong("comment_count"),
                                    resultSet.getLong("video_bind_count")
                            ),
                            videosForWorkflow(workflowId.toString()),
                            new WorkflowDetailResponse.ViewerActions(false, false)
                    );

                    return Optional.of(response);
                },
                workflowId
        );

        return workflowDetail.map(this::enrichWorkflowViewerActions);
    }

    public List<VideoSummaryResponse> videosForWorkflow(String workflowId) {
        UUID targetWorkflowId = parseUuid(workflowId);
        if (targetWorkflowId == null) {
            return List.of();
        }

        WorkflowSeed seed = jdbcTemplate.query("""
                select id, author_id, tag_names, published_at, updated_at
                from workflows
                where id = ? and publish_status = 'published' and deleted_at is null
                """,
                resultSet -> resultSet.next()
                        ? new WorkflowSeed(
                                resultSet.getObject("id", UUID.class),
                                resultSet.getObject("author_id", UUID.class),
                                toStringList(resultSet.getArray("tag_names")),
                                resultSet.getObject("published_at", OffsetDateTime.class),
                                resultSet.getObject("updated_at", OffsetDateTime.class)
                        )
                        : null,
                targetWorkflowId
        );

        if (seed == null) {
            return List.of();
        }

        List<VideoRecommendationCandidate> candidates = jdbcTemplate.query("""
                select
                    v.id,
                    v.title,
                    v.summary,
                    v.duration_ms,
                    v.like_count,
                    v.play_count,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    workflow.id as workflow_id,
                    workflow.title as workflow_title,
                    cover.storage_provider as cover_storage_provider,
                    cover.bucket_name as cover_bucket_name,
                    cover.object_key as cover_url,
                    poster.storage_provider as poster_storage_provider,
                    poster.bucket_name as poster_bucket_name,
                    poster.object_key as poster_url,
                    preview.storage_provider as preview_storage_provider,
                    preview.bucket_name as preview_bucket_name,
                    preview.object_key as preview_url,
                    source.storage_provider as source_storage_provider,
                    source.bucket_name as source_bucket_name,
                    source.object_key as source_url,
                    v.tag_names,
                    v.published_at,
                    v.updated_at
                from videos v
                join users author on author.id = v.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join workflows workflow on workflow.id = v.workflow_id
                    and workflow.publish_status = 'published'
                    and workflow.deleted_at is null
                left join media_assets cover on cover.id = v.cover_asset_id
                left join media_assets poster on poster.id = v.poster_asset_id
                left join media_assets preview on preview.id = v.preview_asset_id
                left join media_assets source on source.id = v.source_asset_id
                where v.publish_status = 'published'
                  and v.deleted_at is null
                order by v.like_count desc,
                         v.play_count desc,
                         coalesce(v.published_at, v.updated_at) desc,
                         v.created_at desc
                limit 48
                """,
                (resultSet, rowNum) -> new VideoRecommendationCandidate(
                        mapVideoSummary(resultSet),
                        resultSet.getObject("author_id", UUID.class),
                        resultSet.getObject("workflow_id", UUID.class),
                        toStringList(resultSet.getArray("tag_names")),
                        resultSet.getObject("published_at", OffsetDateTime.class),
                        resultSet.getObject("updated_at", OffsetDateTime.class)
                )
        );

        return candidates.stream()
                .sorted((left, right) -> Integer.compare(
                        scoreWorkflowVideoRecommendation(seed, right),
                        scoreWorkflowVideoRecommendation(seed, left)
                ))
                .limit(6)
                .map(VideoRecommendationCandidate::summary)
                .toList();
    }

    public List<WorkflowSummaryResponse> workflowsForAuthor(String creatorId) {
        UUID authorId = resolveAuthorId(creatorId);
        if (authorId == null) {
            return List.of();
        }

        return jdbcTemplate.query("""
                select
                    workflow.id,
                    workflow.title,
                    workflow.summary,
                    workflow.like_count,
                    workflow.allow_copy,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    cover.storage_provider as cover_storage_provider,
                    cover.bucket_name as cover_bucket_name,
                    cover.object_key as cover_url
                from workflows workflow
                join users author on author.id = workflow.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join media_assets cover on cover.id = workflow.cover_asset_id
                where workflow.author_id = ? and workflow.publish_status = 'published' and workflow.deleted_at is null
                order by workflow.updated_at desc
                """,
                (resultSet, rowNum) -> mapWorkflowSummary(resultSet),
                authorId
        );
    }

    public Optional<CreatorProfileResponse> findCreator(String id) {
        UUID authorId = resolveAuthorId(id);
        if (authorId == null) {
            return Optional.empty();
        }

        Optional<CreatorProfileResponse> profile = jdbcTemplate.query("""
                select
                    user_account.id,
                    user_account.display_name,
                    coalesce(avatar_asset.object_key, user_account.avatar_url) as avatar_url,
                    avatar_asset.storage_provider as avatar_storage_provider,
                    avatar_asset.bucket_name as avatar_bucket_name,
                    user_account.bio,
                    creator_profile.headline,
                    (
                        select count(*)
                        from (
                            select video.id
                            from videos video
                            where video.author_id = user_account.id
                              and video.publish_status = 'published'
                              and video.deleted_at is null
                            union all
                            select prompt.id
                            from prompt_entries prompt
                            where prompt.author_id = user_account.id
                              and prompt.publish_status = 'published'
                              and prompt.deleted_at is null
                        ) published_works
                    ) as video_count,
                    (
                        select count(*)
                        from workflows workflow
                        where workflow.author_id = user_account.id
                          and workflow.publish_status = 'published'
                          and workflow.deleted_at is null
                    ) as workflow_count,
                    (
                        select count(*)
                        from follow_relations relation
                        where relation.followee_id = user_account.id
                          and relation.status_code = 'active'
                    ) as follower_count,
                    (
                        select coalesce(sum(source.like_count), 0)
                        from (
                            select video.like_count
                            from videos video
                            where video.author_id = user_account.id
                              and video.publish_status = 'published'
                              and video.deleted_at is null
                            union all
                            select workflow.like_count
                            from workflows workflow
                            where workflow.author_id = user_account.id
                              and workflow.publish_status = 'published'
                              and workflow.deleted_at is null
                            union all
                            select prompt.like_count
                            from prompt_entries prompt
                            where prompt.author_id = user_account.id
                              and prompt.publish_status = 'published'
                              and prompt.deleted_at is null
                            union all
                            select thread.like_count
                            from discussion_threads thread
                            where thread.author_id = user_account.id
                              and thread.publish_status = 'published'
                              and thread.deleted_at is null
                        ) source
                    ) as like_received_count
                from users user_account
                left join creator_profiles creator_profile on creator_profile.user_id = user_account.id
                left join media_assets avatar_asset on avatar_asset.id = user_account.avatar_asset_id
                where user_account.id = ? and user_account.deleted_at is null
                """,
                resultSet -> resultSet.next()
                        ? Optional.of(new CreatorProfileResponse(
                                resultSet.getObject("id").toString(),
                                resultSet.getString("display_name"),
                                jdbcMediaUrlResolver.resolve(resultSet, "avatar_url"),
                                resultSet.getString("bio"),
                                resultSet.getString("headline"),
                                new CreatorProfileResponse.Stats(
                                        resultSet.getInt("video_count"),
                                        resultSet.getInt("workflow_count"),
                                        resultSet.getLong("follower_count"),
                                        resultSet.getLong("like_received_count")
                                ),
                                new CreatorProfileResponse.ViewerActions(false)
                        ))
                        : Optional.empty(),
                authorId
        );

        return profile.map(this::enrichCreatorViewerActions);
    }

    public HomeFeedResponse loadHomeFeed(String channel) {
        List<HomeFeedResponse.FeedItemResponse> feedItems = loadCuratedFeed(channel);
        if (feedItems.isEmpty()) {
            List<FeedCandidate> mergedItems = new ArrayList<>();
            mergedItems.addAll(loadPublishedVideoFeed());
            mergedItems.addAll(loadPublishedPromptFeed());

            mergedItems.sort(Comparator.comparing(FeedCandidate::sortAt).reversed());

            feedItems = mergedItems.stream()
                    .limit(12)
                    .map(FeedCandidate::item)
                    .toList();
        }

        return new HomeFeedResponse(
                feedItems,
                null,
                false,
                new HomeFeedResponse.Sections(
                        hotWorkflows(),
                        featuredCreators()
                ),
                new HomeFeedResponse.HomeLayout(homeLayoutSlots())
        );
    }

    public FeaturedArchiveResponse loadFeaturedArchive() {
        Map<String, List<AdminFeedOpsPageResponse.ContentItem>> configuredSlots = adminFeedOpsService.loadPublishedFeaturedSlotItems();
        List<HomeFeedResponse.FeedItemResponse> prompts = loadPublishedPromptFeed().stream()
                .map(FeedCandidate::item)
                .toList();
        List<HomeFeedResponse.FeedItemResponse> workflows = loadPublishedWorkflowFeed().stream()
                .map(FeedCandidate::item)
                .toList();
        List<HomeFeedResponse.FeedItemResponse> posts = loadPublishedPostFeed().stream()
                .map(FeedCandidate::item)
                .toList();

        List<HomeFeedResponse.FeedItemResponse> allFallbackPool = new ArrayList<>();
        allFallbackPool.addAll(prompts);
        allFallbackPool.addAll(workflows);
        allFallbackPool.addAll(posts);

        List<HomeFeedResponse.FeedItemResponse> promptFallbackPool = new ArrayList<>(prompts);
        List<HomeFeedResponse.FeedItemResponse> workflowFallbackPool = new ArrayList<>(workflows);
        List<HomeFeedResponse.FeedItemResponse> postFallbackPool = new ArrayList<>(posts);
        List<HomeFeedResponse.FeedItemResponse> videoPromptFallbackPool = prompts.stream()
                .filter(item -> "video".equalsIgnoreCase(item.promptModality()))
                .toList();
        List<HomeFeedResponse.FeedItemResponse> imagePromptFallbackPool = prompts.stream()
                .filter(item -> !"video".equalsIgnoreCase(item.promptModality()))
                .toList();

        Map<String, HomeFeedResponse.FeedItemResponse> poolItemsByKey = new LinkedHashMap<>();
        allFallbackPool.forEach(item -> poolItemsByKey.put(homeLayoutItemKey(item), item));

        List<FeaturedArchiveResponse.FeaturedSlot> slots = new ArrayList<>();
        addFeaturedArchiveSlot(slots, configuredSlots, poolItemsByKey, allFallbackPool, "featured-all", 12);
        addFeaturedArchiveSlot(slots, configuredSlots, poolItemsByKey, workflowFallbackPool, "featured-workflow", 12);
        addFeaturedArchiveSlot(slots, configuredSlots, poolItemsByKey, videoPromptFallbackPool, "featured-video-prompt", 12);
        addFeaturedArchiveSlot(slots, configuredSlots, poolItemsByKey, imagePromptFallbackPool, "featured-image-prompt", 12);
        addFeaturedArchiveSlot(slots, configuredSlots, poolItemsByKey, postFallbackPool, "featured-activity", 12);
        return new FeaturedArchiveResponse(List.copyOf(slots));
    }

    private List<HomeFeedResponse.FeedItemResponse> loadCuratedFeed(String channel) {
        return jdbcTemplate.query("""
                select
                    feed_item.content_kind,
                    feed_item.item_type,
                    feed_item.target_type,
                    feed_item.target_id,
                    video.title as video_title,
                    video.summary as video_summary,
                    video.play_count as video_play_count,
                    video.like_count as video_like_count,
                    workflow_item.title as workflow_item_title,
                    workflow_item.summary as workflow_item_summary,
                    workflow_item.like_count as workflow_like_count,
                    prompt.modality as prompt_modality,
                    prompt.title as prompt_title,
                    prompt.summary as prompt_summary,
                    prompt.like_count as prompt_like_count,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    linked_workflow.id as workflow_id,
                    linked_workflow.title as workflow_title,
                    video_cover.storage_provider as video_cover_storage_provider,
                    video_cover.bucket_name as video_cover_bucket_name,
                    video_cover.object_key as video_cover_url,
                    video_poster.storage_provider as video_poster_storage_provider,
                    video_poster.bucket_name as video_poster_bucket_name,
                    video_poster.object_key as video_poster_url,
                    video_preview.storage_provider as video_preview_storage_provider,
                    video_preview.bucket_name as video_preview_bucket_name,
                    video_preview.object_key as video_preview_url,
                    video_source.storage_provider as video_source_storage_provider,
                    video_source.bucket_name as video_source_bucket_name,
                    video_source.object_key as video_source_url,
                    workflow_cover.storage_provider as workflow_cover_storage_provider,
                    workflow_cover.bucket_name as workflow_cover_bucket_name,
                    workflow_cover.object_key as workflow_cover_url,
                    prompt_cover.storage_provider as prompt_cover_storage_provider,
                    prompt_cover.bucket_name as prompt_cover_bucket_name,
                    prompt_cover.object_key as prompt_cover_url,
                    prompt_cover.asset_kind as prompt_cover_asset_kind,
                    prompt_primary_example.storage_provider as prompt_primary_example_storage_provider,
                    prompt_primary_example.bucket_name as prompt_primary_example_bucket_name,
                    prompt_primary_example.object_key as prompt_primary_example_url,
                    prompt_primary_example.asset_kind as prompt_primary_example_asset_kind,
                    prompt_preview_example.storage_provider as prompt_preview_example_storage_provider,
                    prompt_preview_example.bucket_name as prompt_preview_example_bucket_name,
                    prompt_preview_example.object_key as prompt_preview_example_url,
                    prompt_preview_example.asset_kind as prompt_preview_example_asset_kind
                from feed_items feed_item
                left join videos video on coalesce(feed_item.target_type, feed_item.item_type) = 'video'
                    and video.id = feed_item.target_id
                    and video.publish_status = 'published'
                    and video.deleted_at is null
                left join workflows workflow_item on coalesce(feed_item.target_type, feed_item.item_type) = 'workflow'
                    and workflow_item.id = feed_item.target_id
                    and workflow_item.publish_status = 'published'
                    and workflow_item.deleted_at is null
                left join prompt_entries prompt on coalesce(feed_item.target_type, feed_item.item_type) = 'prompt'
                    and prompt.id = feed_item.target_id
                    and prompt.publish_status = 'published'
                    and prompt.deleted_at is null
                join users author on author.id = coalesce(video.author_id, workflow_item.author_id, prompt.author_id)
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join workflows linked_workflow on linked_workflow.id = video.workflow_id
                    and linked_workflow.publish_status = 'published'
                    and linked_workflow.deleted_at is null
                left join media_assets video_cover on video_cover.id = video.cover_asset_id
                left join media_assets video_poster on video_poster.id = video.poster_asset_id
                left join media_assets video_preview on video_preview.id = video.preview_asset_id
                left join media_assets video_source on video_source.id = video.source_asset_id
                left join media_assets workflow_cover on workflow_cover.id = workflow_item.cover_asset_id
                left join media_assets prompt_cover on prompt_cover.id = prompt.cover_asset_id
                left join media_assets prompt_primary_example on prompt_primary_example.id = prompt.primary_example_asset_id
                left join media_assets prompt_preview_example on prompt_preview_example.id = (
                    select link.media_asset_id
                    from prompt_example_links link
                    where link.prompt_id = prompt.id
                      and link.role_code = 'preview'
                    order by link.sort_order asc, link.created_at asc
                    limit 1
                )
                where feed_item.channel_code = ?
                  and feed_item.status_code = 'active'
                  and (
                      (coalesce(feed_item.target_type, feed_item.item_type) = 'video' and video.id is not null)
                      or (coalesce(feed_item.target_type, feed_item.item_type) = 'prompt' and prompt.id is not null)
                      or (coalesce(feed_item.target_type, feed_item.item_type) = 'workflow' and workflow_item.id is not null)
                  )
                order by feed_item.rank_score desc, coalesce(feed_item.published_at, feed_item.updated_at) desc
                limit 12
                """,
                (resultSet, rowNum) -> {
                    String targetType = normalizeTargetType(
                            resultSet.getString("target_type"),
                            resultSet.getString("item_type")
                    );
                    String contentKind = normalizeContentKind(
                            resultSet.getString("content_kind"),
                            targetType
                    );
                    if ("video".equals(targetType)) {
                        return new HomeFeedResponse.FeedItemResponse(
                                contentKind,
                                null,
                                "video",
                                resultSet.getObject("target_id").toString(),
                                resultSet.getString("video_title"),
                                resultSet.getString("video_summary"),
                                resolveVideoCoverUrl(resultSet),
                                resolveVideoPosterUrl(resultSet),
                                resolveVideoPreviewUrl(resultSet),
                                resolveVideoSourceUrl(resultSet),
                                new HomeFeedResponse.AuthorSummary(
                                        resultSet.getObject("author_id").toString(),
                                        resultSet.getString("author_display_name"),
                                        jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                                ),
                                nullableWorkflowSummary(resultSet),
                                new HomeFeedResponse.ItemStats(
                                        resultSet.getLong("video_play_count"),
                                        resultSet.getLong("video_like_count")
                                )
                        );
                    }

                    if ("prompt".equals(targetType)) {
                        return new HomeFeedResponse.FeedItemResponse(
                                contentKind,
                                resultSet.getString("prompt_modality"),
                                "prompt",
                                resultSet.getObject("target_id").toString(),
                                resultSet.getString("prompt_title"),
                                resultSet.getString("prompt_summary"),
                                resolvePromptCoverUrl(resultSet),
                                resolvePromptPosterUrl(resultSet),
                                resolvePromptPreviewUrl(resultSet),
                                resolvePromptSourceUrl(resultSet),
                                new HomeFeedResponse.AuthorSummary(
                                        resultSet.getObject("author_id").toString(),
                                        resultSet.getString("author_display_name"),
                                        jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                                ),
                                null,
                                new HomeFeedResponse.ItemStats(
                                        null,
                                        resultSet.getLong("prompt_like_count")
                                )
                        );
                    }

                    return new HomeFeedResponse.FeedItemResponse(
                            contentKind,
                            null,
                            "workflow",
                            resultSet.getObject("target_id").toString(),
                            resultSet.getString("workflow_item_title"),
                            resultSet.getString("workflow_item_summary"),
                            resolveMediaUrl(resultSet, "workflow_cover_url"),
                            null,
                            null,
                            null,
                            new HomeFeedResponse.AuthorSummary(
                                    resultSet.getObject("author_id").toString(),
                                    resultSet.getString("author_display_name"),
                                    jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                            ),
                            null,
                            new HomeFeedResponse.ItemStats(
                                    null,
                                    resultSet.getLong("workflow_like_count")
                            )
                    );
                },
                channel
        );
    }

    private List<FeedCandidate> loadPublishedVideoFeed() {
        return jdbcTemplate.query("""
                select
                    v.id,
                    v.title,
                    v.summary,
                    v.play_count,
                    v.like_count,
                    coalesce(v.published_at, v.updated_at) as sort_at,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    workflow.id as workflow_id,
                    workflow.title as workflow_title,
                    cover.storage_provider as cover_storage_provider,
                    cover.bucket_name as cover_bucket_name,
                    cover.object_key as cover_url,
                    poster.storage_provider as poster_storage_provider,
                    poster.bucket_name as poster_bucket_name,
                    poster.object_key as poster_url,
                    preview.storage_provider as preview_storage_provider,
                    preview.bucket_name as preview_bucket_name,
                    preview.object_key as preview_url,
                    source.storage_provider as source_storage_provider,
                    source.bucket_name as source_bucket_name,
                    source.object_key as source_url
                from videos v
                join users author on author.id = v.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join workflows workflow on workflow.id = v.workflow_id
                    and workflow.publish_status = 'published'
                    and workflow.deleted_at is null
                left join media_assets cover on cover.id = v.cover_asset_id
                left join media_assets poster on poster.id = v.poster_asset_id
                left join media_assets preview on preview.id = v.preview_asset_id
                left join media_assets source on source.id = v.source_asset_id
                where v.publish_status = 'published' and v.deleted_at is null
                order by coalesce(v.published_at, v.updated_at) desc
                limit 12
                """,
                (resultSet, rowNum) -> new FeedCandidate(
                        resultSet.getObject("sort_at", OffsetDateTime.class),
                        new HomeFeedResponse.FeedItemResponse(
                                "workflow_work",
                                null,
                                "video",
                                resultSet.getObject("id").toString(),
                                resultSet.getString("title"),
                                resultSet.getString("summary"),
                                resolveVideoCoverUrl(resultSet),
                                resolveVideoPosterUrl(resultSet),
                                resolveVideoPreviewUrl(resultSet),
                                resolveVideoSourceUrl(resultSet),
                                new HomeFeedResponse.AuthorSummary(
                                        resultSet.getObject("author_id").toString(),
                                        resultSet.getString("author_display_name"),
                                        jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                                ),
                                nullableWorkflowSummary(resultSet),
                                new HomeFeedResponse.ItemStats(
                                        resultSet.getLong("play_count"),
                                        resultSet.getLong("like_count")
                                )
                        )
                )
        );
    }

    private List<FeedCandidate> loadPublishedWorkflowFeed() {
        return jdbcTemplate.query("""
                select
                    workflow.id,
                    workflow.title,
                    workflow.summary,
                    workflow.like_count,
                    coalesce(workflow.published_at, workflow.updated_at) as sort_at,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    cover.storage_provider as cover_storage_provider,
                    cover.bucket_name as cover_bucket_name,
                    cover.object_key as cover_url
                from workflows workflow
                join users author on author.id = workflow.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join media_assets cover on cover.id = workflow.cover_asset_id
                where workflow.publish_status = 'published' and workflow.deleted_at is null
                order by coalesce(workflow.published_at, workflow.updated_at) desc
                limit 12
                """,
                (resultSet, rowNum) -> new FeedCandidate(
                        resultSet.getObject("sort_at", OffsetDateTime.class),
                        new HomeFeedResponse.FeedItemResponse(
                                "workflow_work",
                                null,
                                "workflow",
                                resultSet.getObject("id").toString(),
                                resultSet.getString("title"),
                                resultSet.getString("summary"),
                                resolveMediaUrl(resultSet, "cover_url"),
                                null,
                                null,
                                null,
                                new HomeFeedResponse.AuthorSummary(
                                        resultSet.getObject("author_id").toString(),
                                        resultSet.getString("author_display_name"),
                                        jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                                ),
                                null,
                                new HomeFeedResponse.ItemStats(
                                        null,
                                        resultSet.getLong("like_count")
                                )
                        )
                )
        );
    }

    private List<FeedCandidate> loadPublishedPromptFeed() {
        return jdbcTemplate.query("""
                select
                    prompt.id,
                    prompt.modality,
                    prompt.title,
                    prompt.summary,
                    prompt.like_count,
                    coalesce(prompt.published_at, prompt.updated_at) as sort_at,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
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
                    preview_example.asset_kind as preview_example_asset_kind
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
                where prompt.publish_status = 'published' and prompt.deleted_at is null
                order by coalesce(prompt.published_at, prompt.updated_at) desc
                limit 12
                """,
                (resultSet, rowNum) -> new FeedCandidate(
                        resultSet.getObject("sort_at", OffsetDateTime.class),
                        new HomeFeedResponse.FeedItemResponse(
                                "prompt",
                                resultSet.getString("modality"),
                                "prompt",
                                resultSet.getObject("id").toString(),
                                resultSet.getString("title"),
                                resultSet.getString("summary"),
                                resolvePromptCoverUrl(resultSet),
                                resolvePromptPosterUrl(resultSet),
                                resolvePromptPreviewUrl(resultSet),
                                resolvePromptSourceUrl(resultSet),
                                new HomeFeedResponse.AuthorSummary(
                                        resultSet.getObject("author_id").toString(),
                                        resultSet.getString("author_display_name"),
                                        jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                                ),
                                null,
                                new HomeFeedResponse.ItemStats(
                                        null,
                                        resultSet.getLong("like_count")
                                )
                        )
                )
        );
    }

    private List<FeedCandidate> loadPublishedPostFeed() {
        return jdbcTemplate.query("""
                select
                    thread.id,
                    thread.title,
                    thread.excerpt_text,
                    thread.like_count,
                    coalesce(thread.published_at, thread.last_activity_at, thread.updated_at) as sort_at,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name
                from discussion_threads thread
                join users author on author.id = thread.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                where thread.publish_status = 'published' and thread.deleted_at is null
                order by coalesce(thread.published_at, thread.last_activity_at, thread.updated_at) desc
                limit 12
                """,
                (resultSet, rowNum) -> new FeedCandidate(
                        resultSet.getObject("sort_at", OffsetDateTime.class),
                        new HomeFeedResponse.FeedItemResponse(
                                "post",
                                null,
                                "post",
                                resultSet.getObject("id").toString(),
                                resultSet.getString("title"),
                                resultSet.getString("excerpt_text"),
                                null,
                                null,
                                null,
                                null,
                                new HomeFeedResponse.AuthorSummary(
                                        resultSet.getObject("author_id").toString(),
                                        resultSet.getString("author_display_name"),
                                jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                                ),
                                null,
                                new HomeFeedResponse.ItemStats(
                                        null,
                                        resultSet.getLong("like_count")
                                )
                        )
                )
        );
    }

    private List<HomeFeedResponse.WorkflowSpotlight> hotWorkflows() {
        return jdbcTemplate.query("""
                select
                    workflow.id,
                    workflow.title,
                    workflow.allow_copy,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    cover.storage_provider as cover_storage_provider,
                    cover.bucket_name as cover_bucket_name,
                    cover.object_key as cover_url
                from workflows workflow
                join users author on author.id = workflow.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join media_assets cover on cover.id = workflow.cover_asset_id
                where workflow.publish_status = 'published' and workflow.deleted_at is null
                order by workflow.like_count desc, coalesce(workflow.published_at, workflow.updated_at) desc
                limit 6
                """,
                (resultSet, rowNum) -> new HomeFeedResponse.WorkflowSpotlight(
                        resultSet.getObject("id").toString(),
                        resultSet.getString("title"),
                        resolveMediaUrl(resultSet, "cover_url"),
                        resultSet.getBoolean("allow_copy"),
                        new HomeFeedResponse.AuthorSummary(
                                resultSet.getObject("author_id").toString(),
                                resultSet.getString("author_display_name"),
                                jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                        )
                )
        );
    }

    private List<HomeFeedResponse.CreatorSpotlight> featuredCreators() {
        return jdbcTemplate.query("""
                select
                    user_account.id,
                    user_account.display_name,
                    coalesce(avatar_asset.object_key, user_account.avatar_url) as avatar_url,
                    avatar_asset.storage_provider as avatar_storage_provider,
                    avatar_asset.bucket_name as avatar_bucket_name,
                    creator_profile.headline
                from creator_profiles creator_profile
                join users user_account on user_account.id = creator_profile.user_id
                left join media_assets avatar_asset on avatar_asset.id = user_account.avatar_asset_id
                where user_account.deleted_at is null
                order by creator_profile.follower_count desc,
                         (creator_profile.video_count + creator_profile.workflow_count) desc,
                         creator_profile.updated_at desc
                limit 6
                """,
                (resultSet, rowNum) -> new HomeFeedResponse.CreatorSpotlight(
                        resultSet.getObject("id").toString(),
                        resultSet.getString("display_name"),
                        jdbcMediaUrlResolver.resolve(resultSet, "avatar_url"),
                        resultSet.getString("headline")
                )
        );
    }

    private List<HomeFeedResponse.HomeLayoutSlot> homeLayoutSlots() {
        Map<String, List<AdminFeedOpsPageResponse.ContentItem>> configuredSlots = adminFeedOpsService.loadPublishedHomeSlotItems();
        List<HomeFeedResponse.FeedItemResponse> prompts = loadPublishedPromptFeed().stream()
                .map(FeedCandidate::item)
                .toList();
        List<HomeFeedResponse.FeedItemResponse> workflows = loadPublishedWorkflowFeed().stream()
                .map(FeedCandidate::item)
                .toList();
        List<HomeFeedResponse.FeedItemResponse> fallbackPool = new ArrayList<>();
        fallbackPool.addAll(prompts);
        fallbackPool.addAll(workflows);

        Map<String, HomeFeedResponse.FeedItemResponse> poolItemsByKey = new LinkedHashMap<>();
        fallbackPool.forEach(item -> poolItemsByKey.put(homeLayoutItemKey(item), item));

        List<HomeFeedResponse.HomeLayoutSlot> slots = new ArrayList<>();
        addHomeLayoutSlot(slots, configuredSlots, poolItemsByKey, fallbackPool, "home-hero", 3);
        addHomeLayoutSlot(slots, configuredSlots, poolItemsByKey, fallbackPool, "recommended-primary", 4);
        addHomeLayoutSlot(slots, configuredSlots, poolItemsByKey, fallbackPool, "recommended-secondary", 4);
        addHomeLayoutSlot(slots, configuredSlots, poolItemsByKey, fallbackPool, "canvas", 4);
        addHomeLayoutSlot(slots, configuredSlots, poolItemsByKey, fallbackPool, "commercial", 4);
        addHomeLayoutSlot(slots, configuredSlots, poolItemsByKey, fallbackPool, "animation", 4);
        addHomeLayoutSlot(slots, configuredSlots, poolItemsByKey, fallbackPool, "narrative", 4);
        addHomeLayoutSlot(slots, configuredSlots, poolItemsByKey, fallbackPool, "mv", 4);
        addHomeLayoutSlot(slots, configuredSlots, poolItemsByKey, fallbackPool, "creative", 4);
        return List.copyOf(slots);
    }

    private void addHomeLayoutSlot(
            List<HomeFeedResponse.HomeLayoutSlot> slots,
            Map<String, List<AdminFeedOpsPageResponse.ContentItem>> configuredSlots,
            Map<String, HomeFeedResponse.FeedItemResponse> poolItemsByKey,
            List<HomeFeedResponse.FeedItemResponse> fallbackPool,
            String slotKey,
            int maxItems
    ) {
        List<HomeFeedResponse.FeedItemResponse> configuredItems = configuredSlots.getOrDefault(slotKey, List.of()).stream()
                .map(item -> poolItemsByKey.getOrDefault(homeLayoutItemKey(item.targetType(), item.targetId()), mapHomeLayoutItem(item)))
                .toList();
        List<HomeFeedResponse.FeedItemResponse> mergedItems = fillHomeLayoutSlot(configuredItems, fallbackPool, maxItems);
        slots.add(new HomeFeedResponse.HomeLayoutSlot(slotKey, mergedItems));
    }

    private void addFeaturedArchiveSlot(
            List<FeaturedArchiveResponse.FeaturedSlot> slots,
            Map<String, List<AdminFeedOpsPageResponse.ContentItem>> configuredSlots,
            Map<String, HomeFeedResponse.FeedItemResponse> poolItemsByKey,
            List<HomeFeedResponse.FeedItemResponse> fallbackPool,
            String slotKey,
            int maxItems
    ) {
        List<HomeFeedResponse.FeedItemResponse> configuredItems = configuredSlots.getOrDefault(slotKey, List.of()).stream()
                .map(item -> poolItemsByKey.getOrDefault(homeLayoutItemKey(item.targetType(), item.targetId()), mapHomeLayoutItem(item)))
                .toList();
        List<HomeFeedResponse.FeedItemResponse> mergedItems = fillHomeLayoutSlot(configuredItems, fallbackPool, maxItems);
        slots.add(new FeaturedArchiveResponse.FeaturedSlot(slotKey, mergedItems));
    }

    private List<HomeFeedResponse.FeedItemResponse> fillHomeLayoutSlot(
            List<HomeFeedResponse.FeedItemResponse> configuredItems,
            List<HomeFeedResponse.FeedItemResponse> fallbackPool,
            int maxItems
    ) {
        List<HomeFeedResponse.FeedItemResponse> items = new ArrayList<>();
        Map<String, Boolean> seen = new LinkedHashMap<>();

        for (HomeFeedResponse.FeedItemResponse item : configuredItems) {
            String key = homeLayoutItemKey(item);
            if (seen.putIfAbsent(key, Boolean.TRUE) == null) {
                items.add(item);
            }
            if (items.size() >= maxItems) {
                return List.copyOf(items);
            }
        }

        for (HomeFeedResponse.FeedItemResponse item : fallbackPool) {
            String key = homeLayoutItemKey(item);
            if (seen.containsKey(key)) {
                continue;
            }

            seen.put(key, Boolean.TRUE);
            items.add(item);

            if (items.size() >= maxItems) {
                break;
            }
        }

        return List.copyOf(items);
    }

    private String homeLayoutItemKey(HomeFeedResponse.FeedItemResponse item) {
        return homeLayoutItemKey(item.itemType(), item.targetId());
    }

    private String homeLayoutItemKey(String itemType, String targetId) {
        return itemType + ":" + targetId;
    }

    private HomeFeedResponse.FeedItemResponse mapHomeLayoutItem(AdminFeedOpsPageResponse.ContentItem item) {
        String itemType = switch (item.targetType()) {
            case "workflow" -> "workflow";
            case "prompt" -> "prompt";
            case "post" -> "post";
            default -> "prompt";
        };
        String contentKind = "workflow".equals(itemType) ? "workflow_work" : "post".equals(itemType) ? "post" : "prompt";
        Long playCount = "prompt".equals(itemType) && "video".equalsIgnoreCase(item.promptModality()) ? 1L : null;

        return new HomeFeedResponse.FeedItemResponse(
                contentKind,
                item.promptModality(),
                itemType,
                item.targetId(),
                item.title(),
                item.summaryText(),
                item.coverUrl(),
                item.posterUrl(),
                item.previewUrl(),
                item.sourceUrl(),
                new HomeFeedResponse.AuthorSummary(
                        item.authorId() == null || item.authorId().isBlank() ? item.targetId() : item.authorId(),
                        item.authorDisplayName(),
                        item.authorAvatarUrl()
                ),
                null,
                new HomeFeedResponse.ItemStats(
                        playCount,
                        null
                )
        );
    }

    private VideoDetailResponse mapVideoDetail(ResultSet resultSet) throws SQLException {
        return new VideoDetailResponse(
                resultSet.getObject("id").toString(),
                resultSet.getString("title"),
                resultSet.getString("summary"),
                toStringList(resultSet, "tag_names"),
                new VideoDetailResponse.Media(
                        resolveMediaUrl(resultSet, "cover_url"),
                        resolveMediaUrl(resultSet, "poster_url"),
                        resolveMediaUrl(resultSet, "preview_url"),
                        resolveMediaUrl(resultSet, "source_url"),
                        toLong(resultSet, "duration_ms")
                ),
                new VideoDetailResponse.Author(
                        resultSet.getObject("author_id").toString(),
                        resultSet.getString("author_display_name"),
                        jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                ),
                nullableVideoWorkflow(resultSet),
                new VideoDetailResponse.CommentPolicy(
                        resultSet.getBoolean("comments_enabled"),
                        canManageContent((UUID) resultSet.getObject("author_id"))
                ),
                new VideoDetailResponse.Stats(
                        resultSet.getLong("play_count"),
                        resultSet.getLong("like_count"),
                        resultSet.getLong("favorite_count"),
                        resultSet.getLong("comment_count")
                ),
                new VideoDetailResponse.ViewerActions(false, false, false)
        );
    }

    private VideoDetailResponse enrichVideoViewerActions(VideoDetailResponse detail) {
        UUID videoId = parseUuid(detail.id());
        UUID authorId = parseUuid(detail.author().id());

        return new VideoDetailResponse(
                detail.id(),
                detail.title(),
                detail.summary(),
                detail.tags(),
                detail.media(),
                detail.author(),
                detail.workflow(),
                detail.commentPolicy(),
                detail.stats(),
                new VideoDetailResponse.ViewerActions(
                        hasActiveInteraction("like", "video", videoId),
                        hasActiveInteraction("favorite", "video", videoId),
                        isFollowing(authorId)
                )
        );
    }

    private WorkflowDetailResponse enrichWorkflowViewerActions(WorkflowDetailResponse detail) {
        UUID workflowId = parseUuid(detail.id());

        return new WorkflowDetailResponse(
                detail.id(),
                detail.title(),
                detail.summary(),
                detail.scenarioText(),
                detail.coverUrl(),
                detail.exampleMedia(),
                detail.tagNames(),
                detail.author(),
                detail.permissions(),
                detail.canvasBinding(),
                detail.commentPolicy(),
                detail.stats(),
                detail.relatedVideos(),
                new WorkflowDetailResponse.ViewerActions(
                        hasActiveInteraction("like", "workflow", workflowId),
                        hasActiveInteraction("favorite", "workflow", workflowId)
                )
        );
    }

    private CreatorProfileResponse enrichCreatorViewerActions(CreatorProfileResponse profile) {
        UUID creatorId = parseUuid(profile.id());

        return new CreatorProfileResponse(
                profile.id(),
                profile.displayName(),
                profile.avatarUrl(),
                profile.bio(),
                profile.headline(),
                profile.stats(),
                new CreatorProfileResponse.ViewerActions(isFollowing(creatorId))
        );
    }

    private boolean hasActiveInteraction(String actionType, String targetType, UUID targetId) {
        if (targetId == null) {
            return false;
        }
        CurrentUser currentUser = CurrentUserContext.currentOrNull();
        if (currentUser == null) {
            return false;
        }

        Boolean exists = jdbcTemplate.queryForObject("""
                select exists(
                    select 1
                    from interaction_actions
                    where actor_id = ?
                      and action_type = ?
                      and target_type = ?
                      and target_id = ?
                      and status_code = 'active'
                )
                """,
                Boolean.class,
                currentUser.id(),
                actionType,
                targetType,
                targetId
        );

        return Boolean.TRUE.equals(exists);
    }

    private boolean isFollowing(UUID followeeId) {
        if (followeeId == null) {
            return false;
        }
        CurrentUser currentUser = CurrentUserContext.currentOrNull();
        if (currentUser == null) {
            return false;
        }

        Boolean exists = jdbcTemplate.queryForObject("""
                select exists(
                    select 1
                    from follow_relations
                    where follower_id = ?
                      and followee_id = ?
                      and status_code = 'active'
                )
                """,
                Boolean.class,
                currentUser.id(),
                followeeId
        );

        return Boolean.TRUE.equals(exists);
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

        String roleCode = currentUser.roleCode() == null ? "" : currentUser.roleCode().toLowerCase();
        return "admin".equals(roleCode) || "operator".equals(roleCode) || "moderator".equals(roleCode);
    }

    private VideoSummaryResponse mapVideoSummary(ResultSet resultSet) throws SQLException {
        return new VideoSummaryResponse(
                resultSet.getObject("id").toString(),
                resultSet.getString("title"),
                resolveVideoCoverUrl(resultSet),
                resolveVideoPosterUrl(resultSet),
                resolveVideoPreviewUrl(resultSet),
                resolveVideoSourceUrl(resultSet),
                toLong(resultSet, "duration_ms"),
                resultSet.getString("summary"),
                toLong(resultSet, "like_count"),
                toLong(resultSet, "play_count"),
                new VideoSummaryResponse.AuthorSummary(
                        resultSet.getObject("author_id").toString(),
                        resultSet.getString("author_display_name"),
                        jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                ),
                nullableVideoWorkflowSummary(resultSet)
        );
    }

    private WorkflowSummaryResponse mapWorkflowSummary(ResultSet resultSet) throws SQLException {
        return new WorkflowSummaryResponse(
                resultSet.getObject("id").toString(),
                resultSet.getString("title"),
                resolveMediaUrl(resultSet, "cover_url"),
                resultSet.getString("summary"),
                toLong(resultSet, "like_count"),
                resultSet.getBoolean("allow_copy"),
                new WorkflowSummaryResponse.AuthorSummary(
                        resultSet.getObject("author_id").toString(),
                        resultSet.getString("author_display_name"),
                        jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                )
        );
    }

    private WorkflowDetailResponse.ExampleMedia nullableWorkflowExampleMedia(ResultSet resultSet) throws SQLException {
        String assetKind = resultSet.getString("example_asset_kind");
        if (assetKind == null || assetKind.isBlank()) {
            return null;
        }

        String url = resolveMediaUrl(resultSet, "example_url");
        if (url == null || url.isBlank()) {
            return null;
        }

        return new WorkflowDetailResponse.ExampleMedia(assetKind, url);
    }

    private HomeFeedResponse.WorkflowSummary nullableWorkflowSummary(ResultSet resultSet) throws SQLException {
        Object workflowId = resultSet.getObject("workflow_id");
        if (workflowId == null) {
            return null;
        }

        return new HomeFeedResponse.WorkflowSummary(
                workflowId.toString(),
                resultSet.getString("workflow_title")
        );
    }

    private VideoDetailResponse.Workflow nullableVideoWorkflow(ResultSet resultSet) throws SQLException {
        Object workflowId = resultSet.getObject("workflow_id");
        if (workflowId == null) {
            return null;
        }

        return new VideoDetailResponse.Workflow(
                workflowId.toString(),
                resultSet.getString("workflow_title"),
                resultSet.getBoolean("workflow_allow_copy")
        );
    }

    private VideoSummaryResponse.WorkflowSummary nullableVideoWorkflowSummary(ResultSet resultSet) throws SQLException {
        Object workflowId = resultSet.getObject("workflow_id");
        if (workflowId == null) {
            return null;
        }

        return new VideoSummaryResponse.WorkflowSummary(
                workflowId.toString(),
                resultSet.getString("workflow_title")
        );
    }

    private WorkflowDetailResponse.CanvasBinding nullableCanvasBinding(ResultSet resultSet) throws SQLException {
        Object bindingId = resultSet.getObject("binding_id");
        if (bindingId == null) {
            return null;
        }

        return new WorkflowDetailResponse.CanvasBinding(
                resultSet.getString("binding_type"),
                resultSet.getString("open_url"),
                resultSet.getBoolean("allow_copy")
        );
    }

    private String normalizeContentKind(String rawContentKind, String itemType) {
        if (rawContentKind != null && !rawContentKind.isBlank()) {
            return rawContentKind;
        }

        if (itemType == null || itemType.isBlank()) {
            return "workflow_work";
        }

        return switch (itemType) {
            case "prompt" -> "prompt";
            case "post" -> "post";
            default -> "workflow_work";
        };
    }

    private String normalizeTargetType(String rawTargetType, String itemType) {
        if (rawTargetType != null && !rawTargetType.isBlank()) {
            return rawTargetType;
        }

        if (itemType == null || itemType.isBlank()) {
            return "video";
        }

        return itemType;
    }

    private UUID resolveAuthorId(String creatorId) {
        return parseUuid(creatorId);
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

    private String resolveMediaUrl(ResultSet resultSet, String columnName) throws SQLException {
        return jdbcMediaUrlResolver.resolve(resultSet, columnName);
    }

    private String resolveFirstAvailableMediaUrl(ResultSet resultSet, String... columnNames) throws SQLException {
        for (String columnName : columnNames) {
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

    private String resolveVideoCoverUrl(ResultSet resultSet) throws SQLException {
        String coverUrl = resolveFirstAvailableMediaUrl(resultSet, "cover_url", "video_cover_url");
        if (coverUrl != null && !coverUrl.isBlank()) {
            return coverUrl;
        }

        String posterUrl = resolveFirstAvailableMediaUrl(resultSet, "poster_url", "video_poster_url");
        return posterUrl != null && !posterUrl.isBlank() ? posterUrl : null;
    }

    private String resolveVideoPosterUrl(ResultSet resultSet) throws SQLException {
        String posterUrl = resolveFirstAvailableMediaUrl(resultSet, "poster_url", "video_poster_url");
        if (posterUrl != null && !posterUrl.isBlank()) {
            return posterUrl;
        }

        return resolveFirstAvailableMediaUrl(resultSet, "cover_url", "video_cover_url");
    }

    private String resolveVideoPreviewUrl(ResultSet resultSet) throws SQLException {
        return resolveFirstAvailableMediaUrl(resultSet, "preview_url", "video_preview_url");
    }

    private String resolveVideoSourceUrl(ResultSet resultSet) throws SQLException {
        return resolveFirstAvailableMediaUrl(resultSet, "source_url", "video_source_url");
    }

    private String resolvePromptCoverUrl(ResultSet resultSet) throws SQLException {
        String coverUrl = resolveImageMediaUrl(
                resultSet,
                "prompt_cover_url",
                "cover_url",
                "prompt_cover_asset_kind",
                "cover_asset_kind"
        );
        return coverUrl != null
                ? coverUrl
                : resolveImageMediaUrl(
                        resultSet,
                        "prompt_primary_example_url",
                        "primary_example_url",
                        "prompt_primary_example_asset_kind",
                        "primary_example_asset_kind"
                );
    }

    private String resolvePromptPosterUrl(ResultSet resultSet) throws SQLException {
        return resolvePromptCoverUrl(resultSet);
    }

    private String resolvePromptPreviewUrl(ResultSet resultSet) throws SQLException {
        String previewUrl = resolveVideoMediaUrl(
                resultSet,
                "prompt_preview_example_url",
                "preview_example_url",
                "prompt_preview_example_asset_kind",
                "preview_example_asset_kind"
        );
        return previewUrl != null
                ? previewUrl
                : resolveVideoMediaUrl(
                        resultSet,
                        "prompt_primary_example_url",
                        "primary_example_url",
                        "prompt_primary_example_asset_kind",
                        "primary_example_asset_kind"
                );
    }

    private String resolvePromptSourceUrl(ResultSet resultSet) throws SQLException {
        return resolveVideoMediaUrl(
                resultSet,
                "prompt_primary_example_url",
                "primary_example_url",
                "prompt_primary_example_asset_kind",
                "primary_example_asset_kind"
        );
    }

    private String resolveImageMediaUrl(ResultSet resultSet, String preferredColumnName, String fallbackColumnName, String... assetKindColumns) throws SQLException {
        return "image".equalsIgnoreCase(resolveFirstAvailableText(resultSet, assetKindColumns))
                ? resolveFirstAvailableMediaUrl(resultSet, preferredColumnName, fallbackColumnName)
                : null;
    }

    private String resolveVideoMediaUrl(ResultSet resultSet, String preferredColumnName, String fallbackColumnName, String... assetKindColumns) throws SQLException {
        return "video".equalsIgnoreCase(resolveFirstAvailableText(resultSet, assetKindColumns))
                ? resolveFirstAvailableMediaUrl(resultSet, preferredColumnName, fallbackColumnName)
                : null;
    }

    private String resolveFirstAvailableText(ResultSet resultSet, String... columnNames) throws SQLException {
        for (String columnName : columnNames) {
            String value = jdbcMediaUrlResolver.nullableTextIfPresent(resultSet, columnName);
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private Long toLong(ResultSet resultSet, String columnName) throws SQLException {
        Object value = resultSet.getObject(columnName);
        if (value == null) {
            return null;
        }

        return ((Number) value).longValue();
    }

    private List<String> toStringList(java.sql.Array sqlArray) throws SQLException {
        if (sqlArray == null) {
            return List.of();
        }

        Object raw = sqlArray.getArray();
        if (raw instanceof String[] values) {
            return List.of(values);
        }

        return List.of();
    }

    private List<String> toStringList(ResultSet resultSet, String columnName) throws SQLException {
        java.sql.Array array = resultSet.getArray(columnName);
        if (array == null) {
            return List.of();
        }

        Object raw = array.getArray();
        if (raw instanceof String[] values) {
            return List.of(values);
        }

        return List.of();
    }

    private int scoreVideoRecommendation(VideoSeed seed, VideoRecommendationCandidate candidate) {
        int score = 0;
        if (seed.authorId() != null && seed.authorId().equals(candidate.authorId())) {
            score += 85;
        }
        if (seed.workflowId() != null && seed.workflowId().equals(candidate.workflowId())) {
            score += 120;
        }
        score += overlapCount(seed.tagNames(), candidate.tagNames()) * 18;
        score += Math.min(20, (int) ((candidate.summary().likeCount() == null ? 0L : candidate.summary().likeCount()) / 8));
        score += Math.min(16, (int) ((candidate.summary().playCount() == null ? 0L : candidate.summary().playCount()) / 20));
        score += recencyBonus(candidate.publishedAt(), candidate.updatedAt());
        return score;
    }

    private int scoreWorkflowVideoRecommendation(WorkflowSeed seed, VideoRecommendationCandidate candidate) {
        int score = 0;
        if (seed.id() != null && seed.id().equals(candidate.workflowId())) {
            score += 120;
        }
        if (seed.authorId() != null && seed.authorId().equals(candidate.authorId())) {
            score += 70;
        }
        score += overlapCount(seed.tagNames(), candidate.tagNames()) * 16;
        score += Math.min(20, (int) ((candidate.summary().likeCount() == null ? 0L : candidate.summary().likeCount()) / 8));
        score += Math.min(16, (int) ((candidate.summary().playCount() == null ? 0L : candidate.summary().playCount()) / 20));
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

    private record VideoSeed(
            UUID id,
            UUID authorId,
            UUID workflowId,
            List<String> tagNames,
            OffsetDateTime publishedAt,
            OffsetDateTime updatedAt
    ) {
    }

    private record WorkflowSeed(
            UUID id,
            UUID authorId,
            List<String> tagNames,
            OffsetDateTime publishedAt,
            OffsetDateTime updatedAt
    ) {
    }

    private record VideoRecommendationCandidate(
            VideoSummaryResponse summary,
            UUID authorId,
            UUID workflowId,
            List<String> tagNames,
            OffsetDateTime publishedAt,
            OffsetDateTime updatedAt
    ) {
    }

    private record FeedCandidate(
            OffsetDateTime sortAt,
            HomeFeedResponse.FeedItemResponse item
    ) {
    }
}
