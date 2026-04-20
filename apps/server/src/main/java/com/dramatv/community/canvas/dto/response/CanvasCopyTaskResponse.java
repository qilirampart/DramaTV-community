package com.dramatv.community.canvas.dto.response;

import java.util.List;

public record CanvasCopyTaskResponse(
        String statusCode,
        int progressPercent,
        String targetRuntimeId,
        List<String> warnings,
        String errorCode,
        String errorMessage
) {
}
