package com.dramatv.community.admin.reports;

import com.dramatv.community.admin.auditlogs.AdminAuditLogService;
import com.dramatv.community.admin.auth.AdminAccessService;
import com.dramatv.community.admin.comments.AdminCommentService;
import com.dramatv.community.admin.moderation.AdminModerationService;
import com.dramatv.community.admin.moderation.dto.response.AdminModerationActionResponse;
import com.dramatv.community.admin.reports.dto.response.AdminReportActionResponse;
import com.dramatv.community.admin.reports.dto.response.AdminReportDetailResponse;
import com.dramatv.community.admin.reports.dto.response.AdminReportListResponse;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.shared.media.JdbcMediaUrlResolver;
import com.dramatv.community.shared.request.MdcBusinessContextScope;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
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
public class AdminReportService {

    private static final Logger log = LoggerFactory.getLogger(AdminReportService.class);
    private static final String[] MANAGE_ROLES = {"admin", "moderator"};
    private static final int DEFAULT_LIMIT = 80;

    private static final String FILTERED_ROWS_CTE = """
            with report_rows as (
                select
                    ticket.id,
                    ticket.reporter_id,
                    reporter.display_name as reporter_display_name,
                    ticket.target_type,
                    ticket.target_id,
                    ticket.reason_code,
                    ticket.description_text,
                    ticket.status_code,
                    ticket.assignee_id,
                    assignee.display_name as assignee_display_name,
                    ticket.result_note,
                    ticket.created_at,
                    ticket.updated_at,
                    coalesce(video.title, workflow.title, prompt.title, thread.title, comment.content_text, '已删除内容') as target_title,
                    prompt.modality as target_prompt_modality,
                    coalesce(video.summary, workflow.summary, prompt.summary, thread.excerpt_text, comment.content_text, '') as target_excerpt_text,
                    coalesce(video.publish_status, workflow.publish_status, prompt.publish_status, thread.publish_status, comment.status_code, 'unknown') as target_status_code,
                    coalesce(video_author.id, workflow_author.id, prompt_author.id, thread_author.id, comment_author.id) as target_author_id,
                    coalesce(
                        video_author.display_name,
                        workflow_author.display_name,
                        prompt_author.display_name,
                        thread_author.display_name,
                        comment_author.display_name,
                        '未知用户'
                    ) as target_author_display_name,
                    case
                        when ticket.target_type = 'comment' then
                            case
                                when comment.status_code = 'hidden' then 'high'
                                when ticket.status_code in ('pending', 'processing') then 'high'
                                else 'medium'
                            end
                        when coalesce(video.publish_status, workflow.publish_status, prompt.publish_status, thread.publish_status) = 'taken_down' then 'high'
                        when ticket.status_code in ('pending', 'processing') and ticket.reason_code in ('pornographic', 'political', 'abuse', 'copyright') then 'high'
                        when ticket.status_code in ('pending', 'processing') then 'medium'
                        else 'low'
                    end as risk_level
                from report_tickets ticket
                join users reporter on reporter.id = ticket.reporter_id
                left join users assignee on assignee.id = ticket.assignee_id
                left join videos video
                    on ticket.target_type = 'video'
                   and video.id = ticket.target_id
                left join users video_author on video_author.id = video.author_id
                left join workflows workflow
                    on ticket.target_type = 'workflow'
                   and workflow.id = ticket.target_id
                left join users workflow_author on workflow_author.id = workflow.author_id
                left join prompt_entries prompt
                    on ticket.target_type = 'prompt'
                   and prompt.id = ticket.target_id
                left join users prompt_author on prompt_author.id = prompt.author_id
                left join discussion_threads thread
                    on ticket.target_type = 'post'
                   and thread.id = ticket.target_id
                left join users thread_author on thread_author.id = thread.author_id
                left join comments comment
                    on ticket.target_type = 'comment'
                   and comment.id = ticket.target_id
                left join users comment_author on comment_author.id = comment.author_id
                where (
                        cast(? as varchar) is null
                        or reporter.username ilike ?
                        or reporter.display_name ilike ?
                        or coalesce(video.title, workflow.title, prompt.title, thread.title, comment.content_text, '') ilike ?
                        or coalesce(
                            video_author.display_name,
                            workflow_author.display_name,
                            prompt_author.display_name,
                            thread_author.display_name,
                            comment_author.display_name,
                            ''
                        ) ilike ?
                    )
                  and (cast(? as varchar) is null or ticket.status_code = cast(? as varchar))
                  and (cast(? as varchar) is null or ticket.target_type = cast(? as varchar))
                  and (cast(? as varchar) is null or ticket.reason_code = cast(? as varchar))
            )
            """;

