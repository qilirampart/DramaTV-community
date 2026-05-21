package com.dramatv.community.admin.users;

import com.dramatv.community.admin.auth.AdminAccessService;
import com.dramatv.community.admin.users.dto.response.AdminUserListResponse;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AdminUserQueryService {

    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private final JdbcTemplate jdbcTemplate;
    private final AdminAccessService adminAccessService;

    public AdminUserQueryService(
            JdbcTemplate jdbcTemplate,
            AdminAccessService adminAccessService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.adminAccessService = adminAccessService;
    }

    public AdminUserListResponse listUsers(String query, Integer page, Integer pageSize) {
        adminAccessService.requireAdminUser();

        String normalizedQuery = normalizeQuery(query);
        String likeQuery = normalizedQuery == null ? null : "%" + normalizedQuery + "%";
        int safePage = normalizePage(page);
        int safePageSize = normalizePageSize(pageSize);
        long totalItems = queryMatchedUserCount(normalizedQuery, likeQuery);
        int totalPages = totalItems == 0 ? 1 : (int) Math.ceil((double) totalItems / safePageSize);
        int effectivePage = Math.min(safePage, totalPages);
        int offset = (effectivePage - 1) * safePageSize;

        AdminUserListResponse.Summary summary = jdbcTemplate.queryForObject("""
                select
                    count(*) filter (where deleted_at is null) as total_users,
                    count(*) filter (
                        where deleted_at is null
                          and role_code in ('admin', 'operator', 'moderator')
                    ) as backend_role_users,
                    count(*) filter (
                        where deleted_at is null
                          and status_code <> 'active'
                    ) as non_active_users
                from users
                """,
                (resultSet, rowNum) -> new AdminUserListResponse.Summary(
                        resultSet.getLong("total_users"),
                        resultSet.getLong("backend_role_users"),
                        resultSet.getLong("non_active_users")
                )
        );

        List<AdminUserListResponse.Item> items = jdbcTemplate.query("""
                select
                    user_account.id,
                    user_account.username,
                    user_account.display_name,
                    user_account.role_code,
                    user_account.status_code,
                    user_account.created_at,
                    user_account.last_login_at,
                    coalesce((
                        select count(*)
                        from videos video
                        where video.author_id = user_account.id
                          and video.publish_status = 'published'
                          and video.deleted_at is null
                    ), 0) as video_count,
                    coalesce((
                        select count(*)
                        from workflows workflow
                        where workflow.author_id = user_account.id
                          and workflow.publish_status = 'published'
                          and workflow.deleted_at is null
                    ), 0) as workflow_count,
                    coalesce((
                        select count(*)
                        from prompt_entries prompt
                        where prompt.author_id = user_account.id
                          and prompt.publish_status = 'published'
                          and prompt.deleted_at is null
                    ), 0) as prompt_count,
                    coalesce((
                        select count(*)
                        from discussion_threads thread
                        where thread.author_id = user_account.id
                          and thread.publish_status = 'published'
                          and thread.deleted_at is null
                    ), 0) as post_count,
                    coalesce(profile.follower_count, 0) as follower_count,
                    coalesce(profile.like_received_count, 0) as like_received_count,
                    coalesce((
                        select count(*)
                        from report_tickets report
                        where report.reporter_id = user_account.id
                    ), 0) as reported_tickets,
                    coalesce((
                        select count(*)
                        from report_tickets report
                        where report.assignee_id = user_account.id
                          and report.status_code in ('pending', 'processing')
                    ), 0) as assigned_open_tickets
                from users user_account
                left join creator_profiles profile
                  on profile.user_id = user_account.id
                where user_account.deleted_at is null
                  and (
                    cast(? as text) is null
                    or user_account.username ilike cast(? as text)
                    or user_account.display_name ilike cast(? as text)
                  )
                order by
                    case when user_account.role_code in ('admin', 'operator', 'moderator') then 0 else 1 end,
                    user_account.created_at desc
                limit ?
                offset ?
                """,
                (resultSet, rowNum) -> mapItem(
                        (UUID) resultSet.getObject("id"),
                        resultSet.getString("username"),
                        resultSet.getString("display_name"),
                        resultSet.getString("role_code"),
                        resultSet.getString("status_code"),
                        resultSet.getObject("created_at", OffsetDateTime.class),
                        resultSet.getObject("last_login_at", OffsetDateTime.class),
                        resultSet.getInt("video_count"),
                        resultSet.getInt("workflow_count"),
                        resultSet.getInt("prompt_count"),
                        resultSet.getInt("post_count"),
                        resultSet.getLong("follower_count"),
                        resultSet.getLong("like_received_count"),
                        resultSet.getLong("reported_tickets"),
                        resultSet.getLong("assigned_open_tickets")
                ),
                normalizedQuery,
                likeQuery,
                likeQuery,
                safePageSize,
                offset
        );

        return new AdminUserListResponse(
                summary,
                new AdminUserListResponse.Pagination(
                        effectivePage,
                        safePageSize,
                        totalItems,
                        totalPages,
                        effectivePage > 1,
                        effectivePage < totalPages
                ),
                items
        );
    }

    private AdminUserListResponse.Item mapItem(
            UUID id,
            String username,
            String displayName,
            String roleCode,
            String statusCode,
            OffsetDateTime createdAt,
            OffsetDateTime lastLoginAt,
            int videoCount,
            int workflowCount,
            int promptCount,
            int postCount,
            long followerCount,
            long likeReceivedCount,
            long reportedTickets,
            long assignedOpenTickets
    ) {
        return new AdminUserListResponse.Item(
                id.toString(),
                username,
                displayName,
                roleCode,
                statusCode,
                createdAt,
                lastLoginAt,
                new AdminUserListResponse.ContentStats(videoCount, workflowCount, promptCount, postCount),
                new AdminUserListResponse.EngagementStats(followerCount, likeReceivedCount),
                new AdminUserListResponse.ModerationStats(reportedTickets, assignedOpenTickets)
        );
    }

    private String normalizeQuery(String query) {
        if (query == null) {
            return null;
        }

        String normalized = query.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private long queryMatchedUserCount(String normalizedQuery, String likeQuery) {
        Long count = jdbcTemplate.queryForObject("""
                select count(*)
                from users user_account
                where user_account.deleted_at is null
                  and (
                    cast(? as text) is null
                    or user_account.username ilike cast(? as text)
                    or user_account.display_name ilike cast(? as text)
                  )
                """,
                Long.class,
                normalizedQuery,
                likeQuery,
                likeQuery
        );
        return count == null ? 0L : count;
    }

    private int normalizePage(Integer page) {
        if (page == null || page < 1) {
            return DEFAULT_PAGE;
        }
        return page;
    }

    private int normalizePageSize(Integer pageSize) {
        if (pageSize == null || pageSize < 1) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(pageSize, MAX_PAGE_SIZE);
    }
}
