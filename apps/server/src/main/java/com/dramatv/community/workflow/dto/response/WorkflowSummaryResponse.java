package com.dramatv.community.workflow.dto.response;

public record WorkflowSummaryResponse(
        String id,
        String title,
        String coverUrl,
        String summary,
        Long likeCount,
        boolean allowCopy,
        AuthorSummary author
) {
    public record AuthorSummary(
            String id,
            String displayName,
            String avatarUrl
    ) {
    }
}
