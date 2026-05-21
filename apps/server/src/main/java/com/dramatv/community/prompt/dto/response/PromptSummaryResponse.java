package com.dramatv.community.prompt.dto.response;

import java.util.List;

public record PromptSummaryResponse(
        String id,
        String title,
        String summary,
        String modality,
        String coverUrl,
        String posterUrl,
        String previewUrl,
        String sourceUrl,
        Taxonomy taxonomy,
        AuthorSummary author,
        List<String> tagNames,
        Stats stats,
        ViewerActions viewerActions
) {
    public record Taxonomy(
            String modelCategory,
            String contentCategory,
            String compositionCategory
    ) {
    }

    public record AuthorSummary(
            String id,
            String displayName,
            String avatarUrl
    ) {
    }

    public record Stats(
            long likeCount,
            long favoriteCount,
            long exampleCount
    ) {
    }

    public record ViewerActions(
            boolean liked
    ) {
    }
}
