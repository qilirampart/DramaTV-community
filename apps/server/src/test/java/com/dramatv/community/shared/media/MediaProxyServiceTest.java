package com.dramatv.community.shared.media;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.GetObjectRequest;
import com.aliyun.oss.model.ObjectMetadata;
import com.dramatv.community.shared.config.MediaStorageProperties;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.lang.reflect.Field;
import java.time.Instant;
import java.util.Date;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpMethod;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(OutputCaptureExtension.class)
class MediaProxyServiceTest {

    @Test
    void headRequestForOssOnlyReturnsMetadataWithoutDownloadingObject() throws Exception {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        MediaStorageProperties properties = new MediaStorageProperties();
        properties.setStorageProvider("oss");
        properties.setBucketName("dz-ailab-community");
        StubAliyunOssClientProvider ossClientProvider = new StubAliyunOssClientProvider(properties);
        OSS ossClient = mock(OSS.class);
        setCachedClient(ossClientProvider, ossClient);

        when(jdbcTemplate.query(anyString(), any(org.springframework.jdbc.core.ResultSetExtractor.class), any()))
                .thenReturn(null);

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(1024L);
        metadata.setContentType("video/mp4");
        when(ossClient.getObjectMetadata("dz-ailab-community", "community/test/video/source/demo.mp4"))
                .thenReturn(metadata);

        MediaProxyService service = new MediaProxyService(jdbcTemplate, properties, ossClientProvider);
        MockHttpServletResponse response = new MockHttpServletResponse();

        service.writeToResponse(
                "community/test/video/source/demo.mp4",
                HttpMethod.HEAD,
                null,
                null,
                null,
                response
        );

        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_OK);
        assertThat(response.getContentType()).isEqualTo("video/mp4");
        assertThat(response.getHeader("Accept-Ranges")).isEqualTo("bytes");
        assertThat(response.getContentLengthLong()).isEqualTo(1024L);

