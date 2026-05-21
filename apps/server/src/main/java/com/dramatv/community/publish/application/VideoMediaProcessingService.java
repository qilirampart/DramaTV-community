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
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class VideoMediaProcessingService {

    private static final Logger log = LoggerFactory.getLogger(VideoMediaProcessingService.class);

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final UploadApplicationService uploadApplicationService;
    private final PublishModerationPersistenceService publishModerationPersistenceService;
    private final MediaStorageProperties mediaStorageProperties;
    private final VideoMediaProcessingProperties processingProperties;
    private final AliyunOssClientProvider aliyunOssClientProvider;

    public VideoMediaProcessingService(
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
            QueuedVideoMediaTask task = claimNextTask();
            if (task == null) {
                break;
            }
            processSingleTask(task);
            processedCount++;
        }
        return processedCount;
    }

    private void processSingleTask(QueuedVideoMediaTask task) {
        TargetMediaSpec target = loadTarget(task.targetType(), task.targetId());
        if (target == null) {
            markTaskFailed(task, task.targetType() + " target not found");
            return;
        }
        UUID sourceAssetId = target.sourceAssetId() != null ? target.sourceAssetId() : task.payloadSourceAssetId();
        if (sourceAssetId == null) {
            markTaskFailed(task, task.targetType() + " source asset is missing");
            return;
        }

        SourceAsset sourceAsset = loadSourceAsset(sourceAssetId);
        if (sourceAsset == null) {
            markTaskFailed(task, task.targetType() + " source asset is invalid or unavailable");
            return;
        }

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("dramatv-video-media-");
            Path localSourcePath = materializeSourceAsset(sourceAsset, tempDir);
            long sourceSizeBytes = Files.size(localSourcePath);
            Integer durationMs = probeDurationMs(localSourcePath);

            UUID coverAssetId = null;
            if (target.coverAssetId() == null) {
                Path coverImagePath = extractCoverFrame(localSourcePath, tempDir);
                UploadApplicationService.StoredAsset coverAsset = uploadApplicationService.storeDerivedAsset(
                        "image",
                        "cover",
                        buildDerivedFileName(sourceAsset.fileName(), "cover.jpg"),
                        "image/jpeg",
                        coverImagePath,
                        effectiveCreatedBy(target, sourceAsset),
                        null
                );
                coverAssetId = coverAsset.id();
            }

            UUID previewAssetId = null;
            if (shouldGeneratePreview(target.previewAssetId(), sourceSizeBytes)) {
                Path previewPath = transcodePreview(localSourcePath, tempDir, durationMs);
                UploadApplicationService.StoredAsset previewAsset = uploadApplicationService.storeDerivedAsset(
                        "video",
                        "preview",
                        buildDerivedFileName(sourceAsset.fileName(), "preview.mp4"),
                        "video/mp4",
                        previewPath,
                        effectiveCreatedBy(target, sourceAsset),
                        durationMs
                );
                previewAssetId = previewAsset.id();
            }

            publishModerationPersistenceService.applyMediaCallback(new MediaCallbackRequest(
                    task.taskId().toString(),
                    "succeeded",
                    task.targetType(),
                    task.targetId().toString(),
                    new MediaCallbackRequest.Result(
                            coverAssetId == null ? null : coverAssetId.toString(),
                            previewAssetId == null ? null : previewAssetId.toString(),
                            durationMs == null ? null : durationMs.longValue(),
                            null
                    )
            ));
        } catch (Exception ex) {
            log.warn("video media processing failed, taskId={}, targetId={}, message={}",
                    task.taskId(), task.targetId(), ex.getMessage());
            markTaskFailed(task, ex.getMessage());
        } finally {
            cleanupTempDir(tempDir);
        }
    }

    private boolean shouldGeneratePreview(UUID previewAssetId, long sourceSizeBytes) {
        return previewAssetId == null
                && sourceSizeBytes > Math.max(1L, processingProperties.getCompressionThresholdBytes());
    }

    private UUID effectiveCreatedBy(TargetMediaSpec target, SourceAsset sourceAsset) {
        return sourceAsset.createdBy() != null ? sourceAsset.createdBy() : target.authorId();
    }

    private QueuedVideoMediaTask claimNextTask() {
        return jdbcTemplate.query("""
                with candidate as (
                    select id, target_type, target_id, payload_json::text as payload_json
                    from async_task_records
                    where task_type = 'video_media_process'
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
                returning task.id, task.target_type, task.target_id, candidate.payload_json
                """,
                resultSet -> {
                    if (!resultSet.next()) {
                        return null;
                    }
                    UUID taskId = (UUID) resultSet.getObject("id");
                    String targetType = resultSet.getString("target_type");
                    UUID targetId = (UUID) resultSet.getObject("target_id");
                    String payloadText = resultSet.getString("payload_json");
                    return new QueuedVideoMediaTask(taskId, targetType, targetId, parsePayloadSourceAssetId(payloadText));
                }
        );
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

    private TargetMediaSpec loadTarget(String targetType, UUID targetId) {
        if ("prompt".equalsIgnoreCase(targetType)) {
            return loadPromptTarget(targetId);
        }
        return loadVideoTarget(targetId);
    }

    private TargetMediaSpec loadVideoTarget(UUID targetId) {
        return jdbcTemplate.query("""
                select id, author_id, cover_asset_id, preview_asset_id, source_asset_id, duration_ms
                from videos
                where id = ?
                  and deleted_at is null
                """,
                resultSet -> {
                    if (!resultSet.next()) {
                        return null;
                    }
                    return new TargetMediaSpec(
                            "video",
                            (UUID) resultSet.getObject("id"),
                            (UUID) resultSet.getObject("author_id"),
                            (UUID) resultSet.getObject("cover_asset_id"),
                            (UUID) resultSet.getObject("preview_asset_id"),
                            (UUID) resultSet.getObject("source_asset_id"),
                            resultSet.getObject("duration_ms") == null ? null : resultSet.getInt("duration_ms")
                    );
                },
                targetId
        );
    }

    private TargetMediaSpec loadPromptTarget(UUID targetId) {
        return jdbcTemplate.query("""
                select
                    prompt.id,
                    prompt.author_id,
                    prompt.cover_asset_id,
                    prompt.primary_example_asset_id as source_asset_id,
                    (
                        select link.media_asset_id
                        from prompt_example_links link
                        where link.prompt_id = prompt.id
                          and link.role_code = 'preview'
                        order by link.sort_order asc, link.created_at asc
                        limit 1
                    ) as preview_asset_id
                from prompt_entries prompt
                where prompt.id = ?
                  and prompt.deleted_at is null
                """,
                resultSet -> {
                    if (!resultSet.next()) {
                        return null;
                    }
                    return new TargetMediaSpec(
                            "prompt",
                            (UUID) resultSet.getObject("id"),
                            (UUID) resultSet.getObject("author_id"),
                            (UUID) resultSet.getObject("cover_asset_id"),
                            (UUID) resultSet.getObject("preview_asset_id"),
                            (UUID) resultSet.getObject("source_asset_id"),
                            null
                    );
                },
                targetId
        );
    }

    private SourceAsset loadSourceAsset(UUID sourceAssetId) {
        return jdbcTemplate.query("""
                select id, storage_provider, bucket_name, object_key, file_name, mime_type, size_bytes, created_by
                from media_assets
                where id = ?
                  and asset_kind = 'video'
                  and status_code = 'ready'
                """,
                resultSet -> {
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
                },
                sourceAssetId
        );
    }

    private Path materializeSourceAsset(SourceAsset sourceAsset, Path tempDir) throws IOException {
        String storageProvider = normalize(sourceAsset.storageProvider());
        String objectKey = normalizeStoredObjectKey(sourceAsset.objectKey());
        if (objectKey == null) {
            throw new IOException("source asset object key is empty");
        }

        if ("oss".equals(storageProvider)) {
            return downloadOssObject(sourceAsset, objectKey, tempDir);
        }

        Path mediaRoot = mediaStorageProperties.resolvedLocalDirPath();
        Path localPath = mediaRoot.resolve(objectKey.replace('/', java.io.File.separatorChar)).normalize();
        if (!localPath.startsWith(mediaRoot) || !Files.exists(localPath) || !Files.isRegularFile(localPath)) {
            throw new IOException("local source asset file does not exist");
        }
        return localPath;
    }

    private Path downloadOssObject(SourceAsset sourceAsset, String objectKey, Path tempDir) throws IOException {
        String suffix = fileSuffix(sourceAsset.fileName(), ".mp4");
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

    private Integer probeDurationMs(Path sourcePath) throws IOException, InterruptedException {
        List<String> command = List.of(
                processingProperties.resolveFfprobeCommand(),
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                sourcePath.toString()
        );
        String output = runProcess(command, "ffprobe duration");
        if (output == null || output.isBlank()) {
            return null;
        }

        double durationSeconds = Double.parseDouble(output.trim());
        if (!Double.isFinite(durationSeconds) || durationSeconds <= 0) {
            return null;
        }

        long durationMs = Math.round(durationSeconds * 1000D);
        if (durationMs <= 0) {
            return null;
        }
        return durationMs > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) durationMs;
    }

    private Path extractCoverFrame(Path sourcePath, Path tempDir) throws IOException, InterruptedException {
        Path coverPath = tempDir.resolve("cover.jpg");
        List<String> command = List.of(
                processingProperties.resolveFfmpegCommand(),
                "-y",
                "-i",
                sourcePath.toString(),
                "-frames:v",
                "1",
                "-q:v",
                "2",
                coverPath.toString()
        );
        runProcess(command, "ffmpeg cover");
        ensureGeneratedFile(coverPath, "cover image");
        return coverPath;
    }

    private Path transcodePreview(Path sourcePath, Path tempDir, Integer durationMs) throws IOException, InterruptedException {
        Path previewPath = tempDir.resolve("preview.mp4");
        int audioBitrateKbps = Math.max(32, processingProperties.getPreviewAudioBitrateKbps());
        int videoBitrateKbps = resolveVideoBitrateKbps(durationMs, audioBitrateKbps);
        int maxRateKbps = Math.max(videoBitrateKbps, Math.round(videoBitrateKbps * 1.15f));
        int bufferSizeKbps = Math.max(maxRateKbps * 2, videoBitrateKbps * 2);

        List<String> command = new ArrayList<>();
        command.add(processingProperties.resolveFfmpegCommand());
        command.add("-y");
        command.add("-i");
        command.add(sourcePath.toString());
        command.add("-map");
        command.add("0:v:0");
        command.add("-map");
        command.add("0:a?");
        command.add("-vf");
        command.add("scale=-2:" + Math.max(240, processingProperties.getPreviewMaxHeight()) + ":force_original_aspect_ratio=decrease");
        command.add("-c:v");
        command.add("libx264");
        command.add("-preset");
        command.add("veryfast");
        command.add("-pix_fmt");
        command.add("yuv420p");
        command.add("-b:v");
        command.add(videoBitrateKbps + "k");
        command.add("-maxrate");
        command.add(maxRateKbps + "k");
        command.add("-bufsize");
        command.add(bufferSizeKbps + "k");
        command.add("-c:a");
        command.add("aac");
        command.add("-b:a");
        command.add(audioBitrateKbps + "k");
        command.add("-movflags");
        command.add("+faststart");
        command.add(previewPath.toString());

        runProcess(command, "ffmpeg preview");
        ensureGeneratedFile(previewPath, "preview video");
        return previewPath;
    }

    private int resolveVideoBitrateKbps(Integer durationMs, int audioBitrateKbps) {
        int minVideoKbps = Math.max(200, processingProperties.getPreviewMinVideoBitrateKbps());
        int maxVideoKbps = Math.max(minVideoKbps, processingProperties.getPreviewMaxVideoBitrateKbps());
        if (durationMs == null || durationMs <= 0) {
            return maxVideoKbps;
        }

        double durationSeconds = Math.max(1D, durationMs / 1000D);
        double totalKbps = (processingProperties.getPreviewTargetMaxBytes() * 8D) / durationSeconds / 1024D;
        int computedVideoKbps = (int) Math.floor(totalKbps - audioBitrateKbps);
        if (computedVideoKbps < minVideoKbps) {
            return minVideoKbps;
        }
        if (computedVideoKbps > maxVideoKbps) {
            return maxVideoKbps;
        }
        return computedVideoKbps;
    }

    private String runProcess(List<String> command, String label) throws IOException, InterruptedException {
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectErrorStream(true);
        Process process = processBuilder.start();
        byte[] outputBytes;
        try (InputStream inputStream = process.getInputStream()) {
            outputBytes = inputStream.readAllBytes();
        }
        int exitCode = process.waitFor();
        String output = new String(outputBytes, StandardCharsets.UTF_8).trim();
        if (exitCode != 0) {
            String message = output.isBlank() ? label + " failed" : label + " failed: " + tail(output, 500);
            throw new IOException(message);
        }
        return output;
    }

    private void ensureGeneratedFile(Path filePath, String label) throws IOException {
        if (!Files.exists(filePath) || !Files.isRegularFile(filePath) || Files.size(filePath) <= 0) {
            throw new IOException(label + " was not generated");
        }
    }

    private void markTaskFailed(QueuedVideoMediaTask task, String errorMessage) {
        String safeErrorMessage = sanitizeErrorMessage(errorMessage);
        publishModerationPersistenceService.applyMediaCallback(new MediaCallbackRequest(
                task.taskId().toString(),
                "failed",
                task.targetType(),
                task.targetId().toString(),
                new MediaCallbackRequest.Result(
                        null,
                        null,
                        null,
                        safeErrorMessage
                )
        ));
    }

    private String sanitizeErrorMessage(String errorMessage) {
        if (errorMessage == null || errorMessage.isBlank()) {
            return "video media processing failed";
        }
        return tail(errorMessage.trim(), 500);
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

    private record QueuedVideoMediaTask(
            UUID taskId,
            String targetType,
            UUID targetId,
            UUID payloadSourceAssetId
    ) {
    }

    private record TargetMediaSpec(
            String targetType,
            UUID id,
            UUID authorId,
            UUID coverAssetId,
            UUID previewAssetId,
            UUID sourceAssetId,
            Integer durationMs
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
