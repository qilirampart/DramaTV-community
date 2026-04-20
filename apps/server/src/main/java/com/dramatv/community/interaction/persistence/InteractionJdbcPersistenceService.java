package com.dramatv.community.interaction.persistence;

import com.dramatv.community.interaction.dto.request.CreateCommentRequest;
import com.dramatv.community.interaction.dto.request.FollowRequest;
import com.dramatv.community.interaction.dto.request.TargetActionRequest;
import com.dramatv.community.interaction.dto.response.ActionStateResponse;
import com.dramatv.community.interaction.dto.response.CommentResponse;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserContext;
import com.dramatv.community.identity.application.CurrentUserService;
import com.dramatv.community.shared.response.CursorPageResponse;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InteractionJdbcPersistenceService {

    private final JdbcTemplate jdbcTemplate;
    private final CurrentUserService currentUserService;

    public InteractionJdbcPersistenceService(JdbcTemplate jdbcTemplate, CurrentUserService currentUserService) {
        this.jdbcTemplate = jdbcTemplate;
        this.currentUserService = currentUserService;
    }

    public CursorPageResponse<CommentResponse> listComments(String targetType, String targetId, String cursor) {
        UUID parsedTargetId = requireTargetId(targetId);
        String normalizedTargetType = normalizeCommentTargetType(targetType);
        UUID viewerId = optionalViewerId();

        List<CommentResponse> items = jdbcTemplate.query("""
                select
                    comment.id,
                    comment.author_id,
                    author.display_name as author_display_name,
                    author.avatar_url as author_avatar_url,
                    comment.content_text,
                    comment.created_at,
                    comment.reply_count,
                    comment.like_count,
                    exists(
                        select 1
                        from interaction_actions action
                        where action.actor_id = ?
                          and action.action_type = 'like'
                          and action.target_type = 'comment'
                          and action.target_id = comment.id
                          and action.status_code = 'active'
                    ) as viewer_liked
                from comments comment
                join users author on author.id = comment.author_id
                where comment.target_type = ?
                  and comment.target_id = ?
                  and comment.parent_id is null
                  and comment.status_code = 'active'
                  and comment.deleted_at is null
                order by comment.created_at asc
                """,
                (resultSet, rowNum) -> mapComment(resultSet),
                viewerId,
                normalizedTargetType,
                parsedTargetId
        );

        return new CursorPageResponse<>(items, null, false);
    }

    @Transactional
    public CommentResponse createComment(CreateCommentRequest request) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        ensureCreatorProfileExists(currentUser);

        String normalizedTargetType = normalizeCommentTargetType(request.targetType());
        UUID parsedTargetId = requireTargetId(request.targetId());
        UUID parentId = parseUuid(request.parentId());

        ensureVisibleTargetExists(normalizedTargetType, parsedTargetId);

        ParentComment parentComment = parentId == null ? null : loadParentComment(parentId, normalizedTargetType, parsedTargetId);

        UUID commentId = UUID.randomUUID();
        UUID rootId = parentComment == null ? null : parentComment.rootId() == null ? parentComment.id() : parentComment.rootId();
        String content = normalizeCommentContent(request.content());

        jdbcTemplate.update("""
                insert into comments (
                    id, target_type, target_id, author_id, parent_id, root_id, content_text,
                    status_code, reply_count, like_count, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, ?, ?, 'active', 0, 0, now(), now())
                """,
                commentId,
                normalizedTargetType,
                parsedTargetId,
                currentUser.id(),
                parentId,
                rootId,
                content
        );

        if (parentComment != null) {
            syncReplyCount(parentComment.id());
        }
        syncCommentCount(normalizedTargetType, parsedTargetId);

        return jdbcTemplate.query("""
                select
                    comment.id,
                    comment.author_id,
                    author.display_name as author_display_name,
                    author.avatar_url as author_avatar_url,
                    comment.content_text,
                    comment.created_at,
                    comment.reply_count,
                    comment.like_count,
                    false as viewer_liked
                from comments comment
                join users author on author.id = comment.author_id
                where comment.id = ?
                """,
                resultSet -> resultSet.next() ? mapComment(resultSet) : null,
                commentId
        );
    }

    @Transactional
    public ActionStateResponse like(TargetActionRequest request, boolean active) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        ensureCreatorProfileExists(currentUser);

        String normalizedTargetType = normalizeLikeTargetType(request.targetType());
        UUID parsedTargetId = requireTargetId(request.targetId());

        ensureInteractionTargetExists("like", normalizedTargetType, parsedTargetId);
        boolean changed = upsertInteractionAction(currentUser.id(), "like", normalizedTargetType, parsedTargetId, active);
        if (changed) {
            syncLikeCount(normalizedTargetType, parsedTargetId);
        }

        return new ActionStateResponse("like", parsedTargetId.toString(), active);
    }

    @Transactional
    public ActionStateResponse favorite(TargetActionRequest request, boolean active) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        ensureCreatorProfileExists(currentUser);

        String normalizedTargetType = normalizeFavoriteTargetType(request.targetType());
        UUID parsedTargetId = requireTargetId(request.targetId());

        ensureInteractionTargetExists("favorite", normalizedTargetType, parsedTargetId);
        boolean changed = upsertInteractionAction(currentUser.id(), "favorite", normalizedTargetType, parsedTargetId, active);
        if (changed) {
            syncFavoriteCount(normalizedTargetType, parsedTargetId);
        }

        return new ActionStateResponse("favorite", parsedTargetId.toString(), active);
    }

    @Transactional
    public ActionStateResponse follow(FollowRequest request, boolean active) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        ensureCreatorProfileExists(currentUser);

        UUID followeeId = requireTargetId(request.followeeId());
        if (currentUser.id().equals(followeeId)) {
            throw new IllegalArgumentException("FOLLOW_SELF_FORBIDDEN");
        }
        ensureFolloweeExists(followeeId);

        boolean changed = upsertFollowRelation(currentUser.id(), followeeId, active);
        if (changed) {
            syncFollowerCount(followeeId);
        }

        return new ActionStateResponse("follow", followeeId.toString(), active);
    }

    private CommentResponse mapComment(ResultSet resultSet) throws SQLException {
        return new CommentResponse(
                resultSet.getObject("id").toString(),
                new CommentResponse.Author(
                        resultSet.getObject("author_id").toString(),
                        resultSet.getString("author_display_name"),
                        resultSet.getString("author_avatar_url")
                ),
                resultSet.getString("content_text"),
                resultSet.getObject("created_at", OffsetDateTime.class).toString(),
                resultSet.getInt("reply_count"),
                resultSet.getInt("like_count"),
                new CommentResponse.ViewerActions(resultSet.getBoolean("viewer_liked"))
        );
    }

    private String normalizeCommentTargetType(String targetType) {
        String normalized = normalizeTargetType(targetType);
        if ("video".equals(normalized)
                || "workflow".equals(normalized)
                || "prompt".equals(normalized)
                || "post".equals(normalized)) {
            return normalized;
        }
        throw new IllegalArgumentException("COMMENT_TARGET_NOT_FOUND");
    }

    private String normalizeLikeTargetType(String targetType) {
        String normalized = normalizeTargetType(targetType);
        if ("video".equals(normalized)
                || "workflow".equals(normalized)
                || "prompt".equals(normalized)
                || "comment".equals(normalized)
                || "post".equals(normalized)) {
            return normalized;
        }
        throw new IllegalArgumentException("INTERACTION_TARGET_NOT_FOUND");
    }

    private String normalizeFavoriteTargetType(String targetType) {
        String normalized = normalizeTargetType(targetType);
        if ("video".equals(normalized)
                || "workflow".equals(normalized)
                || "prompt".equals(normalized)
                || "post".equals(normalized)) {
            return normalized;
        }
        throw new IllegalArgumentException("INTERACTION_TARGET_NOT_FOUND");
    }

    private String normalizeTargetType(String targetType) {
        if (targetType == null || targetType.isBlank()) {
            throw new IllegalArgumentException("INTERACTION_TARGET_NOT_FOUND");
        }

        return targetType.trim().toLowerCase(Locale.ROOT);
    }

    private UUID requireTargetId(String targetId) {
        UUID parsed = parseUuid(targetId);
        if (parsed == null) {
            throw new IllegalArgumentException("INTERACTION_TARGET_NOT_FOUND");
        }
        return parsed;
    }

    private UUID parseUuid(String candidate) {
        if (candidate == null || candidate.isBlank()) {
            return null;
        }

        try {
            return UUID.fromString(candidate.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String normalizeCommentContent(String content) {
        if (content == null) {
            throw new IllegalArgumentException("COMMENT_CONTENT_INVALID");
        }

        String normalized = content.trim();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("COMMENT_CONTENT_INVALID");
        }

        return normalized;
    }

    private void ensureVisibleTargetExists(String targetType, UUID targetId) {
        Boolean exists = switch (targetType) {
            case "video", "workflow" -> jdbcTemplate.queryForObject(
                    "select exists(select 1 from " + ("video".equals(targetType) ? "videos" : "workflows")
                            + " where id = ? and publish_status = 'published' and deleted_at is null)",
                    Boolean.class,
                    targetId
            );
            case "prompt" -> jdbcTemplate.queryForObject(
                    "select exists(select 1 from prompt_entries where id = ? and publish_status = 'published' and deleted_at is null)",
                    Boolean.class,
                    targetId
            );
            case "post" -> jdbcTemplate.queryForObject(
                    "select exists(select 1 from discussion_threads where id = ? and publish_status = 'published' and deleted_at is null)",
                    Boolean.class,
                    targetId
            );
            default -> throw new IllegalArgumentException("COMMENT_TARGET_NOT_FOUND");
        };

        if (!Boolean.TRUE.equals(exists)) {
            throw new IllegalArgumentException("COMMENT_TARGET_NOT_FOUND");
        }
    }

    private void ensureInteractionTargetExists(String actionType, String targetType, UUID targetId) {
        boolean exists = switch (targetType) {
            case "video", "workflow", "prompt" -> isPublishedContentVisible(targetType, targetId);
            case "comment" -> isCommentVisible(targetId);
            case "post" -> isDiscussionThreadVisible(targetId);
            default -> false;
        };

        if (!exists) {
            throw new IllegalArgumentException("favorite".equals(actionType) ? "INTERACTION_TARGET_NOT_FOUND" : "INTERACTION_TARGET_NOT_FOUND");
        }
    }

    private boolean isPublishedContentVisible(String targetType, UUID targetId) {
        String tableName = switch (targetType) {
            case "video" -> "videos";
            case "workflow" -> "workflows";
            case "prompt" -> "prompt_entries";
            default -> throw new IllegalArgumentException("INTERACTION_TARGET_NOT_FOUND");
        };
        Boolean exists = jdbcTemplate.queryForObject(
                "select exists(select 1 from " + tableName + " where id = ? and publish_status = 'published' and deleted_at is null)",
                Boolean.class,
                targetId
        );
        return Boolean.TRUE.equals(exists);
    }

    private boolean isCommentVisible(UUID commentId) {
        Boolean exists = jdbcTemplate.queryForObject(
                "select exists(select 1 from comments where id = ? and status_code = 'active' and deleted_at is null)",
                Boolean.class,
                commentId
        );
        return Boolean.TRUE.equals(exists);
    }

    private boolean isDiscussionThreadVisible(UUID threadId) {
        Boolean exists = jdbcTemplate.queryForObject(
                "select exists(select 1 from discussion_threads where id = ? and publish_status = 'published' and deleted_at is null)",
                Boolean.class,
                threadId
        );
        return Boolean.TRUE.equals(exists);
    }

    private ParentComment loadParentComment(UUID parentId, String targetType, UUID targetId) {
        ParentComment parentComment = jdbcTemplate.query("""
                select id, root_id
                from comments
                where id = ?
                  and target_type = ?
                  and target_id = ?
                  and status_code = 'active'
                  and deleted_at is null
                """,
                resultSet -> resultSet.next()
                        ? new ParentComment(
                                (UUID) resultSet.getObject("id"),
                                (UUID) resultSet.getObject("root_id")
                        )
                        : null,
                parentId,
                targetType,
                targetId
        );

        if (parentComment == null) {
            throw new IllegalArgumentException("COMMENT_TARGET_NOT_FOUND");
        }
        return parentComment;
    }

    private boolean upsertInteractionAction(UUID actorId, String actionType, String targetType, UUID targetId, boolean active) {
        String nextStatus = active ? "active" : "inactive";
        String currentStatus = jdbcTemplate.query("""
                select status_code
                from interaction_actions
                where actor_id = ?
                  and action_type = ?
                  and target_type = ?
                  and target_id = ?
                """,
                resultSet -> resultSet.next() ? resultSet.getString("status_code") : null,
                actorId,
                actionType,
                targetType,
                targetId
        );

        if (nextStatus.equals(currentStatus)) {
            return false;
        }

        jdbcTemplate.update("""
                insert into interaction_actions (
                    id, actor_id, action_type, target_type, target_id, status_code, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, ?, now(), now())
                on conflict (actor_id, action_type, target_type, target_id) do update
                set status_code = excluded.status_code,
                    updated_at = now()
                """,
                UUID.randomUUID(),
                actorId,
                actionType,
                targetType,
                targetId,
                nextStatus
        );

        return true;
    }

    private boolean upsertFollowRelation(UUID followerId, UUID followeeId, boolean active) {
        String nextStatus = active ? "active" : "inactive";
        String currentStatus = jdbcTemplate.query("""
                select status_code
                from follow_relations
                where follower_id = ? and followee_id = ?
                """,
                resultSet -> resultSet.next() ? resultSet.getString("status_code") : null,
                followerId,
                followeeId
        );

        if (nextStatus.equals(currentStatus)) {
            return false;
        }

        jdbcTemplate.update("""
                insert into follow_relations (
                    id, follower_id, followee_id, status_code, created_at, updated_at
                )
                values (?, ?, ?, ?, now(), now())
                on conflict (follower_id, followee_id) do update
                set status_code = excluded.status_code,
                    updated_at = now()
                """,
                UUID.randomUUID(),
                followerId,
                followeeId,
                nextStatus
        );

        return true;
    }

    private void syncReplyCount(UUID commentId) {
        jdbcTemplate.update("""
                update comments parent
                set reply_count = (
                        select count(*)
                        from comments child
                        where child.parent_id = parent.id
                          and child.status_code = 'active'
                          and child.deleted_at is null
                    ),
                    updated_at = now()
                where parent.id = ?
                """,
                commentId
        );
    }

    private void syncCommentCount(String targetType, UUID targetId) {
        if ("post".equals(targetType)) {
            jdbcTemplate.update("""
                    update discussion_threads target
                    set reply_count = (
                            select count(*)
                            from comments comment
                            where comment.target_type = ?
                              and comment.target_id = target.id
                              and comment.status_code = 'active'
                              and comment.deleted_at is null
                        ),
                        last_activity_at = coalesce(
                            (
                                select max(comment.created_at)
                                from comments comment
                                where comment.target_type = ?
                                  and comment.target_id = target.id
                                  and comment.status_code = 'active'
                                  and comment.deleted_at is null
                            ),
                            target.published_at,
                            now()
                        ),
                        updated_at = now()
                    where target.id = ?
                    """,
                    targetType,
                    targetType,
                    targetId
            );
            return;
        }

        String tableName = switch (targetType) {
            case "video" -> "videos";
            case "workflow" -> "workflows";
            case "prompt" -> "prompt_entries";
            default -> throw new IllegalArgumentException("COMMENT_TARGET_NOT_FOUND");
        };
        jdbcTemplate.update("""
                update %s target
                set comment_count = (
                        select count(*)
                        from comments comment
                        where comment.target_type = ?
                          and comment.target_id = target.id
                          and comment.status_code = 'active'
                          and comment.deleted_at is null
                    ),
                    updated_at = now()
                where target.id = ?
                """.formatted(tableName),
                targetType,
                targetId
        );
    }

    private void syncLikeCount(String targetType, UUID targetId) {
        String tableName = switch (targetType) {
            case "video" -> "videos";
            case "workflow" -> "workflows";
            case "prompt" -> "prompt_entries";
            case "comment" -> "comments";
            case "post" -> "discussion_threads";
            default -> throw new IllegalArgumentException("INTERACTION_TARGET_NOT_FOUND");
        };

        jdbcTemplate.update("""
                update %s target
                set like_count = (
                        select count(*)
                        from interaction_actions action
                        where action.action_type = 'like'
                          and action.target_type = ?
                          and action.target_id = target.id
                          and action.status_code = 'active'
                    ),
                    updated_at = now()
                where target.id = ?
                """.formatted(tableName),
                targetType,
                targetId
        );
    }

    private void syncFavoriteCount(String targetType, UUID targetId) {
        String tableName = switch (targetType) {
            case "video" -> "videos";
            case "workflow" -> "workflows";
            case "prompt" -> "prompt_entries";
            case "post" -> "discussion_threads";
            default -> throw new IllegalArgumentException("INTERACTION_TARGET_NOT_FOUND");
        };

        jdbcTemplate.update("""
                update %s target
                set favorite_count = (
                        select count(*)
                        from interaction_actions action
                        where action.action_type = 'favorite'
                          and action.target_type = ?
                          and action.target_id = target.id
                          and action.status_code = 'active'
                    ),
                    updated_at = now()
                where target.id = ?
                """.formatted(tableName),
                targetType,
                targetId
        );
    }

    private void syncFollowerCount(UUID followeeId) {
        jdbcTemplate.update("""
                update creator_profiles profile
                set follower_count = (
                        select count(*)
                        from follow_relations relation
                        where relation.followee_id = profile.user_id
                          and relation.status_code = 'active'
                    ),
                    updated_at = now()
                where profile.user_id = ?
                """,
                followeeId
        );
    }

    private void ensureFolloweeExists(UUID followeeId) {
        Boolean exists = jdbcTemplate.queryForObject(
                "select exists(select 1 from users where id = ? and deleted_at is null)",
                Boolean.class,
                followeeId
        );
        if (!Boolean.TRUE.equals(exists)) {
            throw new IllegalArgumentException("FOLLOW_TARGET_NOT_FOUND");
        }
    }

    private void ensureCreatorProfileExists(CurrentUser user) {
        jdbcTemplate.update("""
                insert into creator_profiles (
                    user_id, headline, featured_status, created_at, updated_at
                )
                values (?, ?, ?, now(), now())
                on conflict (user_id) do update
                set headline = excluded.headline,
                    updated_at = now()
                """,
                user.id(),
                user.headline(),
                "normal"
        );
    }

    private UUID optionalViewerId() {
        CurrentUser currentUser = CurrentUserContext.currentOrNull();
        return currentUser == null ? null : currentUser.id();
    }

    private record ParentComment(
            UUID id,
            UUID rootId
    ) {
    }
}
