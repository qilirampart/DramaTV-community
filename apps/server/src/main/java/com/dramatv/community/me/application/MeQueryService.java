package com.dramatv.community.me.application;

import com.dramatv.community.discussion.application.DiscussionQueryService;
import com.dramatv.community.discussion.dto.response.DiscussionHomeResponse;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserService;
import com.dramatv.community.me.dto.response.MeHubResponse;
import com.dramatv.community.me.dto.response.MeNotificationsResponse;
import com.dramatv.community.prompt.application.PromptQueryService;
import com.dramatv.community.prompt.dto.response.PromptSummaryResponse;
import com.dramatv.community.publish.application.PublishDraftLifecycleQueryService;
import com.dramatv.community.publish.persistence.PersistedPublishDraft;
import com.dramatv.community.shared.media.JdbcMediaUrlResolver;
import com.dramatv.community.shared.support.RichTextExcerptSupport;
import com.dramatv.community.video.application.VideoQueryService;
import com.dramatv.community.video.dto.response.VideoSummaryResponse;
import com.dramatv.community.workflow.application.WorkflowQueryService;
import com.dramatv.community.workflow.dto.response.WorkflowSummaryResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
public class MeQueryService {

    private static final int MAX_SECTION_ITEMS = 12;

    private final JdbcTemplate jdbcTemplate;
    private final CurrentUserService currentUserService;
    private final JdbcMediaUrlResolver jdbcMediaUrlResolver;
    private final VideoQueryService videoQueryService;
    private final PromptQueryService promptQueryService;
    private final WorkflowQueryService workflowQueryService;
    private final DiscussionQueryService discussionQueryService;
    private final PublishDraftLifecycleQueryService publishDraftLifecycleQueryService;
    private final ObjectMapper objectMapper;

    public MeQueryService(
            JdbcTemplate jdbcTemplate,
            CurrentUserService currentUserService,
            JdbcMediaUrlResolver jdbcMediaUrlResolver,
            VideoQueryService videoQueryService,
            PromptQueryService promptQueryService,
            WorkflowQueryService workflowQueryService,
            DiscussionQueryService discussionQueryService,
            PublishDraftLifecycleQueryService publishDraftLifecycleQueryService,
            ObjectMapper objectMapper
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.currentUserService = currentUserService;
        this.jdbcMediaUrlResolver = jdbcMediaUrlResolver;
        this.videoQueryService = videoQueryService;
        this.promptQueryService = promptQueryService;
        this.workflowQueryService = workflowQueryService;
        this.discussionQueryService = discussionQueryService;
        this.publishDraftLifecycleQueryService = publishDraftLifecycleQueryService;
        this.objectMapper = objectMapper;
    }

    public MeHubResponse loadHub() {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        List<VideoSummaryResponse> publishedVideos = videoQueryService.summariesForAuthor(currentUser.id().toString());
        List<PromptSummaryResponse> publishedPrompts = promptQueryService.summariesForAuthor(currentUser.id().toString());
        List<WorkflowSummaryResponse> publishedWorkflows = workflowQueryService.summariesForAuthor(currentUser.id().toString());
        List<DiscussionHomeResponse.ThreadCard> publishedPosts = discussionQueryService.listThreadsForAuthor(currentUser.id().toString());

        return new MeHubResponse(
                loadProfile(currentUser),
                loadRecentInteractionItems(currentUser.id(), "like"),
                loadRecentInteractionItems(currentUser.id(), "favorite"),
                loadDraftItems(currentUser.id()),
                new MeHubResponse.PublishedContent(
                        publishedVideos,
                        publishedPrompts,
                        publishedWorkflows,
                        publishedPosts
                )
        );
    }

    public MeNotificationsResponse loadRecentNotifications() {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        List<SortableNotificationItem> items = new ArrayList<>();
        items.addAll(loadInteractionNotifications(currentUser.id()));
        items.addAll(loadCommentNotifications(currentUser.id()));

        items.sort(Comparator.comparing(
                SortableNotificationItem::actedAt,
                Comparator.nullsLast(Comparator.reverseOrder())
        ));

        return new MeNotificationsResponse(items.stream()
                .limit(MAX_SECTION_ITEMS)
                .map(SortableNotificationItem::item)
                .toList());
    }

    private MeHubResponse.Profile loadProfile(CurrentUser currentUser) {
        Optional<MeHubResponse.Profile> profile = jdbcTemplate.query("""
                select
                    user_account.id,
                    user_account.display_name,
                    coalesce(avatar_asset.object_key, user_account.avatar_url) as avatar_url,
                    avatar_asset.storage_provider as avatar_storage_provider,
                    avatar_asset.bucket_name as avatar_bucket_name,
                    user_account.role_code,
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
                where user_account.id = ?
                """,
                resultSet -> resultSet.next() ? Optional.of(mapProfile(resultSet)) : Optional.empty(),
                currentUser.id()
        );

        return profile.orElseGet(() -> new MeHubResponse.Profile(
                currentUser.id().toString(),
                currentUser.displayName(),
                currentUser.avatarUrl(),
                currentUser.roleCode(),
                currentUser.bio(),
                currentUser.headline(),
                new MeHubResponse.Stats(0, 0, 0, 0)
        ));
    }

