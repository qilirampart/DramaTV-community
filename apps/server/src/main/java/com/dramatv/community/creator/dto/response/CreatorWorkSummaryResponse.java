package com.dramatv.community.creator.dto.response;

public record CreatorWorkSummaryResponse(
        String id,
        String itemType,
        String title,
        String summary,
        String promptModality,
        String coverUrl,
        String posterUrl,
        String previewUrl,
        String sourceUrl,
        Long likeCount,
        Long playCount,
        AuthorSummary author,
        WorkflowSummary workflow
) {
    public record AuthorSummary(
            String id,
            String displayName,
            String avatarUrl
    ) {
    }

    public record WorkflowSummary(
            String id,
            String title
    ) {
    }
}
