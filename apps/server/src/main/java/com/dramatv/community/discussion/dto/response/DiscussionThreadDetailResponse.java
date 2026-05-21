package com.dramatv.community.discussion.dto.response;

import com.dramatv.community.discussion.dto.response.DiscussionHomeResponse.ThreadCard;
import java.util.List;

public record DiscussionThreadDetailResponse(
        String id,
        String slug,
        String title,
        String content,
        String excerpt,
        Channel channel,
        Author author,
        Stats stats,
        String publishedAt,
        String lastActivityAt,
        List<String> tagNames,
        ViewerActions viewerActions,
        CommentPolicy commentPolicy,
        Binding binding,
        List<ThreadCard> relatedThreads
) {
    public record Channel(
            String slug,
            String title
    ) {
    }

    public record Author(
            String id,
            String displayName,
            String avatarUrl
    ) {
    }

    public record Stats(
            long likeCount,
            long favoriteCount,
            long replyCount
    ) {
    }

    public record ViewerActions(
            boolean liked,
            boolean favorited
    ) {
    }

    public record CommentPolicy(
            boolean commentingEnabled,
            boolean canManageComments
    ) {
    }

    public record Binding(
            String targetType,
            String targetId,
            String targetTitle
    ) {
    }
}
