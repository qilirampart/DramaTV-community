package com.dramatv.community.admin.taxonomy.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminTaxonomyCreateRequest(
        @NotBlank
        @Size(max = 64)
        String sectionKey,
        @NotBlank
        @Size(max = 128)
        String categoryValue
) {
}
