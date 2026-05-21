package com.dramatv.community.admin.users.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record AdminUserDetailResponse(
        String id,
        String username,
        String displayName,
        String roleCode,
        String statusCode,
        String identityProvider,
        String email,
        String phone,
        String bio,
        String headline,
        OffsetDateTime createdAt,
        OffsetDateTime lastLoginAt,
        ContentStats contentStats,
        EngagementStats engagementStats,
        ModerationStats moderationStats,
        GovernanceSummary governanceSummary,
        AdminUserPasswordGovernanceResponse passwordGovernance,
        List<RecentContentItem> recentContents
) {
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
            long assignedOpenTickets,
            long openReportsAgainstUser
    ) {
    }

    public record GovernanceSummary(
            boolean adminRole,
            boolean canLogin,
            boolean canPublish,
            boolean canManageAdmin,
            String statusNote
    ) {
    }

    public record RecentContentItem(
            String targetType,
            String targetId,
            String title,
            String publishStatus,
            OffsetDateTime publishedAt
    ) {
    }
}