    private MeHubResponse.Profile mapProfile(ResultSet resultSet) throws SQLException {
        return new MeHubResponse.Profile(
                resultSet.getObject("id").toString(),
                resultSet.getString("display_name"),
                jdbcMediaUrlResolver.resolve(resultSet, "avatar_url"),
                resultSet.getString("role_code"),
                resultSet.getString("bio"),
                resultSet.getString("headline"),
                new MeHubResponse.Stats(
                        resultSet.getInt("video_count"),
                        resultSet.getInt("workflow_count"),
                        resultSet.getLong("follower_count"),
                        resultSet.getLong("like_received_count")
                )
        );
    }

    private List<MeHubResponse.InteractionItem> loadRecentInteractionItems(UUID actorId, String actionType) {
        List<SortableInteractionItem> items = new ArrayList<>();
        items.addAll(loadVideoInteractionItems(actorId, actionType));
        items.addAll(loadPromptInteractionItems(actorId, actionType));
        items.addAll(loadWorkflowInteractionItems(actorId, actionType));
        items.addAll(loadPostInteractionItems(actorId, actionType));

        items.sort(Comparator.comparing(
                SortableInteractionItem::actedAt,
                Comparator.nullsLast(Comparator.reverseOrder())
        ));

        return items.stream()
                .limit(MAX_SECTION_ITEMS)
                .map(SortableInteractionItem::item)
                .toList();
    }

    private List<SortableInteractionItem> loadVideoInteractionItems(UUID actorId, String actionType) {
        return jdbcTemplate.query("""
                select
                    action.updated_at as acted_at,
                    video.id as target_id,
                    video.title,
                    video.summary,
                    cover.storage_provider as cover_storage_provider,
                    cover.bucket_name as cover_bucket_name,
                    cover.object_key as cover_url,
                    workflow.title as workflow_title,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name
                from interaction_actions action
                join videos video on video.id = action.target_id
                    and video.publish_status = 'published'
                    and video.deleted_at is null
                join users author on author.id = video.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join media_assets cover on cover.id = video.cover_asset_id
                left join workflows workflow on workflow.id = video.workflow_id
                    and workflow.publish_status = 'published'
                    and workflow.deleted_at is null
                where action.actor_id = ?
                  and action.action_type = ?
                  and action.target_type = 'video'
                  and action.status_code = 'active'
                order by action.updated_at desc
                limit 24
                """,
                (resultSet, rowNum) -> {
                    OffsetDateTime actedAt = resultSet.getObject("acted_at", OffsetDateTime.class);
                    String workflowTitle = nullableText(resultSet, "workflow_title");
                    String summary = nullableText(resultSet, "summary");

                    if (summary == null && workflowTitle != null) {
                        summary = "已关联工作流：" + workflowTitle;
                    }

                    return new SortableInteractionItem(
                            actedAt,
                            new MeHubResponse.InteractionItem(
                                    "video",
                                    resultSet.getObject("target_id").toString(),
                                    resultSet.getString("title"),
                                    summary,
                                    jdbcMediaUrlResolver.resolve(resultSet, "cover_url"),
                                    "/videos/" + resultSet.getObject("target_id"),
                                    workflowTitle,
                                    null,
                                    toIsoString(actedAt),
                                    new MeHubResponse.Author(
                                            resultSet.getObject("author_id").toString(),
                                            resultSet.getString("author_display_name"),
                                            jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                                    )
                            )
                    );
                },
                actorId,
                actionType
        );
    }

