package com.dramatv.community.admin.users.dto.response;

public record AdminUserCreateResponse(
        String userId,
        String username,
        String displayName,
        String roleCode,
        String statusCode,
        String temporaryPassword,
        boolean adminRole,
        boolean canLogin
) {
}
