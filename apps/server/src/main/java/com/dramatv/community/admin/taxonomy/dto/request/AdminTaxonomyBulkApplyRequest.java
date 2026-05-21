package com.dramatv.community.admin.taxonomy.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record AdminTaxonomyBulkApplyRequest(
        @NotBlank
        @Size(max = 32)
        String modality,
        @NotEmpty
        List<@NotBlank @Size(max = 64) String> promptIds,
        @Size(max = 64)
        String modelCategory,
        @Size(max = 64)
        String contentCategory,
        @Size(max = 64)
        String compositionCategory
) {
}
