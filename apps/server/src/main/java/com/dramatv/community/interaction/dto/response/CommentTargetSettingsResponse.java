package com.dramatv.community.interaction.dto.response;

public record CommentTargetSettingsResponse(
        String targetType,
        String targetId,
        boolean commentsEnabled,
        boolean canManageComments
) {
}
