package com.dramatv.community.interaction.dto.response;

import java.util.List;

public record CommentResponse(
        String id,
        String parentId,
        Author author,
        ReplyTarget replyTarget,
        String content,
        String createdAt,
        int replyCount,
        int likeCount,
        ViewerActions viewerActions,
        String statusCode,
        List<CommentResponse> replies
) {
    public record Author(
            String id,
            String displayName,
            String avatarUrl
    ) {
    }

    public record ReplyTarget(
            String commentId,
            Author author
    ) {
    }

    public record ViewerActions(
            boolean liked,
            boolean canDelete
    ) {
    }
}
