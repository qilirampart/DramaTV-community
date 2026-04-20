package com.dramatv.community.canvas.dto.response;

public record CanvasLinkResponse(
        String bindingType,
        String openUrl,
        boolean allowCopy,
        String sourceRuntimeType,
        int lightSnapshotVersion
) {
}