    private List<SortableNotificationItem> loadInteractionNotifications(UUID authorId) {
        return jdbcTemplate.query("""
                select *
                from (
                    select
                        action.id as event_id,
                        action.updated_at as acted_at,
                        action.action_type,
                        actor.id as actor_id,
                        actor.display_name as actor_display_name,
                        coalesce(actor_avatar_asset.object_key, actor.avatar_url) as actor_avatar_url,
                        actor_avatar_asset.storage_provider as actor_avatar_storage_provider,
                        actor_avatar_asset.bucket_name as actor_avatar_bucket_name,
                        video.id as target_id,
                        'video' as target_type,
                        video.title as target_title,
                        '/videos/' || video.id::text as target_href,
                        null::text as excerpt,
                        null::text as reply_to_actor_name,
                        null::text as comment_id
                    from interaction_actions action
                    join videos video on video.id = action.target_id
                        and action.target_type = 'video'
                        and video.publish_status = 'published'
                        and video.deleted_at is null
                        and video.author_id = ?
                    join users actor on actor.id = action.actor_id
                    left join media_assets actor_avatar_asset on actor_avatar_asset.id = actor.avatar_asset_id
                    where action.action_type in ('like', 'favorite')
                      and action.status_code = 'active'
                      and action.actor_id <> ?
                    union all
                    select
                        action.id as event_id,
                        action.updated_at as acted_at,
                        action.action_type,
                        actor.id as actor_id,
                        actor.display_name as actor_display_name,
                        coalesce(actor_avatar_asset.object_key, actor.avatar_url) as actor_avatar_url,
                        actor_avatar_asset.storage_provider as actor_avatar_storage_provider,
                        actor_avatar_asset.bucket_name as actor_avatar_bucket_name,
                        workflow.id as target_id,
                        'workflow' as target_type,
                        workflow.title as target_title,
                        '/workflows/' || workflow.id::text as target_href,
                        null::text as excerpt,
                        null::text as reply_to_actor_name,
                        null::text as comment_id
                    from interaction_actions action
                    join workflows workflow on workflow.id = action.target_id
                        and action.target_type = 'workflow'
                        and workflow.publish_status = 'published'
                        and workflow.deleted_at is null
                        and workflow.author_id = ?
                    join users actor on actor.id = action.actor_id
                    left join media_assets actor_avatar_asset on actor_avatar_asset.id = actor.avatar_asset_id
                    where action.action_type in ('like', 'favorite')
                      and action.status_code = 'active'
                      and action.actor_id <> ?
                    union all
                    select
                        action.id as event_id,
                        action.updated_at as acted_at,
                        action.action_type,
                        actor.id as actor_id,
                        actor.display_name as actor_display_name,
                        coalesce(actor_avatar_asset.object_key, actor.avatar_url) as actor_avatar_url,
                        actor_avatar_asset.storage_provider as actor_avatar_storage_provider,
                        actor_avatar_asset.bucket_name as actor_avatar_bucket_name,
                        prompt.id as target_id,
                        'prompt' as target_type,
                        prompt.title as target_title,
                        '/prompts/' || prompt.id::text as target_href,
                        null::text as excerpt,
                        null::text as reply_to_actor_name,
                        null::text as comment_id
                    from interaction_actions action
                    join prompt_entries prompt on prompt.id = action.target_id
                        and action.target_type = 'prompt'
                        and prompt.publish_status = 'published'
                        and prompt.deleted_at is null
                        and prompt.author_id = ?
                    join users actor on actor.id = action.actor_id
                    left join media_assets actor_avatar_asset on actor_avatar_asset.id = actor.avatar_asset_id
                    where action.action_type in ('like', 'favorite')
                      and action.status_code = 'active'
                      and action.actor_id <> ?
                    union all
                    select
                        action.id as event_id,
                        action.updated_at as acted_at,
                        action.action_type,
                        actor.id as actor_id,
                        actor.display_name as actor_display_name,
                        coalesce(actor_avatar_asset.object_key, actor.avatar_url) as actor_avatar_url,
                        actor_avatar_asset.storage_provider as actor_avatar_storage_provider,
                        actor_avatar_asset.bucket_name as actor_avatar_bucket_name,
                        thread.id as target_id,
                        'post' as target_type,
                        thread.title as target_title,
                        '/discussions/' || thread.slug as target_href,
                        null::text as excerpt,
                        null::text as reply_to_actor_name,
                        null::text as comment_id
                    from interaction_actions action
                    join discussion_threads thread on thread.id = action.target_id
                        and action.target_type = 'post'
                        and thread.publish_status = 'published'
                        and thread.deleted_at is null
                        and thread.author_id = ?
                    join users actor on actor.id = action.actor_id
                    left join media_assets actor_avatar_asset on actor_avatar_asset.id = actor.avatar_asset_id
                    where action.action_type in ('like', 'favorite')
                      and action.status_code = 'active'
                      and action.actor_id <> ?
                ) notification
                order by acted_at desc
                limit 24
                """,
                (resultSet, rowNum) -> mapNotificationItem(resultSet),
                authorId,
                authorId,
                authorId,
                authorId,
                authorId,
                authorId,
                authorId,
                authorId
        );
    }

