package com.dramatv.community.internal.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MediaCallbackRequest(
        @NotBlank String taskId,
        @NotBlank String statusCode,
        @NotBlank String targetType,
        @NotBlank String targetId,
        @NotNull @Valid Result result
) {
    public record Result(
            String coverAssetId,
            String previewAssetId,
            Long durationMs
    ) {
    }
}
