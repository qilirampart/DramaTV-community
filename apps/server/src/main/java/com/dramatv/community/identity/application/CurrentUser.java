package com.dramatv.community.identity.application;

import java.util.UUID;

public record CurrentUser(
        UUID id,
        String username,
        String displayName,
        String avatarUrl,
        String bio,
        String headline,
        String roleCode,
        String identityProvider,
        String externalSubject
) {
}