    private List<SortableNotificationItem> loadCommentNotifications(UUID authorId) {
        return jdbcTemplate.query("""
                select *
                from (
                    select
                        comment.id as event_id,
                        comment.created_at as acted_at,
                        'reply' as action_type,
                        actor.id as actor_id,
                        actor.display_name as actor_display_name,
                        coalesce(actor_avatar_asset.object_key, actor.avatar_url) as actor_avatar_url,
                        actor_avatar_asset.storage_provider as actor_avatar_storage_provider,
                        actor_avatar_asset.bucket_name as actor_avatar_bucket_name,
                        video.id as target_id,
                        'video' as target_type,
                        video.title as target_title,
                        '/videos/' || video.id::text as target_href,
                        comment.content_text as excerpt,
                        null::text as reply_to_actor_name,
                        comment.id::text as comment_id
                    from comments comment
                    join comments replied_comment on replied_comment.id = comment.reply_to_comment_id
                    join videos video on video.id = comment.target_id
                        and comment.target_type = 'video'
                        and video.publish_status = 'published'
                        and video.deleted_at is null
                    join users actor on actor.id = comment.author_id
                    left join media_assets actor_avatar_asset on actor_avatar_asset.id = actor.avatar_asset_id
                    where comment.status_code = 'active'
                      and comment.deleted_at is null
                      and comment.author_id <> ?
                      and comment.reply_to_comment_id is not null
                      and replied_comment.author_id = ?
                    union all
                    select
                        comment.id as event_id,
                        comment.created_at as acted_at,
                        'reply' as action_type,
                        actor.id as actor_id,
                        actor.display_name as actor_display_name,
                        coalesce(actor_avatar_asset.object_key, actor.avatar_url) as actor_avatar_url,
                        actor_avatar_asset.storage_provider as actor_avatar_storage_provider,
                        actor_avatar_asset.bucket_name as actor_avatar_bucket_name,
                        workflow.id as target_id,
                        'workflow' as target_type,
                        workflow.title as target_title,
                        '/workflows/' || workflow.id::text as target_href,
                        comment.content_text as excerpt,
                        null::text as reply_to_actor_name,
                        comment.id::text as comment_id
                    from comments comment
                    join comments replied_comment on replied_comment.id = comment.reply_to_comment_id
                    join workflows workflow on workflow.id = comment.target_id
                        and comment.target_type = 'workflow'
                        and workflow.publish_status = 'published'
                        and workflow.deleted_at is null
                    join users actor on actor.id = comment.author_id
                    left join media_assets actor_avatar_asset on actor_avatar_asset.id = actor.avatar_asset_id
                    where comment.status_code = 'active'
                      and comment.deleted_at is null
                      and comment.author_id <> ?
                      and comment.reply_to_comment_id is not null
                      and replied_comment.author_id = ?
                    union all
                    select
                        comment.id as event_id,
                        comment.created_at as acted_at,
                        'reply' as action_type,
                        actor.id as actor_id,
                        actor.display_name as actor_display_name,
                        coalesce(actor_avatar_asset.object_key, actor.avatar_url) as actor_avatar_url,
                        actor_avatar_asset.storage_provider as actor_avatar_storage_provider,
                        actor_avatar_asset.bucket_name as actor_avatar_bucket_name,
                        prompt.id as target_id,
                        'prompt' as target_type,
                        prompt.title as target_title,
                        '/prompts/' || prompt.id::text as target_href,
                        comment.content_text as excerpt,
                        null::text as reply_to_actor_name,
                        comment.id::text as comment_id
                    from comments comment
                    join comments replied_comment on replied_comment.id = comment.reply_to_comment_id
                    join prompt_entries prompt on prompt.id = comment.target_id
                        and comment.target_type = 'prompt'
                        and prompt.publish_status = 'published'
                        and prompt.deleted_at is null
                    join users actor on actor.id = comment.author_id
                    left join media_assets actor_avatar_asset on actor_avatar_asset.id = actor.avatar_asset_id
                    where comment.status_code = 'active'
                      and comment.deleted_at is null
                      and comment.author_id <> ?
                      and comment.reply_to_comment_id is not null
                      and replied_comment.author_id = ?
                    union all
                    select
                        comment.id as event_id,
                        comment.created_at as acted_at,
                        'reply' as action_type,
                        actor.id as actor_id,
                        actor.display_name as actor_display_name,
                        coalesce(actor_avatar_asset.object_key, actor.avatar_url) as actor_avatar_url,
                        actor_avatar_asset.storage_provider as actor_avatar_storage_provider,
                        actor_avatar_asset.bucket_name as actor_avatar_bucket_name,
                        thread.id as target_id,
                        'post' as target_type,
                        thread.title as target_title,
                        '/discussions/' || thread.slug as target_href,
                        comment.content_text as excerpt,
                        null::text as reply_to_actor_name,
                        comment.id::text as comment_id
                    from comments comment
                    join comments replied_comment on replied_comment.id = comment.reply_to_comment_id
                    join discussion_threads thread on thread.id = comment.target_id
                        and comment.target_type = 'post'
                        and thread.publish_status = 'published'
                        and thread.deleted_at is null
                    join users actor on actor.id = comment.author_id
                    left join media_assets actor_avatar_asset on actor_avatar_asset.id = actor.avatar_asset_id
                    where comment.status_code = 'active'
                      and comment.deleted_at is null
                      and comment.author_id <> ?
                      and comment.reply_to_comment_id is not null
                      and replied_comment.author_id = ?
                    union all
                    select
                        comment.id as event_id,
                        comment.created_at as acted_at,
                        'comment' as action_type,
                        actor.id as actor_id,
                        actor.display_name as actor_display_name,
                        coalesce(actor_avatar_asset.object_key, actor.avatar_url) as actor_avatar_url,
                        actor_avatar_asset.storage_provider as actor_avatar_storage_provider,
                        actor_avatar_asset.bucket_name as actor_avatar_bucket_name,
                        video.id as target_id,
                        'video' as target_type,
                        video.title as target_title,
                        '/videos/' || video.id::text as target_href,
                        comment.content_text as excerpt,
                        null::text as reply_to_actor_name,
                        comment.id::text as comment_id
                    from comments comment
                    join videos video on video.id = comment.target_id
                        and comment.target_type = 'video'
                        and video.publish_status = 'published'
                        and video.deleted_at is null
                        and video.author_id = ?
                    join users actor on actor.id = comment.author_id
                    left join media_assets actor_avatar_asset on actor_avatar_asset.id = actor.avatar_asset_id
                    where comment.status_code = 'active'
                      and comment.deleted_at is null
                      and comment.author_id <> ?
                      and (
                          comment.reply_to_comment_id is null
                          or exists (
                              select 1
                              from comments replied_comment
                              where replied_comment.id = comment.reply_to_comment_id
                                and replied_comment.author_id <> ?
                          )
                      )
                    union all
                    select
                        comment.id as event_id,
                        comment.created_at as acted_at,
                        'comment' as action_type,
                        actor.id as actor_id,
                        actor.display_name as actor_display_name,
                        coalesce(actor_avatar_asset.object_key, actor.avatar_url) as actor_avatar_url,
                        actor_avatar_asset.storage_provider as actor_avatar_storage_provider,
                        actor_avatar_asset.bucket_name as actor_avatar_bucket_name,
                        workflow.id as target_id,
                        'workflow' as target_type,
                        workflow.title as target_title,
                        '/workflows/' || workflow.id::text as target_href,
                        comment.content_text as excerpt,
                        null::text as reply_to_actor_name,
                        comment.id::text as comment_id
                    from comments comment
                    join workflows workflow on workflow.id = comment.target_id
                        and comment.target_type = 'workflow'
                        and workflow.publish_status = 'published'
                        and workflow.deleted_at is null
                        and workflow.author_id = ?
                    join users actor on actor.id = comment.author_id
                    left join media_assets actor_avatar_asset on actor_avatar_asset.id = actor.avatar_asset_id
                    where comment.status_code = 'active'
                      and comment.deleted_at is null
                      and comment.author_id <> ?
                      and (
                          comment.reply_to_comment_id is null
                          or exists (
                              select 1
                              from comments replied_comment
                              where replied_comment.id = comment.reply_to_comment_id
                                and replied_comment.author_id <> ?
                          )
                      )
                    union all
                    select
                        comment.id as event_id,
                        comment.created_at as acted_at,
                        'comment' as action_type,
                        actor.id as actor_id,
                        actor.display_name as actor_display_name,
                        coalesce(actor_avatar_asset.object_key, actor.avatar_url) as actor_avatar_url,
                        actor_avatar_asset.storage_provider as actor_avatar_storage_provider,
                        actor_avatar_asset.bucket_name as actor_avatar_bucket_name,
                        prompt.id as target_id,
                        'prompt' as target_type,
                        prompt.title as target_title,
                        '/prompts/' || prompt.id::text as target_href,
                        comment.content_text as excerpt,
                        null::text as reply_to_actor_name,
                        comment.id::text as comment_id
                    from comments comment
                    join prompt_entries prompt on prompt.id = comment.target_id
                        and comment.target_type = 'prompt'
                        and prompt.publish_status = 'published'
                        and prompt.deleted_at is null
                        and prompt.author_id = ?
                    join users actor on actor.id = comment.author_id
                    left join media_assets actor_avatar_asset on actor_avatar_asset.id = actor.avatar_asset_id
                    where comment.status_code = 'active'
                      and comment.deleted_at is null
                      and comment.author_id <> ?
                      and (
                          comment.reply_to_comment_id is null
                          or exists (
                              select 1
                              from comments replied_comment
                              where replied_comment.id = comment.reply_to_comment_id
                                and replied_comment.author_id <> ?
                          )
                      )
                    union all
                    select
                        comment.id as event_id,
                        comment.created_at as acted_at,
                        'comment' as action_type,
                        actor.id as actor_id,
                        actor.display_name as actor_display_name,
                        coalesce(actor_avatar_asset.object_key, actor.avatar_url) as actor_avatar_url,
                        actor_avatar_asset.storage_provider as actor_avatar_storage_provider,
                        actor_avatar_asset.bucket_name as actor_avatar_bucket_name,
                        thread.id as target_id,
                        'post' as target_type,
                        thread.title as target_title,
                        '/discussions/' || thread.slug as target_href,
                        comment.content_text as excerpt,
                        null::text as reply_to_actor_name,
                        comment.id::text as comment_id
                    from comments comment
                    join discussion_threads thread on thread.id = comment.target_id
                        and comment.target_type = 'post'
                        and thread.publish_status = 'published'
                        and thread.deleted_at is null
                        and thread.author_id = ?
                    join users actor on actor.id = comment.author_id
                    left join media_assets actor_avatar_asset on actor_avatar_asset.id = actor.avatar_asset_id
                    where comment.status_code = 'active'
                      and comment.deleted_at is null
                      and comment.author_id <> ?
                      and (
                          comment.reply_to_comment_id is null
                          or exists (
                              select 1
                              from comments replied_comment
                              where replied_comment.id = comment.reply_to_comment_id
                                and replied_comment.author_id <> ?
                          )
                      )
                ) notification
                order by acted_at desc
                limit 24
                """,
                (resultSet, rowNum) -> mapNotificationItem(resultSet),
                authorId,
                authorId,
                authorId,
                authorId,
                authorId,
                authorId,
                authorId,
                authorId,
                authorId,
                authorId,
                authorId,
                authorId,
                authorId,
                authorId,
                authorId,
                authorId,
                authorId,
                authorId,
                authorId,
                authorId
        );
    }

