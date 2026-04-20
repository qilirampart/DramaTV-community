package com.dramatv.community.prompt.dto.response;

import java.util.List;

public record PromptSummaryResponse(
        String id,
        String title,
        String summary,
        String modality,
        String coverUrl,
        AuthorSummary author,
        List<String> tagNames,
        Stats stats
) {
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
}
