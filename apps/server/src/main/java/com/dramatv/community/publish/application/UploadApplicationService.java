package com.dramatv.community.publish.application;

import com.dramatv.community.publish.dto.request.UploadPolicyRequest;
import com.dramatv.community.publish.dto.response.UploadAssetResponse;
import com.dramatv.community.publish.dto.response.UploadPolicyResponse;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserService;
import com.dramatv.community.shared.error.ApiBusinessException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Service
public class UploadApplicationService {

    private static final long MAX_VIDEO_SIZE_BYTES = 300L * 1024 * 1024;
    private static final long MAX_IMAGE_SIZE_BYTES = 20L * 1024 * 1024;
    private static final String STORAGE_PROVIDER = "local_fs";
    private static final String BUCKET_NAME = "dramatv-local-media";
    private static final String STATUS_PENDING_UPLOAD = "pending_upload";
    private static final String STATUS_READY = "ready";

    private final JdbcTemplate jdbcTemplate;
    private final Path mediaLocalDir;
    private final CurrentUserService currentUserService;

    public UploadApplicationService(
            JdbcTemplate jdbcTemplate,
            @Value("${dramatv.media.local-dir:tmp/media}") String mediaLocalDir,
            CurrentUserService currentUserService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.mediaLocalDir = Path.of(mediaLocalDir).toAbsolutePath().normalize();
        this.currentUserService = currentUserService;
    }

    public UploadPolicyResponse createVideoPolicy(UploadPolicyRequest request) {
        return createPolicy("video", request, MAX_VIDEO_SIZE_BYTES, "video/");
    }

    public UploadPolicyResponse createImagePolicy(UploadPolicyRequest request) {
        return createPolicy("image", request, MAX_IMAGE_SIZE_BYTES, "image/");
    }

