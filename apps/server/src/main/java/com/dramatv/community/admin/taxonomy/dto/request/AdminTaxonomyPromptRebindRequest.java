package com.dramatv.community.admin.taxonomy.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record AdminTaxonomyPromptRebindRequest(
        @NotBlank
        @Size(max = 64)
        String sectionKey,
        @NotBlank
        @Size(max = 128)
        String categoryValue,
        @NotEmpty
        List<@NotBlank @Size(max = 64) String> promptIds
) {
}
