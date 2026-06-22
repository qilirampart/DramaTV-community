package com.dramatv.community.admin.taxonomy.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record AdminTaxonomyResponse(
        Summary summary,
        List<Section> sections
) {

    public record Summary(
            long totalPrompts,
            long fullyCategorizedPrompts,
            long needsAttentionPrompts,
            long imageModelCategories,
            long videoModelCategories,
            long imageContentCategories,
            long videoContentCategories,
            long videoModelUsageCategories
    ) {
    }

    public record Section(
            String key,
            String label,
            String description,
            long promptCount,
            long categoryCount,
            List<Item> items
    ) {
    }

    public record Item(
            String value,
            String label,
            String modalityScope,
            long promptCount,
            long authorCount,
            OffsetDateTime latestPublishedAt,
            List<String> sampleTitles,
            Governance governance
    ) {
    }

    public record Governance(
            boolean hasCustomConfig,
            String statusCode,
            int sortOrder,
            List<String> exposureFlags,
            String noteText,
            String updatedByDisplayName,
            OffsetDateTime updatedAt
    ) {
    }
}
