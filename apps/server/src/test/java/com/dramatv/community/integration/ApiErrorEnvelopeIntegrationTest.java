package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Locale;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ApiErrorEnvelopeIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void protectedApiFailureStillReturnsStableEnvelopeWithRequestId() throws Exception {
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/me/hub")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andReturn();

        assertStableFailureEnvelope(readBody(result), "FORBIDDEN");
    }

    @Test
    void invalidCredentialsDoNotLeakLowLevelDetails() throws Exception {
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequestBody(
                                "local_password",
                                "it-missing-user",
                                "wrong-password"
                        ))))
                .andExpect(status().isUnauthorized())
                .andReturn();

        JsonNode body = readBody(result);
        assertStableFailureEnvelope(body, "AUTH_INVALID_CREDENTIALS");
        assertThat(body.path("message").asText()).isEqualTo("username or password is invalid");
    }

    @Test
    void uploadValidationFailureKeepsSafeBusinessMessageAndRequestId() throws Exception {
        LoginSession session = loginAsRandomUser("error-envelope-upload");

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/uploads/image-policy")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new UploadPolicyRequest(
                                        "poster.svg",
                                        "image/svg+xml",
                                        2048,
                                        "source"
                                ))),
                        session.accessToken()))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode body = readBody(result);
        assertStableFailureEnvelope(body, "UPLOAD_MIME_NOT_ALLOWED");
        assertThat(body.path("message").asText()).isEqualTo("upload mime type is not allowed");
    }

    private void assertStableFailureEnvelope(JsonNode body, String expectedCode) {
        String message = body.path("message").asText();
        String normalizedMessage = message.toLowerCase(Locale.ROOT);

        assertThat(body.path("code").asText()).isEqualTo(expectedCode);
        assertThat(body.path("requestId").asText()).isNotBlank();
        assertThat(message).isNotBlank();
        assertThat(normalizedMessage).doesNotContain("exception");
        assertThat(normalizedMessage).doesNotContain("java.lang");
        assertThat(normalizedMessage).doesNotContain("org.springframework");
    }

    private record LoginRequestBody(
            String loginType,
            String username,
            String password
    ) {
    }

    private record UploadPolicyRequest(
            String fileName,
            String mimeType,
            long sizeBytes,
            String assetRole
    ) {
    }
}
