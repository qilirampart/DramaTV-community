package com.dramatv.community.publish.dto.response;

import java.time.OffsetDateTime;
import java.util.Map;

public record UploadPolicyResponse(
        String assetId,
        String uploadUrl,
        Map<String, String> headers,
        OffsetDateTime expiresAt
) {
}