    public UploadAssetResponse uploadBinary(String assetIdText, String contentType, InputStream inputStream) {
        UUID assetId = parseAssetId(assetIdText);
        RegisteredAsset asset = findRegisteredAsset(assetId);
        validateUploadState(asset);

        String effectiveMimeType = normalizeMimeType(contentType == null || contentType.isBlank()
                ? asset.mimeType()
                : contentType);
        validateMime(effectiveMimeType, expectedMimePrefix(asset.assetKind()));

        Path targetPath = resolveStoragePath(asset.assetKind(), asset.id(), asset.fileName());
        long sizeBytes;

        try {
            Files.createDirectories(targetPath.getParent());
            try (InputStream body = inputStream) {
                sizeBytes = Files.copy(body, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            throw ApiBusinessException.internalError("UPLOAD_WRITE_FAILED", "upload write failed");
        }

        if (sizeBytes <= 0) {
            try {
                Files.deleteIfExists(targetPath);
            } catch (IOException ignored) {
                // Best effort cleanup for empty uploads.
            }
            throw ApiBusinessException.badRequest("UPLOAD_EMPTY_FILE", "upload file is empty");
        }

        jdbcTemplate.update("""
                update media_assets
                set mime_type = ?,
                    size_bytes = ?,
                    status_code = ?,
                    updated_at = now()
                where id = ?
                """,
                effectiveMimeType,
                sizeBytes,
                STATUS_READY,
                asset.id()
        );

        return new UploadAssetResponse(
                asset.id().toString(),
                STATUS_READY,
                asset.objectKey(),
                sizeBytes
        );
    }

    private UploadPolicyResponse createPolicy(
            String assetKind,
            UploadPolicyRequest request,
            long maxSizeBytes,
            String expectedMimePrefix
    ) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        validateSize(request.sizeBytes(), maxSizeBytes);
        String normalizedMimeType = normalizeMimeType(request.mimeType());
        validateMime(normalizedMimeType, expectedMimePrefix);

        UUID assetId = UUID.randomUUID();
        String publicPath = buildPublicPath(assetKind, assetId, request.fileName());
        String publicUrl = buildPublicUrl(publicPath);

        jdbcTemplate.update("""
                insert into media_assets (
                    id, asset_kind, storage_provider, bucket_name, object_key,
                    file_name, mime_type, size_bytes, status_code, is_public, created_by, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), now())
                """,
                assetId,
                assetKind,
                STORAGE_PROVIDER,
                BUCKET_NAME,
                publicUrl,
                request.fileName().trim(),
                normalizedMimeType,
                request.sizeBytes(),
                STATUS_PENDING_UPLOAD,
                true,
                currentUser.id()
        );

        return new UploadPolicyResponse(
                assetId.toString(),
                "/api/uploads/assets/" + assetId + "/binary",
                Map.of(),
                OffsetDateTime.now().plusMinutes(30)
        );
    }

    private void validateSize(long sizeBytes, long maxSizeBytes) {
        if (sizeBytes > maxSizeBytes) {
            throw ApiBusinessException.badRequest("UPLOAD_FILE_TOO_LARGE", "upload file is too large");
        }
    }

    private void validateMime(String mimeType, String expectedPrefix) {
        if (mimeType == null || !mimeType.startsWith(expectedPrefix)) {
            throw ApiBusinessException.badRequest("UPLOAD_MIME_NOT_ALLOWED", "upload mime type is not allowed");
        }
    }

    private String normalizeMimeType(String mimeType) {
        if (mimeType == null) {
            return null;
        }

        String normalized = mimeType.trim().toLowerCase();
        int separatorIndex = normalized.indexOf(';');
        return separatorIndex >= 0 ? normalized.substring(0, separatorIndex).trim() : normalized;
    }

    private UUID parseAssetId(String assetIdText) {
        try {
            return UUID.fromString(assetIdText);
        } catch (IllegalArgumentException ex) {
            throw ApiBusinessException.badRequest("UPLOAD_ASSET_ID_INVALID", "upload asset id is invalid");
        }
    }

    private RegisteredAsset findRegisteredAsset(UUID assetId) {
        RegisteredAsset asset = jdbcTemplate.query("""
                select id, asset_kind, file_name, mime_type, object_key, status_code
                from media_assets
                where id = ?
                """,
                resultSet -> {
                    if (!resultSet.next()) {
                        return null;
                    }

                    return new RegisteredAsset(
                            (UUID) resultSet.getObject("id"),
                            resultSet.getString("asset_kind"),
                            resultSet.getString("file_name"),
                            resultSet.getString("mime_type"),
                            resultSet.getString("object_key"),
                            resultSet.getString("status_code")
                    );
                },
                assetId
        );

        if (asset == null) {
            throw ApiBusinessException.badRequest("UPLOAD_ASSET_NOT_FOUND", "upload asset does not exist");
        }

        return asset;
    }

    private void validateUploadState(RegisteredAsset asset) {
        if (STATUS_READY.equals(asset.statusCode())) {
            throw ApiBusinessException.conflict("UPLOAD_ASSET_ALREADY_READY", "upload asset is already ready");
        }

        if (!STATUS_PENDING_UPLOAD.equals(asset.statusCode())) {
            throw ApiBusinessException.conflict("UPLOAD_ASSET_STATUS_INVALID", "upload asset status is invalid");
        }
    }

    private String expectedMimePrefix(String assetKind) {
        return "image".equals(assetKind) ? "image/" : "video/";
    }

    private Path resolveStoragePath(String assetKind, UUID assetId, String fileName) {
        Path relativePath = Path.of(assetKind, assetId.toString(), safeFileName(fileName));
        Path targetPath = mediaLocalDir.resolve(relativePath).normalize();
        if (!targetPath.startsWith(mediaLocalDir)) {
            throw ApiBusinessException.internalError("UPLOAD_PATH_INVALID", "upload path is invalid");
        }
        return targetPath;
    }

    private String buildPublicPath(String assetKind, UUID assetId, String fileName) {
        return "/media/" + assetKind + "/" + assetId + "/" + safeFileName(fileName);
    }

    private String buildPublicUrl(String publicPath) {
        try {
            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path(publicPath)
                    .toUriString();
        } catch (IllegalStateException ex) {
            return publicPath;
        }
    }

    private String safeFileName(String fileName) {
        String sanitized = fileName == null ? "" : fileName.trim().replaceAll("[^A-Za-z0-9._-]", "-");
        if (sanitized.isBlank()) {
            return "upload.bin";
        }
        return sanitized;
    }

    private record RegisteredAsset(
            UUID id,
            String assetKind,
            String fileName,
            String mimeType,
            String objectKey,
            String statusCode
    ) {
    }
}
