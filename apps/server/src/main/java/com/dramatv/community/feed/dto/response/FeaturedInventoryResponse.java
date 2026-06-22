package com.dramatv.community.feed.dto.response;

import com.dramatv.community.shared.response.CursorPageResponse;
import java.util.List;
import java.util.Map;

public record FeaturedInventoryResponse(
        Summary summary,
        CursorPageResponse<Item> page
) {

    public record Summary(
            Counts counts,
            WorkflowFacetSummary workflowFacets,
            PromptFacetSummary videoPromptFacets,
            PromptFacetSummary imagePromptFacets
    ) {
    }

    public record Counts(
            long all,
            long workflow,
            long videoPrompt,
            long imagePrompt,
            long activity
    ) {
    }

    public record WorkflowFacetSummary(
            long copyable,
            long placeholder
    ) {
    }

    public record PromptFacetSummary(
            Map<String, Long> modelCounts,
            Map<String, Long> contentCounts
    ) {
    }

    public record Item(
            String contentKind,
            String promptModality,
            String itemType,
            String targetId,
            String targetSlug,
            String channelSlug,
            String title,
            String summary,
            String coverUrl,
            String posterUrl,
            String previewUrl,
            String sourceUrl,
            Integer width,
            Integer height,
            HomeFeedResponse.AuthorSummary author,
            HomeFeedResponse.ItemStats stats,
            List<String> tagNames,
            String modelCategory,
            String contentCategory,
            Boolean allowCopy,
            ViewerActions viewerActions
    ) {
    }

    public record ViewerActions(
            boolean liked
    ) {
    }
}
