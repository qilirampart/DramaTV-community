package com.dramatv.community.admin.users.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AdminUserGovernanceUpdateRequest(
        @NotBlank String roleCode,
        @NotBlank String statusCode
) {
}
