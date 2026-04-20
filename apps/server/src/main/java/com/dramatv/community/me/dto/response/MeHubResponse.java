package com.dramatv.community.me.dto.response;

import java.util.List;

public record MeHubResponse(
        Profile profile,
        List<InteractionItem> likedItems,
        List<InteractionItem> favoritedItems
) {
    public record Profile(
            String id,
            String displayName,
            String avatarUrl,
            String roleCode,
            String bio,
            String headline,
            Stats stats
    ) {
    }

    public record Stats(
            int videoCount,
            int workflowCount,
            long followerCount
    ) {
    }

    public record InteractionItem(
            String itemType,
            String targetId,
            String title,
            String summary,
            String coverUrl,
            String href,
            String workflowTitle,
            String channelTitle,
            String actedAt,
            Author author
    ) {
    }

    public record Author(
            String id,
            String displayName,
            String avatarUrl
    ) {
    }
}
