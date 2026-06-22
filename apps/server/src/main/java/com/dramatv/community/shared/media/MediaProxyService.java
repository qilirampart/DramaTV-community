package com.dramatv.community.shared.media;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSException;
import com.aliyun.oss.model.GetObjectRequest;
import com.aliyun.oss.model.ObjectMetadata;
import com.aliyun.oss.model.OSSObject;
import com.dramatv.community.shared.config.MediaStorageProperties;
import com.dramatv.community.shared.request.RequestIdContext;
import com.dramatv.community.shared.request.TraceIdContext;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Objects;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
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
    private static final DateTimeFormatter HTTP_DATE_FORMATTER = DateTimeFormatter.RFC_1123_DATE_TIME.withZone(ZoneOffset.UTC);

    private final JdbcTemplate jdbcTemplate;
    private final MediaStorageProperties mediaStorageProperties;
    private final AliyunOssClientProvider aliyunOssClientProvider;
    private final Semaphore proxySemaphore;

    public MediaProxyService(
            JdbcTemplate jdbcTemplate,
            MediaStorageProperties mediaStorageProperties,
            AliyunOssClientProvider aliyunOssClientProvider
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.mediaStorageProperties = mediaStorageProperties;
        this.aliyunOssClientProvider = aliyunOssClientProvider;
        int maxConcurrentRequests = Math.max(0, mediaStorageProperties.getProxy().getMaxConcurrentRequests());
        this.proxySemaphore = new Semaphore(maxConcurrentRequests, true);
    }

    public void writeToResponse(
            String objectKey,
            HttpMethod method,
            String rangeHeader,
            String ifNoneMatchHeader,
            String ifModifiedSinceHeader,
            jakarta.servlet.http.HttpServletResponse response
    ) {
        long startedAt = System.nanoTime();
        String normalizedObjectKey = normalizeObjectKey(objectKey);
        if (normalizedObjectKey == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        MediaAssetLocation mediaAssetLocation = resolveLocation(normalizedObjectKey);
        boolean proxyPermitAcquired = acquireProxyPermit(mediaAssetLocation, method, normalizedObjectKey);
        int status = HttpStatus.OK.value();
        String storageProvider = normalizeStorageProvider(mediaAssetLocation.storageProvider());
        try {
            if ("oss".equals(storageProvider)) {
                writeOssObject(mediaAssetLocation, method, rangeHeader, ifNoneMatchHeader, ifModifiedSinceHeader, response);
            } else if (storageProvider == null || storageProvider.startsWith("local")) {
                writeLocalFile(mediaAssetLocation, method, rangeHeader, ifNoneMatchHeader, ifModifiedSinceHeader, response);
            } else {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND);
            }

            status = response.getStatus();
        } catch (ResponseStatusException exception) {
            status = exception.getStatusCode().value();
            logProxyFailure(mediaAssetLocation, method, normalizedObjectKey, status, exception, startedAt);
            throw exception;
        } catch (RuntimeException exception) {
            status = HttpStatus.BAD_GATEWAY.value();
            logProxyFailure(mediaAssetLocation, method, normalizedObjectKey, status, exception, startedAt);
            throw exception;
        } finally {
            if (proxyPermitAcquired) {
                proxySemaphore.release();
            }
            logSlowRequestIfNeeded(mediaAssetLocation, method, normalizedObjectKey, status, startedAt, rangeHeader);
        }
    }

    private void writeOssObject(
            MediaAssetLocation mediaAssetLocation,
            HttpMethod method,
            String rangeHeader,
            String ifNoneMatchHeader,
            String ifModifiedSinceHeader,
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
            Instant lastModified = latestInstant(
                    mediaAssetLocation.updatedAt(),
                    objectMetadata != null && objectMetadata.getLastModified() != null
                            ? objectMetadata.getLastModified().toInstant()
                            : null
            );
            String etag = resolveEtag(
                    mediaAssetLocation,
                    totalLength,
                    lastModified,
                    objectMetadata != null ? normalizeText(objectMetadata.getETag()) : null
            );
            if (shouldReturnNotModified(rangeHeader, ifNoneMatchHeader, ifModifiedSinceHeader, etag, lastModified)) {
                applyCachingHeaders(response, mediaAssetLocation, etag, lastModified);
                response.setStatus(HttpStatus.NOT_MODIFIED.value());
                return;
            }

            MediaByteRange range = resolveRange(rangeHeader, totalLength, response);
            applyResponseHeaders(response, mediaAssetLocation, contentType, totalLength, range, etag, lastModified);
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
            String ifNoneMatchHeader,
            String ifModifiedSinceHeader,
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
            Instant lastModified = latestInstant(
                    mediaAssetLocation.updatedAt(),
                    Files.getLastModifiedTime(targetPath).toInstant()
            );
            String etag = resolveEtag(mediaAssetLocation, totalLength, lastModified, null);
            if (shouldReturnNotModified(rangeHeader, ifNoneMatchHeader, ifModifiedSinceHeader, etag, lastModified)) {
                applyCachingHeaders(response, mediaAssetLocation, etag, lastModified);
                response.setStatus(HttpStatus.NOT_MODIFIED.value());
                return;
            }
            MediaByteRange range = resolveRange(rangeHeader, totalLength, response);

            applyResponseHeaders(response, mediaAssetLocation, contentType, totalLength, range, etag, lastModified);
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
                    , asset_kind, asset_role
                    , updated_at
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
                    OffsetDateTime updatedAt = resultSet.getObject("updated_at", OffsetDateTime.class);

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
                            sizeBytes,
                            normalizeText(resultSet.getString("asset_kind")),
                            normalizeAssetRole(
                                    resultSet.getString("asset_role"),
                                    resultSet.getString("asset_kind"),
                                    resultSet.getString("object_key")
                            ),
                            updatedAt == null ? null : updatedAt.toInstant()
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
                null,
                null,
                normalizeAssetRole(null, null, objectKey),
                null
        );
    }

    private void applyResponseHeaders(
            jakarta.servlet.http.HttpServletResponse response,
            MediaAssetLocation mediaAssetLocation,
            String contentType,
            long totalLength,
            MediaByteRange range,
            String etag,
            Instant lastModified
    ) {
        applyCachingHeaders(response, mediaAssetLocation, etag, lastModified);
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
            response.setContentLengthLong(totalLength);
        }
        response.setStatus(HttpStatus.OK.value());
    }

    private void applyCachingHeaders(
            jakarta.servlet.http.HttpServletResponse response,
            MediaAssetLocation mediaAssetLocation,
            String etag,
            Instant lastModified
    ) {
        response.setHeader("Cache-Control", resolveCacheControl(mediaAssetLocation));
        response.setHeader("Accept-Ranges", "bytes");
        if (etag != null) {
            response.setHeader("ETag", etag);
        }
        if (lastModified != null) {
            response.setHeader("Last-Modified", HTTP_DATE_FORMATTER.format(lastModified));
        }
    }

    private String resolveCacheControl(MediaAssetLocation mediaAssetLocation) {
        long maxAgeSeconds = maxAgeSecondsForRole(mediaAssetLocation == null ? null : mediaAssetLocation.assetRole());
        return "public, max-age=" + maxAgeSeconds;
    }

    private long maxAgeSecondsForRole(String assetRole) {
        MediaStorageProperties.Cache cache = mediaStorageProperties.getCache();
        String normalizedRole = normalizeText(assetRole);
        if (normalizedRole == null) {
            return cache.getDefaultMaxAgeSeconds();
        }

        return switch (normalizedRole) {
            case "avatar" -> cache.getAvatarMaxAgeSeconds();
            case "cover" -> cache.getCoverMaxAgeSeconds();
            case "poster" -> cache.getPosterMaxAgeSeconds();
            case "preview" -> cache.getPreviewMaxAgeSeconds();
            case "source" -> cache.getSourceMaxAgeSeconds();
            case "attachment" -> cache.getAttachmentMaxAgeSeconds();
            default -> cache.getDefaultMaxAgeSeconds();
        };
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

    private boolean acquireProxyPermit(
            MediaAssetLocation mediaAssetLocation,
            HttpMethod method,
            String objectKey
    ) {
        MediaStorageProperties.Proxy proxy = mediaStorageProperties.getProxy();
        if (!proxy.isEnabled()) {
            return false;
        }

        if (proxySemaphore.tryAcquire()) {
            return true;
        }

        int limit = Math.max(0, proxy.getMaxConcurrentRequests());
        int inFlight = limit - proxySemaphore.availablePermits();
        log.warn(
                "media_proxy_busy requestId={} traceId={} method={} objectKey={} assetRole={} storageProvider={} inFlight={} limit={}",
                RequestIdContext.currentOrFallback(),
                TraceIdContext.currentOrFallback(),
                method.name(),
                objectKey,
                mediaAssetLocation == null ? "unknown" : safeText(mediaAssetLocation.assetRole()),
                mediaAssetLocation == null ? "unknown" : safeText(mediaAssetLocation.storageProvider()),
                inFlight,
                limit
        );
        throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "media proxy busy");
    }

    private void logSlowRequestIfNeeded(
            MediaAssetLocation mediaAssetLocation,
            HttpMethod method,
            String objectKey,
            int status,
            long startedAt,
            String rangeHeader
    ) {
        long thresholdMs = mediaStorageProperties.getProxy().getSlowRequestThresholdMs();
        if (thresholdMs < 0) {
            return;
        }

        long durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAt);
        if (durationMs < thresholdMs) {
            return;
        }

        log.warn(
                "media_proxy_slow requestId={} traceId={} method={} status={} durationMs={} objectKey={} assetRole={} storageProvider={} range={}",
                RequestIdContext.currentOrFallback(),
                TraceIdContext.currentOrFallback(),
                method.name(),
                status,
                durationMs,
                objectKey,
                mediaAssetLocation == null ? "unknown" : safeText(mediaAssetLocation.assetRole()),
                mediaAssetLocation == null ? "unknown" : safeText(mediaAssetLocation.storageProvider()),
                rangeHeader == null || rangeHeader.isBlank() ? "none" : rangeHeader
        );
    }

    private void logProxyFailure(
            MediaAssetLocation mediaAssetLocation,
            HttpMethod method,
            String objectKey,
            int status,
            Exception exception,
            long startedAt
    ) {
        if (status < 500) {
            return;
        }

        long durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAt);
        log.warn(
                "media_proxy_failure requestId={} traceId={} method={} status={} durationMs={} objectKey={} assetRole={} storageProvider={} error={}",
                RequestIdContext.currentOrFallback(),
                TraceIdContext.currentOrFallback(),
                method.name(),
                status,
                durationMs,
                objectKey,
                mediaAssetLocation == null ? "unknown" : safeText(mediaAssetLocation.assetRole()),
                mediaAssetLocation == null ? "unknown" : safeText(mediaAssetLocation.storageProvider()),
                safeText(exception.getMessage())
        );
    }

    private boolean shouldReturnNotModified(
            String rangeHeader,
            String ifNoneMatchHeader,
            String ifModifiedSinceHeader,
            String etag,
            Instant lastModified
    ) {
        if (rangeHeader != null && !rangeHeader.isBlank()) {
            return false;
        }

        if (matchesIfNoneMatch(ifNoneMatchHeader, etag)) {
            return true;
        }

        if (ifNoneMatchHeader != null && !ifNoneMatchHeader.isBlank()) {
            return false;
        }

        return matchesIfModifiedSince(ifModifiedSinceHeader, lastModified);
    }

    private boolean matchesIfNoneMatch(String ifNoneMatchHeader, String currentEtag) {
        if (ifNoneMatchHeader == null || ifNoneMatchHeader.isBlank() || currentEtag == null || currentEtag.isBlank()) {
            return false;
        }

        String normalizedCurrent = normalizeWeakEtag(currentEtag);
        for (String candidate : ifNoneMatchHeader.split(",")) {
            String normalizedCandidate = candidate.trim();
            if (normalizedCandidate.isEmpty()) {
                continue;
            }
            if ("*".equals(normalizedCandidate)) {
                return true;
            }
            if (Objects.equals(normalizedCurrent, normalizeWeakEtag(normalizedCandidate))) {
                return true;
            }
        }

        return false;
    }

    private boolean matchesIfModifiedSince(String ifModifiedSinceHeader, Instant lastModified) {
        if (ifModifiedSinceHeader == null || ifModifiedSinceHeader.isBlank() || lastModified == null) {
            return false;
        }

        Instant parsed = parseHttpDate(ifModifiedSinceHeader);
        if (parsed == null) {
            return false;
        }

        return lastModified.getEpochSecond() <= parsed.getEpochSecond();
    }

    private Instant parseHttpDate(String headerValue) {
        try {
            return HTTP_DATE_FORMATTER.parse(headerValue.trim(), Instant::from);
        } catch (DateTimeParseException exception) {
            return null;
        }
    }

    private String resolveEtag(
            MediaAssetLocation mediaAssetLocation,
            long totalLength,
            Instant lastModified,
            String upstreamEtag
    ) {
        String normalizedUpstreamEtag = normalizeText(upstreamEtag);
        if (normalizedUpstreamEtag != null) {
            String unquoted = normalizedUpstreamEtag;
            while (unquoted.startsWith("W/")) {
                unquoted = unquoted.substring(2);
            }
            unquoted = unquoted.trim();
            if (unquoted.startsWith("\"") && unquoted.endsWith("\"") && unquoted.length() >= 2) {
                unquoted = unquoted.substring(1, unquoted.length() - 1);
            }
            if (!unquoted.isBlank()) {
                return "\"" + unquoted + "\"";
            }
        }

        int signature = Objects.hash(
                mediaAssetLocation.storageProvider(),
                mediaAssetLocation.bucketName(),
                mediaAssetLocation.objectKey(),
                totalLength,
                lastModified == null ? 0L : lastModified.toEpochMilli()
        );
        return "W/\"" + Integer.toUnsignedString(signature, 16) + "\"";
    }

    private String normalizeWeakEtag(String value) {
        String normalized = value == null ? "" : value.trim();
        while (normalized.startsWith("W/")) {
            normalized = normalized.substring(2).trim();
        }
        if (normalized.startsWith("\"") && normalized.endsWith("\"") && normalized.length() >= 2) {
            normalized = normalized.substring(1, normalized.length() - 1);
        }
        return normalized;
    }

    private Instant latestInstant(Instant primary, Instant fallback) {
        if (primary == null) {
            return fallback;
        }
        if (fallback == null) {
            return primary;
        }
        return primary.isAfter(fallback) ? primary : fallback;
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

    private String safeText(String value) {
        String normalized = normalizeText(value);
        return normalized == null ? "unknown" : normalized;
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

    private String normalizeAssetRole(String assetRole, String assetKind, String objectKey) {
        String normalizedRole = normalizeText(assetRole);
        if (normalizedRole != null) {
            return normalizedRole.toLowerCase();
        }

        String normalizedKind = normalizeText(assetKind);
        if (normalizedKind != null) {
            String loweredKind = normalizedKind.toLowerCase();
            if (isSupportedAssetRole(loweredKind)) {
                return loweredKind;
            }
        }

        String normalizedObjectKey = normalizeObjectKey(objectKey);
        if (normalizedObjectKey != null) {
            String loweredObjectKey = normalizedObjectKey.toLowerCase();
            for (String candidate : new String[]{"avatar", "cover", "poster", "preview", "attachment", "source"}) {
                if (loweredObjectKey.contains("/" + candidate + "/")) {
                    return candidate;
                }
            }
        }

        return "source";
    }

    private boolean isSupportedAssetRole(String assetRole) {
        return "avatar".equals(assetRole)
                || "cover".equals(assetRole)
                || "poster".equals(assetRole)
                || "preview".equals(assetRole)
                || "attachment".equals(assetRole)
                || "source".equals(assetRole);
    }

    private record MediaAssetLocation(
            String storageProvider,
            String bucketName,
            String objectKey,
            String mimeType,
            Long sizeBytes,
            String assetKind,
            String assetRole,
            Instant updatedAt
    ) {
    }
}
