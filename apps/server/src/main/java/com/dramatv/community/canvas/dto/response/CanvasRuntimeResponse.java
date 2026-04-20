package com.dramatv.community.canvas.dto.response;

public record CanvasRuntimeResponse(
        String runtimeId,
        String sourceWorkflowId,
        String runtimeStatus,
        String canvasSpaceId,
        String canvasWorkflowId,
        int lightSnapshotVersion,
        CopyTaskSummary copyTask
) {
    public record CopyTaskSummary(
            String id,
            String statusCode,
            int progressPercent
    ) {
    }
}
