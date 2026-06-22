package com.dramatv.community.admin.taxonomy.dto.response;

import java.util.List;

public record AdminTaxonomyPromptRebindResponse(
        String sectionKey,
        String categoryValue,
        int updatedCount,
        List<String> promptIds
) {
}