    private SortableNotificationItem mapNotificationItem(ResultSet resultSet) throws SQLException {
        OffsetDateTime actedAt = resultSet.getObject("acted_at", OffsetDateTime.class);

        return new SortableNotificationItem(
                actedAt,
                new MeNotificationsResponse.NotificationItem(
                        resultSet.getObject("event_id").toString(),
                        resultSet.getString("action_type"),
                        toIsoString(actedAt),
                        excerpt(nullableText(resultSet, "excerpt")),
                        nullableText(resultSet, "reply_to_actor_name"),
                        nullableText(resultSet, "comment_id"),
                        new MeNotificationsResponse.Actor(
                                resultSet.getObject("actor_id").toString(),
                                resultSet.getString("actor_display_name"),
                                jdbcMediaUrlResolver.resolve(resultSet, "actor_avatar_url")
                        ),
                        new MeNotificationsResponse.Target(
                                resultSet.getObject("target_id").toString(),
                                resultSet.getString("target_type"),
                                resultSet.getString("target_title"),
                                resultSet.getString("target_href")
                        )
                )
        );
    }

    private List<SortableInteractionItem> loadPromptInteractionItems(UUID actorId, String actionType) {
        return jdbcTemplate.query("""
                select
                    action.updated_at as acted_at,
                    prompt.id as target_id,
                    prompt.title,
                    prompt.summary,
                    prompt.modality,
                    case
                        when cover.object_key is not null then cover.storage_provider
                        else primary_example.storage_provider
                    end as cover_storage_provider,
                    case
                        when cover.object_key is not null then cover.bucket_name
                        else primary_example.bucket_name
                    end as cover_bucket_name,
                    coalesce(cover.object_key, primary_example.object_key) as cover_url,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name
                from interaction_actions action
                join prompt_entries prompt on prompt.id = action.target_id
                    and prompt.publish_status = 'published'
                    and prompt.deleted_at is null
                join users author on author.id = prompt.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join media_assets cover on cover.id = prompt.cover_asset_id
                left join media_assets primary_example on primary_example.id = prompt.primary_example_asset_id
                where action.actor_id = ?
                  and action.action_type = ?
                  and action.target_type = 'prompt'
                  and action.status_code = 'active'
                order by action.updated_at desc
                limit 24
                """,
                (resultSet, rowNum) -> {
                    OffsetDateTime actedAt = resultSet.getObject("acted_at", OffsetDateTime.class);
                    String summary = nullableText(resultSet, "summary");

                    if (summary == null) {
                        summary = "image".equals(resultSet.getString("modality")) ? "图片提示词资源" : "视频提示词资源";
                    }

                    return new SortableInteractionItem(
                            actedAt,
                            new MeHubResponse.InteractionItem(
                                    "prompt",
                                    resultSet.getObject("target_id").toString(),
                                    resultSet.getString("title"),
                                    summary,
                                    jdbcMediaUrlResolver.resolve(resultSet, "cover_url"),
                                    "/prompts/" + resultSet.getObject("target_id"),
                                    null,
                                    resultSet.getString("modality"),
                                    toIsoString(actedAt),
                                    new MeHubResponse.Author(
                                            resultSet.getObject("author_id").toString(),
                                            resultSet.getString("author_display_name"),
                                            jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                                    )
                            )
                    );
                },
                actorId,
                actionType
        );
    }

