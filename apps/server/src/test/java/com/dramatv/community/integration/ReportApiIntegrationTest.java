package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ReportApiIntegrationTest extends ApiIntegrationTestSupport {

    @AfterEach
    void clearMdc() {
        MDC.clear();
    }

    @Test
    void authenticatedUserCanCreateVideoReport() throws Exception {
        LoginSession owner = loginAsRandomUser("report-owner");
        LoginSession reporter = loginAsRandomUser("report-actor");
        String videoId = createPublishedVideo(owner.userId(), "Report target video");

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/reports")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new ReportPayload(
                                        "video",
                                        videoId,
                                        "abuse",
                                        "integration report"
                                ))),
                        reporter.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/targetType").asText()).isEqualTo("video");
        assertThat(body.at("/data/targetId").asText()).isEqualTo(videoId);
        assertThat(body.at("/data/reasonCode").asText()).isEqualTo("abuse");
        assertThat(body.at("/data/statusCode").asText()).isEqualTo("pending");

        Integer count = jdbcTemplate.queryForObject("""
                select count(*)
                from report_tickets
                where reporter_id = ?
                  and target_type = 'video'
                  and target_id = ?
                  and reason_code = 'abuse'
                  and status_code = 'pending'
                """,
                Integer.class,
                java.util.UUID.fromString(reporter.userId()),
                java.util.UUID.fromString(videoId)
        );
        assertThat(count).isEqualTo(1);
    }

    @Test
    void duplicateOpenReportIsRejected() throws Exception {
        LoginSession owner = loginAsRandomUser("report-duplicate-owner");
        LoginSession reporter = loginAsRandomUser("report-duplicate-actor");
        String promptId = createPublishedPrompt(
                owner.userId(),
                "Report target prompt",
                "image",
                "summary",
                "prompt body"
        );

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/reports")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new ReportPayload(
                                        "prompt",
                                        promptId,
                                        "misleading",
                                        "first report"
                                ))),
                        reporter.accessToken()))
                .andExpect(status().isOk());

        MvcResult duplicateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/reports")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new ReportPayload(
                                        "prompt",
                                        promptId,
                                        "spam",
                                        "duplicate report"
                                ))),
                        reporter.accessToken()))
                .andExpect(status().isConflict())
                .andReturn();

        JsonNode duplicateBody = readBody(duplicateResult);
        assertThat(duplicateBody.path("code").asText()).isEqualTo("REPORT_DUPLICATE");
        assertThat(MDC.get("reportId")).isNull();
        assertThat(MDC.get("promptId")).isNull();
        assertThat(MDC.get("targetType")).isNull();
        assertThat(MDC.get("targetId")).isNull();
        assertThat(MDC.get("bizContext")).isNull();
    }

    private record ReportPayload(
            String targetType,
            String targetId,
            String reasonCode,
            String descriptionText
    ) {
    }
}
