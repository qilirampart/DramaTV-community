package com.dramatv.community.admin.moderation.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record AdminModerationListResponse(
        Summary summary,
        List<Item> items
) {
    public record Summary(
            long pendingItems,
            long highRiskItems,
            long processedToday,
            long offlineItems
    ) {
    }

    public record Item(
            String targetType,
            String targetId,
            String title,
            String authorId,
            String authorDisplayName,
            List<String> tagNames,
            OffsetDateTime submittedAt,
            String statusCode,
            String riskLevel,
            String reviewerId,
            String reviewerDisplayName,
            String summaryText,
            Media media,
            List<String> modelTags
    ) {
    }

    public record Media(
            String coverUrl,
            String posterUrl,
            String previewUrl,
            String sourceUrl
    ) {
    }
}
