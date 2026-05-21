package com.dramatv.community.integration;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.dramatv.community.admin.feedops.AdminFeedOpsService;
import com.dramatv.community.shared.error.ApiExceptionHandler;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminFeedOpsLoggingIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void homeFeedOpsUpdateSuccessLogCarriesPageBusinessContext() throws Exception {
        LoginSession operator = loginAsRandomUser("admin-feedops-log-success");
        promoteToRole(operator.userId(), "operator");

        LoginSession author = loginAsRandomUser("admin-feedops-log-author");
        String promptId = createPublishedPrompt(
                author.userId(),
                "FeedOps Logging Prompt",
                "video",
                "FeedOps logging summary",
                "FeedOps logging body"
        );

        Logger logger = (Logger) LoggerFactory.getLogger(AdminFeedOpsService.class);
        ListAppender<ILoggingEvent> appender = attachAppender(logger);

        try {
            mockMvc.perform(authorized(
                            MockMvcRequestBuilders.put("/api/admin/feed-ops/home")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(Map.of(
                                            "statusCode", "draft",
                                            "slots", List.of(
                                                    Map.of(
                                                            "slotKey", "home-hero",
                                                            "items", List.of(
                                                                    Map.of("targetType", "prompt", "targetId", promptId)
                                                            )
                                                    )
                                            )
                                    ))),
                            operator.accessToken()))
                    .andExpect(status().isOk());

            ILoggingEvent event = findEvent(appender, "admin feed ops update success:");
            assertThat(event.getFormattedMessage())
                    .contains("operatorId=" + operator.userId())
                    .contains("pageKey=home")
                    .contains("statusCode=draft")
                    .contains("configuredSlotCount=1")
                    .contains("configuredItemCount=1")
                    .contains("published=false");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("targetType", "feed_ops_page")
                    .containsEntry("targetId", "home")
                    .containsEntry("bizContext", "targetType=feed_ops_page,targetId=home");
        } finally {
            detachAppender(logger, appender);
        }
    }

    @Test
    void homeFeedOpsInvalidTargetErrorPreservesPageBusinessContext() throws Exception {
        LoginSession operator = loginAsRandomUser("admin-feedops-log-error");
        promoteToRole(operator.userId(), "operator");

        String missingPromptId = UUID.randomUUID().toString();
        Logger errorLogger = (Logger) LoggerFactory.getLogger(ApiExceptionHandler.class);
        ListAppender<ILoggingEvent> errorAppender = attachAppender(errorLogger);

        try {
            MvcResult result = mockMvc.perform(authorized(
                            MockMvcRequestBuilders.put("/api/admin/feed-ops/home")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(Map.of(
                                            "statusCode", "draft",
                                            "slots", List.of(
                                                    Map.of(
                                                            "slotKey", "home-hero",
                                                            "items", List.of(
                                                                    Map.of("targetType", "prompt", "targetId", missingPromptId)
                                                            )
                                                    )
                                            )
                                    ))),
                            operator.accessToken()))
                    .andExpect(status().isNotFound())
                    .andReturn();

            assertThat(readBody(result).path("code").asText()).isEqualTo("ADMIN_FEED_OPS_TARGET_NOT_FOUND");

            ILoggingEvent event = findEvent(errorAppender, "code=ADMIN_FEED_OPS_TARGET_NOT_FOUND");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("targetType", "feed_ops_page")
                    .containsEntry("targetId", "home")
                    .containsEntry("bizContext", "targetType=feed_ops_page,targetId=home");
        } finally {
            detachAppender(errorLogger, errorAppender);
        }
    }

    private void promoteToRole(String userId, String roleCode) {
        jdbcTemplate.update(
                "update users set role_code = ?, updated_at = now() where id = ?",
                roleCode,
                UUID.fromString(userId)
        );
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
}
