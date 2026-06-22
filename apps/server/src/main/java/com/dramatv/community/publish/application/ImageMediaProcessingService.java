package com.dramatv.community.publish.application;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.OSSObject;
import com.dramatv.community.internal.dto.request.MediaCallbackRequest;
import com.dramatv.community.publish.persistence.PublishModerationPersistenceService;
import com.dramatv.community.shared.config.MediaStorageProperties;
import com.dramatv.community.shared.media.AliyunOssClientProvider;
import com.dramatv.community.shared.media.VideoMediaProcessingProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class ImageMediaProcessingService {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final UploadApplicationService uploadApplicationService;
    private final PublishModerationPersistenceService publishModerationPersistenceService;
    private final MediaStorageProperties mediaStorageProperties;
    private final VideoMediaProcessingProperties processingProperties;
    private final AliyunOssClientProvider aliyunOssClientProvider;

    public ImageMediaProcessingService(
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            UploadApplicationService uploadApplicationService,
            PublishModerationPersistenceService publishModerationPersistenceService,
            MediaStorageProperties mediaStorageProperties,
            VideoMediaProcessingProperties processingProperties,
            AliyunOssClientProvider aliyunOssClientProvider
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.uploadApplicationService = uploadApplicationService;
        this.publishModerationPersistenceService = publishModerationPersistenceService;
        this.mediaStorageProperties = mediaStorageProperties;
        this.processingProperties = processingProperties;
        this.aliyunOssClientProvider = aliyunOssClientProvider;
    }

    public int processAvailableTasks() {
        int processedCount = 0;
        int batchSize = Math.max(1, processingProperties.getBatchSize());
        while (processedCount < batchSize) {
            QueuedImageMediaTask task = claimNextTask();
            if (task == null) {
                break;
            }
            processSingleTask(task);
            processedCount++;
        }
        return processedCount;
    }

    private void processSingleTask(QueuedImageMediaTask task) {
        PromptImageTarget target = loadPromptTarget(task.targetId());
        if (target == null) {
            markTaskFailed(task, "prompt target not found");
            return;
        }

        UUID sourceAssetId = target.sourceAssetId() != null ? target.sourceAssetId() : task.payloadSourceAssetId();
        if (sourceAssetId == null) {
            markTaskFailed(task, "prompt source asset is missing");
            return;
        }

        SourceAsset sourceAsset = loadSourceAsset(sourceAssetId);
        if (sourceAsset == null) {
            markTaskFailed(task, "prompt source asset is invalid or unavailable");
            return;
        }

        if (!shouldGenerateCover(target.needsDerivedCover(), sourceAsset.sizeBytes())) {
            markTaskSucceeded(task, null);
            return;
        }

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("dramatv-image-media-");
            Path localSourcePath = materializeSourceAsset(sourceAsset, tempDir);
            Path coverImagePath = generateDerivedCover(localSourcePath, tempDir);
            UploadApplicationService.StoredAsset coverAsset = uploadApplicationService.storeDerivedAsset(
                    "image",
                    "cover",
                    buildDerivedFileName(sourceAsset.fileName(), "cover.jpg"),
                    "image/jpeg",
                    coverImagePath,
                    sourceAsset.createdBy() != null ? sourceAsset.createdBy() : target.authorId(),
                    null
            );
            markTaskSucceeded(task, coverAsset.id());
        } catch (Exception ex) {
            markTaskFailed(task, sanitizeErrorMessage(ex.getMessage()));
        } finally {
            cleanupTempDir(tempDir);
        }
    }

    private boolean shouldGenerateCover(boolean needsDerivedCover, long sourceSizeBytes) {
        return needsDerivedCover
                && sourceSizeBytes > Math.max(1L, processingProperties.getImageCoverThresholdBytes());
    }

    private QueuedImageMediaTask claimNextTask() {
        return jdbcTemplate.query("""
                with candidate as (
                    select id, target_id, payload_json::text as payload_json
                    from async_task_records
                    where task_type = 'image_media_process'
                      and target_type = 'prompt'
                      and queue_name = 'media-processing'
                      and status_code = 'queued'
                      and coalesce(scheduled_at, now()) <= now()
                    order by priority_level asc, created_at asc
                    for update skip locked
                    limit 1
                )
                update async_task_records task
                set status_code = 'processing',
                    started_at = coalesce(task.started_at, now()),
                    updated_at = now()
                from candidate
                where task.id = candidate.id
                returning task.id, task.target_id, candidate.payload_json
                """, resultSet -> {
            if (!resultSet.next()) {
                return null;
            }
            return new QueuedImageMediaTask(
                    (UUID) resultSet.getObject("id"),
                    (UUID) resultSet.getObject("target_id"),
                    parsePayloadSourceAssetId(resultSet.getString("payload_json"))
            );
        });
    }

    private UUID parsePayloadSourceAssetId(String payloadText) {
        if (payloadText == null || payloadText.isBlank()) {
            return null;
        }

        try {
            JsonNode payload = objectMapper.readTree(payloadText);
            JsonNode sourceAssetIdNode = payload.get("sourceAssetId");
            if (sourceAssetIdNode == null || sourceAssetIdNode.isNull()) {
                return null;
            }
            return UUID.fromString(sourceAssetIdNode.asText());
        } catch (Exception ex) {
            return null;
        }
    }

    private PromptImageTarget loadPromptTarget(UUID promptId) {
        return jdbcTemplate.query("""
                select
                    prompt.id,
                    prompt.author_id,
                    prompt.cover_asset_id,
                    prompt.primary_example_asset_id,
                    case
                        when prompt.cover_asset_id is null then true
                        when prompt.cover_asset_id = prompt.primary_example_asset_id then true
                        when cover.id is null then true
                        when cover.asset_kind <> 'image' then true
                        when cover.asset_role is distinct from 'cover' then true
                        else false
                    end as needs_derived_cover
                from prompt_entries prompt
                left join media_assets cover on cover.id = prompt.cover_asset_id
                where prompt.id = ?
                  and prompt.deleted_at is null
                """, resultSet -> {
            if (!resultSet.next()) {
                return null;
            }
            return new PromptImageTarget(
                    (UUID) resultSet.getObject("id"),
                    (UUID) resultSet.getObject("author_id"),
                    (UUID) resultSet.getObject("cover_asset_id"),
                    (UUID) resultSet.getObject("primary_example_asset_id"),
                    resultSet.getBoolean("needs_derived_cover")
            );
        }, promptId);
    }

    private SourceAsset loadSourceAsset(UUID sourceAssetId) {
        return jdbcTemplate.query("""
                select id, storage_provider, bucket_name, object_key, file_name, mime_type, size_bytes, created_by
                from media_assets
                where id = ?
                  and asset_kind = 'image'
                  and status_code = 'ready'
                """, resultSet -> {
            if (!resultSet.next()) {
                return null;
            }
            return new SourceAsset(
                    (UUID) resultSet.getObject("id"),
                    resultSet.getString("storage_provider"),
                    resultSet.getString("bucket_name"),
                    resultSet.getString("object_key"),
                    resultSet.getString("file_name"),
                    resultSet.getString("mime_type"),
                    resultSet.getObject("size_bytes") == null ? 0L : resultSet.getLong("size_bytes"),
                    (UUID) resultSet.getObject("created_by")
            );
        }, sourceAssetId);
    }

    private Path materializeSourceAsset(SourceAsset sourceAsset, Path tempDir) throws IOException {
        String storageProvider = normalize(sourceAsset.storageProvider());
        String bucketName = normalize(sourceAsset.bucketName());
        String objectKey = normalizeStoredObjectKey(sourceAsset.objectKey());
        if (objectKey == null) {
            throw new IOException("source asset object key is empty");
        }

        if ("oss".equals(storageProvider)) {
            return downloadOssObject(sourceAsset, objectKey, tempDir);
        }

        if (isWebPublicStorage(storageProvider, bucketName)) {
            Path webPublicRoot = resolveWorkspaceWebPublicRoot();
            return resolveLocalObjectPath(webPublicRoot, objectKey, "local-public source asset file does not exist");
        }

        Path mediaRoot = mediaStorageProperties.resolvedLocalDirPath();
        return resolveLocalObjectPath(mediaRoot, objectKey, "local source asset file does not exist");
    }

    private Path downloadOssObject(SourceAsset sourceAsset, String objectKey, Path tempDir) throws IOException {
        String suffix = fileSuffix(sourceAsset.fileName(), ".img");
        Path tempFile = Files.createTempFile(tempDir, "source-", suffix);
        OSS ossClient = aliyunOssClientProvider.currentClient();
        try (OSSObject object = ossClient.getObject(sourceAsset.bucketName(), objectKey);
             InputStream inputStream = object.getObjectContent()) {
            Files.copy(inputStream, tempFile, StandardCopyOption.REPLACE_EXISTING);
            return tempFile;
        } catch (Exception ex) {
            throw new IOException("oss source asset download failed", ex);
        }
    }

    private Path generateDerivedCover(Path sourcePath, Path tempDir) throws IOException {
        BufferedImage original = ImageIO.read(sourcePath.toFile());
        if (original == null) {
            throw new IOException("image cover generation failed: unsupported image source");
        }

        int maxWidth = Math.max(320, processingProperties.getImageCoverMaxWidth());
        int maxHeight = Math.max(320, processingProperties.getImageCoverMaxHeight());
        int sourceWidth = Math.max(1, original.getWidth());
        int sourceHeight = Math.max(1, original.getHeight());
        double scale = Math.min(1D, Math.min(maxWidth / (double) sourceWidth, maxHeight / (double) sourceHeight));
        int targetWidth = Math.max(1, (int) Math.round(sourceWidth * scale));
        int targetHeight = Math.max(1, (int) Math.round(sourceHeight * scale));

        BufferedImage output = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = output.createGraphics();
        try {
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, targetWidth, targetHeight);
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            graphics.drawImage(original, 0, 0, targetWidth, targetHeight, null);
        } finally {
            graphics.dispose();
        }

        Path coverPath = tempDir.resolve("cover.jpg");
        if (!ImageIO.write(output, "jpeg", coverPath.toFile())) {
            throw new IOException("image cover generation failed: jpeg writer unavailable");
        }
        ensureGeneratedFile(coverPath, "cover image");
        return coverPath;
    }

    private void markTaskSucceeded(QueuedImageMediaTask task, UUID coverAssetId) {
        publishModerationPersistenceService.applyMediaCallback(new MediaCallbackRequest(
                task.taskId().toString(),
                "succeeded",
                "prompt",
                task.targetId().toString(),
                new MediaCallbackRequest.Result(
                        coverAssetId == null ? null : coverAssetId.toString(),
                        null,
                        null,
                        null
                )
        ));
    }

    private void markTaskFailed(QueuedImageMediaTask task, String errorMessage) {
        publishModerationPersistenceService.applyMediaCallback(new MediaCallbackRequest(
                task.taskId().toString(),
                "failed",
                "prompt",
                task.targetId().toString(),
                new MediaCallbackRequest.Result(
                        null,
                        null,
                        null,
                        sanitizeErrorMessage(errorMessage)
                )
        ));
    }

    private void ensureGeneratedFile(Path filePath, String label) throws IOException {
        if (!Files.exists(filePath) || !Files.isRegularFile(filePath) || Files.size(filePath) <= 0) {
            throw new IOException(label + " was not generated");
        }
    }

    private boolean isWebPublicStorage(String storageProvider, String bucketName) {
        return "local-public".equals(storageProvider)
                || "apps-web-public".equals(bucketName);
    }

    private Path resolveWorkspaceWebPublicRoot() throws IOException {
        String configuredRoot = normalize(System.getenv("DRAMATV_WEB_PUBLIC_ROOT"));
        if (configuredRoot != null) {
            Path configuredPath = Path.of(configuredRoot).toAbsolutePath().normalize();
            if (Files.isDirectory(configuredPath)) {
                return configuredPath;
            }
        }

        String[] knownCloudCandidates = {
                "/opt/dramatv-community-web/current/public",
                "/opt/dramatv-community-web/shared/public"
        };
        for (String knownCandidate : knownCloudCandidates) {
            Path candidate = Path.of(knownCandidate).toAbsolutePath().normalize();
            if (Files.isDirectory(candidate)) {
                return candidate;
            }
        }

        Path cursor = Path.of("").toAbsolutePath().normalize();
        while (cursor != null) {
            Path candidate = cursor.resolve("apps").resolve("web").resolve("public").normalize();
            if (Files.isDirectory(candidate)) {
                return candidate;
            }
            cursor = cursor.getParent();
        }

        throw new IOException("workspace web public root does not exist");
    }

    private Path resolveLocalObjectPath(Path root, String objectKey, String missingMessage) throws IOException {
        Path targetPath = root.resolve(objectKey.replace('/', File.separatorChar)).normalize();
        if (!targetPath.startsWith(root) || !Files.exists(targetPath) || !Files.isRegularFile(targetPath)) {
            throw new IOException(missingMessage);
        }
        return targetPath;
    }

    private String normalizeStoredObjectKey(String storedReference) {
        String normalized = normalize(storedReference);
        if (normalized == null) {
            return null;
        }

        String basePath = mediaStorageProperties.normalizedPublicBasePath();
        if (normalized.startsWith(basePath + "/")) {
            return normalized.substring(basePath.length() + 1);
        }
        if (normalized.startsWith("/")) {
            return normalized.substring(1);
        }
        return normalized;
    }

    private String buildDerivedFileName(String originalFileName, String fallbackSuffix) {
        String normalized = originalFileName == null ? "" : originalFileName.trim();
        if (normalized.isBlank()) {
            return fallbackSuffix;
        }

        int lastDotIndex = normalized.lastIndexOf('.');
        String baseName = lastDotIndex > 0 ? normalized.substring(0, lastDotIndex) : normalized;
        String safeBaseName = baseName.replaceAll("[^A-Za-z0-9._-]", "-");
        if (safeBaseName.isBlank()) {
            safeBaseName = "media";
        }
        return safeBaseName + "-" + fallbackSuffix;
    }

    private String fileSuffix(String fileName, String fallback) {
        if (fileName == null || fileName.isBlank()) {
            return fallback;
        }
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex < 0 || lastDotIndex == fileName.length() - 1) {
            return fallback;
        }
        return fileName.substring(lastDotIndex);
    }

    private void cleanupTempDir(Path tempDir) {
        if (tempDir == null || !Files.exists(tempDir)) {
            return;
        }

        try (var paths = Files.walk(tempDir)) {
            paths.sorted((left, right) -> right.getNameCount() - left.getNameCount())
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (IOException ignored) {
                            // Best effort cleanup for temporary media processing files.
                        }
                    });
        } catch (IOException ignored) {
            // Best effort cleanup for temporary media processing files.
        }
    }

    private String sanitizeErrorMessage(String errorMessage) {
        if (errorMessage == null || errorMessage.isBlank()) {
            return "image media processing failed";
        }
        return tail(errorMessage.trim(), 500);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String tail(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(value.length() - maxLength);
    }

    private record QueuedImageMediaTask(
            UUID taskId,
            UUID targetId,
            UUID payloadSourceAssetId
    ) {
    }

    private record PromptImageTarget(
            UUID id,
            UUID authorId,
            UUID coverAssetId,
            UUID sourceAssetId,
            boolean needsDerivedCover
    ) {
    }

    private record SourceAsset(
            UUID id,
            String storageProvider,
            String bucketName,
            String objectKey,
            String fileName,
            String mimeType,
            long sizeBytes,
            UUID createdBy
    ) {
    }
}

