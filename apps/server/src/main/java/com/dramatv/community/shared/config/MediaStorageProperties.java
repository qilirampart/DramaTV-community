package com.dramatv.community.shared.config;

import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "dramatv.media")
public class MediaStorageProperties {

    private String localDir = "tmp/media";
    private boolean serveLocally = true;
    private String storageProvider = "local_fs";
    private String bucketName = "dramatv-local-media";
    private String keyPrefix = "community/local";
    private String publicBaseUrl = "";
    private String publicBasePath = "/media";
    private final Upload upload = new Upload();
    private final Oss oss = new Oss();

    public String getLocalDir() {
        return localDir;
    }

    public void setLocalDir(String localDir) {
        this.localDir = localDir;
    }

    public boolean isServeLocally() {
        return serveLocally;
    }

    public void setServeLocally(boolean serveLocally) {
        this.serveLocally = serveLocally;
    }

    public String getStorageProvider() {
        return storageProvider;
    }

    public void setStorageProvider(String storageProvider) {
        this.storageProvider = storageProvider;
    }

    public String getBucketName() {
        return bucketName;
    }

    public void setBucketName(String bucketName) {
        this.bucketName = bucketName;
    }

    public String getKeyPrefix() {
        return keyPrefix;
    }

    public void setKeyPrefix(String keyPrefix) {
        this.keyPrefix = keyPrefix;
    }

    public String getPublicBaseUrl() {
        return publicBaseUrl;
    }

    public void setPublicBaseUrl(String publicBaseUrl) {
        this.publicBaseUrl = publicBaseUrl;
    }

    public String getPublicBasePath() {
        return publicBasePath;
    }

    public void setPublicBasePath(String publicBasePath) {
        this.publicBasePath = publicBasePath;
    }

    public Oss getOss() {
        return oss;
    }

    public Upload getUpload() {
        return upload;
    }

    public String normalizedPublicBasePath() {
        String trimmed = publicBasePath == null ? "" : publicBasePath.trim();
        if (trimmed.isEmpty()) {
            return "/media";
        }
        String normalized = trimmed.startsWith("/") ? trimmed : "/" + trimmed;
        return normalized.endsWith("/") ? normalized.substring(0, normalized.length() - 1) : normalized;
    }

    public String normalizedPublicBaseUrl() {
        String trimmed = publicBaseUrl == null ? "" : publicBaseUrl.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
    }

    public String normalizedKeyPrefix() {
        String trimmed = keyPrefix == null ? "" : keyPrefix.trim();
        if (trimmed.isEmpty()) {
            return "";
        }

        String normalized = trimmed.replace('\\', '/');
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    public Path resolvedLocalDirPath() {
        Path configured = Path.of(localDir == null || localDir.isBlank() ? "tmp/media" : localDir.trim());
        if (configured.isAbsolute()) {
            return configured.normalize();
        }

        Path workingDir = Path.of("").toAbsolutePath().normalize();
        Path twoUp = workingDir.getParent() == null || workingDir.getParent().getParent() == null
                ? null
                : workingDir.getParent().getParent().resolve(configured).normalize();
        if (workingDir.endsWith(Path.of("apps", "server")) && twoUp != null && Files.exists(twoUp)) {
            return twoUp;
        }

        Path direct = workingDir.resolve(configured).normalize();
        if (Files.exists(direct)) {
            return direct;
        }

        Path oneUp = workingDir.getParent() == null ? null : workingDir.getParent().resolve(configured).normalize();
        if (oneUp != null && Files.exists(oneUp)) {
            return oneUp;
        }

        if (twoUp != null && Files.exists(twoUp)) {
            return twoUp;
        }

        if (workingDir.endsWith(Path.of("apps", "server")) && twoUp != null) {
            return twoUp;
        }

        return direct;
    }

    public static class Oss {
        private String endpoint = "";
        private String region = "";
        private String authMode = "auto";
        private String roleName = "";
        private String roleDiscoveryUrl = "http://100.100.100.200/latest/meta-data/ram/security-credentials/";
        private String accessKey = "";
        private String secretKey = "";

        public String getEndpoint() {
            return endpoint;
        }

        public void setEndpoint(String endpoint) {
            this.endpoint = endpoint;
        }

        public String getRegion() {
            return region;
        }

        public void setRegion(String region) {
            this.region = region;
        }

        public String getAuthMode() {
            return authMode;
        }

        public void setAuthMode(String authMode) {
            this.authMode = authMode;
        }

        public String getRoleName() {
            return roleName;
        }

        public void setRoleName(String roleName) {
            this.roleName = roleName;
        }

        public String getRoleDiscoveryUrl() {
            return roleDiscoveryUrl;
        }

        public void setRoleDiscoveryUrl(String roleDiscoveryUrl) {
            this.roleDiscoveryUrl = roleDiscoveryUrl;
        }

        public String getAccessKey() {
            return accessKey;
        }

        public void setAccessKey(String accessKey) {
            this.accessKey = accessKey;
        }

        public String getSecretKey() {
            return secretKey;
        }

        public void setSecretKey(String secretKey) {
            this.secretKey = secretKey;
        }
    }

    public static class Upload {
        private long maxVideoSizeBytes = 300L * 1024L * 1024L;
        private long maxImageSizeBytes = 20L * 1024L * 1024L;

        public long getMaxVideoSizeBytes() {
            return maxVideoSizeBytes;
        }

        public void setMaxVideoSizeBytes(long maxVideoSizeBytes) {
            this.maxVideoSizeBytes = maxVideoSizeBytes;
        }

        public long getMaxImageSizeBytes() {
            return maxImageSizeBytes;
        }

        public void setMaxImageSizeBytes(long maxImageSizeBytes) {
            this.maxImageSizeBytes = maxImageSizeBytes;
        }
    }
}
