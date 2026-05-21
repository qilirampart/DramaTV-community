package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UploadValidationIntegrationTest extends ApiIntegrationTestSupport {

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

    private Path resolveLocalMediaPath(String objectKey) {
        return mediaStorageProperties.resolvedLocalDirPath()
                .resolve(Path.of(objectKey.replace('/', java.io.File.separatorChar)))
                .normalize();
    }

    private record UploadPolicyPayload(
            String fileName,
            String mimeType,
            long sizeBytes,
            String assetRole
    ) {
    }
}
