package com.dramatv.community.admin.taxonomy.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record AdminTaxonomyUpdateRequest(
        @NotBlank
        @Size(max = 64)
        String sectionKey,
        @NotBlank
        @Size(max = 128)
        String categoryValue,
        @NotBlank
        @Size(max = 32)
        String statusCode,
        @NotNull
        @Min(0)
        @Max(9999)
        Integer sortOrder,
        List<@Size(max = 32) String> exposureFlags,
        @Size(max = 500)
        String noteText
) {
}
