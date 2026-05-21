package com.dramatv.community.publish.dto.response;

public record MediaTaskSummaryResponse(
        String taskId,
        String taskType,
        String targetType,
        String targetId,
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
