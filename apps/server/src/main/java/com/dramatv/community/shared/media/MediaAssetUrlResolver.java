package com.dramatv.community.shared.media;

import com.dramatv.community.shared.config.MediaStorageProperties;
import java.io.File;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.stereotype.Service;

@Service
public class MediaAssetUrlResolver {

    private final MediaStorageProperties mediaStorageProperties;

    public MediaAssetUrlResolver(MediaStorageProperties mediaStorageProperties) {
        this.mediaStorageProperties = mediaStorageProperties;
    }

    public String resolve(String storedReference) {
        return resolve(null, null, storedReference);
    }

    public String toMediaPath(String storedReference) {
        return toMediaPath(null, null, storedReference);
    }

    public String toMediaPath(String storageProvider, String bucketName, String storedReference) {
        String normalizedReference = normalize(storedReference);
        if (normalizedReference == null) {
            return null;
        }

        if (isDirectUrl(normalizedReference)) {
            return filterMissingLocalMediaPath(null, rewriteLocalDevelopmentUrl(normalizedReference));
        }

        if (normalizedReference.startsWith(mediaStorageProperties.normalizedPublicBasePath() + "/")) {
            return filterMissingLocalMediaPath(storageProvider, normalizedReference);
        }

        if (normalizedReference.startsWith("/")) {
            return filterMissingLocalMediaPath(storageProvider, normalizedReference);
        }

        return filterMissingLocalMediaPath(
                storageProvider,
                appendPath(mediaStorageProperties.normalizedPublicBasePath(), normalizedReference)
        );
    }

    public String resolve(String storageProvider, String bucketName, String storedReference) {
        String normalizedReference = normalize(storedReference);
        if (normalizedReference == null) {
            return null;
        }

        String normalizedProvider = normalize(storageProvider);
        String resolvedBucketName = normalize(bucketName);
        if (normalizedProvider == null) {
            normalizedProvider = normalize(mediaStorageProperties.getStorageProvider());
        }
        if (resolvedBucketName == null) {
            resolvedBucketName = normalize(mediaStorageProperties.getBucketName());
        }

        if (isDirectUrl(normalizedReference)) {
            return filterMissingLocalMediaPath(normalizedProvider, rewriteLocalDevelopmentUrl(normalizedReference));
        }

        String configuredBaseUrl = mediaStorageProperties.normalizedPublicBaseUrl();

        if (isWebPublicStorage(normalizedProvider, resolvedBucketName)) {
            String webPublicPath = normalizedReference.startsWith("/") ? normalizedReference : "/" + normalizedReference;
            return configuredBaseUrl.isEmpty() ? webPublicPath : configuredBaseUrl + webPublicPath;
        }

        if (normalizedReference.startsWith("/")) {
            String resolvedAbsolutePath = filterMissingLocalMediaPath(normalizedProvider, normalizedReference);
            if (resolvedAbsolutePath == null) {
                return null;
            }
            return configuredBaseUrl.isEmpty() ? resolvedAbsolutePath : configuredBaseUrl + resolvedAbsolutePath;
        }

        if (isLocalProvider(normalizedProvider)) {
            String localPath = appendPath(mediaStorageProperties.normalizedPublicBasePath(), normalizedReference);
            String resolvedLocalPath = filterMissingLocalMediaPath(normalizedProvider, localPath);
            if (resolvedLocalPath == null) {
                return null;
            }
            return configuredBaseUrl.isEmpty() ? resolvedLocalPath : configuredBaseUrl + resolvedLocalPath;
        }

        if (!configuredBaseUrl.isEmpty()) {
            return appendPath(configuredBaseUrl, normalizedReference);
        }

        return appendPath(mediaStorageProperties.normalizedPublicBasePath(), normalizedReference);
    }

    private boolean isWebPublicStorage(String storageProvider, String bucketName) {
        return "local-public".equalsIgnoreCase(storageProvider)
                || "apps-web-public".equalsIgnoreCase(bucketName);
    }

    private boolean isLocalProvider(String storageProvider) {
        return storageProvider == null || storageProvider.startsWith("local");
    }

    private boolean isDirectUrl(String value) {
        return value.startsWith("http://")
                || value.startsWith("https://")
                || value.startsWith("data:")
                || value.startsWith("blob:");
    }

    private String rewriteLocalDevelopmentUrl(String directUrl) {
        if (!directUrl.startsWith("http://") && !directUrl.startsWith("https://")) {
            return directUrl;
        }

        try {
            URI uri = new URI(directUrl);
            String host = normalize(uri.getHost());
            if (!isLocalDevelopmentHost(host)) {
                return directUrl;
            }

            String rawPath = normalize(uri.getRawPath());
            if (rawPath == null) {
                return directUrl;
            }

            StringBuilder suffix = new StringBuilder(rawPath);
            if (uri.getRawQuery() != null && !uri.getRawQuery().isBlank()) {
                suffix.append('?').append(uri.getRawQuery());
            }
            if (uri.getRawFragment() != null && !uri.getRawFragment().isBlank()) {
                suffix.append('#').append(uri.getRawFragment());
            }

            String configuredBaseUrl = mediaStorageProperties.normalizedPublicBaseUrl();
            return configuredBaseUrl.isEmpty() ? suffix.toString() : configuredBaseUrl + suffix;
        } catch (URISyntaxException ex) {
            return directUrl;
        }
    }

    private boolean isLocalDevelopmentHost(String host) {
        return "127.0.0.1".equals(host)
                || "localhost".equalsIgnoreCase(host)
                || "::1".equals(host);
    }

    private String filterMissingLocalMediaPath(String storageProvider, String candidatePath) {
        if (candidatePath == null || !mediaStorageProperties.isServeLocally()) {
            return candidatePath;
        }

        if (storageProvider != null && !isLocalProvider(storageProvider)) {
            return candidatePath;
        }

        String normalizedBasePath = mediaStorageProperties.normalizedPublicBasePath();
        String normalizedPath = extractPath(candidatePath);
        if (normalizedPath == null || !normalizedPath.startsWith(normalizedBasePath + "/")) {
            return candidatePath;
        }

        String objectKey = normalizedPath.substring(normalizedBasePath.length() + 1);
        Path mediaRoot = mediaStorageProperties.resolvedLocalDirPath();
        Path targetPath = mediaRoot.resolve(objectKey.replace('/', File.separatorChar)).normalize();
        if (!targetPath.startsWith(mediaRoot) || !Files.exists(targetPath) || !Files.isRegularFile(targetPath)) {
            return null;
        }

        return candidatePath;
    }

    private String extractPath(String candidatePath) {
        if (candidatePath.startsWith("http://") || candidatePath.startsWith("https://")) {
            try {
                URI uri = new URI(candidatePath);
                return normalize(uri.getPath());
            } catch (URISyntaxException ex) {
                return null;
            }
        }

        return candidatePath;
    }

    private String appendPath(String base, String... segments) {
        StringBuilder builder = new StringBuilder();
        if (base != null && !base.isBlank()) {
            builder.append(base.endsWith("/") ? base.substring(0, base.length() - 1) : base);
        }

        for (String segment : segments) {
            String normalizedSegment = normalize(segment);
            if (normalizedSegment == null) {
                continue;
            }

            if (builder.isEmpty()) {
                builder.append(normalizedSegment.startsWith("/") ? normalizedSegment : "/" + normalizedSegment);
                continue;
            }

            builder.append('/');
            builder.append(normalizedSegment.startsWith("/") ? normalizedSegment.substring(1) : normalizedSegment);
        }

        return builder.toString();
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
