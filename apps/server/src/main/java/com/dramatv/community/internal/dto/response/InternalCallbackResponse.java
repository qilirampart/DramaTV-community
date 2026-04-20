package com.dramatv.community.internal.dto.response;

public record InternalCallbackResponse(
        String taskId,
        String statusCode,
        String acceptedAt
) {
}
