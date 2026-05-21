package com.dramatv.community.admin.users.dto.response;

public record AdminUserPasswordResetResponse(
        String userId,
        String passwordAction,
        String temporaryPassword,
        boolean canLogin,
        boolean sessionsRevoked
) {
}
