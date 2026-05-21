package com.dramatv.community.workflow.dto.response;

import com.dramatv.community.video.dto.response.VideoSummaryResponse;
import java.util.List;

public record WorkflowDetailResponse(
        String id,
        String title,
        String summary,
        String scenarioText,
        String coverUrl,
        ExampleMedia exampleMedia,
        List<String> tagNames,
        Author author,
        Permissions permissions,
        CanvasBinding canvasBinding,
        CommentPolicy commentPolicy,
        Stats stats,
        List<VideoSummaryResponse> relatedVideos,
        ViewerActions viewerActions
) {
    public record Author(
            String id,
            String displayName,
            String avatarUrl
    ) {
    }

    public record Permissions(
            boolean allowCopy,
            boolean allowFork
    ) {
    }

    public record CanvasBinding(
            String bindingType,
            String openUrl,
            boolean canCopy
    ) {
    }

    public record ExampleMedia(
            String assetKind,
            String url
    ) {
    }

    public record CommentPolicy(
            boolean commentingEnabled,
            boolean canManageComments
    ) {
    }

    public record Stats(
            long likeCount,
            long favoriteCount,
            long commentCount,
            long videoBindCount
    ) {
    }

    public record ViewerActions(
            boolean liked,
            boolean favorited
    ) {
    }
}
