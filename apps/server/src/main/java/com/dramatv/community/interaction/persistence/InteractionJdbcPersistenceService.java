package com.dramatv.community.interaction.persistence;

import com.dramatv.community.interaction.dto.request.CreateCommentRequest;
import com.dramatv.community.interaction.dto.request.CommentTargetSettingsRequest;
import com.dramatv.community.interaction.dto.request.FollowRequest;
import com.dramatv.community.interaction.dto.request.TargetActionRequest;
import com.dramatv.community.interaction.dto.response.ActionStateResponse;
import com.dramatv.community.interaction.dto.response.CommentResponse;
import com.dramatv.community.interaction.dto.response.CommentTargetSettingsResponse;
import com.dramatv.community.interaction.moderation.CommentModerationService;
import com.dramatv.community.interaction.moderation.CommentModerationService.CommentModerationDecision;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserContext;
import com.dramatv.community.identity.application.CurrentUserService;
import com.dramatv.community.shared.media.JdbcMediaUrlResolver;
import com.dramatv.community.shared.request.MdcBusinessContextScope;
import com.dramatv.community.shared.response.CursorPageResponse;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InteractionJdbcPersistenceService {

    private static final Logger log = LoggerFactory.getLogger(InteractionJdbcPersistenceService.class);
    private static final int COMMENT_ROOT_PAGE_SIZE = 10;

    private final JdbcTemplate jdbcTemplate;
    private final CurrentUserService currentUserService;
    private final JdbcMediaUrlResolver jdbcMediaUrlResolver;
    private final CommentModerationService commentModerationService;

    public InteractionJdbcPersistenceService(
            JdbcTemplate jdbcTemplate,
            CurrentUserService currentUserService,
            JdbcMediaUrlResolver jdbcMediaUrlResolver,
            CommentModerationService commentModerationService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.currentUserService = currentUserService;
        this.jdbcMediaUrlResolver = jdbcMediaUrlResolver;
        this.commentModerationService = commentModerationService;
    }

    public CursorPageResponse<CommentResponse> listComments(String targetType, String targetId, String cursor) {
        UUID parsedTargetId = requireTargetId(targetId);
        String normalizedTargetType = normalizeCommentTargetType(targetType);
        CurrentUser viewer = CurrentUserContext.currentOrNull();
        UUID viewerId = viewer == null ? null : viewer.id();
        TargetCommentState targetState = loadCommentTargetState(normalizedTargetType, parsedTargetId);
        boolean canManageTarget = canManageTargetComments(viewer, targetState.authorId());

        CommentCursor parsedCursor = parseCommentCursor(cursor);
        List<RootCommentSliceRow> rootRows = loadRootCommentSlice(
                normalizedTargetType,
                parsedTargetId,
                parsedCursor
        );

        boolean hasMore = rootRows.size() > COMMENT_ROOT_PAGE_SIZE;
        List<RootCommentSliceRow> pageRoots = hasMore ? rootRows.subList(0, COMMENT_ROOT_PAGE_SIZE) : rootRows;
        if (pageRoots.isEmpty()) {
            return new CursorPageResponse<>(List.of(), null, false);
        }

        String nextCursor = null;
        if (hasMore) {
            RootCommentSliceRow lastRoot = pageRoots.get(pageRoots.size() - 1);
            nextCursor = encodeCommentCursor(lastRoot.createdAt(), lastRoot.id());
        }

        List<UUID> rootIds = pageRoots.stream()
                .map(RootCommentSliceRow::id)
                .toList();
        List<CommentRow> rows = loadCommentRowsForRoots(
                normalizedTargetType,
                parsedTargetId,
                rootIds,
                viewerId,
                canManageTarget
        );

        List<CommentResponse> items = buildCommentTree(rows);
        return new CursorPageResponse<>(items, nextCursor, hasMore);
    }

    @Transactional
    public CommentResponse createComment(CreateCommentRequest request) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        ensureCreatorProfileExists(currentUser);

        String normalizedTargetType = normalizeCommentTargetType(request.targetType());
        UUID parsedTargetId = requireTargetId(request.targetId());
        UUID parentId = parseUuid(request.parentId());
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(targetContext(normalizedTargetType, parsedTargetId))) {

            TargetCommentState targetState = loadCommentTargetState(normalizedTargetType, parsedTargetId);
            if (!targetState.commentsEnabled()) {
                throw new IllegalArgumentException("COMMENT_DISABLED");
            }

            ParentComment parentComment = parentId == null ? null : loadParentComment(parentId, normalizedTargetType, parsedTargetId);
            CommentPlacement placement = resolveCommentPlacement(parentComment);

            UUID commentId = UUID.randomUUID();
            String content = normalizeCommentContent(request.content());
            CommentModerationDecision moderationDecision = commentModerationService.moderate(
                    currentUser.id(),
                    normalizedTargetType,
                    parsedTargetId,
                    content
            );

            jdbcTemplate.update("""
                    insert into comments (
                        id, target_type, target_id, author_id, parent_id, root_id, reply_to_comment_id, content_text,
                        status_code, reply_count, like_count, created_at, updated_at
                    )
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, now(), now())
                    """,
                    commentId,
                    normalizedTargetType,
                    parsedTargetId,
                    currentUser.id(),
                    placement.parentId(),
                    placement.rootId(),
                    placement.replyToCommentId(),
                    content,
                    moderationDecision.statusCode()
            );

            if (parentComment != null) {
                syncReplyCount(placement.parentId());
            }
            syncCommentCount(normalizedTargetType, parsedTargetId);
            try (MdcBusinessContextScope commentScope = MdcBusinessContextScope.open(commentContext(commentId))) {
                log.info(
                        "comment create success: authorId={} targetType={} targetId={} commentId={} parentId={} rootId={} replyToCommentId={} statusCode={} hiddenByModeration={} contentLength={}",
                        currentUser.id(),
                        normalizedTargetType,
                        parsedTargetId,
                        commentId,
                        placement.parentId(),
                        placement.rootId(),
                        placement.replyToCommentId(),
                        moderationDecision.statusCode(),
                        moderationDecision.hidden(),
                        content.length()
                );
            }

            return jdbcTemplate.query("""
                    select
                        comment.id,
                        comment.parent_id,
                        comment.root_id,
                        comment.reply_to_comment_id,
                        coalesce(
                            comment.reply_to_comment_id,
                            case
                                when comment.root_id is not null
                                 and comment.parent_id is not null
                                 and comment.parent_id <> comment.root_id
                                then comment.parent_id
                                else null
                            end
                        ) as effective_reply_to_comment_id,
                        comment.author_id,
                        author.display_name as author_display_name,
                        coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                        author_avatar_asset.storage_provider as author_avatar_storage_provider,
                        author_avatar_asset.bucket_name as author_avatar_bucket_name,
                        reply_to_author.id as reply_to_author_id,
                        reply_to_author.display_name as reply_to_author_display_name,
                        coalesce(reply_to_author_avatar_asset.object_key, reply_to_author.avatar_url) as reply_to_author_avatar_url,
                        reply_to_author_avatar_asset.storage_provider as reply_to_author_avatar_storage_provider,
                        reply_to_author_avatar_asset.bucket_name as reply_to_author_avatar_bucket_name,
                        comment.content_text,
                        comment.status_code,
                        comment.created_at,
                        comment.reply_count,
                        comment.like_count,
                        false as viewer_liked
                    from comments comment
                    join users author on author.id = comment.author_id
                    left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                    left join comments reply_to on reply_to.id = coalesce(
                        comment.reply_to_comment_id,
                        case
                            when comment.root_id is not null
                             and comment.parent_id is not null
                             and comment.parent_id <> comment.root_id
                            then comment.parent_id
                            else null
                        end
                    )
                    left join users reply_to_author on reply_to_author.id = reply_to.author_id
                    left join media_assets reply_to_author_avatar_asset
                        on reply_to_author_avatar_asset.id = reply_to_author.avatar_asset_id
                    where comment.id = ?
                    """,
                    resultSet -> resultSet.next() ? mapCommentRow(resultSet, currentUser.id(), true).toResponse(List.of()) : null,
                    commentId
            );
        }
    }

    @Transactional
    public CommentTargetSettingsResponse updateCommentTargetSettings(CommentTargetSettingsRequest request) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        String normalizedTargetType = normalizeCommentTargetType(request.targetType());
        UUID parsedTargetId = requireTargetId(request.targetId());
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(targetContext(normalizedTargetType, parsedTargetId))) {
            TargetCommentState targetState = loadCommentTargetState(normalizedTargetType, parsedTargetId);

            if (!canManageTargetComments(currentUser, targetState.authorId())) {
                throw new IllegalArgumentException("COMMENT_MANAGE_FORBIDDEN");
            }

            String tableName = commentTargetTable(normalizedTargetType);
            jdbcTemplate.update("""
                    update %s
                    set comments_enabled = ?,
                        updated_at = now()
                    where id = ?
                    """.formatted(tableName),
                    request.commentsEnabled(),
                    parsedTargetId
            );
            log.info(
                    "comment target settings update success: operatorId={} targetType={} targetId={} commentsEnabled={}",
                    currentUser.id(),
                    normalizedTargetType,
                    parsedTargetId,
                    request.commentsEnabled()
            );

            return new CommentTargetSettingsResponse(
                    normalizedTargetType,
                    parsedTargetId.toString(),
                    request.commentsEnabled(),
                    true
            );
        }
    }

    @Transactional
    public ActionStateResponse deleteComment(String commentId) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        UUID parsedCommentId = requireTargetId(commentId);
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(commentContext(parsedCommentId))) {

            CommentDeleteTarget deleteTarget = loadCommentDeleteTarget(parsedCommentId);
            if (deleteTarget == null) {
                throw new IllegalArgumentException("COMMENT_NOT_FOUND");
            }
            try (MdcBusinessContextScope targetScope = MdcBusinessContextScope.open(
                    targetContext(deleteTarget.targetType(), deleteTarget.targetId()))) {

                TargetCommentState targetState = loadCommentTargetState(deleteTarget.targetType(), deleteTarget.targetId());
                boolean canDelete = currentUser.id().equals(deleteTarget.authorId())
                        || canManageTargetComments(currentUser, targetState.authorId());
                if (!canDelete) {
                    throw new IllegalArgumentException("COMMENT_DELETE_FORBIDDEN");
                }

                jdbcTemplate.update("""
                        with recursive comment_tree as (
                            select id
                            from comments
                            where id = ?
                            union
                            select child.id
                            from comments child
                            join comment_tree parent on child.parent_id = parent.id
                                or child.reply_to_comment_id = parent.id
                            where child.deleted_at is null
                        )
                        update comments comment
                        set status_code = 'deleted',
                            deleted_at = coalesce(comment.deleted_at, now()),
                            updated_at = now()
                        where comment.id in (select id from comment_tree)
                        """,
                        parsedCommentId
                );

                if (deleteTarget.parentId() != null) {
                    syncReplyCount(deleteTarget.parentId());
                }
                syncCommentCount(deleteTarget.targetType(), deleteTarget.targetId());
                log.info(
                        "comment delete success: operatorId={} commentId={} authorId={} targetType={} targetId={} parentId={}",
                        currentUser.id(),
                        parsedCommentId,
                        deleteTarget.authorId(),
                        deleteTarget.targetType(),
                        deleteTarget.targetId(),
                        deleteTarget.parentId()
                );

                return new ActionStateResponse("delete", parsedCommentId.toString(), false);
            }
        }
    }

    @Transactional
    public ActionStateResponse like(TargetActionRequest request, boolean active) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        ensureCreatorProfileExists(currentUser);

        String normalizedTargetType = normalizeLikeTargetType(request.targetType());
        UUID parsedTargetId = requireTargetId(request.targetId());
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(targetContext(normalizedTargetType, parsedTargetId))) {

            ensureInteractionTargetExists("like", normalizedTargetType, parsedTargetId);
            boolean changed = upsertInteractionAction(currentUser.id(), "like", normalizedTargetType, parsedTargetId, active);
            if (changed) {
                syncLikeCount(normalizedTargetType, parsedTargetId);
                syncLikeReceivedCount(normalizedTargetType, parsedTargetId);
            }
            log.info(
                    "interaction like success: actorId={} targetType={} targetId={} active={} changed={}",
                    currentUser.id(),
                    normalizedTargetType,
                    parsedTargetId,
                    active,
                    changed
            );

            return new ActionStateResponse("like", parsedTargetId.toString(), active);
        }
    }

    @Transactional
    public ActionStateResponse favorite(TargetActionRequest request, boolean active) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        ensureCreatorProfileExists(currentUser);

        String normalizedTargetType = normalizeFavoriteTargetType(request.targetType());
        UUID parsedTargetId = requireTargetId(request.targetId());
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(targetContext(normalizedTargetType, parsedTargetId))) {

            ensureInteractionTargetExists("favorite", normalizedTargetType, parsedTargetId);
            boolean changed = upsertInteractionAction(currentUser.id(), "favorite", normalizedTargetType, parsedTargetId, active);
            if (changed) {
                syncFavoriteCount(normalizedTargetType, parsedTargetId);
            }
            log.info(
                    "interaction favorite success: actorId={} targetType={} targetId={} active={} changed={}",
                    currentUser.id(),
                    normalizedTargetType,
                    parsedTargetId,
                    active,
                    changed
            );

            return new ActionStateResponse("favorite", parsedTargetId.toString(), active);
        }
    }

    @Transactional
    public ActionStateResponse follow(FollowRequest request, boolean active) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        ensureCreatorProfileExists(currentUser);

        UUID followeeId = requireTargetId(request.followeeId());
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(followContext(followeeId))) {
            if (currentUser.id().equals(followeeId)) {
                throw new IllegalArgumentException("FOLLOW_SELF_FORBIDDEN");
            }
            ensureFolloweeExists(followeeId);

            boolean changed = upsertFollowRelation(currentUser.id(), followeeId, active);
            if (changed) {
                syncFollowerCount(followeeId);
            }
            log.info(
                    "interaction follow success: actorId={} followeeId={} active={} changed={}",
                    currentUser.id(),
                    followeeId,
                    active,
                    changed
            );

            return new ActionStateResponse("follow", followeeId.toString(), active);
        }
    }

    private List<CommentResponse> buildCommentTree(List<CommentRow> rows) {
        Map<UUID, CommentRow> rowsById = new LinkedHashMap<>();
        for (CommentRow row : rows) {
            rowsById.put(row.id(), row);
        }

        Map<UUID, List<CommentRow>> childrenByParent = new LinkedHashMap<>();
        List<CommentRow> rootRows = new ArrayList<>();

        for (CommentRow row : rows) {
            UUID displayParentId = resolveDisplayParentId(row, rowsById);
            if (displayParentId == null) {
                rootRows.add(row);
                continue;
            }

            childrenByParent.computeIfAbsent(displayParentId, ignored -> new ArrayList<>()).add(row);
        }

        for (List<CommentRow> children : childrenByParent.values()) {
            children.sort((left, right) -> {
                int createdAtCompare = left.createdAt().compareTo(right.createdAt());
                if (createdAtCompare != 0) {
                    return createdAtCompare;
                }
                return left.id().compareTo(right.id());
            });
        }

        return rootRows.stream()
                .map(row -> toCommentResponse(row, childrenByParent))
                .toList();
    }

    private UUID resolveDisplayParentId(CommentRow row, Map<UUID, CommentRow> rowsById) {
        if (row.parentId() == null) {
            return null;
        }

        if (row.rootId() == null || row.parentId().equals(row.rootId())) {
            return row.parentId();
        }

        CommentRow storedParent = rowsById.get(row.parentId());
        if (storedParent == null) {
            return row.rootId();
        }

        return storedParent.parentId() == null ? storedParent.id() : row.rootId();
    }

    private CommentResponse toCommentResponse(CommentRow row, Map<UUID, List<CommentRow>> childrenByParent) {
        List<CommentResponse> replies = childrenByParent.getOrDefault(row.id(), List.of()).stream()
                .map(child -> child.toResponse(List.of()))
                .toList();
        int replyCount = replies.size();

        return row.toResponse(replies, replyCount);
    }

    private List<RootCommentSliceRow> loadRootCommentSlice(
            String targetType,
            UUID targetId,
            CommentCursor cursor
    ) {
        if (cursor == null) {
            return jdbcTemplate.query("""
                    select
                        comment.id,
                        comment.created_at
                    from comments comment
                    where comment.target_type = ?
                      and comment.target_id = ?
                      and comment.parent_id is null
                      and comment.status_code = 'active'
                      and comment.deleted_at is null
                    order by comment.created_at asc, comment.id asc
                    limit ?
                    """,
                    (resultSet, rowNum) -> new RootCommentSliceRow(
                            (UUID) resultSet.getObject("id"),
                            resultSet.getObject("created_at", OffsetDateTime.class)
                    ),
                    targetType,
                    targetId,
                    COMMENT_ROOT_PAGE_SIZE + 1
            );
        }

        return jdbcTemplate.query("""
                select
                    comment.id,
                    comment.created_at
                from comments comment
                where comment.target_type = ?
                  and comment.target_id = ?
                  and comment.parent_id is null
                  and comment.status_code = 'active'
                  and comment.deleted_at is null
                  and (
                        comment.created_at > ?
                        or (comment.created_at = ? and comment.id > ?)
                  )
                order by comment.created_at asc, comment.id asc
                limit ?
                """,
                (resultSet, rowNum) -> new RootCommentSliceRow(
                        (UUID) resultSet.getObject("id"),
                        resultSet.getObject("created_at", OffsetDateTime.class)
                ),
                targetType,
                targetId,
                cursor.createdAt(),
                cursor.createdAt(),
                cursor.id(),
                COMMENT_ROOT_PAGE_SIZE + 1
        );
    }

    private List<CommentRow> loadCommentRowsForRoots(
            String targetType,
            UUID targetId,
            List<UUID> rootIds,
            UUID viewerId,
            boolean canManageTarget
    ) {
        if (rootIds.isEmpty()) {
            return List.of();
        }

        String placeholders = String.join(", ", Collections.nCopies(rootIds.size(), "?"));
        List<Object> params = new ArrayList<>();
        params.add(viewerId);
        params.add(targetType);
        params.add(targetId);
        params.addAll(rootIds);
        params.addAll(rootIds);

        return jdbcTemplate.query("""
                select
                    comment.id,
                    comment.parent_id,
                    comment.root_id,
                    comment.reply_to_comment_id,
                    coalesce(
                        comment.reply_to_comment_id,
                        case
                            when comment.root_id is not null
                             and comment.parent_id is not null
                             and comment.parent_id <> comment.root_id
                            then comment.parent_id
                            else null
                        end
                    ) as effective_reply_to_comment_id,
                    comment.author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    reply_to_author.id as reply_to_author_id,
                    reply_to_author.display_name as reply_to_author_display_name,
                    coalesce(reply_to_author_avatar_asset.object_key, reply_to_author.avatar_url) as reply_to_author_avatar_url,
                    reply_to_author_avatar_asset.storage_provider as reply_to_author_avatar_storage_provider,
                    reply_to_author_avatar_asset.bucket_name as reply_to_author_avatar_bucket_name,
                    comment.content_text,
                    comment.status_code,
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
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join comments reply_to on reply_to.id = coalesce(
                    comment.reply_to_comment_id,
                    case
                        when comment.root_id is not null
                         and comment.parent_id is not null
                         and comment.parent_id <> comment.root_id
                        then comment.parent_id
                        else null
                    end
                )
                left join users reply_to_author on reply_to_author.id = reply_to.author_id
                left join media_assets reply_to_author_avatar_asset
                    on reply_to_author_avatar_asset.id = reply_to_author.avatar_asset_id
                where comment.target_type = ?
                  and comment.target_id = ?
                  and comment.status_code = 'active'
                  and comment.deleted_at is null
                  and (
                        comment.id in (%s)
                        or comment.parent_id in (%s)
                  )
                order by comment.created_at asc, comment.id asc
                """.formatted(placeholders, placeholders),
                (resultSet, rowNum) -> mapCommentRow(resultSet, viewerId, canManageTarget),
                params.toArray()
        );
    }

    private CommentRow mapCommentRow(ResultSet resultSet, UUID viewerId, boolean canManageTarget) throws SQLException {
        UUID authorId = (UUID) resultSet.getObject("author_id");
        UUID replyToAuthorId = (UUID) resultSet.getObject("reply_to_author_id");
        return new CommentRow(
                (UUID) resultSet.getObject("id"),
                (UUID) resultSet.getObject("parent_id"),
                (UUID) resultSet.getObject("root_id"),
                new CommentResponse.Author(
                        authorId.toString(),
                        resultSet.getString("author_display_name"),
                        jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url")
                ),
                replyToAuthorId == null ? null : new CommentResponse.ReplyTarget(
                        ((UUID) resultSet.getObject("effective_reply_to_comment_id")).toString(),
                        new CommentResponse.Author(
                                replyToAuthorId.toString(),
                                resultSet.getString("reply_to_author_display_name"),
                                jdbcMediaUrlResolver.resolve(resultSet, "reply_to_author_avatar_url")
                        )
                ),
                resultSet.getString("content_text"),
                resultSet.getString("status_code"),
                resultSet.getObject("created_at", OffsetDateTime.class),
                resultSet.getInt("like_count"),
                resultSet.getBoolean("viewer_liked"),
                viewerId != null && (viewerId.equals(authorId) || canManageTarget)
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

    private CommentCursor parseCommentCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }

        String[] parts = cursor.trim().split("\\|", 2);
        if (parts.length != 2) {
            throw new IllegalArgumentException("COMMENT_CURSOR_INVALID");
        }

        try {
            return new CommentCursor(
                    OffsetDateTime.parse(parts[0]),
                    UUID.fromString(parts[1])
            );
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException("COMMENT_CURSOR_INVALID");
        }
    }

    private String encodeCommentCursor(OffsetDateTime createdAt, UUID id) {
        return createdAt.toString() + "|" + id;
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

    private TargetCommentState loadCommentTargetState(String targetType, UUID targetId) {
        String tableName = commentTargetTable(targetType);
        TargetCommentState state = jdbcTemplate.query("""
                select author_id, comments_enabled
                from %s
                where id = ?
                  and publish_status = 'published'
                  and deleted_at is null
                """.formatted(tableName),
                resultSet -> resultSet.next()
                        ? new TargetCommentState(
                                (UUID) resultSet.getObject("author_id"),
                                resultSet.getBoolean("comments_enabled")
                        )
                        : null,
                targetId
        );

        if (state == null) {
            throw new IllegalArgumentException("COMMENT_TARGET_NOT_FOUND");
        }
        return state;
    }

    private String commentTargetTable(String targetType) {
        return switch (targetType) {
            case "video" -> "videos";
            case "workflow" -> "workflows";
            case "prompt" -> "prompt_entries";
            case "post" -> "discussion_threads";
            default -> throw new IllegalArgumentException("COMMENT_TARGET_NOT_FOUND");
        };
    }

    private boolean canManageTargetComments(CurrentUser currentUser, UUID authorId) {
        if (currentUser == null) {
            return false;
        }

        if (currentUser.id().equals(authorId)) {
            return true;
        }

        String roleCode = currentUser.roleCode() == null ? "" : currentUser.roleCode().toLowerCase(Locale.ROOT);
        return "admin".equals(roleCode) || "operator".equals(roleCode) || "moderator".equals(roleCode);
    }

    private CommentDeleteTarget loadCommentDeleteTarget(UUID commentId) {
        return jdbcTemplate.query("""
                select id, target_type, target_id, author_id, parent_id
                from comments
                where id = ?
                  and status_code <> 'deleted'
                  and deleted_at is null
                """,
                resultSet -> resultSet.next()
                        ? new CommentDeleteTarget(
                                (UUID) resultSet.getObject("id"),
                                resultSet.getString("target_type"),
                                (UUID) resultSet.getObject("target_id"),
                                (UUID) resultSet.getObject("author_id"),
                                (UUID) resultSet.getObject("parent_id")
                        )
                        : null,
                commentId
        );
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
                select id, parent_id, root_id
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
                                (UUID) resultSet.getObject("parent_id"),
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

    private CommentPlacement resolveCommentPlacement(ParentComment parentComment) {
        if (parentComment == null) {
            return new CommentPlacement(null, null, null);
        }

        if (parentComment.isRoot()) {
            return new CommentPlacement(
                    parentComment.id(),
                    parentComment.id(),
                    parentComment.id()
            );
        }

        UUID rootId = parentComment.requireRootId();
        return new CommentPlacement(
                rootId,
                rootId,
                parentComment.id()
        );
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

    private void syncLikeReceivedCount(String targetType, UUID targetId) {
        UUID authorId = findLikeTargetAuthorId(targetType, targetId);
        if (authorId == null) {
            return;
        }

        jdbcTemplate.update("""
                insert into creator_profiles (
                    user_id, featured_status, created_at, updated_at
                )
                values (?, 'normal', now(), now())
                on conflict (user_id) do nothing
                """,
                authorId
        );

        jdbcTemplate.update("""
                update creator_profiles profile
                set like_received_count = (
                        select coalesce(sum(source.like_count), 0)
                        from (
                            select video.like_count
                            from videos video
                            where video.author_id = profile.user_id
                              and video.publish_status = 'published'
                              and video.deleted_at is null
                            union all
                            select workflow.like_count
                            from workflows workflow
                            where workflow.author_id = profile.user_id
                              and workflow.publish_status = 'published'
                              and workflow.deleted_at is null
                            union all
                            select prompt.like_count
                            from prompt_entries prompt
                            where prompt.author_id = profile.user_id
                              and prompt.publish_status = 'published'
                              and prompt.deleted_at is null
                            union all
                            select thread.like_count
                            from discussion_threads thread
                            where thread.author_id = profile.user_id
                              and thread.publish_status = 'published'
                              and thread.deleted_at is null
                        ) source
                    ),
                    updated_at = now()
                where profile.user_id = ?
                """,
                authorId
        );
    }

    private UUID findLikeTargetAuthorId(String targetType, UUID targetId) {
        String tableName = switch (targetType) {
            case "video" -> "videos";
            case "workflow" -> "workflows";
            case "prompt" -> "prompt_entries";
            case "post" -> "discussion_threads";
            default -> null;
        };

        if (tableName == null) {
            return null;
        }

        return jdbcTemplate.query(
                "select author_id from " + tableName + " where id = ?",
                resultSet -> resultSet.next() ? (UUID) resultSet.getObject("author_id") : null,
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

    private Map<String, String> targetContext(String targetType, UUID targetId) {
        LinkedHashMap<String, String> context = new LinkedHashMap<>();
        context.put("targetType", targetType);
        context.put("targetId", targetId.toString());
        return context;
    }

    private Map<String, String> commentContext(UUID commentId) {
        LinkedHashMap<String, String> context = new LinkedHashMap<>();
        context.put("commentId", commentId.toString());
        return context;
    }

    private Map<String, String> followContext(UUID followeeId) {
        LinkedHashMap<String, String> context = new LinkedHashMap<>();
        context.put("managedUserId", followeeId.toString());
        return context;
    }

    private UUID optionalViewerId() {
        CurrentUser currentUser = CurrentUserContext.currentOrNull();
        return currentUser == null ? null : currentUser.id();
    }

    private record ParentComment(
            UUID id,
            UUID parentId,
            UUID rootId
    ) {
        private boolean isRoot() {
            return parentId == null;
        }

        private UUID requireRootId() {
            return rootId == null ? id : rootId;
        }
    }

    private record CommentPlacement(
            UUID parentId,
            UUID rootId,
            UUID replyToCommentId
    ) {
    }

    private record TargetCommentState(
            UUID authorId,
            boolean commentsEnabled
    ) {
    }

    private record CommentDeleteTarget(
            UUID id,
            String targetType,
            UUID targetId,
            UUID authorId,
            UUID parentId
    ) {
    }

    private record CommentCursor(
            OffsetDateTime createdAt,
            UUID id
    ) {
    }

    private record RootCommentSliceRow(
            UUID id,
            OffsetDateTime createdAt
    ) {
    }

    private record CommentRow(
            UUID id,
            UUID parentId,
            UUID rootId,
            CommentResponse.Author author,
            CommentResponse.ReplyTarget replyTarget,
            String content,
            String statusCode,
            OffsetDateTime createdAt,
            int likeCount,
            boolean viewerLiked,
            boolean viewerCanDelete
    ) {
        private CommentResponse toResponse(List<CommentResponse> replies) {
            return toResponse(replies, replies.size());
        }

        private CommentResponse toResponse(List<CommentResponse> replies, int replyCount) {
            return new CommentResponse(
                    id.toString(),
                    parentId == null ? null : parentId.toString(),
                    author,
                    replyTarget,
                    content,
                    createdAt.toString(),
                    replyCount,
                    likeCount,
                    new CommentResponse.ViewerActions(viewerLiked, viewerCanDelete),
                    statusCode,
                    replies
            );
        }
    }
}
