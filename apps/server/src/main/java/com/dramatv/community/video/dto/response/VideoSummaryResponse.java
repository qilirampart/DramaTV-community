package com.dramatv.community.video.dto.response;

public record VideoSummaryResponse(
        String id,
        String title,
        String coverUrl,
        Long durationMs,
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
