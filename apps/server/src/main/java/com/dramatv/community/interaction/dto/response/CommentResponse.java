package com.dramatv.community.interaction.dto.response;

public record CommentResponse(
        String id,
        Author author,
        String content,
        String createdAt,
        int replyCount,
        int likeCount,
        ViewerActions viewerActions
) {
    public record Author(
            String id,
            String displayName,
            String avatarUrl
    ) {
    }

    public record ViewerActions(
            boolean liked
    ) {
    }
}
