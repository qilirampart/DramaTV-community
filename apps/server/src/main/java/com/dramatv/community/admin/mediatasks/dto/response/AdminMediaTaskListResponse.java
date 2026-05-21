package com.dramatv.community.admin.mediatasks.dto.response;

import java.util.List;

public record AdminMediaTaskListResponse(
        Summary summary,
        List<Item> items
) {
    public record Summary(
            long totalTasks,
            long failedTasks,
            long retryableTasks,
            long todayTasks,
            long processingTasks
    ) {
    }

    public record Item(
            String taskId,
            String taskType,
            String targetType,
            String targetId,
            String targetTitle,
            String targetSummary,
            String targetAuthorId,
            String targetAuthorDisplayName,
            String queueName,
            int priorityLevel,
            String statusCode,
            int retryCount,
            int maxRetryCount,
            String errorMessage,
            String submittedAt,
            String startedAt,
            String finishedAt,
            boolean retryable
    ) {
    }
}
