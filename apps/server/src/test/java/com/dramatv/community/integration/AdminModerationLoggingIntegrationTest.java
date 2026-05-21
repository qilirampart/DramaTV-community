package com.dramatv.community.integration;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.dramatv.community.admin.moderation.AdminModerationService;
import com.dramatv.community.shared.error.ApiExceptionHandler;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminModerationLoggingIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void moderationApproveSuccessLogIncludesPromptBusinessContext() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-moderation-log-approve");
        promoteToRole(admin.userId(), "moderator");

        LoginSession author = loginAsRandomUser("admin-moderation-log-author");
        String promptId = createPublishedPrompt(
                author.userId(),
                "Admin moderation log prompt",
                "video",
                "Admin moderation log prompt summary",
                "prompt body"
        );
        insertAuditRecord("prompt", promptId, author.userId(), "pending_review", "high");

        Logger logger = (Logger) LoggerFactory.getLogger(AdminModerationService.class);
        ListAppender<ILoggingEvent> appender = attachAppender(logger);

        try {
            MvcResult result = mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/admin/moderation/items/prompt/{targetId}/approve", promptId)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content("""
                                            {"note":"approve by logging integration"}
                                            """),
                            admin.accessToken()))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode body = readBody(result);
            assertThat(body.at("/data/statusCode").asText()).isEqualTo("approved");

            ILoggingEvent event = findEvent(appender, "admin moderation action success:");
            assertThat(event.getFormattedMessage())
                    .contains("action=approve")
                    .contains("operatorId=" + admin.userId())
                    .contains("targetType=prompt")
                    .contains("targetId=" + promptId)
                    .contains("authorId=" + author.userId())
                    .contains("workflowId=null")
                    .contains("previousPublishStatus=published")
                    .contains("nextPublishStatus=published")
                    .contains("previousAuditStatus=pending_review")
                    .contains("nextAuditStatus=approved")
                    .contains("hasNote=true");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("promptId", promptId)
                    .containsEntry("targetType", "prompt")
                    .containsEntry("targetId", promptId)
                    .containsEntry("bizContext", "promptId=" + promptId + ",targetType=prompt,targetId=" + promptId);
        } finally {
            detachAppender(logger, appender);
        }
    }

    @Test
    void moderationInvalidTargetTypeApiErrorPreservesPathBusinessContext() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-moderation-log-invalid");
        promoteToRole(admin.userId(), "admin");

        String bogusTargetId = UUID.randomUUID().toString();
        Logger errorLogger = (Logger) LoggerFactory.getLogger(ApiExceptionHandler.class);
        ListAppender<ILoggingEvent> errorAppender = attachAppender(errorLogger);

        try {
            MvcResult result = mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/admin/moderation/items/promptx/{targetId}/offline", bogusTargetId)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content("""
                                            {"note":"invalid target type"}
                                            """),
                            admin.accessToken()))
                    .andExpect(status().isBadRequest())
                    .andReturn();

            JsonNode body = readBody(result);
            assertThat(body.path("code").asText()).isEqualTo("ADMIN_MODERATION_FILTER_INVALID");

            ILoggingEvent event = findEvent(errorAppender, "code=ADMIN_MODERATION_FILTER_INVALID");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("targetType", "promptx")
                    .containsEntry("targetId", bogusTargetId)
                    .containsEntry("bizContext", "targetType=promptx,targetId=" + bogusTargetId);
        } finally {
            detachAppender(errorLogger, errorAppender);
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

    private void promoteToRole(String userId, String roleCode) {
        jdbcTemplate.update(
                "update users set role_code = ?, updated_at = now() where id = ?",
                roleCode,
                UUID.fromString(userId)
        );
    }

    private void insertAuditRecord(String targetType, String targetId, String operatorId, String statusCode, String riskLevel) {
        jdbcTemplate.update("""
                insert into audit_records (
                    id, target_type, target_id, audit_type, status_code, risk_level,
                    operator_type, operator_id, detail_json, created_at
                )
                values (?, ?, ?, 'publish_review', ?, ?, 'creator', ?, '{}'::jsonb, now())
                """,
                UUID.randomUUID(),
                targetType,
                UUID.fromString(targetId),
                statusCode,
                riskLevel,
                UUID.fromString(operatorId)
        );
    }
}
