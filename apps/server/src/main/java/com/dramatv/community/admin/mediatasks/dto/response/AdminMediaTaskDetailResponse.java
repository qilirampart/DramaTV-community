package com.dramatv.community.admin.mediatasks.dto.response;

import java.util.List;

public record AdminMediaTaskDetailResponse(
        String taskId,
        String taskType,
        String targetType,
        String targetId,
        String targetTitle,
        String targetSummary,
        String targetStatusCode,
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
        boolean retryable,
        PayloadSummary payloadSummary,
        String resultJson,
        List<CallbackLog> callbackLogs
) {
    public record PayloadSummary(
            String draftId,
            String submitMode,
            String sourceAssetId,
            String coverAssetId,
            String workflowId,
            List<String> desiredOutputs
    ) {
    }

    public record CallbackLog(
            String id,
            String callbackType,
            String sourceName,
            String requestId,
            String verifyStatus,
            String processStatus,
            String rawPayloadJson,
            String createdAt
    ) {
    }
}
