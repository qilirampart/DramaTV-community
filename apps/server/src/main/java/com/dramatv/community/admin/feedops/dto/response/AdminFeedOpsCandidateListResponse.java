package com.dramatv.community.admin.feedops.dto.response;

import java.util.List;

public record AdminFeedOpsCandidateListResponse(
        Summary summary,
        Pagination pagination,
        List<AdminFeedOpsPageResponse.ContentItem> items
) {
    public record Summary(
            String pageKey,
            String slotKey,
            int totalItems,
            int filteredItems
    ) {
    }

    public record Pagination(
            int page,
            int pageSize,
            int totalItems,
            int totalPages,
            boolean hasPrevious,
            boolean hasNext
    ) {
    }
}
