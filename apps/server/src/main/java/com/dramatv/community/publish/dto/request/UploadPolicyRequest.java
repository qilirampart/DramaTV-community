package com.dramatv.community.publish.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record UploadPolicyRequest(
        @NotBlank String fileName,
        @NotBlank String mimeType,
        @Positive long sizeBytes
) {
}
