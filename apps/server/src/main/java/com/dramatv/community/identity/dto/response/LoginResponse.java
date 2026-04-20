package com.dramatv.community.identity.dto.response;

public record LoginResponse(
        String accessToken,
        long expiresIn,
        AuthUser user
) {
    public record AuthUser(
            String id,
            String displayName,
            String roleCode
    ) {
    }
}
