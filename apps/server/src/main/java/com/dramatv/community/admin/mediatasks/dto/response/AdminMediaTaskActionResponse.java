package com.dramatv.community.admin.mediatasks.dto.response;

public record AdminMediaTaskActionResponse(
        String action,
        String taskId,
        String statusCode,
        int retryCount,
        boolean retryable
) {
}
