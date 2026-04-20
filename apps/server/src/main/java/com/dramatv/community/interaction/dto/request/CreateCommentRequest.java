package com.dramatv.community.interaction.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreateCommentRequest(
        @NotBlank String targetType,
        @NotBlank String targetId,
        @NotBlank String content,
        String parentId
) {
}
