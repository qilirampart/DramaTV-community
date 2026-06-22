package com.dramatv.community.admin.dashboard;

import com.dramatv.community.admin.auth.AdminAccessService;
import com.dramatv.community.admin.dashboard.dto.response.AdminDashboardOverviewResponse;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AdminDashboardOverviewService {

    private static final String[] MANAGE_ROLES = {"admin", "operator", "moderator"};
    private static final int MODERATION_QUEUE_LIMIT = 6;
    private static final int REPORT_ALERT_LIMIT = 4;
    private static final int MEDIA_ALERT_LIMIT = 4;
    private static final int USER_ALERT_LIMIT = 4;

    private final JdbcTemplate jdbcTemplate;
    private final AdminAccessService adminAccessService;

    public AdminDashboardOverviewService(
            JdbcTemplate jdbcTemplate,
            AdminAccessService adminAccessService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.adminAccessService = adminAccessService;
    }

    public AdminDashboardOverviewResponse getOverview() {
        adminAccessService.requireAnyRole(MANAGE_ROLES);

        AdminDashboardOverviewResponse.Summary summary = jdbcTemplate.queryForObject(
                """
                select
                    (select count(*)
                     from audit_records
                     where audit_type = 'publish_review'
                       and status_code in ('pending_review', 'in_review')) as pending_moderation_count,
                    (select count(*)
                     from report_tickets
                     where status_code in ('pending', 'processing')) as pending_report_count,
                    (select count(*)
                     from async_task_records
                     where task_type in ('video_media_process', 'image_media_process')
                       and status_code = 'failed') as failed_media_task_count,
                    (select count(*)
                     from async_task_records
                     where task_type in ('video_media_process', 'image_media_process')
                       and status_code = 'failed'
                       and retry_count < max_retry_count) as retryable_media_task_count,
                    (select count(*)
                     from users
                     where deleted_at is null) as total_users,
                    (select count(*)
                     from users
                     where deleted_at is null
                       and status_code <> 'active') as non_active_users,
                    (select count(*)
                     from users
                     where deleted_at is null
                       and role_code in ('admin', 'operator', 'moderator')) as backend_role_users
                """,
                (resultSet, rowNum) -> new AdminDashboardOverviewResponse.Summary(
                        resultSet.getLong("pending_moderation_count"),
                        resultSet.getLong("pending_report_count"),
                        resultSet.getLong("failed_media_task_count"),
                        resultSet.getLong("retryable_media_task_count"),
                        resultSet.getLong("total_users"),
                        resultSet.getLong("non_active_users"),
                        resultSet.getLong("backend_role_users")
                )
        );

        List<AdminDashboardOverviewResponse.ModerationQueueItem> moderationQueue = jdbcTemplate.query(
                """
                select
                    audit.target_type,
                    audit.target_id,
                    coalesce(video.title, workflow.title, prompt.title, thread.title, '已删除内容') as title,
                    coalesce(author.display_name, '未知用户') as author_display_name,
                    audit.status_code,
                    audit.risk_level,
                    audit.created_at as submitted_at
                from audit_records audit
                left join videos video
                    on audit.target_type = 'video'
                   and video.id = audit.target_id
                left join workflows workflow
                    on audit.target_type = 'workflow'
                   and workflow.id = audit.target_id
                left join prompt_entries prompt
                    on audit.target_type = 'prompt'
                   and prompt.id = audit.target_id
                left join discussion_threads thread
                    on audit.target_type = 'post'
                   and thread.id = audit.target_id
                left join users author
                    on author.id = coalesce(video.author_id, workflow.author_id, prompt.author_id, thread.author_id)
                where audit.audit_type = 'publish_review'
                  and audit.status_code in ('pending_review', 'in_review')
                order by
                    case when audit.risk_level = 'high' then 0 else 1 end,
                    audit.created_at desc,
                    audit.target_id desc
                limit ?
                """,
                (resultSet, rowNum) -> new AdminDashboardOverviewResponse.ModerationQueueItem(
                        resultSet.getString("target_type"),
                        resultSet.getObject("target_id", UUID.class).toString(),
                        resultSet.getString("title"),
                        resultSet.getString("author_display_name"),
                        resultSet.getString("status_code"),
                        normalizeRiskLevel(resultSet.getString("risk_level")),
                        resultSet.getObject("submitted_at", OffsetDateTime.class)
                ),
                MODERATION_QUEUE_LIMIT
        );

        List<AdminDashboardOverviewResponse.ReportAlertItem> latestReports = jdbcTemplate.query(
                """
                select
                    ticket.id,
                    ticket.target_type,
                    ticket.target_id,
                    coalesce(video.title, workflow.title, prompt.title, thread.title, comment.content_text, '已删除内容') as target_title,
                    reporter.display_name as reporter_display_name,
                    ticket.reason_code,
                    ticket.status_code,
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
                    end as risk_level,
                    ticket.created_at
                from report_tickets ticket
                join users reporter on reporter.id = ticket.reporter_id
                left join videos video
                    on ticket.target_type = 'video'
                   and video.id = ticket.target_id
                left join workflows workflow
                    on ticket.target_type = 'workflow'
                   and workflow.id = ticket.target_id
                left join prompt_entries prompt
                    on ticket.target_type = 'prompt'
                   and prompt.id = ticket.target_id
                left join discussion_threads thread
                    on ticket.target_type = 'post'
                   and thread.id = ticket.target_id
                left join comments comment
                    on ticket.target_type = 'comment'
                   and comment.id = ticket.target_id
                where ticket.status_code in ('pending', 'processing')
                order by
                    case
                        when ticket.status_code = 'pending' then 0
                        when ticket.status_code = 'processing' then 1
                        else 2
                    end,
                    ticket.created_at desc,
                    ticket.id desc
                limit ?
                """,
                (resultSet, rowNum) -> new AdminDashboardOverviewResponse.ReportAlertItem(
                        resultSet.getObject("id", UUID.class).toString(),
                        resultSet.getString("target_type"),
                        resultSet.getObject("target_id", UUID.class).toString(),
                        resultSet.getString("target_title"),
                        resultSet.getString("reporter_display_name"),
                        resultSet.getString("reason_code"),
                        resultSet.getString("status_code"),
                        normalizeRiskLevel(resultSet.getString("risk_level")),
                        resultSet.getObject("created_at", OffsetDateTime.class)
                ),
                REPORT_ALERT_LIMIT
        );

        List<AdminDashboardOverviewResponse.MediaTaskAlertItem> failedMediaTasks = jdbcTemplate.query(
                """
                select
                    task.id,
                    task.target_type,
                    task.target_id,
                    coalesce(video.title, prompt.title, '已删除内容') as target_title,
                    coalesce(video_author.display_name, prompt_author.display_name, '未知用户') as target_author_display_name,
                    task.status_code,
                    task.error_message,
                    task.retry_count,
                    task.max_retry_count,
                    task.created_at
                from async_task_records task
                left join videos video
                    on task.target_type = 'video'
                   and video.id = task.target_id
                left join users video_author on video_author.id = video.author_id
                left join prompt_entries prompt
                    on task.target_type = 'prompt'
                   and prompt.id = task.target_id
                left join users prompt_author on prompt_author.id = prompt.author_id
                where task.task_type in ('video_media_process', 'image_media_process')
                  and task.status_code = 'failed'
                order by
                    case when task.retry_count < task.max_retry_count then 0 else 1 end,
                    task.created_at desc,
                    task.id desc
                limit ?
                """,
                (resultSet, rowNum) -> new AdminDashboardOverviewResponse.MediaTaskAlertItem(
                        resultSet.getObject("id", UUID.class).toString(),
                        resultSet.getString("target_type"),
                        resultSet.getObject("target_id", UUID.class).toString(),
                        resultSet.getString("target_title"),
                        resultSet.getString("target_author_display_name"),
                        resultSet.getString("status_code"),
                        resultSet.getString("error_message"),
                        resultSet.getInt("retry_count"),
                        resultSet.getInt("max_retry_count"),
                        resultSet.getObject("created_at", OffsetDateTime.class)
                ),
                MEDIA_ALERT_LIMIT
        );

        List<AdminDashboardOverviewResponse.UserAlertItem> userWatchItems = jdbcTemplate.query(
                """
                select
                    user_account.id,
                    user_account.username,
                    user_account.display_name,
                    user_account.role_code,
                    user_account.status_code,
                    user_account.last_login_at,
                    coalesce((select count(*)
                              from report_tickets report
                              where report.assignee_id = user_account.id
                                and report.status_code in ('pending', 'processing')), 0) as assigned_open_tickets,
                    coalesce((select count(*)
                              from report_tickets report
                              where report.status_code in ('pending', 'processing')
                                and (
                                  (report.target_type = 'video' and exists (
                                      select 1 from videos video
                                      where video.id = report.target_id
                                        and video.author_id = user_account.id
                                  ))
                                  or (report.target_type = 'workflow' and exists (
                                      select 1 from workflows workflow
                                      where workflow.id = report.target_id
                                        and workflow.author_id = user_account.id
                                  ))
                                  or (report.target_type = 'prompt' and exists (
                                      select 1 from prompt_entries prompt
                                      where prompt.id = report.target_id
                                        and prompt.author_id = user_account.id
                                  ))
                                  or (report.target_type = 'post' and exists (
                                      select 1 from discussion_threads thread
                                      where thread.id = report.target_id
                                        and thread.author_id = user_account.id
                                  ))
                                )), 0) as open_reports_against_user
                from users user_account
                where user_account.deleted_at is null
                  and (
                    user_account.status_code <> 'active'
                    or user_account.role_code in ('admin', 'operator', 'moderator')
                  )
                order by
                    case when user_account.status_code <> 'active' then 0 else 1 end,
                    open_reports_against_user desc,
                    assigned_open_tickets desc,
                    user_account.created_at desc
                limit ?
                """,
                (resultSet, rowNum) -> new AdminDashboardOverviewResponse.UserAlertItem(
                        resultSet.getObject("id", UUID.class).toString(),
                        resultSet.getString("username"),
                        resultSet.getString("display_name"),
                        resultSet.getString("role_code"),
                        resultSet.getString("status_code"),
                        resultSet.getLong("open_reports_against_user"),
                        resultSet.getLong("assigned_open_tickets"),
                        resultSet.getObject("last_login_at", OffsetDateTime.class)
                ),
                USER_ALERT_LIMIT
        );

        return new AdminDashboardOverviewResponse(
                summary == null ? new AdminDashboardOverviewResponse.Summary(0, 0, 0, 0, 0, 0, 0) : summary,
                moderationQueue,
                latestReports,
                failedMediaTasks,
                userWatchItems
        );
    }

    private String normalizeRiskLevel(String riskLevel) {
        if (riskLevel == null || riskLevel.isBlank()) {
            return "medium";
        }
        return riskLevel.trim().toLowerCase(Locale.ROOT);
    }
}
