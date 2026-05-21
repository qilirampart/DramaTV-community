package com.dramatv.community.integration;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.dramatv.community.internal.application.InternalCallbackApplicationService;
import com.dramatv.community.publish.application.MediaTaskApplicationService;
import com.dramatv.community.publish.persistence.PublishModerationPersistenceService;
import com.fasterxml.jackson.databind.JsonNode;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class InternalCallbackLoggingIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void mediaCallbackSuccessLogsShareVideoBusinessContextAcrossLayers() throws Exception {
        LoginSession session = loginAsRandomUser("callback-log-media");
        UploadedAsset sourceAsset = uploadAsset(
                session,
                "/api/uploads/video-policy",
                "callback-log-source.mp4",
                "video/mp4",
                "source",
                "fake-video-source".getBytes()
        );
        SubmittedVideo submittedVideo = submitVideoDraft(session, sourceAsset.assetId(), "Callback log video");
        UploadedAsset coverAsset = uploadAsset(
                session,
                "/api/uploads/image-policy",
                "callback-log-cover.jpg",
                "image/jpeg",
                "cover",
                "fake-cover".getBytes()
        );
        UploadedAsset previewAsset = uploadAsset(
                session,
                "/api/uploads/video-policy",
                "callback-log-preview.mp4",
                "video/mp4",
                "preview",
                "fake-preview".getBytes()
        );

        Logger callbackLogger = (Logger) LoggerFactory.getLogger(InternalCallbackApplicationService.class);
        ListAppender<ILoggingEvent> callbackAppender = attachAppender(callbackLogger);
        Logger persistenceLogger = (Logger) LoggerFactory.getLogger(PublishModerationPersistenceService.class);
        ListAppender<ILoggingEvent> persistenceAppender = attachAppender(persistenceLogger);

        try {
            MvcResult callbackResult = mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/internal/media-callback")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(new MediaCallbackPayload(
                                            submittedVideo.taskId(),
                                            "succeeded",
                                            "video",
                                            submittedVideo.videoId(),
                                            new MediaCallbackResultPayload(
                                                    coverAsset.assetId(),
                                                    previewAsset.assetId(),
                                                    3456L,
                                                    null
                                            )
                                    ))),
                            session.accessToken()))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode body = readBody(callbackResult);
            assertThat(body.at("/data/taskId").asText()).isEqualTo(submittedVideo.taskId());
            assertThat(body.at("/data/statusCode").asText()).isEqualTo("succeeded");

            ILoggingEvent persistenceEvent = findEvent(persistenceAppender, "media callback applied:");
            assertThat(persistenceEvent.getFormattedMessage())
                    .contains("taskId=" + submittedVideo.taskId())
                    .contains("resolvedTaskId=" + submittedVideo.taskId())
                    .contains("targetType=video")
                    .contains("targetId=" + submittedVideo.videoId())
                    .contains("requestStatus=succeeded")
                    .contains("taskStatus=succeeded")
                    .contains("applied=true")
                    .contains("durationMs=3456");
            assertThat(persistenceEvent.getMDCPropertyMap())
                    .containsEntry("taskId", submittedVideo.taskId())
                    .containsEntry("videoId", submittedVideo.videoId())
                    .containsEntry("targetType", "video")
                    .containsEntry("targetId", submittedVideo.videoId())
                    .containsEntry("bizContext", "videoId=" + submittedVideo.videoId() + ",taskId=" + submittedVideo.taskId() + ",targetType=video,targetId=" + submittedVideo.videoId());

            ILoggingEvent callbackEvent = findEvent(callbackAppender, "internal callback accepted: callbackType=media");
            assertThat(callbackEvent.getFormattedMessage())
                    .contains("taskId=" + submittedVideo.taskId())
                    .contains("targetType=video")
                    .contains("targetId=" + submittedVideo.videoId())
                    .contains("requestStatus=succeeded")
                    .contains("effectiveStatus=succeeded")
                    .contains("hasResult=true");
            assertThat(callbackEvent.getMDCPropertyMap())
                    .containsEntry("taskId", submittedVideo.taskId())
                    .containsEntry("videoId", submittedVideo.videoId())
                    .containsEntry("targetType", "video")
                    .containsEntry("targetId", submittedVideo.videoId())
                    .containsEntry("bizContext", "videoId=" + submittedVideo.videoId() + ",taskId=" + submittedVideo.taskId() + ",targetType=video,targetId=" + submittedVideo.videoId());
        } finally {
            detachAppender(callbackLogger, callbackAppender);
            detachAppender(persistenceLogger, persistenceAppender);
        }
    }

    @Test
    void auditCallbackInvalidTargetLogsIgnoredPromptContext() throws Exception {
        LoginSession session = loginAsRandomUser("callback-log-audit");
        String promptId = createPublishedPrompt(
                session.userId(),
                "Callback audit prompt",
                "video",
                "Callback audit prompt summary",
                "prompt body"
        );
        String taskId = UUID.randomUUID().toString();

        Logger callbackLogger = (Logger) LoggerFactory.getLogger(InternalCallbackApplicationService.class);
        ListAppender<ILoggingEvent> callbackAppender = attachAppender(callbackLogger);
        Logger persistenceLogger = (Logger) LoggerFactory.getLogger(PublishModerationPersistenceService.class);
        ListAppender<ILoggingEvent> persistenceAppender = attachAppender(persistenceLogger);

        try {
            MvcResult callbackResult = mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/internal/audit-callback")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(new AuditCallbackPayload(
                                            taskId,
                                            "prompt",
                                            promptId,
                                            "failed",
                                            java.util.List.of("copyright", "spam")
                                    ))),
                            session.accessToken()))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode body = readBody(callbackResult);
            assertThat(body.at("/data/taskId").asText()).isEqualTo(taskId);
            assertThat(body.at("/data/statusCode").asText()).isEqualTo("failed");

            ILoggingEvent ignoredEvent = findEvent(persistenceAppender, "audit callback ignored:");
            assertThat(ignoredEvent.getFormattedMessage())
                    .contains("taskId=" + taskId)
                    .contains("requestTargetType=prompt")
                    .contains("requestTargetId=" + promptId)
                    .contains("requestStatus=failed")
                    .contains("reason=invalid_target");
            assertThat(ignoredEvent.getMDCPropertyMap())
                    .containsEntry("taskId", taskId)
                    .containsEntry("promptId", promptId)
                    .containsEntry("targetType", "prompt")
                    .containsEntry("targetId", promptId)
                    .containsEntry("bizContext", "promptId=" + promptId + ",taskId=" + taskId + ",targetType=prompt,targetId=" + promptId);

            ILoggingEvent callbackEvent = findEvent(callbackAppender, "internal callback accepted: callbackType=audit");
            assertThat(callbackEvent.getFormattedMessage())
                    .contains("taskId=" + taskId)
                    .contains("targetType=prompt")
                    .contains("targetId=" + promptId)
                    .contains("requestStatus=failed")
                    .contains("effectiveStatus=failed")
                    .contains("riskTagCount=2");
            assertThat(callbackEvent.getMDCPropertyMap())
                    .containsEntry("taskId", taskId)
                    .containsEntry("promptId", promptId)
                    .containsEntry("targetType", "prompt")
                    .containsEntry("targetId", promptId)
                    .containsEntry("bizContext", "promptId=" + promptId + ",taskId=" + taskId + ",targetType=prompt,targetId=" + promptId);
        } finally {
            detachAppender(callbackLogger, callbackAppender);
            detachAppender(persistenceLogger, persistenceAppender);
        }
    }

    @Test
    void mediaCallbackStoredPayloadIsSanitizedBeforePersisting() throws Exception {
        LoginSession session = loginAsRandomUser("callback-log-sanitize");
        UploadedAsset sourceAsset = uploadAsset(
                session,
                "/api/uploads/video-policy",
                "callback-sanitize-source.mp4",
                "video/mp4",
                "source",
                "fake-video-source".getBytes()
        );
        SubmittedVideo submittedVideo = submitVideoDraft(session, sourceAsset.assetId(), "Callback sanitize video");
        String longErrorMessage = "token=super-secret " + "x".repeat(900);

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/internal/media-callback")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new MediaCallbackPayload(
                                        submittedVideo.taskId(),
                                        "failed",
                                        "video",
                                        submittedVideo.videoId(),
                                        new MediaCallbackResultPayload(
                                                null,
                                                null,
                                                null,
                                                longErrorMessage
                                        )
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk());

        String storedRawPayload = jdbcTemplate.queryForObject("""
                        select raw_payload_json::text
                        from task_callback_logs
                        where task_id = ?
                        order by created_at desc
                        limit 1
                        """,
                String.class,
                UUID.fromString(submittedVideo.taskId())
        );
        String storedErrorMessage = jdbcTemplate.queryForObject("""
                        select error_message
                        from async_task_records
                        where id = ?
                        """,
                String.class,
                UUID.fromString(submittedVideo.taskId())
        );

        assertThat(storedRawPayload).isNotBlank();
        assertThat(storedRawPayload).doesNotContain(longErrorMessage);
        assertThat(storedRawPayload).contains("[TRUNCATED len=");
        assertThat(storedRawPayload.getBytes(StandardCharsets.UTF_8).length)
                .isLessThan(longErrorMessage.getBytes(StandardCharsets.UTF_8).length);

        assertThat(storedErrorMessage).isNotBlank();
        assertThat(storedErrorMessage).doesNotContain(longErrorMessage);
        assertThat(storedErrorMessage).contains("[TRUNCATED len=");
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

    private UploadedAsset uploadAsset(
            LoginSession session,
            String policyPath,
            String fileName,
            String mimeType,
            String assetRole,
            byte[] content
    ) throws Exception {
        MvcResult policyResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post(policyPath)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new UploadPolicyPayload(
                                        fileName,
                                        mimeType,
                                        content.length,
                                        assetRole
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode policyBody = readBody(policyResult);
        String assetId = policyBody.at("/data/assetId").asText();
        String uploadUrl = policyBody.at("/data/uploadUrl").asText();

        MvcResult uploadResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put(uploadUrl)
                                .contentType(mimeType)
                                .content(content),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode uploadBody = readBody(uploadResult);
        return new UploadedAsset(
                assetId,
                uploadBody.at("/data/assetKind").asText(),
                uploadBody.at("/data/assetRole").asText()
        );
    }

    private SubmittedVideo submitVideoDraft(LoginSession session, String sourceAssetId, String title) throws Exception {
        MvcResult createDraftResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/video-drafts")
                                .accept(MediaType.APPLICATION_JSON),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        String draftId = readBody(createDraftResult).at("/data/draftId").asText();

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/video-drafts/{id}", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new VideoDraftPayload(
                                        title,
                                        "Callback integration summary",
                                        "workflow",
                                        "Callback integration prompt",
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        java.util.List.of("callback", "integration"),
                                        null,
                                        "public",
                                        null,
                                        sourceAssetId
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk());

        MvcResult submitResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/video-drafts/{id}/submit", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new SubmitDraftPayload("publish"))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode submitBody = readBody(submitResult);
        return new SubmittedVideo(
                draftId,
                submitBody.at("/data/videoId").asText(),
                submitBody.at("/data/taskIds/0").asText()
        );
    }

    private record UploadPolicyPayload(
            String fileName,
            String mimeType,
            long sizeBytes,
            String assetRole
    ) {
    }

    private record VideoDraftPayload(
            String title,
            String summary,
            String categoryCode,
            String promptText,
            String promptTextZh,
            String promptTextEn,
            String promptTextRaw,
            String modelName,
            String modelCategory,
            String contentCategory,
            String compositionCategory,
            String sourcePlatform,
            String sourceCampaign,
            String sourceItemId,
            String sourceUrl,
            String publishedAt,
            java.util.List<String> tagNames,
            String workflowId,
            String visibility,
            String coverAssetId,
            String sourceAssetId
    ) {
    }

    private record SubmitDraftPayload(String submitMode) {
    }

    private record MediaCallbackPayload(
            String taskId,
            String statusCode,
            String targetType,
            String targetId,
            MediaCallbackResultPayload result
    ) {
    }

    private record MediaCallbackResultPayload(
            String coverAssetId,
            String previewAssetId,
            Long durationMs,
            String errorMessage
    ) {
    }

    private record AuditCallbackPayload(
            String taskId,
            String targetType,
            String targetId,
            String statusCode,
            java.util.List<String> riskTags
    ) {
    }

    private record UploadedAsset(
            String assetId,
            String assetKind,
            String assetRole
    ) {
    }

    private record SubmittedVideo(
            String draftId,
            String videoId,
            String taskId
    ) {
    }
}
