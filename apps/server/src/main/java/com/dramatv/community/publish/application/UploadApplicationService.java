package com.dramatv.community.publish.application;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.ObjectMetadata;
import com.dramatv.community.publish.dto.request.UploadPolicyRequest;
import com.dramatv.community.publish.dto.response.UploadAssetResponse;
import com.dramatv.community.publish.dto.response.UploadPolicyResponse;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserService;
import com.dramatv.community.shared.config.MediaStorageProperties;
import com.dramatv.community.shared.error.ApiBusinessException;
import com.dramatv.community.shared.media.AliyunOssClientProvider;
import com.dramatv.community.shared.media.MediaAssetUrlResolver;
import com.dramatv.community.shared.request.MdcBusinessContextScope;
import com.dramatv.community.shared.security.ActionRateLimiter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class UploadApplicationService {

    private static final Logger log = LoggerFactory.getLogger(UploadApplicationService.class);
    private static final String STATUS_PENDING_UPLOAD = "pending_upload";
    private static final String STATUS_READY = "ready";
    private static final String ROLE_SOURCE = "source";
    private static final String ROLE_COVER = "cover";
    private static final String ROLE_PREVIEW = "preview";
    private static final String ROLE_POSTER = "poster";
    private static final String ROLE_AVATAR = "avatar";
    private static final String ROLE_ATTACHMENT = "attachment";
    private static final String CHECKSUM_ALGORITHM = "SHA-256";
    private static final int IO_BUFFER_SIZE = 16 * 1024;
    private static final List<String> ALLOWED_IMAGE_MIME_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    private static final List<String> ALLOWED_VIDEO_MIME_TYPES = List.of(
            "video/mp4",
            "video/quicktime",
            "video/webm"
    );
    private static final List<String> ALLOWED_AUDIO_MIME_TYPES = List.of(
            "audio/mpeg",
            "audio/mp4",
            "audio/wav",
            "audio/x-wav",
            "audio/webm",
            "audio/ogg"
    );
    private static final List<String> ALLOWED_IMAGE_EXTENSIONS = List.of(
            "jpg",
            "jpeg",
            "png",
            "webp"
    );
    private static final List<String> ALLOWED_VIDEO_EXTENSIONS = List.of(
            "mp4",
            "mov",
            "webm"
    );
    private static final List<String> ALLOWED_AUDIO_EXTENSIONS = List.of(
            "mp3",
            "m4a",
            "wav",
            "webm",
            "ogg"
    );

    private final JdbcTemplate jdbcTemplate;
    private final Path mediaLocalDir;
    private final MediaStorageProperties mediaStorageProperties;
    private final MediaAssetUrlResolver mediaAssetUrlResolver;
    private final AliyunOssClientProvider aliyunOssClientProvider;
    private final CurrentUserService currentUserService;
    private final ActionRateLimiter actionRateLimiter;

    public UploadApplicationService(
            JdbcTemplate jdbcTemplate,
            MediaStorageProperties mediaStorageProperties,
            MediaAssetUrlResolver mediaAssetUrlResolver,
            AliyunOssClientProvider aliyunOssClientProvider,
            CurrentUserService currentUserService,
            ActionRateLimiter actionRateLimiter
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.mediaStorageProperties = mediaStorageProperties;
        this.mediaLocalDir = mediaStorageProperties.resolvedLocalDirPath();
        this.mediaAssetUrlResolver = mediaAssetUrlResolver;
        this.aliyunOssClientProvider = aliyunOssClientProvider;
        this.currentUserService = currentUserService;
        this.actionRateLimiter = actionRateLimiter;
    }

    public UploadPolicyResponse createVideoPolicy(UploadPolicyRequest request) {
        return createPolicy("video", request, maxSizeBytesFor("video"));
    }

    public UploadPolicyResponse createImagePolicy(UploadPolicyRequest request) {
        return createPolicy("image", request, maxSizeBytesFor("image"));
    }

    public UploadPolicyResponse createAudioPolicy(UploadPolicyRequest request) {
        return createPolicy("audio", request, maxSizeBytesFor("audio"));
    }

    public UploadAssetResponse uploadBinary(
            String assetIdText,
            String contentType,
            long contentLength,
            InputStream inputStream
    ) {
        assertSupportedUploadMode();
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        UUID assetId = parseAssetId(assetIdText);
        RegisteredAsset asset = findRegisteredAsset(assetId);
        validateAssetOwnership(asset, currentUser.id());
        actionRateLimiter.checkUploadBinary(currentUser.id());
        validateUploadState(asset);
        long maxSizeBytes = maxSizeBytesFor(asset.assetKind());
        validateActualSize(asset.assetKind(), contentLength, maxSizeBytes);

        String effectiveMimeType = normalizeMimeType(contentType == null || contentType.isBlank()
                ? asset.mimeType()
                : contentType);
        validateMime(effectiveMimeType, asset.assetKind());
        validateBinaryMimeConsistency(asset, effectiveMimeType);

        MaterializedUpload upload = materializeUpload(inputStream);
        long sizeBytes = upload.sizeBytes();

        ReusableAsset reusableAsset = null;
        try {
            validateActualSize(asset.assetKind(), sizeBytes, maxSizeBytes);
            if (sizeBytes <= 0) {
                throw ApiBusinessException.badRequest("UPLOAD_EMPTY_FILE", "upload file is empty");
            }

            reusableAsset = findReusableReadyAsset(asset, upload.checksum(), sizeBytes);
            if (reusableAsset == null) {
                try (InputStream body = Files.newInputStream(upload.path())) {
                    sizeBytes = uploadByProvider(asset, effectiveMimeType, sizeBytes, body);
                } catch (IOException ex) {
                    throw ApiBusinessException.internalError("UPLOAD_WRITE_FAILED", "upload write failed");
                }
            }
        } finally {
            cleanupTempFile(upload.path());
        }

        String resolvedObjectKey = reusableAsset == null ? asset.objectKey() : reusableAsset.objectKey();
        markAssetReady(asset.id(), effectiveMimeType, sizeBytes, upload.checksum(), resolvedObjectKey);

        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(assetContext(asset.id()))) {
            log.info(
                    "upload binary success: userId={} assetId={} assetKind={} assetRole={} storageProvider={} declaredSizeBytes={} actualSizeBytes={} statusCode={} mimeType={} checksum={} reusedObjectKey={}",
                    currentUser.id(),
                    asset.id(),
                    asset.assetKind(),
                    asset.assetRole(),
                    asset.storageProvider(),
                    asset.declaredSizeBytes(),
                    sizeBytes,
                    STATUS_READY,
                    effectiveMimeType,
                    upload.checksum(),
                    reusableAsset != null
            );
        }

        return new UploadAssetResponse(
                asset.id().toString(),
                asset.assetKind(),
                asset.assetRole(),
                STATUS_READY,
                mediaAssetUrlResolver.toMediaPath(asset.storageProvider(), asset.bucketName(), resolvedObjectKey),
                resolvePublicUrl(asset.storageProvider(), asset.bucketName(), resolvedObjectKey),
                sizeBytes
        );
    }

    public StoredAsset storeDerivedAsset(
            String assetKind,
            String assetRole,
            String fileName,
            String mimeType,
            Path sourcePath,
            UUID createdBy,
            Integer durationMs
    ) {
        assertSupportedUploadMode();

        String normalizedAssetKind = normalizeAssetKind(assetKind);
        String normalizedAssetRole = normalizeAssetRole(normalizedAssetKind, assetRole);
        String normalizedMimeType = normalizeMimeType(mimeType);
        validateMime(normalizedMimeType, normalizedAssetKind);
        validateFileExtension(fileName, normalizedAssetKind);

        long declaredSize;
        try {
            declaredSize = Files.size(sourcePath);
        } catch (IOException ex) {
            throw ApiBusinessException.internalError(
                    "UPLOAD_DERIVED_SOURCE_READ_FAILED",
                    "derived asset source file could not be read"
            );
        }
        validateActualSize(normalizedAssetKind, declaredSize, maxSizeBytesFor(normalizedAssetKind));

        String checksum = computeChecksum(sourcePath);
        ReusableAsset reusableAsset = findReusableReadyAsset(
                normalizedAssetKind,
                normalizedAssetRole,
                mediaStorageProperties.getStorageProvider(),
                mediaStorageProperties.getBucketName(),
                checksum,
                declaredSize
        );
        boolean reuseExistingObject = reusableAsset != null;

        UUID assetId = UUID.randomUUID();
        String safeFileName = safeFileName(fileName);
        String objectKey = reuseExistingObject
                ? reusableAsset.objectKey()
                : buildObjectKey(normalizedAssetKind, normalizedAssetRole, assetId, safeFileName);
        String initialStatus = reuseExistingObject ? STATUS_READY : STATUS_PENDING_UPLOAD;

        jdbcTemplate.update("""
                insert into media_assets (
                    id, asset_kind, asset_role, storage_provider, bucket_name, object_key,
                    file_name, mime_type, size_bytes, duration_ms, checksum, status_code, is_public, created_by, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), now())
                """,
                assetId,
                normalizedAssetKind,
                normalizedAssetRole,
                mediaStorageProperties.getStorageProvider(),
                mediaStorageProperties.getBucketName(),
                objectKey,
                safeFileName,
                normalizedMimeType,
                declaredSize,
                durationMs,
                checksum,
                initialStatus,
                true,
                createdBy
        );

        if (reuseExistingObject) {
            return new StoredAsset(
                    assetId,
                    normalizedAssetKind,
                    normalizedAssetRole,
                    objectKey,
                    mediaAssetUrlResolver.toMediaPath(
                            mediaStorageProperties.getStorageProvider(),
                            mediaStorageProperties.getBucketName(),
                            objectKey
                    ),
                    resolvePublicUrl(
                            mediaStorageProperties.getStorageProvider(),
                            mediaStorageProperties.getBucketName(),
                            objectKey
                    ),
                    declaredSize
            );
        }

        RegisteredAsset asset = new RegisteredAsset(
                assetId,
                normalizedAssetKind,
                normalizedAssetRole,
                safeFileName,
                normalizedMimeType,
                mediaStorageProperties.getStorageProvider(),
                mediaStorageProperties.getBucketName(),
                objectKey,
                STATUS_PENDING_UPLOAD,
                declaredSize,
                createdBy
        );

        try (InputStream inputStream = Files.newInputStream(sourcePath)) {
            long actualSizeBytes = uploadByProvider(asset, normalizedMimeType, declaredSize, inputStream);
            jdbcTemplate.update("""
                    update media_assets
                    set mime_type = ?,
                        size_bytes = ?,
                        duration_ms = coalesce(?, duration_ms),
                        checksum = ?,
                        status_code = ?,
                        updated_at = now()
                    where id = ?
                    """,
                    normalizedMimeType,
                    actualSizeBytes,
                    durationMs,
                    checksum,
                    STATUS_READY,
                    assetId
            );

            return new StoredAsset(
                    assetId,
                    normalizedAssetKind,
                    normalizedAssetRole,
                    objectKey,
                    mediaAssetUrlResolver.toMediaPath(asset.storageProvider(), asset.bucketName(), asset.objectKey()),
                    resolvePublicUrl(asset.storageProvider(), asset.bucketName(), asset.objectKey()),
                    actualSizeBytes
            );
        } catch (IOException ex) {
            jdbcTemplate.update("delete from media_assets where id = ?", assetId);
            throw ApiBusinessException.internalError(
                    "UPLOAD_DERIVED_SOURCE_READ_FAILED",
                    "derived asset source file could not be read"
            );
        } catch (RuntimeException ex) {
            jdbcTemplate.update("delete from media_assets where id = ?", assetId);
            throw ex;
        }
    }

    private UploadPolicyResponse createPolicy(
            String assetKind,
            UploadPolicyRequest request,
            long maxSizeBytes
    ) {
        assertSupportedUploadMode();
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        validateSize(request.sizeBytes(), maxSizeBytes);
        String normalizedMimeType = normalizeMimeType(request.mimeType());
        validateMime(normalizedMimeType, assetKind);
        validateFileExtension(request.fileName(), assetKind);
        String assetRole = normalizeAssetRole(assetKind, request.assetRole());
        actionRateLimiter.checkUploadPolicy(currentUser.id());

        UUID assetId = UUID.randomUUID();
        String objectKey = buildObjectKey(assetKind, assetRole, assetId, request.fileName());

        jdbcTemplate.update("""
                insert into media_assets (
                    id, asset_kind, asset_role, storage_provider, bucket_name, object_key,
                    file_name, mime_type, size_bytes, status_code, is_public, created_by, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), now())
                """,
                assetId,
                assetKind,
                assetRole,
                mediaStorageProperties.getStorageProvider(),
                mediaStorageProperties.getBucketName(),
                objectKey,
                request.fileName().trim(),
                normalizedMimeType,
                request.sizeBytes(),
                STATUS_PENDING_UPLOAD,
                true,
                currentUser.id()
        );

        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(assetContext(assetId))) {
            log.info(
                    "upload policy created: userId={} assetId={} assetKind={} assetRole={} storageProvider={} declaredSizeBytes={} mimeType={} fileName={}",
                    currentUser.id(),
                    assetId,
                    assetKind,
                    assetRole,
                    mediaStorageProperties.getStorageProvider(),
                    request.sizeBytes(),
                    normalizedMimeType,
                    request.fileName().trim()
            );
        }

        return new UploadPolicyResponse(
                assetId.toString(),
                assetKind,
                assetRole,
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

    private Map<String, String> assetContext(UUID assetId) {
        return Map.of("assetId", assetId.toString());
    }

    private void validateActualSize(String assetKind, long sizeBytes, long maxSizeBytes) {
        if (sizeBytes <= 0) {
            return;
        }

        if (sizeBytes > maxSizeBytes) {
            throw ApiBusinessException.badRequest("UPLOAD_FILE_TOO_LARGE", assetKind + " file is too large");
        }
    }

    private void validateMime(String mimeType, String assetKind) {
        if (mimeType == null) {
            throw ApiBusinessException.badRequest("UPLOAD_MIME_NOT_ALLOWED", "upload mime type is not allowed");
        }

        List<String> allowedMimeTypes = switch (assetKind) {
            case "image" -> ALLOWED_IMAGE_MIME_TYPES;
            case "video" -> ALLOWED_VIDEO_MIME_TYPES;
            case "audio" -> ALLOWED_AUDIO_MIME_TYPES;
            default -> List.of();
        };
        if (!allowedMimeTypes.contains(mimeType)) {
            throw ApiBusinessException.badRequest("UPLOAD_MIME_NOT_ALLOWED", "upload mime type is not allowed");
        }
    }

    private void validateBinaryMimeConsistency(RegisteredAsset asset, String actualMimeType) {
        String declaredMimeType = normalizeMimeType(asset.mimeType());
        if (declaredMimeType == null || actualMimeType == null) {
            return;
        }
        if (!declaredMimeType.equals(actualMimeType)) {
            throw ApiBusinessException.badRequest(
                    "UPLOAD_CONTENT_TYPE_MISMATCH",
                    "upload content type does not match registered asset"
            );
        }
    }

    private void validateFileExtension(String fileName, String assetKind) {
        String extension = extractExtension(fileName);
        if (extension == null) {
            throw ApiBusinessException.badRequest(
                    "UPLOAD_FILE_EXTENSION_NOT_ALLOWED",
                    "upload file extension is not allowed"
            );
        }

        List<String> allowedExtensions = switch (assetKind) {
            case "image" -> ALLOWED_IMAGE_EXTENSIONS;
            case "video" -> ALLOWED_VIDEO_EXTENSIONS;
            case "audio" -> ALLOWED_AUDIO_EXTENSIONS;
            default -> List.of();
        };
        if (!allowedExtensions.contains(extension)) {
            throw ApiBusinessException.badRequest(
                    "UPLOAD_FILE_EXTENSION_NOT_ALLOWED",
                    "upload file extension is not allowed"
            );
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

    private String normalizeAssetKind(String assetKind) {
        String normalized = assetKind == null ? "" : assetKind.trim().toLowerCase();
        if ("image".equals(normalized) || "video".equals(normalized) || "audio".equals(normalized)) {
            return normalized;
        }
        throw ApiBusinessException.badRequest("UPLOAD_ASSET_KIND_INVALID", "upload asset kind is invalid");
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
                select id, asset_kind, asset_role, file_name, mime_type, storage_provider, bucket_name, object_key, status_code, size_bytes, created_by
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
                            resultSet.getString("asset_role"),
                            resultSet.getString("file_name"),
                            resultSet.getString("mime_type"),
                            resultSet.getString("storage_provider"),
                            resultSet.getString("bucket_name"),
                            resultSet.getString("object_key"),
                            resultSet.getString("status_code"),
                            resultSet.getLong("size_bytes"),
                            (UUID) resultSet.getObject("created_by")
                    );
                },
                assetId
        );

        if (asset == null) {
            throw ApiBusinessException.badRequest("UPLOAD_ASSET_NOT_FOUND", "upload asset does not exist");
        }

        return asset;
    }

    private void validateAssetOwnership(RegisteredAsset asset, UUID currentUserId) {
        if (asset.createdBy() == null || currentUserId == null || !asset.createdBy().equals(currentUserId)) {
            throw ApiBusinessException.forbidden("UPLOAD_ASSET_FORBIDDEN", "upload asset does not belong to current user");
        }
    }

    private void validateUploadState(RegisteredAsset asset) {
        if (STATUS_READY.equals(asset.statusCode())) {
            throw ApiBusinessException.conflict("UPLOAD_ASSET_ALREADY_READY", "upload asset is already ready");
        }

        if (!STATUS_PENDING_UPLOAD.equals(asset.statusCode())) {
            throw ApiBusinessException.conflict("UPLOAD_ASSET_STATUS_INVALID", "upload asset status is invalid");
        }
    }

    private String normalizeAssetRole(String assetKind, String assetRole) {
        String normalizedRole = assetRole == null ? "" : assetRole.trim().toLowerCase();
        if (normalizedRole.isEmpty()) {
            return ROLE_SOURCE;
        }

        if ("video".equals(assetKind)) {
            if (ROLE_SOURCE.equals(normalizedRole)
                    || ROLE_PREVIEW.equals(normalizedRole)
                    || ROLE_ATTACHMENT.equals(normalizedRole)) {
                return normalizedRole;
            }
        } else if ("image".equals(assetKind)) {
            if (ROLE_SOURCE.equals(normalizedRole)
                    || ROLE_COVER.equals(normalizedRole)
                    || ROLE_POSTER.equals(normalizedRole)
                    || ROLE_AVATAR.equals(normalizedRole)
                    || ROLE_ATTACHMENT.equals(normalizedRole)) {
                return normalizedRole;
            }
        } else if ("audio".equals(assetKind)) {
            if (ROLE_SOURCE.equals(normalizedRole)
                    || ROLE_ATTACHMENT.equals(normalizedRole)) {
                return normalizedRole;
            }
        }

        throw ApiBusinessException.badRequest("UPLOAD_ASSET_ROLE_INVALID", "upload asset role is invalid");
    }

    private long maxSizeBytesFor(String assetKind) {
        return switch (assetKind) {
            case "image" -> mediaStorageProperties.getUpload().getMaxImageSizeBytes();
            case "video" -> mediaStorageProperties.getUpload().getMaxVideoSizeBytes();
            case "audio" -> mediaStorageProperties.getUpload().getMaxAudioSizeBytes();
            default -> mediaStorageProperties.getUpload().getMaxVideoSizeBytes();
        };
    }

    private void assertSupportedUploadMode() {
        String storageProvider = normalizeStorageProvider(mediaStorageProperties.getStorageProvider());
        if ("local_fs".equals(storageProvider) || "oss".equals(storageProvider)) {
            return;
        }

        throw ApiBusinessException.conflict(
                "UPLOAD_PROVIDER_NOT_READY",
                "current upload implementation only supports local_fs or oss storage"
        );
    }

    private long uploadByProvider(
            RegisteredAsset asset,
            String effectiveMimeType,
            long contentLength,
            InputStream inputStream
    ) {
        String storageProvider = normalizeStorageProvider(asset.storageProvider());
        if ("oss".equals(storageProvider)) {
            return uploadToOss(asset, effectiveMimeType, contentLength, inputStream);
        }

        if ("local_fs".equals(storageProvider)) {
            return uploadToLocalFileSystem(asset, contentLength, inputStream);
        }

        throw ApiBusinessException.conflict(
                "UPLOAD_PROVIDER_NOT_READY",
                "upload asset storage provider is not supported"
        );
    }

    private long uploadToLocalFileSystem(
            RegisteredAsset asset,
            long contentLength,
            InputStream inputStream
    ) {
        Path targetPath = resolveStoragePath(asset.objectKey());
        long sizeBytes;

        try {
            Files.createDirectories(targetPath.getParent());
            try (InputStream body = inputStream) {
                sizeBytes = Files.copy(body, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            throw ApiBusinessException.internalError("UPLOAD_WRITE_FAILED", "upload write failed");
        }

        long maxSizeBytes = maxSizeBytesFor(asset.assetKind());
        if (sizeBytes > maxSizeBytes) {
            cleanupFailedUpload(targetPath);
            throw ApiBusinessException.badRequest("UPLOAD_FILE_TOO_LARGE", "upload file is too large");
        }

        if (sizeBytes <= 0) {
            cleanupFailedUpload(targetPath);
            throw ApiBusinessException.badRequest("UPLOAD_EMPTY_FILE", "upload file is empty");
        }

        return sizeBytes;
    }

    private long uploadToOss(
            RegisteredAsset asset,
            String effectiveMimeType,
            long contentLength,
            InputStream inputStream
    ) {
        long resolvedSize = contentLength > 0 ? contentLength : asset.declaredSizeBytes();
        if (resolvedSize <= 0) {
            throw ApiBusinessException.badRequest("UPLOAD_EMPTY_FILE", "upload file is empty");
        }

        ObjectMetadata objectMetadata = new ObjectMetadata();
        objectMetadata.setContentType(effectiveMimeType);
        objectMetadata.setContentLength(resolvedSize);

        OSS ossClient = aliyunOssClientProvider.currentClient();
        try (InputStream body = inputStream) {
            ossClient.putObject(asset.bucketName(), asset.objectKey(), body, objectMetadata);
        } catch (Exception ex) {
            throw ApiBusinessException.internalError("UPLOAD_OSS_WRITE_FAILED", "upload write failed");
        }

        return resolvedSize;
    }

    private String normalizeStorageProvider(String storageProvider) {
        return storageProvider == null ? "" : storageProvider.trim().toLowerCase();
    }

    private Path resolveStoragePath(String objectKey) {
        Path relativePath = Path.of(objectKey.replace('/', java.io.File.separatorChar));
        Path targetPath = mediaLocalDir.resolve(relativePath).normalize();
        if (!targetPath.startsWith(mediaLocalDir)) {
            throw ApiBusinessException.internalError("UPLOAD_PATH_INVALID", "upload path is invalid");
        }
        return targetPath;
    }

    private String buildObjectKey(String assetKind, String assetRole, UUID assetId, String fileName) {
        String safeFileName = safeFileName(fileName);
        String keyPrefix = mediaStorageProperties.normalizedKeyPrefix();
        if (keyPrefix.isEmpty()) {
            return assetKind + "/" + assetRole + "/" + assetId + "/" + safeFileName;
        }
        return keyPrefix + "/" + assetKind + "/" + assetRole + "/" + assetId + "/" + safeFileName;
    }

    private void cleanupFailedUpload(Path targetPath) {
        try {
            Files.deleteIfExists(targetPath);
        } catch (IOException ignored) {
            // Best effort cleanup for failed uploads.
        }
    }

    private MaterializedUpload materializeUpload(InputStream inputStream) {
        Path tempFile;
        try {
            tempFile = Files.createTempFile("dramatv-upload-", ".bin");
        } catch (IOException ex) {
            throw ApiBusinessException.internalError("UPLOAD_WRITE_FAILED", "upload write failed");
        }

        MessageDigest digest = newChecksumDigest();
        long sizeBytes = 0L;
        byte[] buffer = new byte[IO_BUFFER_SIZE];

        try (InputStream body = inputStream; OutputStream outputStream = Files.newOutputStream(tempFile)) {
            int read;
            while ((read = body.read(buffer)) >= 0) {
                if (read == 0) {
                    continue;
                }
                outputStream.write(buffer, 0, read);
                digest.update(buffer, 0, read);
                sizeBytes += read;
            }
        } catch (IOException ex) {
            cleanupTempFile(tempFile);
            throw ApiBusinessException.internalError("UPLOAD_WRITE_FAILED", "upload write failed");
        }

        return new MaterializedUpload(tempFile, sizeBytes, HexFormat.of().formatHex(digest.digest()));
    }

    private String computeChecksum(Path sourcePath) {
        MessageDigest digest = newChecksumDigest();
        byte[] buffer = new byte[IO_BUFFER_SIZE];

        try (InputStream inputStream = Files.newInputStream(sourcePath)) {
            int read;
            while ((read = inputStream.read(buffer)) >= 0) {
                if (read == 0) {
                    continue;
                }
                digest.update(buffer, 0, read);
            }
        } catch (IOException ex) {
            throw ApiBusinessException.internalError(
                    "UPLOAD_DERIVED_SOURCE_READ_FAILED",
                    "derived asset source file could not be read"
            );
        }

        return HexFormat.of().formatHex(digest.digest());
    }

    private MessageDigest newChecksumDigest() {
        try {
            return MessageDigest.getInstance(CHECKSUM_ALGORITHM);
        } catch (NoSuchAlgorithmException ex) {
            throw ApiBusinessException.internalError("UPLOAD_CHECKSUM_UNAVAILABLE", "upload checksum is unavailable");
        }
    }

    private ReusableAsset findReusableReadyAsset(RegisteredAsset asset, String checksum, long sizeBytes) {
        return findReusableReadyAsset(
                asset.assetKind(),
                asset.assetRole(),
                asset.storageProvider(),
                asset.bucketName(),
                checksum,
                sizeBytes
        );
    }

    private ReusableAsset findReusableReadyAsset(
            String assetKind,
            String assetRole,
            String storageProvider,
            String bucketName,
            String checksum,
            long sizeBytes
    ) {
        if (checksum == null || checksum.isBlank() || sizeBytes <= 0) {
            return null;
        }

        return jdbcTemplate.query("""
                select object_key
                from media_assets
                where asset_kind = ?
                  and asset_role = ?
                  and storage_provider = ?
                  and bucket_name = ?
                  and checksum = ?
                  and size_bytes = ?
                  and status_code = ?
                order by created_at asc, id asc
                limit 1
                """,
                resultSet -> resultSet.next() ? new ReusableAsset(resultSet.getString("object_key")) : null,
                assetKind,
                assetRole,
                storageProvider,
                bucketName,
                checksum,
                sizeBytes,
                STATUS_READY
        );
    }

    private void markAssetReady(UUID assetId, String mimeType, long sizeBytes, String checksum, String objectKey) {
        jdbcTemplate.update("""
                update media_assets
                set mime_type = ?,
                    size_bytes = ?,
                    checksum = ?,
                    object_key = ?,
                    status_code = ?,
                    updated_at = now()
                where id = ?
                """,
                mimeType,
                sizeBytes,
                checksum,
                objectKey,
                STATUS_READY,
                assetId
        );
    }

    private void cleanupTempFile(Path tempFile) {
        if (tempFile == null) {
            return;
        }
        try {
            Files.deleteIfExists(tempFile);
        } catch (IOException ignored) {
            // Best effort cleanup for temporary uploads.
        }
    }

    private String resolvePublicUrl(String storageProvider, String bucketName, String objectKey) {
        return mediaAssetUrlResolver.resolve(storageProvider, bucketName, objectKey);
    }

    private String safeFileName(String fileName) {
        String sanitized = fileName == null ? "" : fileName.trim().replaceAll("[^A-Za-z0-9._-]", "-");
        if (sanitized.isBlank()) {
            return "upload.bin";
        }
        return sanitized;
    }

    private String extractExtension(String fileName) {
        String normalized = safeFileName(fileName);
        int dotIndex = normalized.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == normalized.length() - 1) {
            return null;
        }
        return normalized.substring(dotIndex + 1).toLowerCase();
    }

    private record RegisteredAsset(
            UUID id,
            String assetKind,
            String assetRole,
            String fileName,
            String mimeType,
            String storageProvider,
            String bucketName,
            String objectKey,
            String statusCode,
            long declaredSizeBytes,
            UUID createdBy
    ) {
    }

    private record ReusableAsset(
            String objectKey
    ) {
    }

    private record MaterializedUpload(
            Path path,
            long sizeBytes,
            String checksum
    ) {
    }

    public record StoredAsset(
            UUID id,
            String assetKind,
            String assetRole,
            String objectKey,
            String mediaPath,
            String publicUrl,
            long sizeBytes
    ) {
    }
}
