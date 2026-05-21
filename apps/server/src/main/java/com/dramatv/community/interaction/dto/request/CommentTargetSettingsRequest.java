package com.dramatv.community.interaction.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CommentTargetSettingsRequest(
        @NotBlank String targetType,
        @NotBlank String targetId,
        boolean commentsEnabled
) {
}
