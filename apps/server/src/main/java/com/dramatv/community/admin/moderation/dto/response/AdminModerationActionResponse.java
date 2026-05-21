package com.dramatv.community.admin.moderation.dto.response;

public record AdminModerationActionResponse(
        String action,
        String targetType,
        String targetId,
        String statusCode
) {
}
