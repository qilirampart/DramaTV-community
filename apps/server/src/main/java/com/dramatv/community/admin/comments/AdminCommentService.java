package com.dramatv.community.admin.comments;

import com.dramatv.community.admin.auditlogs.AdminAuditLogService;
import com.dramatv.community.admin.auth.AdminAccessService;
import com.dramatv.community.admin.comments.dto.response.AdminCommentListResponse;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.interaction.application.InteractionApplicationService;
import com.dramatv.community.interaction.dto.request.CommentTargetSettingsRequest;
import com.dramatv.community.interaction.dto.response.ActionStateResponse;
import com.dramatv.community.interaction.dto.response.CommentTargetSettingsResponse;
import com.dramatv.community.shared.media.JdbcMediaUrlResolver;
import com.dramatv.community.shared.request.MdcBusinessContextScope;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminCommentService {

    private static final Logger log = LoggerFactory.getLogger(AdminCommentService.class);
    private static final int DEFAULT_LIMIT = 80;
    private static final String[] MANAGE_ROLES = {"admin", "moderator"};
    private static final String FILTERED_COMMENT_ROWS_CTE = """
            with report_stats as (
                select
                    ticket.target_id as comment_id,
                    count(*) as report_count,
                    count(*) filter (where ticket.status_code in ('pending', 'processing')) as open_report_count,
                    max(ticket.created_at) as latest_report_at,
                    (array_agg(ticket.reason_code order by ticket.created_at desc))[1] as latest_reason_code
                from report_tickets ticket
                where ticket.target_type = 'comment'
                group by ticket.target_id
            ),
            comment_rows as (
                select
                    comment.id,
                    comment.target_type,
                    comment.target_id,
                    comment.parent_id,
                    comment.author_id,
                    author.display_name as author_display_name,
                    coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                    author_avatar_asset.storage_provider as author_avatar_storage_provider,
                    author_avatar_asset.bucket_name as author_avatar_bucket_name,
                    comment.content_text,
                    comment.status_code,
                    comment.created_at,
                    parent_author.display_name as parent_author_display_name,
                    parent.content_text as parent_content_text,
                    coalesce(video.title, workflow.title, prompt.title, thread.title, '已删除内容') as target_title,
                    prompt.modality as target_prompt_modality,
                    coalesce(video.comments_enabled, workflow.comments_enabled, prompt.comments_enabled, thread.comments_enabled, true) as target_comments_enabled,
                    coalesce(report_stats.report_count, 0) as report_count,
                    coalesce(report_stats.open_report_count, 0) as open_report_count,
                    report_stats.latest_report_at,
                    report_stats.latest_reason_code,
                    case
                        when comment.status_code = 'hidden' then 'high'
                        when coalesce(report_stats.open_report_count, 0) > 0 then 'high'
                        when coalesce(report_stats.report_count, 0) > 0 then 'suspect'
                        else 'normal'
                    end as risk_level
                from comments comment
                join users author on author.id = comment.author_id
                left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
                left join comments parent on parent.id = comment.parent_id
                left join users parent_author on parent_author.id = parent.author_id
                left join videos video on comment.target_type = 'video' and video.id = comment.target_id
                left join workflows workflow on comment.target_type = 'workflow' and workflow.id = comment.target_id
                left join prompt_entries prompt on comment.target_type = 'prompt' and prompt.id = comment.target_id
                left join discussion_threads thread on comment.target_type = 'post' and thread.id = comment.target_id
                left join report_stats on report_stats.comment_id = comment.id
                where (
                        cast(? as varchar) is null
                        or author.username ilike ?
                        or author.display_name ilike ?
                        or comment.content_text ilike ?
                        or coalesce(video.title, workflow.title, prompt.title, thread.title, '') ilike ?
                    )
                  and (cast(? as varchar) is null or comment.target_type = cast(? as varchar))
                  and (cast(? as varchar) is null or comment.status_code = cast(? as varchar))
                  and (? = false or coalesce(report_stats.open_report_count, 0) > 0)
            )
            """;
    private static final String SUMMARY_SQL = FILTERED_COMMENT_ROWS_CTE + """
            select
                count(*) filter (
                    where created_at >= date_trunc('day', now())
                ) as today_comments,
                count(*) filter (
                    where open_report_count > 0
                ) as reported_comments,
                count(*) filter (
                    where status_code = 'hidden'
                ) as hidden_comments,
                count(distinct case
                    when target_comments_enabled = false then target_type || ':' || target_id::text
                    else null
                end) as closed_targets
            from comment_rows
            """;
    private static final String ITEMS_SQL = FILTERED_COMMENT_ROWS_CTE + """
            select
                id,
                target_type,
                target_id,
                target_title,
                target_prompt_modality,
                target_comments_enabled,
                author_id,
                author_display_name,
                author_avatar_url,
                author_avatar_storage_provider,
                author_avatar_bucket_name,
                content_text,
                parent_id,
                parent_author_display_name,
                parent_content_text,
                status_code,
                created_at,
                report_count,
                open_report_count,
                latest_reason_code as latest_report_reason_code,
                risk_level
            from comment_rows
            order by
                case
                    when open_report_count > 0 then 0
                    when status_code = 'hidden' then 1
                    else 2
                end,
                created_at desc,
                id desc
            limit ?
            """;

    private final JdbcTemplate jdbcTemplate;
    private final JdbcMediaUrlResolver jdbcMediaUrlResolver;
    private final AdminAccessService adminAccessService;
    private final AdminAuditLogService adminAuditLogService;
    private final InteractionApplicationService interactionApplicationService;

    public AdminCommentService(
            JdbcTemplate jdbcTemplate,
            JdbcMediaUrlResolver jdbcMediaUrlResolver,
            AdminAccessService adminAccessService,
            AdminAuditLogService adminAuditLogService,
            InteractionApplicationService interactionApplicationService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.jdbcMediaUrlResolver = jdbcMediaUrlResolver;
        this.adminAccessService = adminAccessService;
        this.adminAuditLogService = adminAuditLogService;
        this.interactionApplicationService = interactionApplicationService;
    }

    public AdminCommentListResponse listComments(
            String query,
            String status,
            String targetType,
            Boolean reportedOnly
    ) {
        adminAccessService.requireAnyRole(MANAGE_ROLES);

        String normalizedQuery = normalizeQuery(query);
        String likeQuery = normalizedQuery == null ? null : "%" + normalizedQuery + "%";
        FilterSpec filters = normalizeFilters(status, targetType, reportedOnly);

        AdminCommentListResponse.Summary summary = jdbcTemplate.queryForObject(
                SUMMARY_SQL,
                (resultSet, rowNum) -> new AdminCommentListResponse.Summary(
                        resultSet.getLong("today_comments"),
                        resultSet.getLong("reported_comments"),
                        resultSet.getLong("hidden_comments"),
                        resultSet.getLong("closed_targets")
                ),
                normalizedQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                filters.targetType(),
                filters.targetType(),
                filters.statusCode(),
                filters.statusCode(),
                filters.reportedOnly()
        );

        return new AdminCommentListResponse(
                summary == null ? new AdminCommentListResponse.Summary(0, 0, 0, 0) : summary,
                jdbcTemplate.query(
                        ITEMS_SQL,
                        (resultSet, rowNum) -> mapItem(resultSet),
                        normalizedQuery,
                        likeQuery,
                        likeQuery,
                        likeQuery,
                        likeQuery,
                        filters.targetType(),
                        filters.targetType(),
                        filters.statusCode(),
                        filters.statusCode(),
                        filters.reportedOnly(),
                        DEFAULT_LIMIT
                )
        );
    }

    @Transactional
    public ActionStateResponse hideComment(String commentId) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);
        ManagedComment target = requireManagedComment(commentId);
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(commentContext(target))) {
            if (target.deleted()) {
                log.warn(
                        "admin comment action rejected: action=hide operatorId={} commentId={} targetType={} targetId={} reason=deleted",
                        operator.id(),
                        target.id(),
                        target.targetType(),
                        target.targetId()
                );
                throw new IllegalArgumentException("COMMENT_HIDE_FORBIDDEN");
            }
            if ("hidden".equals(target.statusCode())) {
                log.info(
                        "admin comment action noop: action=hide operatorId={} commentId={} targetType={} targetId={} status=hidden",
                        operator.id(),
                        target.id(),
                        target.targetType(),
                        target.targetId()
                );
                return new ActionStateResponse("hide", target.id().toString(), false);
            }

            jdbcTemplate.update("""
                    update comments
                    set status_code = 'hidden',
                        updated_at = now()
                    where id = ?
                      and deleted_at is null
                    """,
                    target.id()
            );
            syncCommentAggregates(target);
            log.info(
                    "admin comment action success: action=hide operatorId={} commentId={} targetType={} targetId={} previousStatus={} nextStatus=hidden",
                    operator.id(),
                    target.id(),
                    target.targetType(),
                    target.targetId(),
                    target.statusCode()
            );
            adminAuditLogService.recordSuccessfulOperation(
                    operator,
                    "comments",
                    "评论治理",
                    "hide_comment",
                    "隐藏评论",
                    "comment",
                    target.id().toString(),
                    "评论 " + target.id(),
                    "sensitive",
                    "评论已隐藏",
                    "/api/admin/comments/" + target.id() + "/hide",
                    "POST",
                    "targetType=%s,targetId=%s".formatted(target.targetType(), target.targetId())
            );
            return new ActionStateResponse("hide", target.id().toString(), false);
        }
    }

    @Transactional
    public ActionStateResponse restoreComment(String commentId) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);
        ManagedComment target = requireManagedComment(commentId);
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(commentContext(target))) {
            if (target.deleted()) {
                log.warn(
                        "admin comment action rejected: action=restore operatorId={} commentId={} targetType={} targetId={} reason=deleted",
                        operator.id(),
                        target.id(),
                        target.targetType(),
                        target.targetId()
                );
                throw new IllegalArgumentException("COMMENT_RESTORE_FORBIDDEN");
            }
            if ("active".equals(target.statusCode())) {
                log.info(
                        "admin comment action noop: action=restore operatorId={} commentId={} targetType={} targetId={} status=active",
                        operator.id(),
                        target.id(),
                        target.targetType(),
                        target.targetId()
                );
                return new ActionStateResponse("restore", target.id().toString(), true);
            }

            jdbcTemplate.update("""
                    update comments
                    set status_code = 'active',
                        updated_at = now()
                    where id = ?
                      and deleted_at is null
                    """,
                    target.id()
            );
            syncCommentAggregates(target);
            log.info(
                    "admin comment action success: action=restore operatorId={} commentId={} targetType={} targetId={} previousStatus={} nextStatus=active",
                    operator.id(),
                    target.id(),
                    target.targetType(),
                    target.targetId(),
                    target.statusCode()
            );
            adminAuditLogService.recordSuccessfulOperation(
                    operator,
                    "comments",
                    "评论治理",
                    "restore_comment",
                    "恢复评论",
                    "comment",
                    target.id().toString(),
                    "评论 " + target.id(),
                    "normal",
                    "评论已恢复",
                    "/api/admin/comments/" + target.id() + "/restore",
                    "POST",
                    "targetType=%s,targetId=%s".formatted(target.targetType(), target.targetId())
            );
            return new ActionStateResponse("restore", target.id().toString(), true);
        }
    }

    @Transactional
    public ActionStateResponse deleteComment(String commentId) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);
        ManagedComment target = requireManagedComment(commentId);
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(commentContext(target))) {
            if (target.deleted()) {
                log.warn(
                        "admin comment action rejected: action=delete operatorId={} commentId={} targetType={} targetId={} reason=deleted",
                        operator.id(),
                        target.id(),
                        target.targetType(),
                        target.targetId()
                );
                throw new IllegalArgumentException("COMMENT_NOT_FOUND");
            }
            ActionStateResponse response = interactionApplicationService.deleteComment(commentId);
            log.info(
                    "admin comment action success: action=delete operatorId={} commentId={} targetType={} targetId={} previousStatus={} nextStatus=deleted",
                    operator.id(),
                    target.id(),
                    target.targetType(),
                    target.targetId(),
                    target.statusCode()
            );
            adminAuditLogService.recordSuccessfulOperation(
                    operator,
                    "comments",
                    "评论治理",
                    "delete_comment",
                    "删除评论",
                    "comment",
                    target.id().toString(),
                    "评论 " + target.id(),
                    "sensitive",
                    "评论已删除",
                    "/api/admin/comments/" + target.id(),
                    "DELETE",
                    "targetType=%s,targetId=%s".formatted(target.targetType(), target.targetId())
            );
            return response;
        }
    }

    @Transactional
    public CommentTargetSettingsResponse updateTargetSettings(
            String targetType,
            String targetId,
            boolean commentsEnabled
    ) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(targetContext(targetType, targetId))) {
            CommentTargetSettingsResponse response = interactionApplicationService.updateCommentTargetSettings(
                    new CommentTargetSettingsRequest(targetType, targetId, commentsEnabled)
            );
            log.info(
                    "admin comment target settings update success: operatorId={} targetType={} targetId={} commentsEnabled={}",
                    operator.id(),
                    targetType,
                    targetId,
                    commentsEnabled
            );
            adminAuditLogService.recordSuccessfulOperation(
                    operator,
                    "comments",
                    "评论治理",
                    "update_comment_settings",
                    "调整评论开关",
                    targetType,
                    targetId,
                    targetType + " 评论设置",
                    "sensitive",
                    commentsEnabled ? "评论开关已开启" : "评论开关已关闭",
                    "/api/admin/comments/targets/" + targetType + "/" + targetId + "/settings",
                    "PATCH",
                    "commentsEnabled=" + commentsEnabled
            );
            return response;
        }
    }

    private Map<String, String> commentContext(ManagedComment target) {
        return Map.of(
                "commentId", target.id().toString(),
                "targetType", target.targetType(),
                "targetId", target.targetId().toString()
        );
    }

    private Map<String, String> targetContext(String targetType, String targetId) {
        return Map.of(
                "targetType", targetType,
                "targetId", targetId
        );
    }

    private AdminCommentListResponse.Item mapItem(ResultSet resultSet) throws SQLException {
        return new AdminCommentListResponse.Item(
                resultSet.getObject("id", UUID.class).toString(),
                resultSet.getString("target_type"),
                resultSet.getObject("target_id", UUID.class).toString(),
                resultSet.getString("target_title"),
                nullableText(resultSet, "target_prompt_modality"),
                resultSet.getBoolean("target_comments_enabled"),
                resultSet.getObject("author_id", UUID.class).toString(),
                resultSet.getString("author_display_name"),
                jdbcMediaUrlResolver.resolve(resultSet, "author_avatar_url"),
                resultSet.getString("content_text"),
                nullableUuidText(resultSet, "parent_id"),
                nullableText(resultSet, "parent_author_display_name"),
                nullableText(resultSet, "parent_content_text"),
                resultSet.getString("status_code"),
                resultSet.getObject("created_at", OffsetDateTime.class),
                resultSet.getLong("report_count"),
                resultSet.getLong("open_report_count"),
                nullableText(resultSet, "latest_report_reason_code"),
                resultSet.getString("risk_level")
        );
    }

    private ManagedComment requireManagedComment(String commentId) {
        UUID parsedCommentId = parseRequiredUuid(commentId, "COMMENT_NOT_FOUND");
        ManagedComment target = jdbcTemplate.query("""
                select id, target_type, target_id, parent_id, status_code, deleted_at
                from comments
                where id = ?
                """,
                resultSet -> resultSet.next()
                        ? new ManagedComment(
                                resultSet.getObject("id", UUID.class),
                                resultSet.getString("target_type"),
                                resultSet.getObject("target_id", UUID.class),
                                (UUID) resultSet.getObject("parent_id"),
                                resultSet.getString("status_code"),
                                resultSet.getObject("deleted_at", OffsetDateTime.class) != null
                        )
                        : null,
                parsedCommentId
        );
        if (target == null) {
            throw new IllegalArgumentException("COMMENT_NOT_FOUND");
        }
        return target;
    }

    private void syncCommentAggregates(ManagedComment comment) {
        if (comment.parentId() != null) {
            syncReplyCount(comment.parentId());
        }
        syncCommentCount(comment.targetType(), comment.targetId());
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

    private FilterSpec normalizeFilters(String status, String targetType, Boolean reportedOnly) {
        String normalizedStatus = normalizeStatusFilter(status);
        String normalizedTargetType = normalizeTargetTypeFilter(targetType);
        boolean requireReported = Boolean.TRUE.equals(reportedOnly);

        if ("reported".equals(normalizedStatus)) {
            return new FilterSpec("active", normalizedTargetType, true);
        }

        return new FilterSpec(normalizedStatus, normalizedTargetType, requireReported);
    }

    private String normalizeStatusFilter(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        String normalized = status.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "active", "hidden", "deleted", "reported" -> normalized;
            default -> throw new IllegalArgumentException("ADMIN_COMMENT_FILTER_INVALID");
        };
    }

    private String normalizeTargetTypeFilter(String targetType) {
        if (targetType == null || targetType.isBlank()) {
            return null;
        }

        String normalized = targetType.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "video", "workflow", "prompt", "post" -> normalized;
            default -> throw new IllegalArgumentException("ADMIN_COMMENT_FILTER_INVALID");
        };
    }

    private String normalizeQuery(String query) {
        if (query == null) {
            return null;
        }

        String normalized = query.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private UUID parseRequiredUuid(String candidate, String errorCode) {
        try {
            return UUID.fromString(candidate);
        } catch (Exception ex) {
            throw new IllegalArgumentException(errorCode);
        }
    }

    private String nullableText(ResultSet resultSet, String columnName) throws SQLException {
        String value = resultSet.getString(columnName);
        return value == null || value.isBlank() ? null : value;
    }

    private String nullableUuidText(ResultSet resultSet, String columnName) throws SQLException {
        UUID value = (UUID) resultSet.getObject(columnName);
        return value == null ? null : value.toString();
    }

    private record FilterSpec(
            String statusCode,
            String targetType,
            boolean reportedOnly
    ) {
    }

    private record ManagedComment(
            UUID id,
            String targetType,
            UUID targetId,
            UUID parentId,
            String statusCode,
            boolean deleted
    ) {
    }
}
