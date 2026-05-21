package com.dramatv.community.integration;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.dramatv.community.publish.application.UploadApplicationService;
import com.fasterxml.jackson.databind.JsonNode;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UploadLoggingIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void uploadPolicyAndBinarySuccessLogsCarryAssetBusinessContext() throws Exception {
        LoginSession session = loginAsRandomUser("upload-log");
        byte[] content = "upload-log-image".getBytes(StandardCharsets.UTF_8);
        String fileName = "upload-log-cover.jpg";
        String mimeType = "image/jpeg";

        Logger logger = (Logger) LoggerFactory.getLogger(UploadApplicationService.class);
        ListAppender<ILoggingEvent> appender = attachAppender(logger);

        try {
            MvcResult policyResult = mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/uploads/image-policy")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(new UploadPolicyPayload(
                                            fileName,
                                            mimeType,
                                            content.length,
                                            "cover"
                                    ))),
                            session.accessToken()))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode policyBody = readBody(policyResult);
            String assetId = policyBody.at("/data/assetId").asText();
            String uploadUrl = policyBody.at("/data/uploadUrl").asText();

            assertThat(policyBody.path("code").asText()).isEqualTo("OK");
            assertThat(assetId).isNotBlank();
            assertThat(uploadUrl).isNotBlank();

            ILoggingEvent policyEvent = findEvent(appender, "upload policy created:");
            assertThat(policyEvent.getFormattedMessage())
                    .contains("userId=" + session.userId())
                    .contains("assetId=" + assetId)
                    .contains("assetKind=image")
                    .contains("assetRole=cover")
                    .contains("declaredSizeBytes=" + content.length)
                    .contains("mimeType=" + mimeType)
                    .contains("fileName=" + fileName);
            assertThat(policyEvent.getMDCPropertyMap())
                    .containsEntry("assetId", assetId)
                    .containsEntry("bizContext", "assetId=" + assetId);

            MvcResult uploadResult = mockMvc.perform(authorized(
                            MockMvcRequestBuilders.put(uploadUrl)
                                    .contentType(mimeType)
                                    .content(content),
                            session.accessToken()))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode uploadBody = readBody(uploadResult);
            assertThat(uploadBody.path("code").asText()).isEqualTo("OK");
            assertThat(uploadBody.at("/data/assetId").asText()).isEqualTo(assetId);
            assertThat(uploadBody.at("/data/statusCode").asText()).isEqualTo("ready");

            ILoggingEvent uploadEvent = findEvent(appender, "upload binary success:");
            assertThat(uploadEvent.getFormattedMessage())
                    .contains("userId=" + session.userId())
                    .contains("assetId=" + assetId)
                    .contains("assetKind=image")
                    .contains("assetRole=cover")
                    .contains("declaredSizeBytes=" + content.length)
                    .contains("actualSizeBytes=" + content.length)
                    .contains("statusCode=ready")
                    .contains("mimeType=" + mimeType);
            assertThat(uploadEvent.getMDCPropertyMap())
                    .containsEntry("assetId", assetId)
                    .containsEntry("bizContext", "assetId=" + assetId);
        } finally {
            detachAppender(logger, appender);
        }
    }

    private ListAppender<ILoggingEvent> attachAppender(Logger logger) {
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        return appender;
    }

    private void detachAppender(Logger logger, ListAppender<ILoggingEvent> appender) {
        logger.detachAppender(appender);
        appender.stop();
    }

    private ILoggingEvent findEvent(ListAppender<ILoggingEvent> appender, String messageFragment) {
        return appender.list.stream()
                .filter(event -> event.getFormattedMessage().contains(messageFragment))
                .findFirst()
                .orElseThrow(() -> new AssertionError("missing log event containing: " + messageFragment));
    }

    private record UploadPolicyPayload(
            String fileName,
            String mimeType,
            long sizeBytes,
            String assetRole
    ) {
    }
}
