package com.dramatv.community.identity.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String loginType,
        @NotBlank String username,
        @NotBlank String password
) {
}
