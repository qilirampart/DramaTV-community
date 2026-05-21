package com.dramatv.community.publish.dto.response;

import com.dramatv.community.workflow.dto.response.WorkflowSummaryResponse;
import java.util.List;

public record PublishPageBootstrapResponse(
        CurrentUser currentUser,
        VideoDraftResponse videoDraft,
        WorkflowDraftResponse workflowDraft,
        List<WorkflowSummaryResponse> availableWorkflows
) {
    public record CurrentUser(
            String id,
            String displayName,
            String roleCode
    ) {
    }
}
