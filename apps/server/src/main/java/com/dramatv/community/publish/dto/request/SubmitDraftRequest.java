package com.dramatv.community.publish.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SubmitDraftRequest(
        @NotBlank String submitMode
) {
}
