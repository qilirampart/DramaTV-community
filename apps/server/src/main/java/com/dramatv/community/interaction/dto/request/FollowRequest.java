package com.dramatv.community.interaction.dto.request;

import jakarta.validation.constraints.NotBlank;

public record FollowRequest(
        @NotBlank String followeeId
) {
}
