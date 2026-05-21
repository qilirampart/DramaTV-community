package com.dramatv.community.shared.media;

import com.aliyun.oss.ClientBuilderConfiguration;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.common.auth.CredentialsProvider;
import com.aliyun.oss.common.auth.DefaultCredentialProvider;
import com.aliyun.oss.common.auth.InstanceProfileCredentialsProvider;
import com.aliyun.oss.common.comm.Protocol;
import com.aliyun.oss.common.comm.SignVersion;
import com.dramatv.community.shared.config.MediaStorageProperties;
import com.dramatv.community.shared.error.ApiBusinessException;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Component
public class AliyunOssClientProvider implements DisposableBean {

    private static final Duration METADATA_TIMEOUT = Duration.ofSeconds(2);

    private final MediaStorageProperties mediaStorageProperties;
    private volatile OSS cachedClient;

    public AliyunOssClientProvider(MediaStorageProperties mediaStorageProperties) {
        this.mediaStorageProperties = mediaStorageProperties;
    }

    public OSS currentClient() {
        OSS current = cachedClient;
        if (current != null) {
            return current;
        }

        synchronized (this) {
            if (cachedClient == null) {
                cachedClient = createClient();
            }
            return cachedClient;
        }
    }

    private OSS createClient() {
        MediaStorageProperties.Oss oss = mediaStorageProperties.getOss();
        String endpoint = requireConfigured("endpoint", oss.getEndpoint());
        String region = requireConfigured("region", oss.getRegion());

        CredentialsProvider credentialsProvider = buildCredentialsProvider(oss);
        ClientBuilderConfiguration clientConfiguration = new ClientBuilderConfiguration();
        clientConfiguration.setProtocol(Protocol.HTTPS);
        clientConfiguration.setSignatureVersion(SignVersion.V4);

        return OSSClientBuilder.create()
                .endpoint(endpoint)
                .credentialsProvider(credentialsProvider)
                .clientConfiguration(clientConfiguration)
                .region(region)
                .build();
    }

    CredentialsProvider buildCredentialsProvider(MediaStorageProperties.Oss oss) {
        String authMode = normalize(oss.getAuthMode());
        String accessKey = normalize(oss.getAccessKey());
        String secretKey = normalize(oss.getSecretKey());
        boolean hasAccessKey = !accessKey.isEmpty();
        boolean hasSecretKey = !secretKey.isEmpty();
        boolean hasAnyStaticCredential = hasAccessKey || hasSecretKey;
        boolean hasStaticCredentialPair = hasAccessKey && hasSecretKey;

        if ("access_key".equals(authMode)) {
            if (!hasStaticCredentialPair) {
                throw ApiBusinessException.conflict(
                        "UPLOAD_OSS_NOT_CONFIGURED",
                        "oss access_key auth mode requires both access key and secret key"
                );
            }
            return new DefaultCredentialProvider(accessKey, secretKey);
        }

        if (hasAnyStaticCredential && !hasStaticCredentialPair) {
            throw ApiBusinessException.conflict(
                    "UPLOAD_OSS_NOT_CONFIGURED",
                    "oss static credentials are partially configured: both access key and secret key are required"
            );
        }

        if (hasStaticCredentialPair && !"ecs_ram_role".equals(authMode)) {
            return new DefaultCredentialProvider(accessKey, secretKey);
        }

        if ("ecs_ram_role".equals(authMode) || "auto".equals(authMode) || authMode.isEmpty()) {
            return new InstanceProfileCredentialsProvider(resolveRamRoleName(oss));
        }

        throw ApiBusinessException.conflict(
                "UPLOAD_OSS_NOT_CONFIGURED",
                "unsupported oss auth mode: " + authMode
        );
    }

    String resolveRamRoleName(MediaStorageProperties.Oss oss) {
        String configuredRoleName = normalize(oss.getRoleName());
        if (!configuredRoleName.isEmpty()) {
            return configuredRoleName;
        }

        String discoveryUrl = requireConfigured("role discovery url", oss.getRoleDiscoveryUrl());
        try {
            String metadataBody = fetchMetadataText(discoveryUrl);
            String discoveredRoleName = firstNonBlankLine(metadataBody);
            if (!discoveredRoleName.isEmpty()) {
                return discoveredRoleName;
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw metadataDiscoveryFailed(exception);
        } catch (IOException exception) {
            throw metadataDiscoveryFailed(exception);
        }

        throw ApiBusinessException.conflict(
                "UPLOAD_OSS_NOT_CONFIGURED",
                "oss ecs ram role auth could not resolve role name from metadata; configure dramatv.media.oss.role-name explicitly"
        );
    }

    String fetchMetadataText(String discoveryUrl) throws IOException, InterruptedException {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(METADATA_TIMEOUT)
                .build();
        HttpRequest request = HttpRequest.newBuilder(URI.create(discoveryUrl))
                .GET()
                .timeout(METADATA_TIMEOUT)
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("metadata service returned status " + response.statusCode());
        }
        return response.body();
    }

    private ApiBusinessException metadataDiscoveryFailed(Exception exception) {
        return ApiBusinessException.conflict(
                "UPLOAD_OSS_NOT_CONFIGURED",
                "oss ecs ram role auth could not reach metadata service; configure dramatv.media.oss.role-name explicitly or ensure ECS metadata is reachable"
        );
    }

    private String firstNonBlankLine(String value) {
        if (value == null) {
            return "";
        }

        String[] lines = value.split("\\r?\\n");
        for (String line : lines) {
            String normalized = normalize(line);
            if (!normalized.isEmpty()) {
                return normalized;
            }
        }
        return "";
    }

    private String requireConfigured(String label, String value) {
        String normalized = normalize(value);
        if (!normalized.isEmpty()) {
            return normalized;
        }

        throw ApiBusinessException.conflict(
                "UPLOAD_OSS_NOT_CONFIGURED",
                "oss upload is not fully configured: missing " + label
        );
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    @Override
    public void destroy() {
        OSS current = cachedClient;
        if (current != null) {
            current.shutdown();
            cachedClient = null;
        }
    }
}
