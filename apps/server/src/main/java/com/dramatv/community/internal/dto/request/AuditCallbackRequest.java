package com.dramatv.community.internal.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record AuditCallbackRequest(
        @NotBlank String taskId,
        @NotBlank String targetType,
        @NotBlank String targetId,
        @NotBlank String statusCode,
        List<String> riskTags
) {
}
