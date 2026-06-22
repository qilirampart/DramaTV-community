package com.dramatv.community.discussion.application;

import com.dramatv.community.admin.feedops.AdminFeedOpsService;
import com.dramatv.community.discussion.dto.response.DiscussionHomeResponse;
import com.dramatv.community.discussion.dto.response.DiscussionThreadDetailResponse;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserContext;
import com.dramatv.community.shared.media.JdbcMediaUrlResolver;
import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class DiscussionQueryService {

    private final JdbcTemplate jdbcTemplate;
    private final JdbcMediaUrlResolver jdbcMediaUrlResolver;
    private final AdminFeedOpsService adminFeedOpsService;

    public DiscussionQueryService(
            JdbcTemplate jdbcTemplate,
            JdbcMediaUrlResolver jdbcMediaUrlResolver,
            AdminFeedOpsService adminFeedOpsService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.jdbcMediaUrlResolver = jdbcMediaUrlResolver;
        this.adminFeedOpsService = adminFeedOpsService;
    }

    public DiscussionHomeResponse loadHome(String channelSlug) {
        String normalizedChannelSlug = normalizeOptionalText(channelSlug);
        Map<String, List<String>> ordering = adminFeedOpsService.loadPublishedDiscussionOrdering();
        return new DiscussionHomeResponse(
                loadChannels(ordering.get("discussion-channel-order")),
                loadFeaturedThreads(normalizedChannelSlug, ordering)
        );
    }

    public List<DiscussionHomeResponse.ThreadCard> listThreadsForAuthor(String creatorId) {
        return listThreadsForAuthor(creatorId, 48, 0);
    }

    public List<DiscussionHomeResponse.ThreadCard> listThreadsForAuthor(String creatorId, int limit, int offset) {
        UUID authorId = parseUuid(creatorId);
        if (authorId == null) {
            return List.of();
        }

        UUID viewerId = optionalViewerId();

        return jdbcTemplate.query("""
                select
                    thread.id,
                    thread.slug,
                    thread.title,
                    thread.excerpt_text,
                    thread.published_at,
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
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    thread.binding_target_type,
                    thread.binding_target_id,
                    video.title as binding_video_title,
                    workflow.title as binding_workflow_title
                from discussion_threads thread
                join discussion_channels channel on channel.id = thread.channel_id
                join users author on author.id = thread.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join videos video on thread.binding_target_type = 'video'
                    and video.id = thread.binding_target_id
                    and video.publish_status = 'published'
                    and video.deleted_at is null
                left join workflows workflow on thread.binding_target_type = 'workflow'
                    and workflow.id = thread.binding_target_id
                    and workflow.publish_status = 'published'
                    and workflow.deleted_at is null
                where thread.author_id = ?
                  and thread.publish_status = 'published'
                  and thread.deleted_at is null
                order by coalesce(thread.last_activity_at, thread.published_at, thread.updated_at) desc
                limit ?
                offset ?
                """,
                this::mapThreadCard,
                viewerId,
                viewerId,
                authorId,
                limit,
                offset
        );
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
                    thread.comments_enabled,
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
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    thread.binding_target_type,
                    thread.binding_target_id,
                    video.title as binding_video_title,
                    workflow.title as binding_workflow_title
                from discussion_threads thread
                join discussion_channels channel on channel.id = thread.channel_id
                join users author on author.id = thread.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
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
                resultSet -> {
                    if (!resultSet.next()) {
                        return Optional.empty();
                    }

                    DiscussionThreadDetailResponse detail = mapThreadDetail(resultSet);
                    return Optional.of(enrichThreadDetail(detail));
                },
                viewerId,
                viewerId,
                slug.trim()
        );
    }

    private DiscussionThreadDetailResponse enrichThreadDetail(DiscussionThreadDetailResponse detail) {
        return new DiscussionThreadDetailResponse(
                detail.id(),
                detail.slug(),
                detail.title(),
                detail.content(),
                detail.excerpt(),
                detail.channel(),
                detail.author(),
                detail.stats(),
                detail.publishedAt(),
                detail.lastActivityAt(),
                detail.tagNames(),
                detail.viewerActions(),
                detail.commentPolicy(),
                detail.binding(),
                loadRelatedThreads(detail)
        );
    }

    private List<DiscussionHomeResponse.ThreadCard> loadRelatedThreads(DiscussionThreadDetailResponse detail) {
        if (detail == null) {
            return List.of();
        }

        UUID viewerId = optionalViewerId();
        List<ThreadRecommendationCandidate> candidates = jdbcTemplate.query("""
                select
                    thread.id,
                    thread.slug,
                    thread.title,
                    thread.excerpt_text,
                    thread.published_at,
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
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    thread.binding_target_type,
                    thread.binding_target_id,
                    video.title as binding_video_title,
                    workflow.title as binding_workflow_title
                from discussion_threads thread
                join discussion_channels channel on channel.id = thread.channel_id
                join users author on author.id = thread.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
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
                  and thread.id <> ?
                order by coalesce(thread.last_activity_at, thread.published_at, thread.updated_at) desc
                limit 48
                """,
                (resultSet, rowNum) -> new ThreadRecommendationCandidate(
                        mapThreadCard(resultSet, rowNum),
                        resultSet.getObject("published_at", OffsetDateTime.class),
                        resultSet.getObject("last_activity_at", OffsetDateTime.class)
                ),
                viewerId,
                viewerId,
                parseUuid(detail.id())
        );

        return candidates.stream()
                .sorted((left, right) -> Integer.compare(
                        scoreThreadRecommendation(detail, right),
                        scoreThreadRecommendation(detail, left)
                ))
                .limit(4)
                .map(ThreadRecommendationCandidate::card)
                .toList();
    }

    private List<DiscussionHomeResponse.Channel> loadChannels(List<String> configuredChannelIds) {
        List<DiscussionHomeResponse.Channel> channels = jdbcTemplate.query("""
                select
                    channel.id,
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
                (resultSet, rowNum) -> new ChannelOrderingCandidate(
                        resultSet.getObject("id", UUID.class).toString(),
                        resultSet.getString("slug"),
                        resultSet.getString("title"),
                        resultSet.getString("description_text"),
                        resultSet.getLong("thread_count")
                )
        ).stream().map(candidate -> new DiscussionHomeResponse.Channel(
                candidate.slug(),
                candidate.title(),
                candidate.description(),
                candidate.threadCount()
        )).toList();

        if (configuredChannelIds == null || configuredChannelIds.isEmpty()) {
            return channels;
        }

        Map<String, Integer> rankById = new LinkedHashMap<>();
        for (int index = 0; index < configuredChannelIds.size(); index += 1) {
            rankById.put(configuredChannelIds.get(index), index);
        }

        List<ChannelOrderingCandidate> orderedCandidates = jdbcTemplate.query("""
                select
                    channel.id,
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
                """, (resultSet, rowNum) -> new ChannelOrderingCandidate(
                resultSet.getObject("id", UUID.class).toString(),
                resultSet.getString("slug"),
                resultSet.getString("title"),
                resultSet.getString("description_text"),
                resultSet.getLong("thread_count")
        ));

        return orderedCandidates.stream()
                .sorted((left, right) -> {
                    Integer leftRank = rankById.get(left.id());
                    Integer rightRank = rankById.get(right.id());
                    if (leftRank != null && rightRank != null) {
                        return Integer.compare(leftRank, rightRank);
                    }
                    if (leftRank != null) {
                        return -1;
                    }
                    if (rightRank != null) {
                        return 1;
                    }
                    return 0;
                })
                .map(candidate -> new DiscussionHomeResponse.Channel(
                        candidate.slug(),
                        candidate.title(),
                        candidate.description(),
                        candidate.threadCount()
                ))
                .toList();
    }

    private List<DiscussionHomeResponse.ThreadCard> loadFeaturedThreads(String channelSlug, Map<String, List<String>> ordering) {
        UUID viewerId = optionalViewerId();
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
                select
                    thread.id,
                    thread.slug,
                    thread.title,
                    thread.excerpt_text,
                    thread.published_at,
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
                    author.id as author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    thread.binding_target_type,
                    thread.binding_target_id,
                    video.title as binding_video_title,
                    workflow.title as binding_workflow_title
                from discussion_threads thread
                join discussion_channels channel on channel.id = thread.channel_id
                join users author on author.id = thread.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
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

        List<DiscussionHomeResponse.ThreadCard> systemOrdered = jdbcTemplate.query(
                sql.toString(),
                this::mapThreadCard,
                params.toArray()
        );

        String slotKey = channelSlug == null
                ? "discussion-all-thread-stream"
                : AdminFeedOpsService.discussionChannelSlotKey(channelSlug);
        List<String> configuredThreadIds = ordering.get(slotKey);
        return mergeConfiguredThreads(configuredThreadIds, systemOrdered);
    }

    private List<DiscussionHomeResponse.ThreadCard> mergeConfiguredThreads(
            List<String> configuredThreadIds,
            List<DiscussionHomeResponse.ThreadCard> systemOrdered
    ) {
        if (configuredThreadIds == null || configuredThreadIds.isEmpty()) {
            return systemOrdered;
        }

        Map<String, DiscussionHomeResponse.ThreadCard> cardById = systemOrdered.stream()
                .collect(LinkedHashMap::new, (map, card) -> map.put(card.id(), card), Map::putAll);

        List<DiscussionHomeResponse.ThreadCard> merged = new ArrayList<>();
        for (String threadId : configuredThreadIds) {
            DiscussionHomeResponse.ThreadCard card = cardById.remove(threadId);
            if (card != null) {
                merged.add(card);
            }
        }
        merged.addAll(cardById.values());
        return merged.stream().limit(12).toList();
    }

    private DiscussionHomeResponse.ThreadCard mapThreadCard(ResultSet resultSet, int rowNum) throws SQLException {
        return new DiscussionHomeResponse.ThreadCard(
                resultSet.getObject("id").toString(),
                resultSet.getString("slug"),
                resultSet.getString("title"),
                resultSet.getString("excerpt_text"),
                toIsoString(resultSet.getObject("published_at", OffsetDateTime.class)),
                resultSet.getString("channel_slug"),
                resultSet.getString("channel_title"),
                resultSet.getLong("like_count"),
                resultSet.getLong("favorite_count"),
                resultSet.getLong("reply_count"),
                toIsoString(resultSet.getObject("last_activity_at", OffsetDateTime.class)),
                toStringList(resultSet.getArray("tag_names")),
                new DiscussionHomeResponse.Author(
                        resultSet.getObject("author_id").toString(),
                        resultSet.getString("author_display_name"),
                        jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                ),
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
                        jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
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
                new DiscussionThreadDetailResponse.CommentPolicy(
                        resultSet.getBoolean("comments_enabled"),
                        canManageContent((UUID) resultSet.getObject("author_id"))
                ),
                detailBindingSummary(
                        nullableText(resultSet, "binding_target_type"),
                        nullableUuidString(resultSet, "binding_target_id"),
                        resultSet.getString("binding_video_title"),
                        resultSet.getString("binding_workflow_title")
                ),
                List.of()
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

    private int scoreThreadRecommendation(DiscussionThreadDetailResponse seed, ThreadRecommendationCandidate candidate) {
        int score = 0;

        if (seed.binding() != null && candidate.card().binding() != null) {
            boolean sameBinding = seed.binding().targetType().equals(candidate.card().binding().targetType())
                    && seed.binding().targetId().equals(candidate.card().binding().targetId());
            if (sameBinding) {
                score += 120;
            }
        }

        if (seed.author() != null && seed.author().id() != null && seed.author().id().equals(candidate.card().author().id())) {
            score += 80;
        }

        if (seed.channel() != null && seed.channel().slug() != null && seed.channel().slug().equals(candidate.card().channelSlug())) {
            score += 55;
        }

        score += overlapCount(seed.tagNames(), candidate.card().tagNames()) * 18;
        score += Math.min(20, candidate.card().likeCount() / 5);
        score += Math.min(12, candidate.card().favoriteCount() / 4);
        score += Math.min(12, candidate.card().replyCount() / 3);
        score += recencyBonus(candidate.lastActivityAt(), candidate.publishedAt());

        return score;
    }

    private int overlapCount(List<String> left, List<String> right) {
        if (left.isEmpty() || right.isEmpty()) {
            return 0;
        }

        int count = 0;
        for (String candidate : left) {
            if (candidate != null && right.contains(candidate)) {
                count += 1;
            }
        }
        return count;
    }

    private int recencyBonus(OffsetDateTime lastActivityAt, OffsetDateTime publishedAt) {
        OffsetDateTime timestamp = lastActivityAt != null ? lastActivityAt : publishedAt;
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

    private record ThreadRecommendationCandidate(
            DiscussionHomeResponse.ThreadCard card,
            OffsetDateTime publishedAt,
            OffsetDateTime lastActivityAt
    ) {
    }

    private record ChannelOrderingCandidate(
            String id,
            String slug,
            String title,
            String description,
            long threadCount
    ) {
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
}
