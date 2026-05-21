package com.dramatv.community.integration;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.dramatv.community.admin.mediatasks.AdminMediaTaskService;
import com.dramatv.community.publish.application.MediaTaskApplicationService;
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

class MediaTaskRetryLoggingIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void ownedMediaTaskRetrySuccessLogIncludesVideoBusinessContext() throws Exception {
        LoginSession owner = loginAsRandomUser("media-retry-log-owner");
        String videoId = createPublishedVideo(owner.userId(), "Owned retry log video");
        String taskId = insertMediaTask(
                "video",
                videoId,
                "failed",
                1,
                3,
                "preview timeout",
                """
                        {
                          "draftId": "draft-owned-video-retry",
                          "submitMode": "publish",
                          "sourceAssetId": "%s",
                          "desiredOutputs": ["preview", "cover"]
                        }
                        """.formatted(UUID.randomUUID())
        );

        Logger logger = (Logger) LoggerFactory.getLogger(MediaTaskApplicationService.class);
        ListAppender<ILoggingEvent> appender = attachAppender(logger);

        try {
            MvcResult retryResult = mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/media-tasks/{id}/retry", taskId)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content("{}"),
                            owner.accessToken()))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode retryBody = readBody(retryResult);
            assertThat(retryBody.at("/data/taskId").asText()).isEqualTo(taskId);
            assertThat(retryBody.at("/data/statusCode").asText()).isEqualTo("queued");
            assertThat(retryBody.at("/data/retryCount").asInt()).isEqualTo(2);

            ILoggingEvent event = findEvent(appender, "media task retry success:");
            assertThat(event.getFormattedMessage())
                    .contains("ownerId=" + owner.userId())
                    .contains("taskId=" + taskId)
                    .contains("targetType=video")
                    .contains("targetId=" + videoId)
                    .contains("previousStatus=failed")
                    .contains("nextStatus=queued")
                    .contains("previousRetryCount=1")
                    .contains("nextRetryCount=2");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("taskId", taskId)
                    .containsEntry("videoId", videoId)
                    .containsEntry("targetType", "video")
                    .containsEntry("targetId", videoId)
                    .containsEntry("bizContext", "videoId=" + videoId + ",taskId=" + taskId + ",targetType=video,targetId=" + videoId);
        } finally {
            detachAppender(logger, appender);
        }
    }

    @Test
    void ownedMediaTaskRetryConflictLogsPromptBusinessContextForServiceAndApiError() throws Exception {
        LoginSession owner = loginAsRandomUser("media-retry-log-conflict-owner");
        String promptId = createPublishedPrompt(
                owner.userId(),
                "Owned retry conflict prompt",
                "video",
                "Owned retry conflict prompt summary",
                "prompt body"
        );
        String taskId = insertMediaTask(
                "prompt",
                promptId,
                "failed",
                3,
                3,
                "already exhausted retries",
                """
                        {
                          "draftId": "draft-owned-prompt-retry",
                          "submitMode": "publish",
                          "sourceAssetId": "%s",
                          "desiredOutputs": ["preview"]
                        }
                        """.formatted(UUID.randomUUID())
        );

        Logger serviceLogger = (Logger) LoggerFactory.getLogger(MediaTaskApplicationService.class);
        ListAppender<ILoggingEvent> serviceAppender = attachAppender(serviceLogger);
        Logger errorLogger = (Logger) LoggerFactory.getLogger(ApiExceptionHandler.class);
        ListAppender<ILoggingEvent> errorAppender = attachAppender(errorLogger);

        try {
            MvcResult retryResult = mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/media-tasks/{id}/retry", taskId)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content("{}"),
                            owner.accessToken()))
                    .andExpect(status().isConflict())
                    .andReturn();

            JsonNode retryBody = readBody(retryResult);
            assertThat(retryBody.path("code").asText()).isEqualTo("MEDIA_TASK_RETRY_FORBIDDEN");

            ILoggingEvent rejectedEvent = findEvent(serviceAppender, "media task retry rejected:");
            assertThat(rejectedEvent.getFormattedMessage())
                    .contains("ownerId=" + owner.userId())
                    .contains("taskId=" + taskId)
                    .contains("targetType=prompt")
                    .contains("targetId=" + promptId)
                    .contains("statusCode=failed")
                    .contains("retryCount=3")
                    .contains("maxRetryCount=3");
            assertThat(rejectedEvent.getMDCPropertyMap())
                    .containsEntry("taskId", taskId)
                    .containsEntry("promptId", promptId)
                    .containsEntry("targetType", "prompt")
                    .containsEntry("targetId", promptId)
                    .containsEntry("bizContext", "promptId=" + promptId + ",taskId=" + taskId + ",targetType=prompt,targetId=" + promptId);

            ILoggingEvent apiErrorEvent = findEvent(errorAppender, "code=MEDIA_TASK_RETRY_FORBIDDEN");
            assertThat(apiErrorEvent.getMDCPropertyMap())
                    .containsEntry("taskId", taskId)
                    .containsEntry("promptId", promptId)
                    .containsEntry("targetType", "prompt")
                    .containsEntry("targetId", promptId)
                    .containsEntry("bizContext", "promptId=" + promptId + ",taskId=" + taskId + ",targetType=prompt,targetId=" + promptId);
        } finally {
            detachAppender(serviceLogger, serviceAppender);
            detachAppender(errorLogger, errorAppender);
        }
    }

    @Test
    void adminMediaTaskRetrySuccessLogIncludesPromptBusinessContext() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-media-retry-log");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("admin-media-retry-log-author");
        String promptId = createPublishedPrompt(
                author.userId(),
                "Admin retry log prompt",
                "video",
                "Admin retry log prompt summary",
                "prompt body"
        );
        String taskId = insertMediaTask(
                "prompt",
                promptId,
                "failed",
                0,
                2,
                "preview generation failed",
                """
                        {
                          "draftId": "draft-admin-prompt-retry",
                          "submitMode": "publish",
                          "sourceAssetId": "%s",
                          "desiredOutputs": ["preview", "cover"]
                        }
                        """.formatted(UUID.randomUUID())
        );

        Logger logger = (Logger) LoggerFactory.getLogger(AdminMediaTaskService.class);
        ListAppender<ILoggingEvent> appender = attachAppender(logger);

        try {
            MvcResult retryResult = mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/admin/media-tasks/{taskId}/retry", taskId)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content("{}"),
                            admin.accessToken()))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode retryBody = readBody(retryResult);
            assertThat(retryBody.at("/data/taskId").asText()).isEqualTo(taskId);
            assertThat(retryBody.at("/data/statusCode").asText()).isEqualTo("queued");
            assertThat(retryBody.at("/data/retryCount").asInt()).isEqualTo(1);

            ILoggingEvent event = findEvent(appender, "admin media task retry success:");
            assertThat(event.getFormattedMessage())
                    .contains("operatorId=" + admin.userId())
                    .contains("taskId=" + taskId)
                    .contains("targetType=prompt")
                    .contains("targetId=" + promptId)
                    .contains("previousStatus=failed")
                    .contains("nextStatus=queued")
                    .contains("previousRetryCount=0")
                    .contains("nextRetryCount=1");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("taskId", taskId)
                    .containsEntry("promptId", promptId)
                    .containsEntry("targetType", "prompt")
                    .containsEntry("targetId", promptId)
                    .containsEntry("bizContext", "promptId=" + promptId + ",taskId=" + taskId + ",targetType=prompt,targetId=" + promptId);
        } finally {
            detachAppender(logger, appender);
        }
    }

    @Test
    void adminMediaTaskRetryConflictLogsVideoBusinessContextForServiceAndApiError() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-media-retry-conflict-log");
        promoteToRole(admin.userId(), "moderator");

        LoginSession author = loginAsRandomUser("admin-media-retry-conflict-author");
        String videoId = createPublishedVideo(author.userId(), "Admin retry conflict video");
        String taskId = insertMediaTask(
                "video",
                videoId,
                "queued",
                0,
                3,
                null,
                """
                        {
                          "draftId": "draft-admin-video-retry",
                          "submitMode": "publish",
                          "sourceAssetId": "%s",
                          "desiredOutputs": ["preview", "cover"]
                        }
                        """.formatted(UUID.randomUUID())
        );

        Logger serviceLogger = (Logger) LoggerFactory.getLogger(AdminMediaTaskService.class);
        ListAppender<ILoggingEvent> serviceAppender = attachAppender(serviceLogger);
        Logger errorLogger = (Logger) LoggerFactory.getLogger(ApiExceptionHandler.class);
        ListAppender<ILoggingEvent> errorAppender = attachAppender(errorLogger);

        try {
            MvcResult retryResult = mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/admin/media-tasks/{taskId}/retry", taskId)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content("{}"),
                            admin.accessToken()))
                    .andExpect(status().isConflict())
                    .andReturn();

            JsonNode retryBody = readBody(retryResult);
            assertThat(retryBody.path("code").asText()).isEqualTo("ADMIN_MEDIA_TASK_RETRY_FORBIDDEN");

            ILoggingEvent rejectedEvent = findEvent(serviceAppender, "admin media task retry rejected:");
            assertThat(rejectedEvent.getFormattedMessage())
                    .contains("operatorId=" + admin.userId())
                    .contains("taskId=" + taskId)
                    .contains("targetType=video")
                    .contains("targetId=" + videoId)
                    .contains("statusCode=queued")
                    .contains("retryCount=0")
                    .contains("maxRetryCount=3");
            assertThat(rejectedEvent.getMDCPropertyMap())
                    .containsEntry("taskId", taskId)
                    .containsEntry("videoId", videoId)
                    .containsEntry("targetType", "video")
                    .containsEntry("targetId", videoId)
                    .containsEntry("bizContext", "videoId=" + videoId + ",taskId=" + taskId + ",targetType=video,targetId=" + videoId);

            ILoggingEvent apiErrorEvent = findEvent(errorAppender, "code=ADMIN_MEDIA_TASK_RETRY_FORBIDDEN");
            assertThat(apiErrorEvent.getMDCPropertyMap())
                    .containsEntry("taskId", taskId)
                    .containsEntry("videoId", videoId)
                    .containsEntry("targetType", "video")
                    .containsEntry("targetId", videoId)
                    .containsEntry("bizContext", "videoId=" + videoId + ",taskId=" + taskId + ",targetType=video,targetId=" + videoId);
        } finally {
            detachAppender(serviceLogger, serviceAppender);
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

    private String insertMediaTask(
            String targetType,
            String targetId,
            String statusCode,
            int retryCount,
            int maxRetryCount,
            String errorMessage,
            String payloadJson
    ) {
        UUID taskId = UUID.randomUUID();
        jdbcTemplate.update("""
                insert into async_task_records (
                    id, task_type, target_type, target_id, queue_name, priority_level,
                    status_code, payload_json, retry_count, max_retry_count,
                    scheduled_at, created_at, updated_at, error_message
                )
                values (?, 'video_media_process', ?, ?, 'media-processing', 3, ?, cast(? as jsonb), ?, ?, now(), now(), now(), ?)
                """,
                taskId,
                targetType,
                UUID.fromString(targetId),
                statusCode,
                payloadJson,
                retryCount,
                maxRetryCount,
                errorMessage
        );
        return taskId.toString();
    }
}
