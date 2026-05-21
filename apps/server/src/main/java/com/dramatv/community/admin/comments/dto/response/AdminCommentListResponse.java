package com.dramatv.community.admin.comments.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record AdminCommentListResponse(
        Summary summary,
        List<Item> items
) {
    public record Summary(
            long todayComments,
            long reportedComments,
            long hiddenComments,
            long closedTargets
    ) {
    }

    public record Item(
            String id,
            String targetType,
            String targetId,
            String targetTitle,
            String targetPromptModality,
            boolean targetCommentsEnabled,
            String authorId,
            String authorDisplayName,
            String authorAvatarUrl,
            String contentText,
            String parentId,
            String parentAuthorDisplayName,
            String parentContentText,
            String statusCode,
            OffsetDateTime createdAt,
            long reportCount,
            long openReportCount,
            String latestReportReasonCode,
            String riskLevel
    ) {
    }
}