        verify(ossClient).getObjectMetadata("dz-ailab-community", "community/test/video/source/demo.mp4");
        verify(ossClient, never()).getObject(any(GetObjectRequest.class));
    }

    @Test
    void headRequestForOssReturns304WhenIfNoneMatchMatches() throws Exception {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        MediaStorageProperties properties = new MediaStorageProperties();
        properties.setStorageProvider("oss");
        properties.setBucketName("dz-ailab-community");
        StubAliyunOssClientProvider ossClientProvider = new StubAliyunOssClientProvider(properties);
        OSS ossClient = mock(OSS.class);
        setCachedClient(ossClientProvider, ossClient);

        when(jdbcTemplate.query(anyString(), any(org.springframework.jdbc.core.ResultSetExtractor.class), any()))
                .thenReturn(null);

        ObjectMetadata metadata = mock(ObjectMetadata.class);
        when(metadata.getContentLength()).thenReturn(1024L);
        when(metadata.getContentType()).thenReturn("video/mp4");
        when(metadata.getETag()).thenReturn("demo-oss-etag");
        when(metadata.getLastModified()).thenReturn(Date.from(Instant.parse("2026-05-23T00:00:00Z")));
        when(ossClient.getObjectMetadata("dz-ailab-community", "community/test/video/source/demo.mp4"))
                .thenReturn(metadata);

        MediaProxyService service = new MediaProxyService(jdbcTemplate, properties, ossClientProvider);
        MockHttpServletResponse response = new MockHttpServletResponse();

        service.writeToResponse(
                "community/test/video/source/demo.mp4",
                HttpMethod.HEAD,
                null,
                "\"demo-oss-etag\"",
                null,
                response
        );

        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_NOT_MODIFIED);
        assertThat(response.getHeader("ETag")).isEqualTo("\"demo-oss-etag\"");
        assertThat(response.getHeader("Last-Modified")).isNotBlank();

        verify(ossClient).getObjectMetadata("dz-ailab-community", "community/test/video/source/demo.mp4");
        verify(ossClient, never()).getObject(any(GetObjectRequest.class));
    }

    @Test
    void localGetReturns304WhenIfNoneMatchMatches(@TempDir Path tempDir) throws Exception {
        String objectKey = "community/test/video/source/demo.mp4";
        Path filePath = tempDir.resolve("community/test/video/source/demo.mp4");
        Files.createDirectories(filePath.getParent());
        Files.write(filePath, "demo-video-payload".getBytes(StandardCharsets.UTF_8));

        MediaProxyService service = createLocalService(tempDir);
        MockHttpServletResponse initialResponse = new MockHttpServletResponse();

        service.writeToResponse(
                objectKey,
                HttpMethod.GET,
                null,
                null,
                null,
                initialResponse
        );

        String etag = initialResponse.getHeader("ETag");
        assertThat(initialResponse.getStatus()).isEqualTo(HttpServletResponse.SC_OK);
        assertThat(initialResponse.getHeader("Last-Modified")).isNotBlank();
        assertThat(etag).isNotBlank();
        assertThat(initialResponse.getContentAsByteArray()).isNotEmpty();

        MockHttpServletResponse cachedResponse = new MockHttpServletResponse();
        service.writeToResponse(
                objectKey,
                HttpMethod.GET,
                null,
                etag,
                null,
                cachedResponse
        );

        assertThat(cachedResponse.getStatus()).isEqualTo(HttpServletResponse.SC_NOT_MODIFIED);
        assertThat(cachedResponse.getContentAsByteArray()).isEmpty();
        assertThat(cachedResponse.getHeader("ETag")).isEqualTo(etag);
        assertThat(cachedResponse.getHeader("Last-Modified")).isEqualTo(initialResponse.getHeader("Last-Modified"));
    }

    @Test
    void localRangeRequestBypassesNotModifiedAndStillReturns206(@TempDir Path tempDir) throws Exception {
        String objectKey = "community/test/video/source/demo.mp4";
        byte[] payload = "demo-video-payload".getBytes(StandardCharsets.UTF_8);
        Path filePath = tempDir.resolve("community/test/video/source/demo.mp4");
        Files.createDirectories(filePath.getParent());
        Files.write(filePath, payload);

        MediaProxyService service = createLocalService(tempDir);
        MockHttpServletResponse initialResponse = new MockHttpServletResponse();
        service.writeToResponse(
                objectKey,
                HttpMethod.GET,
                null,
                null,
                null,
                initialResponse
        );

        MockHttpServletResponse rangeResponse = new MockHttpServletResponse();
        service.writeToResponse(
                objectKey,
                HttpMethod.GET,
                "bytes=0-3",
                initialResponse.getHeader("ETag"),
                null,
                rangeResponse
        );

        assertThat(rangeResponse.getStatus()).isEqualTo(HttpServletResponse.SC_PARTIAL_CONTENT);
        assertThat(rangeResponse.getHeader("Content-Range")).isEqualTo("bytes 0-3/" + payload.length);
        assertThat(rangeResponse.getContentAsByteArray()).containsExactly(payload[0], payload[1], payload[2], payload[3]);
    }

    @Test
    void localFilesUseRoleBasedCacheControl(@TempDir Path tempDir) throws Exception {
        Path coverPath = tempDir.resolve("community/test/image/cover/demo.jpg");
        Files.createDirectories(coverPath.getParent());
        Files.write(coverPath, "demo-cover".getBytes(StandardCharsets.UTF_8));

        Path previewPath = tempDir.resolve("community/test/video/preview/demo.mp4");
        Files.createDirectories(previewPath.getParent());
        Files.write(previewPath, "demo-preview".getBytes(StandardCharsets.UTF_8));

        MediaProxyService service = createLocalService(tempDir);

        MockHttpServletResponse coverResponse = new MockHttpServletResponse();
        service.writeToResponse(
                "community/test/image/cover/demo.jpg",
                HttpMethod.GET,
                null,
                null,
                null,
                coverResponse
        );

        MockHttpServletResponse previewResponse = new MockHttpServletResponse();
        service.writeToResponse(
                "community/test/video/preview/demo.mp4",
                HttpMethod.GET,
                null,
                null,
                null,
                previewResponse
        );

        assertThat(coverResponse.getHeader("Cache-Control")).isEqualTo("public, max-age=86400");
        assertThat(previewResponse.getHeader("Cache-Control")).isEqualTo("public, max-age=14400");
    }

    @Test
    void overloadedProxyReturnsServiceUnavailable(@TempDir Path tempDir) {
        MediaStorageProperties properties = new MediaStorageProperties();
        properties.setStorageProvider("local_fs");
        properties.setLocalDir(tempDir.toString());
        properties.getProxy().setEnabled(true);
        properties.getProxy().setMaxConcurrentRequests(0);

        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        when(jdbcTemplate.query(anyString(), any(org.springframework.jdbc.core.ResultSetExtractor.class), any()))
                .thenReturn(null);

        MediaProxyService service = new MediaProxyService(
                jdbcTemplate,
                properties,
                new StubAliyunOssClientProvider(properties)
        );

        assertThatThrownBy(() -> service.writeToResponse(
                "community/test/video/source/demo.mp4",
                HttpMethod.GET,
                null,
                null,
                null,
                new MockHttpServletResponse()
        ))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(exception -> assertThat(((ResponseStatusException) exception).getStatusCode().value())
                        .isEqualTo(HttpServletResponse.SC_SERVICE_UNAVAILABLE));
    }

    @Test
    void slowProxyRequestWritesStructuredWarning(@TempDir Path tempDir, CapturedOutput output) throws Exception {
        String objectKey = "community/test/video/source/demo.mp4";
        Path filePath = tempDir.resolve(objectKey);
        Files.createDirectories(filePath.getParent());
        Files.write(filePath, "demo-video-payload".getBytes(StandardCharsets.UTF_8));

        MediaStorageProperties properties = new MediaStorageProperties();
        properties.setStorageProvider("local_fs");
        properties.setLocalDir(tempDir.toString());
        properties.getProxy().setSlowRequestThresholdMs(0);

        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        when(jdbcTemplate.query(anyString(), any(org.springframework.jdbc.core.ResultSetExtractor.class), any()))
                .thenReturn(null);

        MediaProxyService service = new MediaProxyService(
                jdbcTemplate,
                properties,
                new StubAliyunOssClientProvider(properties)
        );

        service.writeToResponse(
                objectKey,
                HttpMethod.GET,
                null,
                null,
                null,
                new MockHttpServletResponse()
        );

        assertThat(output.getOut())
                .contains("media_proxy_slow")
                .contains("objectKey=" + objectKey)
                .contains("status=200");
    }

    private static MediaProxyService createLocalService(Path localDir) {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        when(jdbcTemplate.query(anyString(), any(org.springframework.jdbc.core.ResultSetExtractor.class), any()))
                .thenReturn(null);

        MediaStorageProperties properties = new MediaStorageProperties();
        properties.setStorageProvider("local_fs");
        properties.setLocalDir(localDir.toString());
        return new MediaProxyService(jdbcTemplate, properties, new StubAliyunOssClientProvider(properties));
    }

    private static void setCachedClient(AliyunOssClientProvider provider, OSS ossClient) throws Exception {
        Field field = AliyunOssClientProvider.class.getDeclaredField("cachedClient");
        field.setAccessible(true);
        field.set(provider, ossClient);
    }

    private static final class StubAliyunOssClientProvider extends AliyunOssClientProvider {

        private StubAliyunOssClientProvider(MediaStorageProperties properties) {
            super(properties);
        }

        @Override
        String fetchMetadataText(String discoveryUrl) {
            return "ignored-role";
        }
    }
}
