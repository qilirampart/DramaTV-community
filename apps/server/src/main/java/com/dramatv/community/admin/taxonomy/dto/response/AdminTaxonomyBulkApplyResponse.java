package com.dramatv.community.admin.taxonomy.dto.response;

import java.util.List;

public record AdminTaxonomyBulkApplyResponse(
        String modality,
        int updatedCount,
        String modelCategory,
        String contentCategory,
        String compositionCategory,
        List<String> promptIds
) {
}
