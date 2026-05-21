package com.dramatv.community.discussion.dto.response;

import java.util.List;

public record DiscussionHomeResponse(
        List<Channel> channels,
        List<ThreadCard> featuredThreads
) {
    public record Channel(
            String slug,
            String title,
            String description,
            long threadCount
    ) {
    }

    public record ThreadCard(
            String id,
            String slug,
            String title,
            String excerpt,
            String publishedAt,
            String channelSlug,
            String channelTitle,
            long likeCount,
            long favoriteCount,
            long replyCount,
            String lastActivityAt,
            List<String> tagNames,
            Author author,
            ViewerActions viewerActions,
            Binding binding
    ) {
    }

    public record Author(
            String id,
            String displayName,
            String avatarUrl
    ) {
    }

    public record ViewerActions(
            boolean liked,
            boolean favorited
    ) {
    }

    public record Binding(
            String targetType,
            String targetId,
            String targetTitle
    ) {
    }
}
