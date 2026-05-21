package com.dramatv.community.shared.media;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSException;
import com.aliyun.oss.model.GetObjectRequest;
import com.aliyun.oss.model.ObjectMetadata;
import com.aliyun.oss.model.OSSObject;
import com.dramatv.community.shared.config.MediaStorageProperties;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MediaProxyService {

    private static final Logger log = LoggerFactory.getLogger(MediaProxyService.class);

    private final JdbcTemplate jdbcTemplate;
    private final MediaStorageProperties mediaStorageProperties;
    private final AliyunOssClientProvider aliyunOssClientProvider;

    public MediaProxyService(
            JdbcTemplate jdbcTemplate,
            MediaStorageProperties mediaStorageProperties,
            AliyunOssClientProvider aliyunOssClientProvider
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.mediaStorageProperties = mediaStorageProperties;
        this.aliyunOssClientProvider = aliyunOssClientProvider;
    }

    public void writeToResponse(
            String objectKey,
            HttpMethod method,
            String rangeHeader,
            jakarta.servlet.http.HttpServletResponse response
    ) {
        String normalizedObjectKey = normalizeObjectKey(objectKey);
        if (normalizedObjectKey == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        MediaAssetLocation mediaAssetLocation = resolveLocation(normalizedObjectKey);
        String storageProvider = normalizeStorageProvider(mediaAssetLocation.storageProvider());
        if ("oss".equals(storageProvider)) {
            writeOssObject(mediaAssetLocation, method, rangeHeader, response);
            return;
        }

        if (storageProvider == null || storageProvider.startsWith("local")) {
            writeLocalFile(mediaAssetLocation, method, rangeHeader, response);
            return;
        }

        throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }

    private void writeOssObject(
            MediaAssetLocation mediaAssetLocation,
            HttpMethod method,
            String rangeHeader,
            jakarta.servlet.http.HttpServletResponse response
    ) {
        OSS ossClient = aliyunOssClientProvider.currentClient();
        String bucketName = mediaAssetLocation.bucketName();
        String objectKey = mediaAssetLocation.objectKey();

        try {
            ObjectMetadata objectMetadata = null;
            String contentType = normalizeText(mediaAssetLocation.mimeType());
            long totalLength = mediaAssetLocation.sizeBytes() != null && mediaAssetLocation.sizeBytes() >= 0
                    ? mediaAssetLocation.sizeBytes()
                    : -1L;
            if (contentType == null || totalLength < 0 || rangeHeader != null && !rangeHeader.isBlank()) {
                objectMetadata = ossClient.getObjectMetadata(bucketName, objectKey);
            }
            if (contentType == null && objectMetadata != null) {
                contentType = normalizeText(objectMetadata.getContentType());
            }
            if (totalLength < 0 && objectMetadata != null) {
                totalLength = objectMetadata.getContentLength();
            }

            MediaByteRange range = resolveRange(rangeHeader, totalLength, response);
            applyResponseHeaders(response, contentType, totalLength, range);
            if (HttpMethod.HEAD.equals(method)) {
                return;
            }

            GetObjectRequest request = new GetObjectRequest(bucketName, objectKey);
            if (range != null) {
                request.setRange(range.start(), range.end());
            }

            try (OSSObject object = ossClient.getObject(request);
                 InputStream inputStream = object.getObjectContent()) {
                StreamUtils.copy(inputStream, response.getOutputStream());
            }
        } catch (IllegalArgumentException exception) {
            applyUnsatisfiedRangeResponse(response, exception);
        } catch (OSSException exception) {
            if ("InvalidRange".equalsIgnoreCase(exception.getErrorCode())) {
                applyUnsatisfiedRangeResponse(response, exception);
                return;
            }

            if ("NoSuchKey".equalsIgnoreCase(exception.getErrorCode())
                    || "NoSuchBucket".equalsIgnoreCase(exception.getErrorCode())) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND);
            }

            log.warn("media proxy oss fetch failed, bucket={}, objectKey={}, errorCode={}, message={}",
                    bucketName,
                    objectKey,
                    exception.getErrorCode(),
                    exception.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY);
        }
    }

    private void writeLocalFile(
            MediaAssetLocation mediaAssetLocation,
            HttpMethod method,
            String rangeHeader,
            jakarta.servlet.http.HttpServletResponse response
    ) {
        String objectKey = mediaAssetLocation.objectKey();
        Path mediaRoot = mediaStorageProperties.resolvedLocalDirPath();
        Path targetPath = mediaRoot.resolve(objectKey.replace('/', java.io.File.separatorChar)).normalize();
        if (!targetPath.startsWith(mediaRoot) || !Files.exists(targetPath) || !Files.isRegularFile(targetPath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        try {
            String contentType = mediaAssetLocation.mimeType() != null && !mediaAssetLocation.mimeType().isBlank()
                    ? mediaAssetLocation.mimeType()
                    : Files.probeContentType(targetPath);
            long totalLength = mediaAssetLocation.sizeBytes() != null && mediaAssetLocation.sizeBytes() >= 0
                    ? mediaAssetLocation.sizeBytes()
                    : Files.size(targetPath);
            MediaByteRange range = resolveRange(rangeHeader, totalLength, response);

            applyResponseHeaders(response, contentType, totalLength, range);
            if (HttpMethod.HEAD.equals(method)) {
                return;
            }

            try (InputStream inputStream = Files.newInputStream(targetPath)) {
                if (range == null) {
                    StreamUtils.copy(inputStream, response.getOutputStream());
                    return;
                }

                inputStream.skipNBytes(range.start());
                copyLimited(inputStream, response.getOutputStream(), range.contentLength());
            }
        } catch (IllegalArgumentException exception) {
            applyUnsatisfiedRangeResponse(response, exception);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY);
        }
    }

    private MediaAssetLocation resolveLocation(String objectKey) {
        MediaAssetLocation mediaAssetLocation = jdbcTemplate.query("""
                select storage_provider, bucket_name, object_key, mime_type, size_bytes
                from media_assets
                where object_key = ?
                  and status_code = 'ready'
                order by updated_at desc
                limit 1
                """,
                resultSet -> {
                    if (!resultSet.next()) {
                        return null;
                    }

                    Long sizeBytes = resultSet.getObject("size_bytes") == null
                            ? null
                            : resultSet.getLong("size_bytes");

                    return new MediaAssetLocation(
                            firstNonBlank(
                                    normalizeStorageProvider(resultSet.getString("storage_provider")),
                                    normalizeStorageProvider(mediaStorageProperties.getStorageProvider())
                            ),
                            firstNonBlank(
                                    normalizeBucketName(resultSet.getString("bucket_name")),
                                    normalizeBucketName(mediaStorageProperties.getBucketName())
                            ),
                            normalizeObjectKey(resultSet.getString("object_key")),
                            normalizeText(resultSet.getString("mime_type")),
                            sizeBytes
                    );
                },
                objectKey
        );

        if (mediaAssetLocation != null && mediaAssetLocation.objectKey() != null) {
            return mediaAssetLocation;
        }

        return new MediaAssetLocation(
                normalizeStorageProvider(mediaStorageProperties.getStorageProvider()),
                normalizeBucketName(mediaStorageProperties.getBucketName()),
                objectKey,
                null,
                null
        );
    }

    private void applyResponseHeaders(
            jakarta.servlet.http.HttpServletResponse response,
            String contentType,
            long totalLength,
            MediaByteRange range
    ) {
        response.setHeader("Cache-Control", "public, max-age=3600");
        response.setHeader("Accept-Ranges", "bytes");
        if (contentType != null && !contentType.isBlank()) {
            response.setContentType(contentType);
        } else {
            response.setContentType("application/octet-stream");
        }

        if (range != null) {
            response.setStatus(HttpStatus.PARTIAL_CONTENT.value());
            response.setHeader("Content-Range", range.contentRangeValue());
            response.setContentLengthLong(range.contentLength());
            return;
        }

        if (totalLength >= 0) {
            response.setStatus(HttpStatus.OK.value());
            response.setContentLengthLong(totalLength);
        }
    }

    private MediaByteRange resolveRange(
            String rangeHeader,
            long totalLength,
            jakarta.servlet.http.HttpServletResponse response
    ) {
        try {
            return MediaByteRange.parse(rangeHeader, totalLength);
        } catch (IllegalArgumentException exception) {
            if (rangeHeader != null && !rangeHeader.isBlank() && totalLength > 0) {
                response.setHeader("Accept-Ranges", "bytes");
                response.setHeader("Content-Range", "bytes */" + totalLength);
                response.setStatus(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE.value());
            }
            throw exception;
        }
    }

    private void applyUnsatisfiedRangeResponse(
            jakarta.servlet.http.HttpServletResponse response,
            Exception exception
    ) {
        if (response.getStatus() == HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE.value()) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "media proxy failed", exception);
    }

    private void copyLimited(InputStream inputStream, OutputStream outputStream, long contentLength) throws IOException {
        byte[] buffer = new byte[16 * 1024];
        long remaining = contentLength;
        while (remaining > 0) {
            int bytesToRead = (int) Math.min(buffer.length, remaining);
            int read = inputStream.read(buffer, 0, bytesToRead);
            if (read < 0) {
                break;
            }

            outputStream.write(buffer, 0, read);
            remaining -= read;
        }
    }

    private String normalizeStorageProvider(String storageProvider) {
        if (storageProvider == null) {
            return null;
        }

        String normalized = storageProvider.trim().toLowerCase();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeBucketName(String bucketName) {
        if (bucketName == null) {
            return null;
        }

        String normalized = bucketName.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String firstNonBlank(String primary, String fallback) {
        return primary != null && !primary.isBlank() ? primary : fallback;
    }

    private String normalizeObjectKey(String objectKey) {
        if (objectKey == null) {
            return null;
        }

        String normalized = objectKey.trim();
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        return normalized.isEmpty() ? null : normalized;
    }

    private record MediaAssetLocation(
            String storageProvider,
            String bucketName,
            String objectKey,
            String mimeType,
            Long sizeBytes
    ) {
    }
}