    private static final String SUMMARY_SQL = FILTERED_ROWS_CTE + """
            select
                count(*) filter (where status_code in ('pending', 'processing')) as pending_tickets,
                count(*) filter (where risk_level = 'high') as high_risk_tickets,
                count(*) filter (where created_at >= date_trunc('day', now())) as new_today,
                count(*) filter (where status_code in ('resolved', 'closed')) as resolved_tickets
            from report_rows
            """;

    private static final String ITEMS_SQL = FILTERED_ROWS_CTE + """
            select
                id,
                target_type,
                target_id,
                target_title,
                target_prompt_modality,
                target_author_id,
                target_author_display_name,
                reporter_id,
                reporter_display_name,
                reason_code,
                description_text,
                status_code,
                risk_level,
                assignee_id,
                assignee_display_name,
                result_note,
                created_at,
                updated_at,
                target_status_code
            from report_rows
            order by
                case
                    when status_code = 'pending' then 0
                    when status_code = 'processing' then 1
                    when risk_level = 'high' then 2
                    else 3
                end,
                created_at desc,
                id desc
            limit ?
            """;

    private static final String DETAIL_SQL = FILTERED_ROWS_CTE + """
            select
                rr.id,
                rr.target_type,
                rr.target_id,
                rr.target_title,
                rr.target_prompt_modality,
                rr.target_excerpt_text,
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
                prompt_preview_example.asset_kind as prompt_preview_example_asset_kind,
                prompt_example.storage_provider as prompt_example_storage_provider,
                prompt_example.bucket_name as prompt_example_bucket_name,
                prompt_example.object_key as prompt_example_url,
                prompt_example.asset_kind as prompt_example_asset_kind,
                rr.target_author_id,
                rr.target_author_display_name,
                rr.reporter_id,
                rr.reporter_display_name,
                rr.reason_code,
                rr.description_text,
                rr.status_code,
                rr.risk_level,
                rr.assignee_id,
                rr.assignee_display_name,
                rr.result_note,
                rr.created_at,
                rr.updated_at,
                rr.target_status_code
            from report_rows rr
            left join media_assets video_cover
                on video_cover.id = (select video.cover_asset_id from videos video where video.id = rr.target_id and rr.target_type = 'video')
            left join media_assets video_poster
                on video_poster.id = (select video.poster_asset_id from videos video where video.id = rr.target_id and rr.target_type = 'video')
            left join media_assets video_preview
                on video_preview.id = (select video.preview_asset_id from videos video where video.id = rr.target_id and rr.target_type = 'video')
            left join media_assets video_source
                on video_source.id = (select video.source_asset_id from videos video where video.id = rr.target_id and rr.target_type = 'video')
            left join media_assets workflow_cover
                on workflow_cover.id = (select workflow.cover_asset_id from workflows workflow where workflow.id = rr.target_id and rr.target_type = 'workflow')
            left join media_assets prompt_cover
                on prompt_cover.id = (select prompt.cover_asset_id from prompt_entries prompt where prompt.id = rr.target_id and rr.target_type = 'prompt')
            left join media_assets prompt_primary_example
                on prompt_primary_example.id = (select prompt.primary_example_asset_id from prompt_entries prompt where prompt.id = rr.target_id and rr.target_type = 'prompt')
            left join media_assets prompt_preview_example
                on prompt_preview_example.id = (
                    select link.media_asset_id
                    from prompt_example_links link
                    where link.prompt_id = rr.target_id
                      and rr.target_type = 'prompt'
                      and link.role_code = 'preview'
                    order by link.sort_order asc, link.created_at asc
                    limit 1
                )
            left join media_assets prompt_example
                on prompt_example.id = (
                    select link.media_asset_id
                    from prompt_example_links link
                    where link.prompt_id = rr.target_id
                      and rr.target_type = 'prompt'
                      and link.role_code = 'example'
                    order by link.sort_order asc, link.created_at asc
                    limit 1
                )
            where rr.id = ?
            limit 1
            """;

