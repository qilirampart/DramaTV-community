package com.dramatv.community.shared.media;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.GetObjectRequest;
import com.aliyun.oss.model.ObjectMetadata;
import com.dramatv.community.shared.config.MediaStorageProperties;
import jakarta.servlet.http.HttpServletResponse;
import java.lang.reflect.Field;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
                response
        );

        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_OK);
        assertThat(response.getContentType()).isEqualTo("video/mp4");
        assertThat(response.getHeader("Accept-Ranges")).isEqualTo("bytes");
        assertThat(response.getContentLengthLong()).isEqualTo(1024L);

        verify(ossClient).getObjectMetadata("dz-ailab-community", "community/test/video/source/demo.mp4");
        verify(ossClient, never()).getObject(any(GetObjectRequest.class));
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
