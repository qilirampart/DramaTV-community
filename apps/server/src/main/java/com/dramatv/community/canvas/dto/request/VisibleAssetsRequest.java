package com.dramatv.community.canvas.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record VisibleAssetsRequest(
        @NotNull Viewport viewport,
        List<String> nodeIds,
        Integer limit
) {
    public record Viewport(
            double x,
            double y,
            double width,
            double height,
            double zoom
    ) {
    }
}
