package com.dramatv.community.admin.users.dto.response;

public record AdminUserPasswordGovernanceResponse(
        boolean hasLocalPassword,
        boolean canInitializePassword,
        boolean canResetPassword,
        String passwordActionLabel,
        String passwordHint
) {
}
