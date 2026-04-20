package com.dramatv.community.canvas.dto.response;

public record CopyToCanvasResponse(
        String copyTaskId,
        String targetRuntimeId,
        String targetCanvasWorkflowId,
        String status,
        String openUrl,
        int lightSnapshotVersion
) {
}
