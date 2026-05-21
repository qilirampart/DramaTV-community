package com.dramatv.community.admin.dashboard.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record AdminDashboardOverviewResponse(
        Summary summary,
        List<ModerationQueueItem> moderationQueue,
        List<ReportAlertItem> latestReports,
        List<MediaTaskAlertItem> failedMediaTasks,
        List<UserAlertItem> userWatchItems
) {
    public record Summary(
            long pendingModerationCount,
            long pendingReportCount,
            long failedMediaTaskCount,
            long retryableMediaTaskCount,
            long totalUsers,
            long nonActiveUsers,
            long backendRoleUsers
    ) {
    }

    public record ModerationQueueItem(
            String targetType,
            String targetId,
            String title,
            String authorDisplayName,
            String statusCode,
            String riskLevel,
            OffsetDateTime submittedAt
    ) {
    }

    public record ReportAlertItem(
            String reportId,
            String targetType,
            String targetId,
            String targetTitle,
            String reporterDisplayName,
            String reasonCode,
            String statusCode,
            String riskLevel,
            OffsetDateTime createdAt
    ) {
    }

    public record MediaTaskAlertItem(
            String taskId,
            String targetType,
            String targetId,
            String targetTitle,
            String targetAuthorDisplayName,
            String statusCode,
            String errorMessage,
            int retryCount,
            int maxRetryCount,
            OffsetDateTime createdAt
    ) {
    }

    public record UserAlertItem(
            String userId,
            String username,
            String displayName,
            String roleCode,
            String statusCode,
            long openReportsAgainstUser,
            long assignedOpenTickets,
            OffsetDateTime lastLoginAt
    ) {
    }
}
