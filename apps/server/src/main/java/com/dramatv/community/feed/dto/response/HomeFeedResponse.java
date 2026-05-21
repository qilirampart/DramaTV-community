package com.dramatv.community.feed.dto.response;

import java.util.List;

public record HomeFeedResponse(
        List<FeedItemResponse> items,
        String nextCursor,
        boolean hasMore,
        Sections sections,
        HomeLayout layout
) {
    public record FeedItemResponse(
            String contentKind,
            String promptModality,
            String itemType,
            String targetId,
            String title,
            String summary,
            String coverUrl,
            String posterUrl,
            String previewUrl,
            String sourceUrl,
            AuthorSummary author,
            WorkflowSummary workflow,
            ItemStats stats
    ) {
    }

    public record AuthorSummary(
            String id,
            String displayName,
            String avatarUrl
    ) {
    }

    public record WorkflowSummary(
            String id,
            String title
    ) {
    }

    public record ItemStats(
            Long playCount,
            Long likeCount
    ) {
    }

    public record Sections(
            List<WorkflowSpotlight> hotWorkflows,
            List<CreatorSpotlight> featuredCreators
    ) {
    }

    public record HomeLayout(
            List<HomeLayoutSlot> slots
    ) {
    }

    public record HomeLayoutSlot(
            String key,
            List<FeedItemResponse> items
    ) {
    }

    public record WorkflowSpotlight(
            String id,
            String title,
            String coverUrl,
            boolean allowCopy,
            AuthorSummary author
    ) {
    }

    public record CreatorSpotlight(
            String id,
            String displayName,
            String avatarUrl,
            String headline
    ) {
    }
}
