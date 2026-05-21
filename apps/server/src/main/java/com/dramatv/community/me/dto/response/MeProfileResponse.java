package com.dramatv.community.me.dto.response;

public record MeProfileResponse(
        String id,
        String displayName,
        String avatarUrl,
        String roleCode,
        String bio,
        String headline,
        MeHubResponse.Stats stats
) {
}
