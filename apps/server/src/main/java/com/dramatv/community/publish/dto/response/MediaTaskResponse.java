package com.dramatv.community.publish.dto.response;

public record MediaTaskResponse(
        String taskId,
        String taskType,
        String targetType,
        String targetId,
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
