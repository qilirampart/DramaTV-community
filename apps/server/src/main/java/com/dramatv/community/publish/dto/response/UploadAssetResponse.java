package com.dramatv.community.publish.dto.response;

public record UploadAssetResponse(
        String assetId,
        String statusCode,
        String publicUrl,
        long sizeBytes
) {
}
