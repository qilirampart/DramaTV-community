package com.dramatv.community.feed.dto.response;

import java.util.List;

public record HomeFeedResponse(
        List<FeedItemResponse> items,
        String nextCursor,
        boolean hasMore,
        Sections sections
) {
    public record FeedItemResponse(
            String itemType,
            String targetId,
            String title,
            String summary,
            String coverUrl,
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
