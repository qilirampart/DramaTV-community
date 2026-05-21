package com.dramatv.community.me.dto.request;

public record UpdateMeProfileRequest(
        String displayName,
        String bio,
        String headline,
        String avatarAssetId,
        String avatarUrl
) {
}
