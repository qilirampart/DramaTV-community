package com.dramatv.community.workflow.dto.response;

public record WorkflowSummaryResponse(
        String id,
        String title,
        String coverUrl,
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
