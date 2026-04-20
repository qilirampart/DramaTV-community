package com.dramatv.community.canvas.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CopyToCanvasRequest(
        @NotBlank String targetSpaceId,
        @NotBlank String copyMode,
        boolean openAfterCopy,
        @NotBlank String idempotencyKey
) {
}
