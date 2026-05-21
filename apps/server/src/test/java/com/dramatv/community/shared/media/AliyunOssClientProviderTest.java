package com.dramatv.community.shared.media;

import com.aliyun.oss.common.auth.CredentialsProvider;
import com.aliyun.oss.common.auth.DefaultCredentialProvider;
import com.aliyun.oss.common.auth.InstanceProfileCredentialsProvider;
import com.dramatv.community.shared.config.MediaStorageProperties;
import com.dramatv.community.shared.error.ApiBusinessException;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AliyunOssClientProviderTest {

    @Test
    void usesStaticCredentialsWhenConfiguredInAutoMode() {
        MediaStorageProperties properties = new MediaStorageProperties();
        properties.getOss().setAuthMode("auto");
        properties.getOss().setAccessKey("test-ak");
        properties.getOss().setSecretKey("test-sk");

        StubAliyunOssClientProvider provider = new StubAliyunOssClientProvider(properties, "");

        CredentialsProvider credentialsProvider = provider.buildCredentialsProvider(properties.getOss());

        assertInstanceOf(DefaultCredentialProvider.class, credentialsProvider);
    }

    @Test
    void autoDiscoversRamRoleWhenStaticCredentialsAreMissing() {
        MediaStorageProperties properties = new MediaStorageProperties();
        properties.getOss().setAuthMode("auto");

        StubAliyunOssClientProvider provider = new StubAliyunOssClientProvider(properties, "dramatv-community-test-role\n");

        CredentialsProvider credentialsProvider = provider.buildCredentialsProvider(properties.getOss());

        assertInstanceOf(InstanceProfileCredentialsProvider.class, credentialsProvider);
        assertEquals("dramatv-community-test-role", provider.resolveRamRoleName(properties.getOss()));
    }

    @Test
    void failsFastWhenRamRoleCannotBeResolved() {
        MediaStorageProperties properties = new MediaStorageProperties();
        properties.getOss().setAuthMode("ecs_ram_role");

        StubAliyunOssClientProvider provider = new StubAliyunOssClientProvider(properties, "   \n");

        ApiBusinessException exception = assertThrows(
                ApiBusinessException.class,
                () -> provider.buildCredentialsProvider(properties.getOss())
        );

        assertEquals("UPLOAD_OSS_NOT_CONFIGURED", exception.code());
    }

    private static final class StubAliyunOssClientProvider extends AliyunOssClientProvider {

        private final String metadataBody;

        private StubAliyunOssClientProvider(MediaStorageProperties properties, String metadataBody) {
            super(properties);
            this.metadataBody = metadataBody;
        }

        @Override
        String fetchMetadataText(String discoveryUrl) throws IOException {
            return metadataBody;
        }
    }
}
