package com.dramatv.community.admin.users.dto.response;

public record AdminUserGovernanceUpdateResponse(
        String userId,
        String roleCode,
        String statusCode,
        boolean adminRole,
        boolean canLogin,
        boolean canPublish
) {
}
