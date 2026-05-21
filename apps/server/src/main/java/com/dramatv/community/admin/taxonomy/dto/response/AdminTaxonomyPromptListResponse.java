package com.dramatv.community.admin.taxonomy.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record AdminTaxonomyPromptListResponse(
        Summary summary,
        List<Item> items
) {

    public record Summary(
            long totalItems,
            long needsAttentionItems,
            long imageItems,
            long videoItems
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
