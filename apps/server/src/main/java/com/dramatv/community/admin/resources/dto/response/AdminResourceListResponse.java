package com.dramatv.community.admin.resources.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record AdminResourceListResponse(
        Summary summary,
        Pagination pagination,
        List<Item> items
) {
    public record Summary(
            long totalItems,
            long publishedItems,
            long pendingItems,
            long offlineItems,
            long rejectedItems
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

    public record Item(
            String targetType,
            String targetId,
            String title,
            String authorId,
            String authorDisplayName,
            List<String> tagNames,
            OffsetDateTime publishedAt,
            OffsetDateTime reviewedAt,
            String publishStatusCode,
            String governanceStatusCode,
            String latestAuditStatusCode,
            String riskLevel,
            String reviewerId,
            String reviewerDisplayName,
            String summaryText,
            String channelTitle,
            String bindingTargetType,
            String bindingTargetId,
            String promptModality,
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
