package com.dramatv.community.shared.persistence;

import com.dramatv.community.creator.dto.response.CreatorProfileResponse;
import com.dramatv.community.feed.dto.response.HomeFeedResponse;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserContext;
import com.dramatv.community.video.dto.response.VideoDetailResponse;
import com.dramatv.community.video.dto.response.VideoSummaryResponse;
import com.dramatv.community.workflow.dto.response.WorkflowDetailResponse;
import com.dramatv.community.workflow.dto.response.WorkflowSummaryResponse;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class CommunityCatalogJdbcQueryService {

    private final JdbcTemplate jdbcTemplate;

    public CommunityCatalogJdbcQueryService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
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
                    v.like_count,
                    v.favorite_count,
                    v.play_count,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    author.avatar_url as author_avatar_url,
                    workflow.id as workflow_id,
                    workflow.title as workflow_title,
                    workflow.allow_copy as workflow_allow_copy,
                    cover.object_key as cover_url,
                    poster.object_key as poster_url,
                    preview.object_key as preview_url,
                    source.object_key as source_url
                from videos v
                join users author on author.id = v.author_id
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
                select id, author_id, workflow_id
                from videos
                where id = ? and publish_status = 'published' and deleted_at is null
                """,
                resultSet -> resultSet.next()
                        ? new VideoSeed(
                                (UUID) resultSet.getObject("id"),
                                (UUID) resultSet.getObject("author_id"),
                                (UUID) resultSet.getObject("workflow_id")
                        )
                        : null,
                videoId
        );

        if (seed == null) {
            return List.of();
        }

        if (seed.workflowId() == null) {
            return jdbcTemplate.query("""
                    select
                        v.id,
                        v.title,
                        v.duration_ms,
                        author.id as author_id,
                        author.display_name as author_display_name,
                        author.avatar_url as author_avatar_url,
                        workflow.id as workflow_id,
                        workflow.title as workflow_title,
                        cover.object_key as cover_url
                    from videos v
                    join users author on author.id = v.author_id
                    left join workflows workflow on workflow.id = v.workflow_id
                        and workflow.publish_status = 'published'
                        and workflow.deleted_at is null
                    left join media_assets cover on cover.id = v.cover_asset_id
                    where v.deleted_at is null
                      and v.publish_status = 'published'
                      and v.id <> ?
                      and v.author_id = ?
                    order by v.updated_at desc
                    limit 6
                    """,
                    (resultSet, rowNum) -> mapVideoSummary(resultSet),
                    seed.id(),
                    seed.authorId()
            );
        }

        return jdbcTemplate.query("""
                select
                    v.id,
                    v.title,
                    v.duration_ms,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    author.avatar_url as author_avatar_url,
                    workflow.id as workflow_id,
                    workflow.title as workflow_title,
                    cover.object_key as cover_url
                from videos v
                join users author on author.id = v.author_id
                left join workflows workflow on workflow.id = v.workflow_id
                    and workflow.publish_status = 'published'
                    and workflow.deleted_at is null
                left join media_assets cover on cover.id = v.cover_asset_id
                where v.deleted_at is null
                  and v.publish_status = 'published'
                  and v.id <> ?
                  and (v.author_id = ? or v.workflow_id = ?)
                order by v.updated_at desc
                limit 6
                """,
                (resultSet, rowNum) -> mapVideoSummary(resultSet),
                seed.id(),
                seed.authorId(),
                seed.workflowId()
        );
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
                    v.duration_ms,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    author.avatar_url as author_avatar_url,
                    workflow.id as workflow_id,
                    workflow.title as workflow_title,
                    cover.object_key as cover_url
                from videos v
                join users author on author.id = v.author_id
                left join workflows workflow on workflow.id = v.workflow_id
                    and workflow.publish_status = 'published'
                    and workflow.deleted_at is null
                left join media_assets cover on cover.id = v.cover_asset_id
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
                    workflow.video_bind_count,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    author.avatar_url as author_avatar_url,
                    binding.id as binding_id,
                    binding.binding_type,
                    binding.open_url
                from workflows workflow
                join users author on author.id = workflow.author_id
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
                            toStringList(resultSet, "tag_names"),
                            new WorkflowDetailResponse.Author(
                                    resultSet.getObject("author_id").toString(),
                                    resultSet.getString("author_display_name"),
                                    resultSet.getString("author_avatar_url")
                            ),
                            new WorkflowDetailResponse.Permissions(
                                    resultSet.getBoolean("allow_copy"),
                                    resultSet.getBoolean("allow_fork")
                            ),
                            nullableCanvasBinding(resultSet),
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

        return jdbcTemplate.query("""
                select
                    v.id,
                    v.title,
                    v.duration_ms,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    author.avatar_url as author_avatar_url,
                    workflow.id as workflow_id,
                    workflow.title as workflow_title,
                    cover.object_key as cover_url
                from videos v
                join users author on author.id = v.author_id
                left join workflows workflow on workflow.id = v.workflow_id
                    and workflow.publish_status = 'published'
                    and workflow.deleted_at is null
                left join media_assets cover on cover.id = v.cover_asset_id
                where v.workflow_id = ? and v.publish_status = 'published' and v.deleted_at is null
                order by v.updated_at desc
                """,
                (resultSet, rowNum) -> mapVideoSummary(resultSet),
                targetWorkflowId
        );
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
                    workflow.allow_copy,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    author.avatar_url as author_avatar_url,
                    cover.object_key as cover_url
                from workflows workflow
                join users author on author.id = workflow.author_id
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
                    user_account.avatar_url,
                    user_account.bio,
                    creator_profile.headline,
                    creator_profile.video_count,
                    creator_profile.workflow_count,
                    creator_profile.follower_count
                from users user_account
                left join creator_profiles creator_profile on creator_profile.user_id = user_account.id
                where user_account.id = ? and user_account.deleted_at is null
                """,
                resultSet -> resultSet.next()
                        ? Optional.of(new CreatorProfileResponse(
                                resultSet.getObject("id").toString(),
                                resultSet.getString("display_name"),
                                resultSet.getString("avatar_url"),
                                resultSet.getString("bio"),
                                resultSet.getString("headline"),
                                new CreatorProfileResponse.Stats(
                                        resultSet.getInt("video_count"),
                                        resultSet.getInt("workflow_count"),
                                        resultSet.getLong("follower_count")
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
            mergedItems.addAll(loadPublishedWorkflowFeed());
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
                )
        );
    }

    private List<HomeFeedResponse.FeedItemResponse> loadCuratedFeed(String channel) {
        return jdbcTemplate.query("""
                select
                    feed_item.item_type,
                    feed_item.target_id,
                    video.title as video_title,
                    video.summary as video_summary,
                    video.play_count as video_play_count,
                    video.like_count as video_like_count,
                    workflow_item.title as workflow_item_title,
                    workflow_item.summary as workflow_item_summary,
                    workflow_item.like_count as workflow_like_count,
                    prompt.title as prompt_title,
                    prompt.summary as prompt_summary,
                    prompt.like_count as prompt_like_count,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    author.avatar_url as author_avatar_url,
                    linked_workflow.id as workflow_id,
                    linked_workflow.title as workflow_title,
                    cover.object_key as cover_url
                from feed_items feed_item
                left join videos video on feed_item.item_type = 'video'
                    and video.id = feed_item.target_id
                    and video.publish_status = 'published'
                    and video.deleted_at is null
                left join workflows workflow_item on feed_item.item_type = 'workflow'
                    and workflow_item.id = feed_item.target_id
                    and workflow_item.publish_status = 'published'
                    and workflow_item.deleted_at is null
                left join prompt_entries prompt on feed_item.item_type = 'prompt'
                    and prompt.id = feed_item.target_id
                    and prompt.publish_status = 'published'
                    and prompt.deleted_at is null
                join users author on author.id = coalesce(video.author_id, workflow_item.author_id, prompt.author_id)
                left join workflows linked_workflow on linked_workflow.id = video.workflow_id
                    and linked_workflow.publish_status = 'published'
                    and linked_workflow.deleted_at is null
                left join media_assets cover on cover.id = coalesce(video.cover_asset_id, workflow_item.cover_asset_id, prompt.cover_asset_id, prompt.primary_example_asset_id)
                where feed_item.channel_code = ?
                  and feed_item.status_code = 'active'
                  and (
                      (feed_item.item_type = 'video' and video.id is not null)
                      or (feed_item.item_type = 'workflow' and workflow_item.id is not null)
                      or (feed_item.item_type = 'prompt' and prompt.id is not null)
                  )
                order by feed_item.rank_score desc, coalesce(feed_item.published_at, feed_item.updated_at) desc
                limit 12
                """,
                (resultSet, rowNum) -> {
                    if ("video".equals(resultSet.getString("item_type"))) {
                        return new HomeFeedResponse.FeedItemResponse(
                                "video",
                                resultSet.getObject("target_id").toString(),
                                resultSet.getString("video_title"),
                                resultSet.getString("video_summary"),
                                resultSet.getString("cover_url"),
                                new HomeFeedResponse.AuthorSummary(
                                        resultSet.getObject("author_id").toString(),
                                        resultSet.getString("author_display_name"),
                                        resultSet.getString("author_avatar_url")
                                ),
                                nullableWorkflowSummary(resultSet),
                                new HomeFeedResponse.ItemStats(
                                        resultSet.getLong("video_play_count"),
                                        resultSet.getLong("video_like_count")
                                )
                        );
                    }

                    if ("prompt".equals(resultSet.getString("item_type"))) {
                        return new HomeFeedResponse.FeedItemResponse(
                                "prompt",
                                resultSet.getObject("target_id").toString(),
                                resultSet.getString("prompt_title"),
                                resultSet.getString("prompt_summary"),
                                resultSet.getString("cover_url"),
                                new HomeFeedResponse.AuthorSummary(
                                        resultSet.getObject("author_id").toString(),
                                        resultSet.getString("author_display_name"),
                                        resultSet.getString("author_avatar_url")
                                ),
                                null,
                                new HomeFeedResponse.ItemStats(
                                        null,
                                        resultSet.getLong("prompt_like_count")
                                )
                        );
                    }

                    return new HomeFeedResponse.FeedItemResponse(
                            "workflow",
                            resultSet.getObject("target_id").toString(),
                            resultSet.getString("workflow_item_title"),
                            resultSet.getString("workflow_item_summary"),
                            resultSet.getString("cover_url"),
                            new HomeFeedResponse.AuthorSummary(
                                    resultSet.getObject("author_id").toString(),
                                    resultSet.getString("author_display_name"),
                                    resultSet.getString("author_avatar_url")
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
                    author.avatar_url as author_avatar_url,
                    workflow.id as workflow_id,
                    workflow.title as workflow_title,
                    cover.object_key as cover_url
                from videos v
                join users author on author.id = v.author_id
                left join workflows workflow on workflow.id = v.workflow_id
                    and workflow.publish_status = 'published'
                    and workflow.deleted_at is null
                left join media_assets cover on cover.id = v.cover_asset_id
                where v.publish_status = 'published' and v.deleted_at is null
                order by coalesce(v.published_at, v.updated_at) desc
                limit 12
                """,
                (resultSet, rowNum) -> new FeedCandidate(
                        resultSet.getObject("sort_at", OffsetDateTime.class),
                        new HomeFeedResponse.FeedItemResponse(
                                "video",
                                resultSet.getObject("id").toString(),
                                resultSet.getString("title"),
                                resultSet.getString("summary"),
                                resultSet.getString("cover_url"),
                                new HomeFeedResponse.AuthorSummary(
                                        resultSet.getObject("author_id").toString(),
                                        resultSet.getString("author_display_name"),
                                        resultSet.getString("author_avatar_url")
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
                    author.avatar_url as author_avatar_url,
                    cover.object_key as cover_url
                from workflows workflow
                join users author on author.id = workflow.author_id
                left join media_assets cover on cover.id = workflow.cover_asset_id
                where workflow.publish_status = 'published' and workflow.deleted_at is null
                order by coalesce(workflow.published_at, workflow.updated_at) desc
                limit 12
                """,
                (resultSet, rowNum) -> new FeedCandidate(
                        resultSet.getObject("sort_at", OffsetDateTime.class),
                        new HomeFeedResponse.FeedItemResponse(
                                "workflow",
                                resultSet.getObject("id").toString(),
                                resultSet.getString("title"),
                                resultSet.getString("summary"),
                                resultSet.getString("cover_url"),
                                new HomeFeedResponse.AuthorSummary(
                                        resultSet.getObject("author_id").toString(),
                                        resultSet.getString("author_display_name"),
                                        resultSet.getString("author_avatar_url")
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
                    prompt.title,
                    prompt.summary,
                    prompt.like_count,
                    coalesce(prompt.published_at, prompt.updated_at) as sort_at,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    author.avatar_url as author_avatar_url,
                    cover.object_key as cover_url
                from prompt_entries prompt
                join users author on author.id = prompt.author_id
                left join media_assets cover on cover.id = coalesce(prompt.cover_asset_id, prompt.primary_example_asset_id)
                where prompt.publish_status = 'published' and prompt.deleted_at is null
                order by coalesce(prompt.published_at, prompt.updated_at) desc
                limit 12
                """,
                (resultSet, rowNum) -> new FeedCandidate(
                        resultSet.getObject("sort_at", OffsetDateTime.class),
                        new HomeFeedResponse.FeedItemResponse(
                                "prompt",
                                resultSet.getObject("id").toString(),
                                resultSet.getString("title"),
                                resultSet.getString("summary"),
                                resultSet.getString("cover_url"),
                                new HomeFeedResponse.AuthorSummary(
                                        resultSet.getObject("author_id").toString(),
                                        resultSet.getString("author_display_name"),
                                        resultSet.getString("author_avatar_url")
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
                    author.avatar_url as author_avatar_url,
                    cover.object_key as cover_url
                from workflows workflow
                join users author on author.id = workflow.author_id
                left join media_assets cover on cover.id = workflow.cover_asset_id
                where workflow.publish_status = 'published' and workflow.deleted_at is null
                order by workflow.like_count desc, coalesce(workflow.published_at, workflow.updated_at) desc
                limit 6
                """,
                (resultSet, rowNum) -> new HomeFeedResponse.WorkflowSpotlight(
                        resultSet.getObject("id").toString(),
                        resultSet.getString("title"),
                        resultSet.getString("cover_url"),
                        resultSet.getBoolean("allow_copy"),
                        new HomeFeedResponse.AuthorSummary(
                                resultSet.getObject("author_id").toString(),
                                resultSet.getString("author_display_name"),
                                resultSet.getString("author_avatar_url")
                        )
                )
        );
    }

    private List<HomeFeedResponse.CreatorSpotlight> featuredCreators() {
        return jdbcTemplate.query("""
                select
                    user_account.id,
                    user_account.display_name,
                    user_account.avatar_url,
                    creator_profile.headline
                from creator_profiles creator_profile
                join users user_account on user_account.id = creator_profile.user_id
                where user_account.deleted_at is null
                order by creator_profile.follower_count desc,
                         (creator_profile.video_count + creator_profile.workflow_count) desc,
                         creator_profile.updated_at desc
                limit 6
                """,
                (resultSet, rowNum) -> new HomeFeedResponse.CreatorSpotlight(
                        resultSet.getObject("id").toString(),
                        resultSet.getString("display_name"),
                        resultSet.getString("avatar_url"),
                        resultSet.getString("headline")
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
                        resultSet.getString("cover_url"),
                        resultSet.getString("poster_url"),
                        resultSet.getString("preview_url"),
                        resultSet.getString("source_url"),
                        toLong(resultSet, "duration_ms")
                ),
                new VideoDetailResponse.Author(
                        resultSet.getObject("author_id").toString(),
                        resultSet.getString("author_display_name"),
                        resultSet.getString("author_avatar_url")
                ),
                nullableVideoWorkflow(resultSet),
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
                detail.tagNames(),
                detail.author(),
                detail.permissions(),
                detail.canvasBinding(),
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

    private VideoSummaryResponse mapVideoSummary(ResultSet resultSet) throws SQLException {
        return new VideoSummaryResponse(
                resultSet.getObject("id").toString(),
                resultSet.getString("title"),
                resultSet.getString("cover_url"),
                toLong(resultSet, "duration_ms"),
                new VideoSummaryResponse.AuthorSummary(
                        resultSet.getObject("author_id").toString(),
                        resultSet.getString("author_display_name"),
                        resultSet.getString("author_avatar_url")
                ),
                nullableVideoWorkflowSummary(resultSet)
        );
    }

    private WorkflowSummaryResponse mapWorkflowSummary(ResultSet resultSet) throws SQLException {
        return new WorkflowSummaryResponse(
                resultSet.getObject("id").toString(),
                resultSet.getString("title"),
                resultSet.getString("cover_url"),
                resultSet.getBoolean("allow_copy"),
                new WorkflowSummaryResponse.AuthorSummary(
                        resultSet.getObject("author_id").toString(),
                        resultSet.getString("author_display_name"),
                        resultSet.getString("author_avatar_url")
                )
        );
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

    private Long toLong(ResultSet resultSet, String columnName) throws SQLException {
        Object value = resultSet.getObject(columnName);
        if (value == null) {
            return null;
        }

        return ((Number) value).longValue();
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

    private record VideoSeed(
            UUID id,
            UUID authorId,
            UUID workflowId
    ) {
    }

    private record FeedCandidate(
            OffsetDateTime sortAt,
            HomeFeedResponse.FeedItemResponse item
    ) {
    }
}
