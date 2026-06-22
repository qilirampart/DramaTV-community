package com.dramatv.community.integration;

import com.dramatv.community.publish.application.UploadApplicationService;
import com.fasterxml.jackson.databind.JsonNode;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UploadValidationIntegrationTest extends ApiIntegrationTestSupport {

    @Autowired
    private UploadApplicationService uploadApplicationService;

    @Test
    void imagePolicyRejectsUnsupportedMimeSubtype() throws Exception {
        LoginSession session = loginAsRandomUser("upload-image-mime");

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/uploads/image-policy")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new UploadPolicyPayload(
                                        "vector.svg",
                                        "image/svg+xml",
                                        128,
                                        "cover"
                                ))),
                        session.accessToken()))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("UPLOAD_MIME_NOT_ALLOWED");
    }

    @Test
    void audioPolicyCreatesReadyAssetAndStoresBinary() throws Exception {
        LoginSession session = loginAsRandomUser("upload-audio-ok");
        byte[] audioBytes = "fake-audio-binary".getBytes(StandardCharsets.UTF_8);

        MvcResult policyResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/uploads/audio-policy")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new UploadPolicyPayload(
                                        "reference-track.mp3",
                                        "audio/mpeg",
                                        audioBytes.length,
                                        "attachment"
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode policyBody = readBody(policyResult);
        String assetId = policyBody.at("/data/assetId").asText();
        String uploadUrl = policyBody.at("/data/uploadUrl").asText();
        assertThat(policyBody.at("/data/assetKind").asText()).isEqualTo("audio");
        assertThat(policyBody.at("/data/assetRole").asText()).isEqualTo("attachment");

        MvcResult uploadResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put(uploadUrl)
                                .contentType("audio/mpeg")
                                .content(audioBytes),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode uploadBody = readBody(uploadResult);
        assertThat(uploadBody.at("/data/assetKind").asText()).isEqualTo("audio");
        assertThat(uploadBody.at("/data/assetRole").asText()).isEqualTo("attachment");
        assertThat(uploadBody.at("/data/statusCode").asText()).isEqualTo("ready");

        Map<String, Object> row = jdbcTemplate.queryForMap("""
                select asset_kind, asset_role, status_code, object_key
                from media_assets
                where id = ?
                """,
                UUID.fromString(assetId)
        );
        assertThat(row.get("asset_kind")).isEqualTo("audio");
        assertThat(row.get("asset_role")).isEqualTo("attachment");
        assertThat(row.get("status_code")).isEqualTo("ready");
        assertThat(Files.exists(resolveLocalMediaPath(String.valueOf(row.get("object_key"))))).isTrue();
    }

    @Test
    void audioPolicyRejectsUnsupportedMimeType() throws Exception {
        LoginSession session = loginAsRandomUser("upload-audio-mime");

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/uploads/audio-policy")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new UploadPolicyPayload(
                                        "reference-track.mp3",
                                        "application/octet-stream",
                                        128,
                                        "attachment"
                                ))),
                        session.accessToken()))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("UPLOAD_MIME_NOT_ALLOWED");
    }

    @Test
    void audioPolicyRejectsDeclaredSizeOverAudioLimit() throws Exception {
        LoginSession session = loginAsRandomUser("upload-audio-size");

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/uploads/audio-policy")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new UploadPolicyPayload(
                                        "reference-track.mp3",
                                        "audio/mpeg",
                                        mediaStorageProperties.getUpload().getMaxAudioSizeBytes() + 1,
                                        "attachment"
                                ))),
                        session.accessToken()))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("UPLOAD_FILE_TOO_LARGE");
    }

    @Test
    void videoPolicyRejectsFileNameExtensionOutsideAllowedList() throws Exception {
        LoginSession session = loginAsRandomUser("upload-video-ext");

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/uploads/video-policy")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new UploadPolicyPayload(
                                        "demo.exe",
                                        "video/mp4",
                                        128,
                                        "source"
                                ))),
                        session.accessToken()))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("UPLOAD_FILE_EXTENSION_NOT_ALLOWED");
    }

    @Test
    void binaryUploadRejectsContentTypeMismatchAgainstRegisteredPolicy() throws Exception {
        LoginSession session = loginAsRandomUser("upload-binary-mime");

        MvcResult policyResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/uploads/image-policy")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new UploadPolicyPayload(
                                        "cover-check.jpg",
                                        "image/jpeg",
                                        64,
                                        "cover"
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode policyBody = readBody(policyResult);
        String assetId = policyBody.at("/data/assetId").asText();
        String uploadUrl = policyBody.at("/data/uploadUrl").asText();

        MvcResult uploadResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put(uploadUrl)
                                .contentType(MediaType.IMAGE_PNG)
                                .content("fake-png-binary".getBytes()),
                        session.accessToken()))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode uploadBody = readBody(uploadResult);
        assertThat(uploadBody.path("code").asText()).isEqualTo("UPLOAD_CONTENT_TYPE_MISMATCH");

        Map<String, Object> row = jdbcTemplate.queryForMap("""
                select status_code, mime_type
                from media_assets
                where id = ?
                """,
                UUID.fromString(assetId)
        );
        assertThat(row.get("status_code")).isEqualTo("pending_upload");
        assertThat(row.get("mime_type")).isEqualTo("image/jpeg");
    }

    @Test
    void binaryUploadRejectsActualOversizeEvenWhenPolicyDeclaredSizeIsSmaller() throws Exception {
        LoginSession session = loginAsRandomUser("upload-actual-size");
        int actualSizeBytes = Math.toIntExact(mediaStorageProperties.getUpload().getMaxImageSizeBytes() + 1);
        byte[] oversizedContent = new byte[actualSizeBytes];

        MvcResult policyResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/uploads/image-policy")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new UploadPolicyPayload(
                                        "oversized.png",
                                        "image/png",
                                        256,
                                        "source"
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode policyBody = readBody(policyResult);
        String assetId = policyBody.at("/data/assetId").asText();
        String uploadUrl = policyBody.at("/data/uploadUrl").asText();

        MvcResult uploadResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put(uploadUrl)
                                .contentType(MediaType.IMAGE_PNG)
                                .content(oversizedContent),
                        session.accessToken()))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode uploadBody = readBody(uploadResult);
        assertThat(uploadBody.path("code").asText()).isEqualTo("UPLOAD_FILE_TOO_LARGE");

        Map<String, Object> row = jdbcTemplate.queryForMap("""
                select object_key, status_code
                from media_assets
                where id = ?
                """,
                UUID.fromString(assetId)
        );
        assertThat(row.get("status_code")).isEqualTo("pending_upload");

        Path localFile = resolveLocalMediaPath(String.valueOf(row.get("object_key")));
        assertThat(Files.exists(localFile)).isFalse();
    }

    @Test
    void binaryUploadReusesExistingReadyObjectForSameRoleAndChecksum() throws Exception {
        LoginSession session = loginAsRandomUser("upload-dedup-binary");
        byte[] content = "shared-upload-image".getBytes(StandardCharsets.UTF_8);
        String expectedChecksum = sha256Hex(content);

        MvcResult firstPolicyResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/uploads/image-policy")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new UploadPolicyPayload(
                                        "shared-cover-a.jpg",
                                        "image/jpeg",
                                        content.length,
                                        "cover"
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        String firstAssetId = readBody(firstPolicyResult).at("/data/assetId").asText();
        String firstUploadUrl = readBody(firstPolicyResult).at("/data/uploadUrl").asText();
        String firstReservedObjectKey = jdbcTemplate.queryForObject(
                "select object_key from media_assets where id = ?",
                String.class,
                UUID.fromString(firstAssetId)
        );

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put(firstUploadUrl)
                                .contentType(MediaType.IMAGE_JPEG)
                                .content(content),
                        session.accessToken()))
                .andExpect(status().isOk());

        MvcResult secondPolicyResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/uploads/image-policy")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new UploadPolicyPayload(
                                        "shared-cover-b.jpg",
                                        "image/jpeg",
                                        content.length,
                                        "cover"
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        String secondAssetId = readBody(secondPolicyResult).at("/data/assetId").asText();
        String secondUploadUrl = readBody(secondPolicyResult).at("/data/uploadUrl").asText();
        String secondReservedObjectKey = jdbcTemplate.queryForObject(
                "select object_key from media_assets where id = ?",
                String.class,
                UUID.fromString(secondAssetId)
        );

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put(secondUploadUrl)
                                .contentType(MediaType.IMAGE_JPEG)
                                .content(content),
                        session.accessToken()))
                .andExpect(status().isOk());

        Map<String, Object> firstRow = jdbcTemplate.queryForMap("""
                select object_key, checksum, size_bytes, status_code
                from media_assets
                where id = ?
                """, UUID.fromString(firstAssetId));
        Map<String, Object> secondRow = jdbcTemplate.queryForMap("""
                select object_key, checksum, size_bytes, status_code
                from media_assets
                where id = ?
                """, UUID.fromString(secondAssetId));

        assertThat(firstRow.get("status_code")).isEqualTo("ready");
        assertThat(secondRow.get("status_code")).isEqualTo("ready");
        assertThat(firstRow.get("checksum")).isEqualTo(expectedChecksum);
        assertThat(secondRow.get("checksum")).isEqualTo(expectedChecksum);
        assertThat(secondRow.get("object_key")).isEqualTo(firstRow.get("object_key"));
        assertThat(secondRow.get("object_key")).isNotEqualTo(secondReservedObjectKey);
        assertThat(firstRow.get("object_key")).isEqualTo(firstReservedObjectKey);
        assertThat(((Number) secondRow.get("size_bytes")).longValue()).isEqualTo(content.length);
        assertThat(Files.exists(resolveLocalMediaPath(String.valueOf(firstRow.get("object_key"))))).isTrue();
        assertThat(Files.exists(resolveLocalMediaPath(secondReservedObjectKey))).isFalse();
    }

    @Test
    void storeDerivedAssetReusesExistingReadyObjectForSameRoleAndChecksum() throws Exception {
        LoginSession session = loginAsRandomUser("upload-dedup-derived");
        Path sourcePath = Files.createTempFile("dramatv-derived-dedup-", ".jpg");
        Files.write(sourcePath, "shared-derived-cover".getBytes(StandardCharsets.UTF_8));
        String expectedChecksum = sha256Hex(Files.readAllBytes(sourcePath));

        try {
            UploadApplicationService.StoredAsset firstAsset = uploadApplicationService.storeDerivedAsset(
                    "image",
                    "cover",
                    "derived-cover-a.jpg",
                    "image/jpeg",
                    sourcePath,
                    UUID.fromString(session.userId()),
                    null
            );
            UploadApplicationService.StoredAsset secondAsset = uploadApplicationService.storeDerivedAsset(
                    "image",
                    "cover",
                    "derived-cover-b.jpg",
                    "image/jpeg",
                    sourcePath,
                    UUID.fromString(session.userId()),
                    null
            );

            Map<String, Object> firstRow = jdbcTemplate.queryForMap("""
                    select object_key, checksum, size_bytes, status_code, file_name
                    from media_assets
                    where id = ?
                    """, firstAsset.id());
            Map<String, Object> secondRow = jdbcTemplate.queryForMap("""
                    select object_key, checksum, size_bytes, status_code, file_name
                    from media_assets
                    where id = ?
                    """, secondAsset.id());

            assertThat(firstAsset.objectKey()).isEqualTo(firstRow.get("object_key"));
            assertThat(secondAsset.objectKey()).isEqualTo(firstAsset.objectKey());
            assertThat(firstRow.get("checksum")).isEqualTo(expectedChecksum);
            assertThat(secondRow.get("checksum")).isEqualTo(expectedChecksum);
            assertThat(firstRow.get("status_code")).isEqualTo("ready");
            assertThat(secondRow.get("status_code")).isEqualTo("ready");
            assertThat(secondRow.get("file_name")).isEqualTo("derived-cover-b.jpg");
            assertThat(Files.exists(resolveLocalMediaPath(firstAsset.objectKey()))).isTrue();
        } finally {
            Files.deleteIfExists(sourcePath);
        }
    }

    private Path resolveLocalMediaPath(String objectKey) {
        return mediaStorageProperties.resolvedLocalDirPath()
                .resolve(Path.of(objectKey.replace('/', java.io.File.separatorChar)))
                .normalize();
    }

    private String sha256Hex(byte[] content) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content));
    }

    private record UploadPolicyPayload(
            String fileName,
            String mimeType,
            long sizeBytes,
            String assetRole
    ) {
    }
}