    private List<SortableInteractionItem> loadWorkflowInteractionItems(UUID actorId, String actionType) {
        return jdbcTemplate.query("""
                select
                    action.updated_at as acted_at,
                    workflow.id as target_id,
                    workflow.title,
                    workflow.summary,
                    workflow.scenario_text,
                    cover.storage_provider as cover_storage_provider,
                    cover.bucket_name as cover_bucket_name,
                    cover.object_key as cover_url,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name
                from interaction_actions action
                join workflows workflow on workflow.id = action.target_id
                    and workflow.publish_status = 'published'
                    and workflow.deleted_at is null
                join users author on author.id = workflow.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join media_assets cover on cover.id = workflow.cover_asset_id
                where action.actor_id = ?
                  and action.action_type = ?
                  and action.target_type = 'workflow'
                  and action.status_code = 'active'
                order by action.updated_at desc
                limit 24
                """,
                (resultSet, rowNum) -> {
                    OffsetDateTime actedAt = resultSet.getObject("acted_at", OffsetDateTime.class);
                    String summary = nullableText(resultSet, "summary");

                    if (summary == null) {
                        summary = nullableText(resultSet, "scenario_text");
                    }

                    return new SortableInteractionItem(
                            actedAt,
                            new MeHubResponse.InteractionItem(
                                    "workflow",
                                    resultSet.getObject("target_id").toString(),
                                    resultSet.getString("title"),
                                    summary,
                                    jdbcMediaUrlResolver.resolve(resultSet, "cover_url"),
                                    "/workflows/" + resultSet.getObject("target_id"),
                                    null,
                                    null,
                                    toIsoString(actedAt),
                                    new MeHubResponse.Author(
                                            resultSet.getObject("author_id").toString(),
                                            resultSet.getString("author_display_name"),
                                            jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                                    )
                            )
                    );
                },
                actorId,
                actionType
        );
    }

