package com.dramatv.community.feed.dto.response;

import java.util.List;

public record FeaturedArchiveResponse(
        List<FeaturedSlot> slots
) {
    public record FeaturedSlot(
            String key,
            List<HomeFeedResponse.FeedItemResponse> items
    ) {
    }
}
