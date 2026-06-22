package com.dramatv.community.integration;

import com.dramatv.community.shared.security.ActionRateLimitProperties;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ActionRateLimitIntegrationTest extends ApiIntegrationTestSupport {

    @Autowired
    private ActionRateLimitProperties actionRateLimitProperties;

    private boolean originalEnabled;
    private RuleSnapshot loginSnapshot;
    private RuleSnapshot reportSnapshot;
    private RuleSnapshot uploadPolicySnapshot;
    private RuleSnapshot uploadBinarySnapshot;

    @BeforeEach
    void snapshotProperties() {
        originalEnabled = actionRateLimitProperties.isEnabled();
        loginSnapshot = RuleSnapshot.capture(actionRateLimitProperties.getLogin());
        reportSnapshot = RuleSnapshot.capture(actionRateLimitProperties.getReport());
        uploadPolicySnapshot = RuleSnapshot.capture(actionRateLimitProperties.getUploadPolicy());
        uploadBinarySnapshot = RuleSnapshot.capture(actionRateLimitProperties.getUploadBinary());
    }

    @AfterEach
    void restoreProperties() {
        actionRateLimitProperties.setEnabled(originalEnabled);
        loginSnapshot.restore(actionRateLimitProperties.getLogin());
        reportSnapshot.restore(actionRateLimitProperties.getReport());
        uploadPolicySnapshot.restore(actionRateLimitProperties.getUploadPolicy());
        uploadBinarySnapshot.restore(actionRateLimitProperties.getUploadBinary());
    }

    @Test
    void loginIsRateLimitedByClientIpAndUsername() throws Exception {
        actionRateLimitProperties.setEnabled(true);
        actionRateLimitProperties.getLogin().setWindowSeconds(60);
        actionRateLimitProperties.getLogin().setMaxAttempts(2);

        String username = "it-auth-rate-" + System.nanoTime();
        LoginPayload payload = new LoginPayload("local_password", username, DEFAULT_PASSWORD);

        for (int attempt = 0; attempt < 2; attempt++) {
            mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/login")
                            .header("X-Forwarded-For", "203.0.113.10")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(payload)))
                    .andExpect(status().isOk());
        }

        MvcResult blockedResult = mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/login")
                        .header("X-Forwarded-For", "203.0.113.10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isTooManyRequests())
                .andReturn();

        JsonNode body = readBody(blockedResult);
        assertThat(body.path("code").asText()).isEqualTo("AUTH_RATE_LIMITED");
    }

    @Test
    void reportCreateIsRateLimitedPerReporter() throws Exception {
        actionRateLimitProperties.setEnabled(true);
        actionRateLimitProperties.getReport().setWindowSeconds(60);
        actionRateLimitProperties.getReport().setMaxAttempts(2);

        LoginSession owner = loginAsRandomUser("report-rate-owner");
        LoginSession reporter = loginAsRandomUser("report-rate-actor");

        for (int index = 0; index < 2; index++) {
            String videoId = createPublishedVideo(owner.userId(), "Report rate target " + index);
            mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/reports")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(new ReportPayload(
                                            "video",
                                            videoId,
                                            "spam",
                                            "rate limit warmup " + index
                                    ))),
                            reporter.accessToken()))
                    .andExpect(status().isOk());
        }

        String blockedVideoId = createPublishedVideo(owner.userId(), "Report rate blocked target");
        MvcResult blockedResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/reports")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new ReportPayload(
                                        "video",
                                        blockedVideoId,
                                        "abuse",
                                        "third report should be blocked"
                                ))),
                        reporter.accessToken()))
                .andExpect(status().isTooManyRequests())
                .andReturn();

        JsonNode body = readBody(blockedResult);
        assertThat(body.path("code").asText()).isEqualTo("REPORT_RATE_LIMITED");
    }

    @Test
    void reportCreateByAdminRoleBypassesRateLimit() throws Exception {
        actionRateLimitProperties.setEnabled(true);
        actionRateLimitProperties.getReport().setWindowSeconds(60);
        actionRateLimitProperties.getReport().setMaxAttempts(1);

        LoginSession owner = loginAsRandomUser("report-rate-admin-owner");
        LoginSession reporter = loginAsRandomUser("report-rate-admin-actor");
        jdbcTemplate.update(
                "update users set role_code = ?, updated_at = now() where id = ?",
                "admin",
                java.util.UUID.fromString(reporter.userId())
        );

        for (int index = 0; index < 3; index++) {
            String videoId = createPublishedVideo(owner.userId(), "Report admin bypass target " + index);
            mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/reports")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(new ReportPayload(
                                            "video",
                                            videoId,
                                            "spam",
                                            "admin bypass report " + index
                                    ))),
                            reporter.accessToken()))
                    .andExpect(status().isOk());
        }
    }

    @Test
    void uploadPolicyIsRateLimitedPerUser() throws Exception {
        actionRateLimitProperties.setEnabled(true);
        actionRateLimitProperties.getUploadPolicy().setWindowSeconds(60);
        actionRateLimitProperties.getUploadPolicy().setMaxAttempts(2);

        LoginSession session = loginAsRandomUser("upload-policy-rate");

        for (int index = 0; index < 2; index++) {
            mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/uploads/image-policy")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(new UploadPolicyPayload(
                                            "policy-rate-" + index + ".png",
                                            "image/png",
                                            128,
                                            "cover"
                                    ))),
                            session.accessToken()))
                    .andExpect(status().isOk());
        }

        MvcResult blockedResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/uploads/image-policy")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new UploadPolicyPayload(
                                        "policy-rate-blocked.png",
                                        "image/png",
                                        128,
                                        "cover"
                                ))),
                        session.accessToken()))
                .andExpect(status().isTooManyRequests())
                .andReturn();

        JsonNode body = readBody(blockedResult);
        assertThat(body.path("code").asText()).isEqualTo("UPLOAD_RATE_LIMITED");
    }

    @Test
    void binaryUploadIsRateLimitedPerUser() throws Exception {
        actionRateLimitProperties.setEnabled(true);
        actionRateLimitProperties.getUploadBinary().setWindowSeconds(60);
        actionRateLimitProperties.getUploadBinary().setMaxAttempts(1);

        LoginSession session = loginAsRandomUser("upload-binary-rate");

        String firstUploadUrl = createImageUploadPolicy(session, "binary-rate-1.png");
        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put(firstUploadUrl)
                                .contentType(MediaType.IMAGE_PNG)
                                .content("binary-one".getBytes()),
                        session.accessToken()))
                .andExpect(status().isOk());

        String secondUploadUrl = createImageUploadPolicy(session, "binary-rate-2.png");
        MvcResult blockedResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put(secondUploadUrl)
                                .contentType(MediaType.IMAGE_PNG)
                                .content("binary-two".getBytes()),
                        session.accessToken()))
                .andExpect(status().isTooManyRequests())
                .andReturn();

        JsonNode body = readBody(blockedResult);
        assertThat(body.path("code").asText()).isEqualTo("UPLOAD_RATE_LIMITED");
    }

    @Test
    void binaryUploadRejectsAssetBelongingToAnotherUser() throws Exception {
        LoginSession owner = loginAsRandomUser("upload-owner");
        LoginSession otherUser = loginAsRandomUser("upload-other");
        String uploadUrl = createImageUploadPolicy(owner, "owner-only.png");

        MvcResult blockedResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put(uploadUrl)
                                .contentType(MediaType.IMAGE_PNG)
                                .content("owner-only".getBytes()),
                        otherUser.accessToken()))
                .andExpect(status().isForbidden())
                .andReturn();

        JsonNode body = readBody(blockedResult);
        assertThat(body.path("code").asText()).isEqualTo("UPLOAD_ASSET_FORBIDDEN");
    }

    private String createImageUploadPolicy(LoginSession session, String fileName) throws Exception {
        MvcResult policyResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/uploads/image-policy")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new UploadPolicyPayload(
                                        fileName,
                                        "image/png",
                                        128,
                                        "cover"
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        return readBody(policyResult).at("/data/uploadUrl").asText();
    }

    private record RuleSnapshot(int windowSeconds, int maxAttempts) {

        static RuleSnapshot capture(ActionRateLimitProperties.Rule rule) {
            return new RuleSnapshot(rule.getWindowSeconds(), rule.getMaxAttempts());
        }

        void restore(ActionRateLimitProperties.Rule rule) {
            rule.setWindowSeconds(windowSeconds);
            rule.setMaxAttempts(maxAttempts);
        }
    }

    private record ReportPayload(
            String targetType,
            String targetId,
            String reasonCode,
            String descriptionText
    ) {
    }

    private record LoginPayload(
            String loginType,
            String username,
            String password
    ) {
    }

    private record UploadPolicyPayload(
            String fileName,
            String mimeType,
            long sizeBytes,
            String assetRole
    ) {
    }
}
