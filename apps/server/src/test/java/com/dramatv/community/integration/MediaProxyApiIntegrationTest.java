package com.dramatv.community.integration;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MediaProxyApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void localMediaGetAndHeadReturnCachingHeadersAndConditional304() throws Exception {
        MediaFixture media = createLocalReadyMedia("video/mp4", "demo-media-payload");

        MvcResult headResult = mockMvc.perform(MockMvcRequestBuilders.head(media.publicPath()))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCEPT_RANGES, "bytes"))
                .andExpect(header().exists(HttpHeaders.ETAG))
                .andExpect(header().exists(HttpHeaders.LAST_MODIFIED))
                .andReturn();

        String etag = headResult.getResponse().getHeader(HttpHeaders.ETAG);
        String lastModified = headResult.getResponse().getHeader(HttpHeaders.LAST_MODIFIED);
        assertThat(etag).isNotBlank();
        assertThat(lastModified).isNotBlank();
        assertThat(headResult.getResponse().getContentAsByteArray()).isEmpty();

        MvcResult getResult = mockMvc.perform(MockMvcRequestBuilders.get(media.publicPath()))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ETAG, etag))
                .andExpect(header().string(HttpHeaders.LAST_MODIFIED, lastModified))
                .andReturn();

        assertThat(getResult.getResponse().getContentAsString(StandardCharsets.UTF_8))
                .isEqualTo("demo-media-payload");

        mockMvc.perform(MockMvcRequestBuilders.get(media.publicPath())
                        .header(HttpHeaders.IF_NONE_MATCH, etag))
                .andExpect(status().isNotModified())
                .andExpect(header().string(HttpHeaders.ETAG, etag))
                .andExpect(header().string(HttpHeaders.LAST_MODIFIED, lastModified));

        mockMvc.perform(MockMvcRequestBuilders.get(media.publicPath())
                        .header(HttpHeaders.IF_MODIFIED_SINCE, lastModified))
                .andExpect(status().isNotModified())
                .andExpect(header().string(HttpHeaders.ETAG, etag))
                .andExpect(header().string(HttpHeaders.LAST_MODIFIED, lastModified));
    }

    @Test
    void localMediaRangeRequestStillReturns206WhenConditionalHeadersPresent() throws Exception {
        MediaFixture media = createLocalReadyMedia("video/mp4", "demo-media-payload");

        MvcResult initialResult = mockMvc.perform(MockMvcRequestBuilders.get(media.publicPath()))
                .andExpect(status().isOk())
                .andExpect(header().exists(HttpHeaders.ETAG))
                .andReturn();

        String etag = initialResult.getResponse().getHeader(HttpHeaders.ETAG);
        assertThat(etag).isNotBlank();

        MvcResult rangeResult = mockMvc.perform(MockMvcRequestBuilders.get(media.publicPath())
                        .header(HttpHeaders.RANGE, "bytes=0-3")
                        .header(HttpHeaders.IF_NONE_MATCH, etag))
                .andExpect(status().isPartialContent())
                .andExpect(header().string(HttpHeaders.ETAG, etag))
                .andExpect(header().exists(HttpHeaders.LAST_MODIFIED))
                .andReturn();

        assertThat(rangeResult.getResponse().getHeader(HttpHeaders.CONTENT_RANGE))
                .isEqualTo("bytes 0-3/18");
        assertThat(rangeResult.getResponse().getContentAsByteArray())
                .containsExactly((byte) 'd', (byte) 'e', (byte) 'm', (byte) 'o');
    }

    @Test
    void localMediaCacheControlVariesByAssetRole() throws Exception {
        MediaFixture cover = createLocalReadyMedia("image", "cover", "image/jpeg", "demo-cover", "cover.jpg");
        MediaFixture preview = createLocalReadyMedia("video", "preview", "video/mp4", "demo-preview", "preview.mp4");
        MediaFixture source = createLocalReadyMedia("video", "source", "video/mp4", "demo-source", "source.mp4");

        mockMvc.perform(MockMvcRequestBuilders.head(cover.publicPath()))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "public, max-age=86400"));

        mockMvc.perform(MockMvcRequestBuilders.head(preview.publicPath()))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "public, max-age=14400"));

        mockMvc.perform(MockMvcRequestBuilders.head(source.publicPath()))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "public, max-age=3600"));
    }

    private MediaFixture createLocalReadyMedia(String mimeType, String content) throws Exception {
        return createLocalReadyMedia("video", "source", mimeType, content, "video.mp4");
    }

    private MediaFixture createLocalReadyMedia(
            String assetKind,
            String assetRole,
            String mimeType,
            String content,
            String fileName
    ) throws Exception {
        LoginSession author = loginAsRandomUser("media-proxy");
        String assetId = UUID.randomUUID().toString();
        String objectKey = "community/local/" + assetKind + "/" + assetRole + "/" + assetId + "/" + fileName;
        Path targetPath = mediaStorageProperties.resolvedLocalDirPath()
                .resolve(Path.of(objectKey.replace('/', java.io.File.separatorChar)))
                .normalize();
        Files.createDirectories(targetPath.getParent());
        byte[] payload = content.getBytes(StandardCharsets.UTF_8);
        Files.write(targetPath, payload);

        jdbcTemplate.update("""
                insert into media_assets (
                    id, asset_kind, asset_role, storage_provider, bucket_name, object_key, file_name, mime_type,
                    size_bytes, status_code, is_public, created_by, created_at, updated_at
                )
                values (?, ?, ?, 'local_fs', ?, ?, ?, ?, ?, 'ready', true, ?, now(), now())
                """,
                UUID.fromString(assetId),
                assetKind,
                assetRole,
                mediaStorageProperties.getBucketName(),
                objectKey,
                fileName,
                mimeType,
                payload.length,
                UUID.fromString(author.userId())
        );

        return new MediaFixture(mediaStorageProperties.normalizedPublicBasePath() + "/" + objectKey);
    }

    private record MediaFixture(String publicPath) {
    }
}
