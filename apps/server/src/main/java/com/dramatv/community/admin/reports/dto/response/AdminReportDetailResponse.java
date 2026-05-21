package com.dramatv.community.admin.reports.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record AdminReportDetailResponse(
        String id,
        String targetType,
        String targetId,
        String targetTitle,
        String targetPromptModality,
        String targetAuthorId,
        String targetAuthorDisplayName,
        String targetExcerptText,
        String targetCoverUrl,
        String targetPosterUrl,
        String targetPreviewUrl,
        String targetSourceUrl,
        String reporterId,
        String reporterDisplayName,
        String reasonCode,
        String descriptionText,
        String statusCode,
        String riskLevel,
        String assigneeId,
        String assigneeDisplayName,
        String resultNote,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        String targetStatusCode,
        boolean canOfflineTarget,
        boolean canHideComment,
        List<TimelineEntry> timelineEntries
) {
    public record TimelineEntry(
            OffsetDateTime happenedAt,
            String actorDisplayName,
            String actionText
    ) {
    }
}
