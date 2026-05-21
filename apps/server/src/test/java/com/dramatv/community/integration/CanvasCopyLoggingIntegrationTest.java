package com.dramatv.community.integration;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.dramatv.community.canvas.application.CanvasApplicationService;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CanvasCopyLoggingIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void copyToCanvasSuccessLogCarriesWorkflowRuntimeAndTaskBusinessContext() throws Exception {
        LoginSession author = loginAsRandomUser("canvas-copy-log-author");
        LoginSession viewer = loginAsRandomUser("canvas-copy-log-viewer");
        String workflowId = createPublishedWorkflow(
                author.userId(),
                "Canvas log workflow",
                "Canvas log summary",
                "Canvas log scenario"
        );
        createActiveCanvasBinding(workflowId, "internal", "/canvas/templates/log-workflow");

        Logger logger = (Logger) LoggerFactory.getLogger(CanvasApplicationService.class);
        ListAppender<ILoggingEvent> appender = attachAppender(logger);

        try {
            MvcResult result = mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/workflows/{id}/copy-to-canvas", workflowId)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(new CopyToCanvasPayload(
                                            "space-canvas-log",
                                            "reference_then_async_clone",
                                            true,
                                            "workflow-copy-" + workflowId
                                    ))),
                            viewer.accessToken()))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode body = readBody(result);
            String runtimeId = body.at("/data/targetRuntimeId").asText();
            String copyTaskId = body.at("/data/copyTaskId").asText();

            assertThat(body.path("code").asText()).isEqualTo("OK");
            assertThat(body.at("/data/status").asText()).isEqualTo("runtime_ready");
            assertThat(body.at("/data/openUrl").asText()).isEqualTo("/canvas/" + runtimeId);

            ILoggingEvent event = findEvent(appender, "canvas copy success:");
            assertThat(event.getFormattedMessage())
                    .contains("operatorId=" + viewer.userId())
                    .contains("workflowId=" + workflowId)
                    .contains("runtimeId=" + runtimeId)
                    .contains("copyTaskId=" + copyTaskId)
                    .contains("targetSpaceId=space-canvas-log")
                    .contains("copyMode=reference_then_async_clone")
                    .contains("openAfterCopy=true")
                    .contains("statusCode=runtime_ready")
                    .contains("lightSnapshotVersion=1")
                    .contains("visibleNodeCount=3")
                    .contains("idempotentReuse=false");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("workflowId", workflowId)
                    .containsEntry("runtimeId", runtimeId)
                    .containsEntry("copyTaskId", copyTaskId)
                    .containsEntry("bizContext", "workflowId=" + workflowId + ",runtimeId=" + runtimeId + ",copyTaskId=" + copyTaskId);
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

    private record CopyToCanvasPayload(
            String targetSpaceId,
            String copyMode,
            boolean openAfterCopy,
            String idempotencyKey
    ) {
    }
}
