package com.dramatv.community.publish.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreateReportRequest(
        @NotBlank String targetType,
        @NotBlank String targetId,
        @NotBlank String reasonCode,
        String descriptionText
) {
}
