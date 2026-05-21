package com.dramatv.community.publish.dto.response;

public record DraftLifecycleResponse(
        String draftStatus,
        String moderationStatus,
        String moderationMessage,
        String processingStatus,
        String processingMessage,
        MediaTaskSummaryResponse mediaTask,
        boolean editable,
        String submittedAt
) {
}
