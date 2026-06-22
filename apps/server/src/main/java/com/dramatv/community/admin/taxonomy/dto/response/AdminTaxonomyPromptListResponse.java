package com.dramatv.community.admin.taxonomy.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record AdminTaxonomyPromptListResponse(
        Summary summary,
        Pagination pagination,
        List<Item> items
) {

    public record Summary(
            long totalItems,
            long needsAttentionItems,
            long imageItems,
            long videoItems
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
            String promptId,
            String title,
            String modality,
            String authorId,
            String authorDisplayName,
            String modelCategory,
            String contentCategory,
            String compositionCategory,
            boolean needsAttention,
            OffsetDateTime publishedAt,
            List<String> tagNames
    ) {
    }
}
