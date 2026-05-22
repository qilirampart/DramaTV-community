package com.dramatv.community.admin.users.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminUserCreateRequest(
        @NotBlank
        @Size(max = 64)
        String username,
        @NotBlank
        @Size(max = 64)
        String displayName,
        @NotBlank
        @Size(max = 32)
        String roleCode,
        @Size(max = 128)
        String email,
        @Size(max = 32)
        String phone,
        @Size(max = 128)
        String password
) {
}
