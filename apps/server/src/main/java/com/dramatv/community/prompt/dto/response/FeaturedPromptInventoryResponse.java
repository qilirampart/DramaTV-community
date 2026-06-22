package com.dramatv.community.prompt.dto.response;

import com.dramatv.community.shared.response.CursorPageResponse;
import java.util.Map;

public record FeaturedPromptInventoryResponse(
        Summary summary,
        CursorPageResponse<PromptSummaryResponse> page
) {

    public record Summary(
            Counts counts,
            PromptFacetSummary videoPromptFacets,
            PromptFacetSummary imagePromptFacets
    ) {
    }

    public record Counts(
            long all,
            long videoPrompt,
            long imagePrompt
    ) {
    }

    public record PromptFacetSummary(
            Map<String, Long> modelCounts,
            Map<String, Long> contentCounts
    ) {
    }
}
