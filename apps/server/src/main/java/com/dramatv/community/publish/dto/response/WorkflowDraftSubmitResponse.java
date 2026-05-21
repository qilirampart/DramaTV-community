package com.dramatv.community.publish.dto.response;

import java.util.List;

public record WorkflowDraftSubmitResponse(
        String workflowId,
        String draftStatus,
        String contentStatus,
        String publishStatus,
        DraftLifecycleResponse lifecycle,
        List<String> taskIds,
        String submitMode
) {
}
