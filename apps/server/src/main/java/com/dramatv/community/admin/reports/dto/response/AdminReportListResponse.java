package com.dramatv.community.admin.reports.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record AdminReportListResponse(
        Summary summary,
        Pagination pagination,
        List<Item> items
) {
    public record Summary(
            long pendingTickets,
            long highRiskTickets,
            long newToday,
            long resolvedTickets
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
            String id,
            String targetType,
            String targetId,
            String targetTitle,
            String targetPromptModality,
            String targetAuthorId,
            String targetAuthorDisplayName,
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
            String targetStatusCode
    ) {
    }
}