    private final JdbcTemplate jdbcTemplate;
    private final AdminAccessService adminAccessService;
    private final AdminAuditLogService adminAuditLogService;
    private final AdminModerationService adminModerationService;
    private final AdminCommentService adminCommentService;
    private final JdbcMediaUrlResolver jdbcMediaUrlResolver;

    public AdminReportService(
            JdbcTemplate jdbcTemplate,
            AdminAccessService adminAccessService,
            AdminAuditLogService adminAuditLogService,
            AdminModerationService adminModerationService,
            AdminCommentService adminCommentService,
            JdbcMediaUrlResolver jdbcMediaUrlResolver
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.adminAccessService = adminAccessService;
        this.adminAuditLogService = adminAuditLogService;
        this.adminModerationService = adminModerationService;
        this.adminCommentService = adminCommentService;
        this.jdbcMediaUrlResolver = jdbcMediaUrlResolver;
    }

    public AdminReportListResponse listReports(String query, String status, String targetType, String reason) {
        adminAccessService.requireAnyRole(MANAGE_ROLES);

        String normalizedQuery = normalizeQuery(query);
        String likeQuery = normalizedQuery == null ? null : "%" + normalizedQuery + "%";
        String normalizedStatus = normalizeStatus(status);
        String normalizedTargetType = normalizeTargetType(targetType);
        String normalizedReason = normalizeReason(reason);

        AdminReportListResponse.Summary summary = jdbcTemplate.queryForObject(
                SUMMARY_SQL,
                (resultSet, rowNum) -> new AdminReportListResponse.Summary(
                        resultSet.getLong("pending_tickets"),
                        resultSet.getLong("high_risk_tickets"),
                        resultSet.getLong("new_today"),
                        resultSet.getLong("resolved_tickets")
                ),
                normalizedQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                normalizedStatus,
                normalizedStatus,
                normalizedTargetType,
                normalizedTargetType,
                normalizedReason,
                normalizedReason
        );

        List<AdminReportListResponse.Item> items = jdbcTemplate.query(
                ITEMS_SQL,
                (resultSet, rowNum) -> mapListItem(resultSet),
                normalizedQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                normalizedStatus,
                normalizedStatus,
                normalizedTargetType,
                normalizedTargetType,
                normalizedReason,
                normalizedReason,
                DEFAULT_LIMIT
        );

        return new AdminReportListResponse(
                summary == null ? new AdminReportListResponse.Summary(0, 0, 0, 0) : summary,
                items
        );
    }

    public AdminReportDetailResponse getReport(String reportId) {
        adminAccessService.requireAnyRole(MANAGE_ROLES);
        ManagedReport report = requireManagedReport(reportId);

        AdminReportDetailResponse detail = jdbcTemplate.query(
                DETAIL_SQL,
                resultSet -> resultSet.next() ? mapDetailItem(resultSet) : null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                report.id()
        );

        if (detail == null) {
            throw new IllegalArgumentException("ADMIN_REPORT_NOT_FOUND");
        }

        return detail;
    }

