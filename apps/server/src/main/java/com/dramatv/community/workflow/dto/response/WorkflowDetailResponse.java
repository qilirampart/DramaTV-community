package com.dramatv.community.workflow.dto.response;

import com.dramatv.community.video.dto.response.VideoSummaryResponse;
import java.util.List;

public record WorkflowDetailResponse(
        String id,
        String title,
        String summary,
        String scenarioText,
        List<String> tagNames,
        Author author,
        Permissions permissions,
        CanvasBinding canvasBinding,
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
