package com.dramatv.community.publish.dto.response;

public record UploadAssetResponse(
        String assetId,
        String assetKind,
        String assetRole,
        String statusCode,
        String mediaPath,
        String publicUrl,
        long sizeBytes
) {
}
