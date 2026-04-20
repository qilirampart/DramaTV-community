package com.dramatv.community.interaction.dto.response;

public record ActionStateResponse(
        String action,
        String targetId,
        boolean active
) {
}
