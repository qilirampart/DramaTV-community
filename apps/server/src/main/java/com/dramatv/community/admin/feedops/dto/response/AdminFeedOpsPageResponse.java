package com.dramatv.community.admin.feedops.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record AdminFeedOpsPageResponse(
        Summary summary,
        List<Slot> slots,
        List<ContentItem> candidatePool
) {
    public record Summary(
            String pageKey,
            String statusCode,
            OffsetDateTime updatedAt,
            String updatedByDisplayName,
            OffsetDateTime publishedAt,
            int configuredItemCount,
            int candidateItemCount
    ) {
    }

    public record Slot(
            String key,
            String title,
            String description,
            int maxItems,
            List<String> allowedTargetTypes,
            List<ContentItem> items,
            List<ContentItem> fallbackItems
    ) {
    }

    public record ContentItem(
            String targetType,
            String targetId,
            String contentKind,
            String itemTypeLabel,
            String targetSlug,
            String title,
            String authorDisplayName,
            String promptModality,
            String channelSlug,
            String channelTitle,
            String summaryText,
            OffsetDateTime publishedAt,
            String coverUrl,
            String posterUrl,
            String previewUrl,
            String sourceUrl,
            String authorId,
            String authorAvatarUrl,
            boolean available
    ) {
    }
}
