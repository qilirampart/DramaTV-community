package com.dramatv.community.internal.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record WorkflowValidateCallbackRequest(
        @NotBlank String taskId,
        @NotBlank String workflowDraftId,
        @NotBlank String statusCode,
        List<String> warnings
) {
}
