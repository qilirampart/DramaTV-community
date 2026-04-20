package com.dramatv.community.canvas.dto.response;

import java.util.List;

public record CanvasSnapshotResponse(
        Viewport viewport,
        MinimapBounds minimapBounds,
        List<NodeShell> nodes,
        List<Edge> edges
) {
    public record Viewport(
            double x,
            double y,
            double zoom
    ) {
    }

    public record MinimapBounds(
            double minX,
            double minY,
            double maxX,
            double maxY
    ) {
    }

    public record NodeShell(
            String id,
            String type,
            double x,
            double y,
            double width,
            double height,
            String title,
            String assetState
    ) {
    }

    public record Edge(
            String id,
            String sourceNodeId,
            String targetNodeId
    ) {
    }
}
