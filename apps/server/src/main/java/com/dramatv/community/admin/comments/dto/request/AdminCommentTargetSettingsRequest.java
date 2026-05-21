package com.dramatv.community.admin.comments.dto.request;

import jakarta.validation.constraints.NotNull;

public record AdminCommentTargetSettingsRequest(
        @NotNull Boolean commentsEnabled
) {
}
