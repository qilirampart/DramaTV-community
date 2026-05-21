package com.dramatv.community.shared.media;

import com.dramatv.community.shared.config.MediaStorageProperties;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MediaAssetUrlResolverTest {

    @Test
    void localMediaPathUsesConfiguredPublicBasePath() {
        MediaStorageProperties properties = new MediaStorageProperties();
        properties.setStorageProvider("local_fs");
        properties.setPublicBasePath("/media");
        properties.setServeLocally(false);

        MediaAssetUrlResolver resolver = new MediaAssetUrlResolver(properties);

        assertThat(resolver.toMediaPath("community/local/image/cover/test.jpg"))
                .isEqualTo("/media/community/local/image/cover/test.jpg");
    }

    @Test
    void ossUrlsPreferConfiguredPublicBaseUrl() {
        MediaStorageProperties properties = new MediaStorageProperties();
        properties.setStorageProvider("oss");
        properties.setBucketName("dz-ailab-community");
        properties.setPublicBaseUrl("https://cdn.example.com");

        MediaAssetUrlResolver resolver = new MediaAssetUrlResolver(properties);

        assertThat(resolver.resolve("oss", "dz-ailab-community", "community/test/video/source/demo.mp4"))
                .isEqualTo("https://cdn.example.com/community/test/video/source/demo.mp4");
        assertThat(resolver.toMediaPath("oss", "dz-ailab-community", "community/test/video/source/demo.mp4"))
                .isEqualTo("/media/community/test/video/source/demo.mp4");
    }

    @Test
    void ossUrlsFallBackToBackendProxyPathWhenNoPublicBaseUrl() {
        MediaStorageProperties properties = new MediaStorageProperties();
        properties.setStorageProvider("oss");
        properties.setBucketName("dz-ailab-community");

        MediaAssetUrlResolver resolver = new MediaAssetUrlResolver(properties);

        assertThat(resolver.resolve("oss", "dz-ailab-community", "community/test/image/source/demo.jpg"))
                .isEqualTo("/media/community/test/image/source/demo.jpg");
        assertThat(resolver.toMediaPath("oss", "dz-ailab-community", "community/test/image/source/demo.jpg"))
                .isEqualTo("/media/community/test/image/source/demo.jpg");
    }

    @Test
    void localDevelopmentAbsoluteUrlsRewriteToConfiguredPublicBaseUrl() {
        MediaStorageProperties properties = new MediaStorageProperties();
        properties.setPublicBaseUrl("https://community.example.com");
        properties.setServeLocally(false);

        MediaAssetUrlResolver resolver = new MediaAssetUrlResolver(properties);

        assertThat(resolver.resolve("http://127.0.0.1:18080/media/image/demo.jpg?size=small"))
                .isEqualTo("https://community.example.com/media/image/demo.jpg?size=small");
    }

    @Test
    void localDevelopmentAbsoluteUrlsFallBackToRelativePathWithoutPublicBaseUrl() {
        MediaStorageProperties properties = new MediaStorageProperties();
        MediaAssetUrlResolver resolver = new MediaAssetUrlResolver(properties);

        assertThat(resolver.resolve("http://localhost:18080/seedance-videos/demo.mp4"))
                .isEqualTo("/seedance-videos/demo.mp4");
    }
}