    @Transactional
    public AdminReportActionResponse markProcessing(String reportId, String note) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);
        ManagedReport report = requireManagedReport(reportId);

        try (MdcBusinessContextScope ignored = reportContext(report)) {
            updateReport(report.id(), operator.id(), "processing", mergeResultNote(report.resultNote(), note));
            log.info(
                    "admin report action success: action=processing operatorId={} reportId={} targetType={} targetId={} previousStatus={} nextStatus=processing hasNote={}",
                    operator.id(),
                    report.id(),
                    report.targetType(),
                    report.targetId(),
                    report.statusCode(),
                    note != null && !note.isBlank()
            );
            adminAuditLogService.recordSuccessfulOperation(
                    operator,
                    "reports",
                    "举报工单",
                    "processing",
                    "转处理中",
                    "report_ticket",
                    report.id().toString(),
                    "举报工单 " + report.id(),
                    "normal",
                    mergeAuditNote("工单已转处理中", note),
                    "/api/admin/reports/" + report.id() + "/processing",
                    "POST"
            );
            return new AdminReportActionResponse("processing", report.id().toString(), "processing");
        }
    }

    @Transactional
    public AdminReportActionResponse closeReport(String reportId, String note) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);
        ManagedReport report = requireManagedReport(reportId);

        try (MdcBusinessContextScope ignored = reportContext(report)) {
            if ("closed".equals(report.statusCode())) {
                log.info(
                        "admin report action noop: action=close operatorId={} reportId={} targetType={} targetId={} status=closed",
                        operator.id(),
                        report.id(),
                        report.targetType(),
                        report.targetId()
                );
                return new AdminReportActionResponse("close", report.id().toString(), "closed");
            }

            ReportCloseTransition transition = resolveCloseTransition(report.statusCode());
            updateReport(report.id(), operator.id(), transition.nextStatus(), mergeResultNote(report.resultNote(), note));
            log.info(
                    "admin report action success: action={} operatorId={} reportId={} targetType={} targetId={} previousStatus={} nextStatus={} hasNote={}",
                    transition.actionCode(),
                    operator.id(),
                    report.id(),
                    report.targetType(),
                    report.targetId(),
                    report.statusCode(),
                    transition.nextStatus(),
                    note != null && !note.isBlank()
            );
            adminAuditLogService.recordSuccessfulOperation(
                    operator,
                    "reports",
                    "举报工单",
                    transition.actionCode(),
                    transition.actionLabel(),
                    "report_ticket",
                    report.id().toString(),
                    "举报工单 " + report.id(),
                    "sensitive",
                    mergeAuditNote(transition.auditMessage(), note),
                    "/api/admin/reports/" + report.id() + "/close",
                    "POST",
                    "previousStatus=%s,nextStatus=%s".formatted(report.statusCode(), transition.nextStatus())
            );
            return new AdminReportActionResponse(transition.actionCode(), report.id().toString(), transition.nextStatus());
        }
    }

    @Transactional
    public AdminReportActionResponse offlineTarget(String reportId, String note) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);
        ManagedReport report = requireManagedReport(reportId);
        try (MdcBusinessContextScope ignored = reportContext(report)) {
            if ("comment".equals(report.targetType())) {
                log.warn(
                        "admin report action rejected: action=offline_target operatorId={} reportId={} targetType=comment targetId={}",
                        operator.id(),
                        report.id(),
                        report.targetId()
                );
                throw new IllegalArgumentException("ADMIN_REPORT_TARGET_ACTION_INVALID");
            }

            AdminModerationActionResponse moderation = adminModerationService.offline(
                    report.targetType(),
                    report.targetId().toString(),
                    note
            );
            updateReport(report.id(), operator.id(), "resolved", mergeResultNote(report.resultNote(), note));
            log.info(
                    "admin report action success: action=offline_target operatorId={} reportId={} targetType={} targetId={} previousStatus={} nextStatus=resolved moderationStatus={} hasNote={}",
                    operator.id(),
                    report.id(),
                    report.targetType(),
                    report.targetId(),
                    report.statusCode(),
                    moderation.statusCode(),
                    note != null && !note.isBlank()
            );
            adminAuditLogService.recordSuccessfulOperation(
                    operator,
                    "reports",
                    "举报工单",
                    "offline_target",
                    "下线目标",
                    "report_ticket",
                    report.id().toString(),
                    "举报工单 " + report.id(),
                    "sensitive",
                    mergeAuditNote("举报目标已下线", note),
                    "/api/admin/reports/" + report.id() + "/offline-target",
                    "POST",
                    "targetType=%s,targetId=%s,moderationStatus=%s".formatted(
                            report.targetType(),
                            report.targetId(),
                            moderation.statusCode()
                    )
            );
            return new AdminReportActionResponse("offline_target", report.id().toString(), moderation.statusCode());
        }
    }

    @Transactional
    public AdminReportActionResponse hideReportedComment(String reportId, String note) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);
        ManagedReport report = requireManagedReport(reportId);
        try (MdcBusinessContextScope ignored = reportContext(report)) {
            if (!"comment".equals(report.targetType())) {
                log.warn(
                        "admin report action rejected: action=hide_reported_comment operatorId={} reportId={} targetType={} targetId={}",
                        operator.id(),
                        report.id(),
                        report.targetType(),
                        report.targetId()
                );
                throw new IllegalArgumentException("ADMIN_REPORT_TARGET_ACTION_INVALID");
            }

            adminCommentService.hideComment(report.targetId().toString());
            updateReport(report.id(), operator.id(), "resolved", mergeResultNote(report.resultNote(), note));
            log.info(
                    "admin report action success: action=hide_reported_comment operatorId={} reportId={} targetType=comment targetId={} previousStatus={} nextStatus=resolved hasNote={}",
                    operator.id(),
                    report.id(),
                    report.targetId(),
                    report.statusCode(),
                    note != null && !note.isBlank()
            );
            adminAuditLogService.recordSuccessfulOperation(
                    operator,
                    "reports",
                    "举报工单",
                    "hide_reported_comment",
                    "隐藏举报评论",
                    "report_ticket",
                    report.id().toString(),
                    "举报工单 " + report.id(),
                    "sensitive",
                    mergeAuditNote("举报评论已隐藏", note),
                    "/api/admin/reports/" + report.id() + "/hide-comment",
                    "POST",
                    "targetType=comment,targetId=" + report.targetId()
            );
            return new AdminReportActionResponse("hide_comment", report.id().toString(), "resolved");
        }
    }

    private void updateReport(UUID reportId, UUID assigneeId, String statusCode, String resultNote) {
        jdbcTemplate.update("""
                update report_tickets
                set status_code = ?,
                    assignee_id = ?,
                    result_note = ?,
                    updated_at = now()
                where id = ?
                """,
                statusCode,
                assigneeId,
                resultNote,
                reportId
        );
    }

    private ManagedReport requireManagedReport(String reportId) {
        UUID parsedReportId = parseRequiredUuid(reportId, "ADMIN_REPORT_NOT_FOUND");
        ManagedReport report = jdbcTemplate.query("""
                select id, target_type, target_id, status_code, assignee_id, result_note
                from report_tickets
                where id = ?
                """,
                resultSet -> resultSet.next()
                        ? new ManagedReport(
                                resultSet.getObject("id", UUID.class),
                                resultSet.getString("target_type"),
                                resultSet.getObject("target_id", UUID.class),
                                resultSet.getString("status_code"),
                                (UUID) resultSet.getObject("assignee_id"),
                                nullableText(resultSet, "result_note")
                        )
                        : null,
                parsedReportId
        );

        if (report == null) {
            throw new IllegalArgumentException("ADMIN_REPORT_NOT_FOUND");
        }
        return report;
    }

    private AdminReportListResponse.Item mapListItem(ResultSet resultSet) throws SQLException {
        return new AdminReportListResponse.Item(
                resultSet.getObject("id", UUID.class).toString(),
                resultSet.getString("target_type"),
                resultSet.getObject("target_id", UUID.class).toString(),
                resultSet.getString("target_title"),
                nullableText(resultSet, "target_prompt_modality"),
                nullableUuidText(resultSet, "target_author_id"),
                resultSet.getString("target_author_display_name"),
                resultSet.getObject("reporter_id", UUID.class).toString(),
                resultSet.getString("reporter_display_name"),
                resultSet.getString("reason_code"),
                nullableText(resultSet, "description_text"),
                resultSet.getString("status_code"),
                resultSet.getString("risk_level"),
                nullableUuidText(resultSet, "assignee_id"),
                nullableText(resultSet, "assignee_display_name"),
                nullableText(resultSet, "result_note"),
                resultSet.getObject("created_at", OffsetDateTime.class),
                resultSet.getObject("updated_at", OffsetDateTime.class),
                resultSet.getString("target_status_code")
        );
    }

    private AdminReportDetailResponse mapDetailItem(ResultSet resultSet) throws SQLException {
        String targetType = resultSet.getString("target_type");
        String targetId = resultSet.getObject("target_id", UUID.class).toString();
        OffsetDateTime createdAt = resultSet.getObject("created_at", OffsetDateTime.class);
        OffsetDateTime updatedAt = resultSet.getObject("updated_at", OffsetDateTime.class);
        String reporter = resultSet.getString("reporter_display_name");
        String assignee = nullableText(resultSet, "assignee_display_name");
        String reason = resultSet.getString("reason_code");
        String statusCode = resultSet.getString("status_code");

        List<AdminReportDetailResponse.TimelineEntry> timeline = new ArrayList<>();
        timeline.add(new AdminReportDetailResponse.TimelineEntry(
                createdAt,
                reporter,
                "提交举报，原因：" + reason
        ));
        if (assignee != null) {
            timeline.add(new AdminReportDetailResponse.TimelineEntry(
                    updatedAt,
                    assignee,
                    "工单状态更新为 " + reportStatusLabel(statusCode)
                ));
        }

        return new AdminReportDetailResponse(
                resultSet.getObject("id", UUID.class).toString(),
                targetType,
                targetId,
                resultSet.getString("target_title"),
                nullableText(resultSet, "target_prompt_modality"),
                nullableUuidText(resultSet, "target_author_id"),
                resultSet.getString("target_author_display_name"),
                nullableText(resultSet, "target_excerpt_text"),
                resolveTargetCoverUrl(resultSet),
                resolveTargetPosterUrl(resultSet),
                resolveTargetPreviewUrl(resultSet),
                resolveTargetSourceUrl(resultSet),
                resultSet.getObject("reporter_id", UUID.class).toString(),
                reporter,
                reason,
                nullableText(resultSet, "description_text"),
                statusCode,
                resultSet.getString("risk_level"),
                nullableUuidText(resultSet, "assignee_id"),
                assignee,
                nullableText(resultSet, "result_note"),
                createdAt,
                updatedAt,
                resultSet.getString("target_status_code"),
                !"comment".equals(targetType),
                "comment".equals(targetType),
                List.copyOf(timeline)
        );
    }

    private String resolveTargetCoverUrl(ResultSet resultSet) throws SQLException {
        String targetType = resultSet.getString("target_type");
        return switch (targetType) {
            case "video" -> resolveFirstAvailableMediaUrl(resultSet, "video_cover_url", "video_poster_url");
            case "workflow" -> resolveFirstAvailableMediaUrl(resultSet, "workflow_cover_url");
            case "prompt" -> resolveFirstAvailableMediaUrl(resultSet, "prompt_cover_url", "prompt_primary_example_url", "prompt_example_url");
            default -> null;
        };
    }

    private String resolveTargetPosterUrl(ResultSet resultSet) throws SQLException {
        String targetType = resultSet.getString("target_type");
        return switch (targetType) {
            case "video" -> resolveFirstAvailableMediaUrl(resultSet, "video_poster_url", "video_cover_url");
            case "workflow" -> resolveFirstAvailableMediaUrl(resultSet, "workflow_cover_url");
            case "prompt" -> resolveFirstAvailableMediaUrl(resultSet, "prompt_cover_url", "prompt_primary_example_url", "prompt_example_url");
            default -> null;
        };
    }

    private String resolveTargetPreviewUrl(ResultSet resultSet) throws SQLException {
        String targetType = resultSet.getString("target_type");
        return switch (targetType) {
            case "video" -> resolveFirstAvailableMediaUrl(resultSet, "video_preview_url", "video_source_url");
            case "workflow" -> null;
            case "prompt" -> resolveFirstAvailableMediaUrlByAssetKind(
                    resultSet,
                    "video",
                    "prompt_preview_example_url",
                    "prompt_primary_example_url",
                    "prompt_example_url"
            );
            default -> null;
        };
    }

    private String resolveTargetSourceUrl(ResultSet resultSet) throws SQLException {
        String targetType = resultSet.getString("target_type");
        return switch (targetType) {
            case "video" -> resolveFirstAvailableMediaUrl(resultSet, "video_source_url", "video_preview_url");
            case "workflow" -> null;
            case "prompt" -> resolveFirstAvailableMediaUrl(resultSet, "prompt_primary_example_url", "prompt_example_url");
            default -> null;
        };
    }

    private String resolveFirstAvailableMediaUrlByAssetKind(ResultSet resultSet, String expectedAssetKind, String... columnNames) throws SQLException {
        for (String columnName : columnNames) {
            String assetKind = nullableText(resultSet, assetKindColumnName(columnName));
            if (assetKind != null && !expectedAssetKind.equalsIgnoreCase(assetKind)) {
                continue;
            }

            String resolved = jdbcMediaUrlResolver.resolve(resultSet, columnName);
            if (resolved != null && !resolved.isBlank()) {
                return resolved;
            }
        }
        return null;
    }

    private String resolveFirstAvailableMediaUrl(ResultSet resultSet, String... columnNames) throws SQLException {
        for (String columnName : columnNames) {
            String resolved = jdbcMediaUrlResolver.resolve(resultSet, columnName);
            if (resolved != null && !resolved.isBlank()) {
                return resolved;
            }
        }
        return null;
    }

    private String assetKindColumnName(String mediaUrlColumnName) {
        if (mediaUrlColumnName.endsWith("_url")) {
            return mediaUrlColumnName.substring(0, mediaUrlColumnName.length() - 4) + "_asset_kind";
        }
        return mediaUrlColumnName + "_asset_kind";
    }

    private String normalizeQuery(String query) {
        if (query == null) {
            return null;
        }
        String normalized = query.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        String normalized = status.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "pending", "processing", "resolved", "closed" -> normalized;
            default -> throw new IllegalArgumentException("ADMIN_REPORT_FILTER_INVALID");
        };
    }

    private String normalizeTargetType(String targetType) {
        if (targetType == null || targetType.isBlank()) {
            return null;
        }

        String normalized = targetType.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "video", "workflow", "prompt", "post", "comment" -> normalized;
            default -> throw new IllegalArgumentException("ADMIN_REPORT_FILTER_INVALID");
        };
    }

    private String normalizeReason(String reason) {
        if (reason == null || reason.isBlank()) {
            return null;
        }

        String normalized = reason.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "pornographic", "political", "spam", "abuse", "copyright", "misleading", "other" -> normalized;
            default -> throw new IllegalArgumentException("ADMIN_REPORT_FILTER_INVALID");
        };
    }

    private UUID parseRequiredUuid(String value, String errorCode) {
        try {
            return UUID.fromString(value);
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

    private String mergeResultNote(String existing, String incoming) {
        String normalizedIncoming = incoming == null ? null : incoming.trim();
        if (normalizedIncoming == null || normalizedIncoming.isEmpty()) {
            return existing;
        }
        if (existing == null || existing.isBlank()) {
            return normalizedIncoming;
        }
        return existing + "\n" + normalizedIncoming;
    }

    private String mergeAuditNote(String defaultNote, String note) {
        if (note == null || note.isBlank()) {
            return defaultNote;
        }
        return defaultNote + "：" + note.trim();
    }

    private ReportCloseTransition resolveCloseTransition(String statusCode) {
        if ("resolved".equals(statusCode)) {
            return new ReportCloseTransition("close", "归档关闭", "closed", "工单已归档关闭");
        }
        return new ReportCloseTransition("resolve", "标记已处理", "resolved", "工单已标记为已处理");
    }

    private String reportStatusLabel(String statusCode) {
        return switch (statusCode) {
            case "processing" -> "处理中";
            case "resolved" -> "已处理";
            case "closed" -> "已归档";
            default -> "待处理";
        };
    }

    private MdcBusinessContextScope reportContext(ManagedReport report) {
        return MdcBusinessContextScope.open(Map.of(
                "reportId", report.id().toString(),
                "targetType", report.targetType(),
                "targetId", report.targetId().toString()
        ));
    }

    private record ManagedReport(
            UUID id,
            String targetType,
            UUID targetId,
            String statusCode,
            UUID assigneeId,
            String resultNote
    ) {
    }

    private record ReportCloseTransition(
            String actionCode,
            String actionLabel,
            String nextStatus,
            String auditMessage
    ) {
    }
}
