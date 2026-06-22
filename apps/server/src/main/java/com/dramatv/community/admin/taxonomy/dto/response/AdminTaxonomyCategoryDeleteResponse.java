package com.dramatv.community.admin.taxonomy.dto.response;

public record AdminTaxonomyCategoryDeleteResponse(
        String sectionKey,
        String categoryValue,
        boolean deleted
) {
}
