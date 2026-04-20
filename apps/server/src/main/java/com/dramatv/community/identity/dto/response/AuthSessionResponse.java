package com.dramatv.community.identity.dto.response;

public record AuthSessionResponse(
        String id,
        String username,
        String displayName,
        String avatarUrl,
        String roleCode,
        String identityProvider,
        String externalSubject,
        CreatorProfile creatorProfile
) {
    public record CreatorProfile(
            String bio,
            String headline
    ) {
    }
}
