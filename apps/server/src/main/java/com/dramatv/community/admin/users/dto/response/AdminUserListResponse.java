package com.dramatv.community.admin.users.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record AdminUserListResponse(
        Summary summary,
        Pagination pagination,
        List<Item> items
) {
    public record Summary(
            long totalUsers,
            long backendRoleUsers,
            long nonActiveUsers
    ) {
    }

    public record Item(
            String id,
            String username,
            String displayName,
            String roleCode,
            String statusCode,
            OffsetDateTime createdAt,
            OffsetDateTime lastLoginAt,
            ContentStats contentStats,
            EngagementStats engagementStats,
            ModerationStats moderationStats
    ) {
    }

    public record ContentStats(
            int videoCount,
            int workflowCount,
            int promptCount,
            int postCount
    ) {
    }

    public record EngagementStats(
            long followerCount,
            long likeReceivedCount
    ) {
    }

    public record ModerationStats(
            long reportedTickets,
            long assignedOpenTickets
    ) {
    }

    public record Pagination(
            int page,
            int pageSize,
            long totalItems,
            int totalPages,
            boolean hasPrevious,
            boolean hasNext
    ) {
    }
}
