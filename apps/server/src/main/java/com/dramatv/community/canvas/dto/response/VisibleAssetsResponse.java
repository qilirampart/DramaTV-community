package com.dramatv.community.canvas.dto.response;

import java.util.List;

public record VisibleAssetsResponse(
        List<Item> items
) {
    public record Item(
            String nodeId,
            String thumbnailUrl,
            String posterUrl,
            String previewUrl,
            String statusCode
    ) {
    }
}