    private List<SortableInteractionItem> loadPostInteractionItems(UUID actorId, String actionType) {
        return jdbcTemplate.query("""
                select
                    action.updated_at as acted_at,
                    thread.id as target_id,
                    thread.slug,
                    thread.title,
                    thread.excerpt_text,
                    channel.title as channel_title,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name
                from interaction_actions action
                join discussion_threads thread on thread.id = action.target_id
                    and thread.publish_status = 'published'
                    and thread.deleted_at is null
                join discussion_channels channel on channel.id = thread.channel_id
                join users author on author.id = thread.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                where action.actor_id = ?
                  and action.action_type = ?
                  and action.target_type = 'post'
                  and action.status_code = 'active'
                order by action.updated_at desc
                limit 24
                """,
                (resultSet, rowNum) -> {
                    OffsetDateTime actedAt = resultSet.getObject("acted_at", OffsetDateTime.class);
                    String slug = resultSet.getString("slug");

                    return new SortableInteractionItem(
                            actedAt,
                            new MeHubResponse.InteractionItem(
                                    "post",
                                    resultSet.getObject("target_id").toString(),
                                    resultSet.getString("title"),
                                    nullableText(resultSet, "excerpt_text"),
                                    null,
                                    "/discussions/" + slug,
                                    null,
                                    resultSet.getString("channel_title"),
                                    toIsoString(actedAt),
                                    new MeHubResponse.Author(
                                            resultSet.getObject("author_id").toString(),
                                            resultSet.getString("author_display_name"),
                                            jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                                    )
                            )
                    );
                },
                actorId,
                actionType
        );
    }

