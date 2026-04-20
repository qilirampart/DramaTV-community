package com.dramatv.community.discussion.application;

import com.dramatv.community.discussion.dto.response.DiscussionHomeResponse;
import com.dramatv.community.discussion.dto.response.DiscussionThreadDetailResponse;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserContext;
import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class DiscussionQueryService {

    private final JdbcTemplate jdbcTemplate;

    public DiscussionQueryService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public DiscussionHomeResponse loadHome(String channelSlug) {
        String normalizedChannelSlug = normalizeOptionalText(channelSlug);
        return new DiscussionHomeResponse(loadChannels(), loadFeaturedThreads(normalizedChannelSlug));
    }

    public Optional<DiscussionThreadDetailResponse> findThread(String slug) {
        if (slug == null || slug.isBlank()) {
            return Optional.empty();
        }
        UUID viewerId = optionalViewerId();

        return jdbcTemplate.query("""
                select
                    thread.id,
                    thread.slug,
                    thread.title,
                    thread.content_text,
                    thread.excerpt_text,
                    thread.like_count,
                    thread.favorite_count,
                    thread.reply_count,
                    thread.published_at,
                    thread.last_activity_at,
                    thread.tag_names,
                    exists(
                        select 1
                        from interaction_actions action
                        where action.actor_id = ?
                          and action.action_type = 'like'
                          and action.target_type = 'post'
                          and action.target_id = thread.id
                          and action.status_code = 'active'
                    ) as viewer_liked,
                    exists(
                        select 1
                        from interaction_actions action
                        where action.actor_id = ?
                          and action.action_type = 'favorite'
                          and action.target_type = 'post'
                          and action.target_id = thread.id
                          and action.status_code = 'active'
                    ) as viewer_favorited,
                    channel.slug as channel_slug,
                    channel.title as channel_title,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    author.avatar_url as author_avatar_url,
                    thread.binding_target_type,
                    thread.binding_target_id,
                    video.title as binding_video_title,
                    workflow.title as binding_workflow_title
                from discussion_threads thread
                join discussion_channels channel on channel.id = thread.channel_id
                join users author on author.id = thread.author_id
                left join videos video on thread.binding_target_type = 'video'
                    and video.id = thread.binding_target_id
                    and video.publish_status = 'published'
                    and video.deleted_at is null
                left join workflows workflow on thread.binding_target_type = 'workflow'
                    and workflow.id = thread.binding_target_id
                    and workflow.publish_status = 'published'
                    and workflow.deleted_at is null
                where thread.slug = ?
                  and thread.publish_status = 'published'
                  and thread.deleted_at is null
                """,
                resultSet -> resultSet.next() ? Optional.of(mapThreadDetail(resultSet)) : Optional.empty(),
                viewerId,
                viewerId,
                slug.trim()
        );
    }

    private List<DiscussionHomeResponse.Channel> loadChannels() {
        return jdbcTemplate.query("""
                select
                    channel.slug,
                    channel.title,
                    channel.description_text,
                    (
                        select count(*)
                        from discussion_threads thread
                        where thread.channel_id = channel.id
                          and thread.publish_status = 'published'
                          and thread.deleted_at is null
                    ) as thread_count
                from discussion_channels channel
                where channel.status_code = 'active'
                order by channel.sort_order asc, channel.created_at asc
                """,
                (resultSet, rowNum) -> new DiscussionHomeResponse.Channel(
                        resultSet.getString("slug"),
                        resultSet.getString("title"),
                        resultSet.getString("description_text"),
                        resultSet.getLong("thread_count")
                )
        );
    }

    private List<DiscussionHomeResponse.ThreadCard> loadFeaturedThreads(String channelSlug) {
        UUID viewerId = optionalViewerId();
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
                select
                    thread.id,
                    thread.slug,
                    thread.title,
                    thread.excerpt_text,
                    thread.like_count,
                    thread.favorite_count,
                    thread.reply_count,
                    thread.last_activity_at,
                    thread.tag_names,
                    exists(
                        select 1
                        from interaction_actions action
                        where action.actor_id = ?
                          and action.action_type = 'like'
                          and action.target_type = 'post'
                          and action.target_id = thread.id
                          and action.status_code = 'active'
                    ) as viewer_liked,
                    exists(
                        select 1
                        from interaction_actions action
                        where action.actor_id = ?
                          and action.action_type = 'favorite'
                          and action.target_type = 'post'
                          and action.target_id = thread.id
                          and action.status_code = 'active'
                    ) as viewer_favorited,
                    channel.slug as channel_slug,
                    channel.title as channel_title,
                    thread.binding_target_type,
                    thread.binding_target_id,
                    video.title as binding_video_title,
                    workflow.title as binding_workflow_title
                from discussion_threads thread
                join discussion_channels channel on channel.id = thread.channel_id
                left join videos video on thread.binding_target_type = 'video'
                    and video.id = thread.binding_target_id
                    and video.publish_status = 'published'
                    and video.deleted_at is null
                left join workflows workflow on thread.binding_target_type = 'workflow'
                    and workflow.id = thread.binding_target_id
                    and workflow.publish_status = 'published'
                    and workflow.deleted_at is null
                where thread.publish_status = 'published'
                  and thread.deleted_at is null
                """);

        if (channelSlug != null) {
            sql.append("""
                  and channel.slug = ?
                """);
            params.add(channelSlug);
        }

        sql.append("""
                order by coalesce(thread.last_activity_at, thread.published_at, thread.updated_at) desc
                limit 12
                """);

        params.add(0, viewerId);
        params.add(1, viewerId);

        return jdbcTemplate.query(
                sql.toString(),
                (resultSet, rowNum) -> new DiscussionHomeResponse.ThreadCard(
                        resultSet.getObject("id").toString(),
                        resultSet.getString("slug"),
                        resultSet.getString("title"),
                        resultSet.getString("excerpt_text"),
                        resultSet.getString("channel_slug"),
                        resultSet.getString("channel_title"),
                        resultSet.getLong("like_count"),
                        resultSet.getLong("favorite_count"),
                        resultSet.getLong("reply_count"),
                        toIsoString(resultSet.getObject("last_activity_at", OffsetDateTime.class)),
                        toStringList(resultSet.getArray("tag_names")),
                        new DiscussionHomeResponse.ViewerActions(
                                resultSet.getBoolean("viewer_liked"),
                                resultSet.getBoolean("viewer_favorited")
                        ),
                        bindingSummary(
                                nullableText(resultSet, "binding_target_type"),
                                nullableUuidString(resultSet, "binding_target_id"),
                                resultSet.getString("binding_video_title"),
                                resultSet.getString("binding_workflow_title")
                        )
                ),
                params.toArray()
        );
    }

    private DiscussionThreadDetailResponse mapThreadDetail(ResultSet resultSet) throws SQLException {
        return new DiscussionThreadDetailResponse(
                resultSet.getObject("id").toString(),
                resultSet.getString("slug"),
                resultSet.getString("title"),
                resultSet.getString("content_text"),
                resultSet.getString("excerpt_text"),
                new DiscussionThreadDetailResponse.Channel(
                        resultSet.getString("channel_slug"),
                        resultSet.getString("channel_title")
                ),
                new DiscussionThreadDetailResponse.Author(
                        resultSet.getObject("author_id").toString(),
                        resultSet.getString("author_display_name"),
                        resultSet.getString("author_avatar_url")
                ),
                new DiscussionThreadDetailResponse.Stats(
                        resultSet.getLong("like_count"),
                        resultSet.getLong("favorite_count"),
                        resultSet.getLong("reply_count")
                ),
                toIsoString(resultSet.getObject("published_at", OffsetDateTime.class)),
                toIsoString(resultSet.getObject("last_activity_at", OffsetDateTime.class)),
                toStringList(resultSet.getArray("tag_names")),
                new DiscussionThreadDetailResponse.ViewerActions(
                        resultSet.getBoolean("viewer_liked"),
                        resultSet.getBoolean("viewer_favorited")
                ),
                detailBindingSummary(
                        nullableText(resultSet, "binding_target_type"),
                        nullableUuidString(resultSet, "binding_target_id"),
                        resultSet.getString("binding_video_title"),
                        resultSet.getString("binding_workflow_title")
                )
        );
    }

    private DiscussionHomeResponse.Binding bindingSummary(
            String targetType,
            String targetId,
            String videoTitle,
            String workflowTitle
    ) {
        if (targetType == null || targetId == null) {
            return null;
        }

        return new DiscussionHomeResponse.Binding(
                targetType,
                targetId,
                "video".equals(targetType) ? videoTitle : workflowTitle
        );
    }

    private DiscussionThreadDetailResponse.Binding detailBindingSummary(
            String targetType,
            String targetId,
            String videoTitle,
            String workflowTitle
    ) {
        if (targetType == null || targetId == null) {
            return null;
        }

        return new DiscussionThreadDetailResponse.Binding(
                targetType,
                targetId,
                "video".equals(targetType) ? videoTitle : workflowTitle
        );
    }

    private String nullableText(ResultSet resultSet, String columnName) throws SQLException {
        String value = resultSet.getString(columnName);
        return value == null || value.isBlank() ? null : value;
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String nullableUuidString(ResultSet resultSet, String columnName) throws SQLException {
        UUID value = resultSet.getObject(columnName, UUID.class);
        return value == null ? null : value.toString();
    }

    private String toIsoString(OffsetDateTime value) {
        return value == null ? null : value.toString();
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

    private UUID optionalViewerId() {
        CurrentUser currentUser = CurrentUserContext.currentOrNull();
        return currentUser == null ? null : currentUser.id();
    }
}
