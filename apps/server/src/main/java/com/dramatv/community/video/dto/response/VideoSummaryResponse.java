package com.dramatv.community.video.dto.response;

public record VideoSummaryResponse(
        String id,
        String title,
        String coverUrl,
        String posterUrl,
        String previewUrl,
        String sourceUrl,
        Long durationMs,
        String summary,
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