    private List<MeHubResponse.DraftItem> loadDraftItems(UUID authorId) {
        return jdbcTemplate.query("""
                select
                    draft.id,
                    draft.draft_type,
                    draft.author_id,
                    draft.target_id,
                    draft.title_draft,
                    draft.payload_json,
                    draft.payload_json ->> 'title' as payload_title,
                    draft.payload_json ->> 'summary' as payload_summary,
                    draft.payload_json ->> 'scenarioText' as payload_scenario_text,
                    draft.payload_json ->> 'content' as payload_content,
                    draft.payload_json ->> 'coverAssetId' as cover_asset_id,
                    cover.storage_provider as cover_storage_provider,
                    cover.bucket_name as cover_bucket_name,
                    cover.object_key as cover_url,
                    draft.current_step,
                    draft.status_code,
                    draft.updated_at,
                    draft.submitted_at,
                    draft.autosave_version
                from publish_drafts draft
                left join media_assets cover on cover.id = (
                    case
                        when coalesce(draft.payload_json ->> 'coverAssetId', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
                            then (draft.payload_json ->> 'coverAssetId')::uuid
                        else null
                    end
                )
                where draft.author_id = ?
                  and draft.status_code in ('draft', 'submitted')
                  and draft.draft_type in ('video', 'workflow', 'post')
                  and (
                    coalesce(
                        nullif(trim(draft.title_draft), ''),
                        nullif(trim(draft.payload_json ->> 'title'), ''),
                        nullif(trim(draft.payload_json ->> 'summary'), ''),
                        nullif(trim(draft.payload_json ->> 'scenarioText'), ''),
                        nullif(trim(draft.payload_json ->> 'content'), ''),
                        nullif(trim(draft.payload_json ->> 'coverAssetId'), ''),
                        nullif(trim(draft.payload_json ->> 'sourceAssetId'), ''),
                        nullif(trim(draft.payload_json ->> 'workflowId'), ''),
                        nullif(trim(draft.payload_json ->> 'bindingTargetId'), '')
                    ) is not null
                    or jsonb_array_length(coalesce(draft.payload_json -> 'tagNames', '[]'::jsonb)) > 0
                  )
                order by draft.updated_at desc
                limit 24
                """,
                (resultSet, rowNum) -> {
                    String draftId = resultSet.getObject("id").toString();
                    String title = firstNonBlank(
                            nullableText(resultSet, "payload_title"),
                            nullableText(resultSet, "title_draft")
                    );
                    String summary = firstNonBlank(
                            nullableText(resultSet, "payload_summary"),
                            nullableText(resultSet, "payload_scenario_text"),
                            excerpt(nullableText(resultSet, "payload_content"))
                    );
                    PersistedPublishDraft draft = mapPersistedDraft(resultSet);
                    String draftType = draft.draftType();

                    return new MeHubResponse.DraftItem(
                            draftType,
                            draftId,
                            resultSet.getObject("target_id") == null ? null : resultSet.getObject("target_id").toString(),
                            title,
                            summary,
                            jdbcMediaUrlResolver.resolve(resultSet, "cover_url"),
                            resultSet.getString("status_code"),
                            resultSet.getString("current_step"),
                            publishDraftLifecycleQueryService.resolve(draft),
                            toIsoString(resultSet.getObject("updated_at", OffsetDateTime.class)),
                            continueHref(draftType, draftId),
                            isEditableDraftType(draftType)
                    );
                },
                authorId
        );
    }

    private String nullableText(ResultSet resultSet, String columnName) throws SQLException {
        String value = resultSet.getString(columnName);
        return value == null || value.isBlank() ? null : value;
    }

    private String toIsoString(OffsetDateTime value) {
        return value == null ? null : value.toString();
    }

    private String continueHref(String draftType, String draftId) {
        if ("video".equals(draftType)) {
            return "/publish?draftId=" + draftId;
        }

        if ("workflow".equals(draftType)) {
            return "/publish?workflowDraftId=" + draftId;
        }

        if ("post".equals(draftType)) {
            return "/discussions/new?draftId=" + draftId;
        }

        return null;
    }

    private boolean isEditableDraftType(String draftType) {
        return "video".equals(draftType) || "workflow".equals(draftType) || "post".equals(draftType);
    }

    private PersistedPublishDraft mapPersistedDraft(ResultSet resultSet) throws SQLException {
        ObjectNode payload = objectMapper.createObjectNode();
        String payloadJson = resultSet.getString("payload_json");
        if (payloadJson != null && !payloadJson.isBlank()) {
            try {
                payload = (ObjectNode) objectMapper.readTree(payloadJson);
            } catch (Exception ignored) {
                payload = objectMapper.createObjectNode();
            }
        }

        return new PersistedPublishDraft(
                (UUID) resultSet.getObject("id"),
                resultSet.getString("draft_type"),
                (UUID) resultSet.getObject("author_id"),
                (UUID) resultSet.getObject("target_id"),
                resultSet.getString("title_draft"),
                payload,
                resultSet.getString("current_step"),
                resultSet.getString("status_code"),
                resultSet.getInt("autosave_version"),
                resultSet.getObject("submitted_at", OffsetDateTime.class)
        );
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }

        return null;
    }

    private String excerpt(String value) {
        return RichTextExcerptSupport.toExcerpt(value, 120);
    }

    private record SortableInteractionItem(
            OffsetDateTime actedAt,
            MeHubResponse.InteractionItem item
    ) {
    }

    private record SortableNotificationItem(
            OffsetDateTime actedAt,
            MeNotificationsResponse.NotificationItem item
    ) {
    }
}
