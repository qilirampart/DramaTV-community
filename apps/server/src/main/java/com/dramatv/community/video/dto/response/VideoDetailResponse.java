package com.dramatv.community.video.dto.response;

import java.util.List;

public record VideoDetailResponse(
        String id,
        String title,
        String summary,
        List<String> tags,
        Media media,
        Author author,
        Workflow workflow,
        Stats stats,
        ViewerActions viewerActions
) {
    public record Media(
            String coverUrl,
            String posterUrl,
            String previewUrl,
            String sourceUrl,
            Long durationMs
    ) {
    }

    public record Author(
            String id,
            String displayName,
            String avatarUrl
    ) {
    }

    public record Workflow(
            String id,
            String title,
            boolean allowCopy
    ) {
    }

    public record Stats(
            long playCount,
            long likeCount,
            long favoriteCount,
            long commentCount
    ) {
    }

    public record ViewerActions(
            boolean liked,
            boolean favorited,
            boolean followedAuthor
    ) {
    }
}
