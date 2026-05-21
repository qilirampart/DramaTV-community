package com.dramatv.community.integration;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.dramatv.community.interaction.persistence.InteractionJdbcPersistenceService;
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

class InteractionLoggingIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void createCommentSuccessLogIncludesVideoAndCommentBusinessContext() throws Exception {
        LoginSession owner = loginAsRandomUser("interaction-log-comment-owner");
        LoginSession commenter = loginAsRandomUser("interaction-log-commenter");
        String videoId = createPublishedVideo(owner.userId(), "Interaction logging comment video");

        Logger logger = (Logger) LoggerFactory.getLogger(InteractionJdbcPersistenceService.class);
        ListAppender<ILoggingEvent> appender = attachAppender(logger);

        try {
            MvcResult result = mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/comments")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(new CreateCommentPayload(
                                            "video",
                                            videoId,
                                            "interaction logging comment body",
                                            null
                                    ))),
                            commenter.accessToken()))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode body = readBody(result);
            String commentId = body.at("/data/id").asText();
            assertThat(commentId).isNotBlank();

            ILoggingEvent event = findEvent(appender, "comment create success:");
            assertThat(event.getFormattedMessage())
                    .contains("authorId=" + commenter.userId())
                    .contains("targetType=video")
                    .contains("targetId=" + videoId)
                    .contains("commentId=" + commentId)
                    .contains("parentId=null")
                    .contains("rootId=null")
                    .contains("replyToCommentId=null")
                    .contains("statusCode=active")
                    .contains("hiddenByModeration=false");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("commentId", commentId)
                    .containsEntry("videoId", videoId)
                    .containsEntry("targetType", "video")
                    .containsEntry("targetId", videoId)
                    .containsEntry("bizContext", "videoId=" + videoId + ",commentId=" + commentId + ",targetType=video,targetId=" + videoId);
        } finally {
            detachAppender(logger, appender);
        }
    }

    @Test
    void likeInvalidTargetApiErrorPreservesPromptBusinessContext() throws Exception {
        LoginSession actor = loginAsRandomUser("interaction-log-like-invalid");
        String missingPromptId = UUID.randomUUID().toString();

        Logger errorLogger = (Logger) LoggerFactory.getLogger(ApiExceptionHandler.class);
        ListAppender<ILoggingEvent> errorAppender = attachAppender(errorLogger);

        try {
            MvcResult result = mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/interactions/like")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(new TargetActionPayload("prompt", missingPromptId))),
                            actor.accessToken()))
                    .andExpect(status().isBadRequest())
                    .andReturn();

            JsonNode body = readBody(result);
            assertThat(body.path("code").asText()).isEqualTo("INTERACTION_TARGET_NOT_FOUND");

            ILoggingEvent event = findEvent(errorAppender, "code=INTERACTION_TARGET_NOT_FOUND");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("promptId", missingPromptId)
                    .containsEntry("targetType", "prompt")
                    .containsEntry("targetId", missingPromptId)
                    .containsEntry("bizContext", "promptId=" + missingPromptId + ",targetType=prompt,targetId=" + missingPromptId);
        } finally {
            detachAppender(errorLogger, errorAppender);
        }
    }

    @Test
    void deleteCommentSuccessLogKeepsCommentAndVideoBusinessContext() throws Exception {
        LoginSession owner = loginAsRandomUser("interaction-log-delete-owner");
        LoginSession commenter = loginAsRandomUser("interaction-log-delete-commenter");
        String videoId = createPublishedVideo(owner.userId(), "Interaction logging delete comment video");
        String commentId = createActiveComment(commenter.userId(), "video", videoId, "interaction logging delete body");

        Logger logger = (Logger) LoggerFactory.getLogger(InteractionJdbcPersistenceService.class);
        ListAppender<ILoggingEvent> appender = attachAppender(logger);

        try {
            mockMvc.perform(authorized(
                            MockMvcRequestBuilders.delete("/api/comments/{commentId}", commentId),
                            owner.accessToken()))
                    .andExpect(status().isOk());

            ILoggingEvent event = findEvent(appender, "comment delete success:");
            assertThat(event.getFormattedMessage())
                    .contains("operatorId=" + owner.userId())
                    .contains("commentId=" + commentId)
                    .contains("authorId=" + commenter.userId())
                    .contains("targetType=video")
                    .contains("targetId=" + videoId)
                    .contains("parentId=null");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("commentId", commentId)
                    .containsEntry("videoId", videoId)
                    .containsEntry("targetType", "video")
                    .containsEntry("targetId", videoId)
                    .containsEntry("bizContext", "videoId=" + videoId + ",commentId=" + commentId + ",targetType=video,targetId=" + videoId);
        } finally {
            detachAppender(logger, appender);
        }
    }

    @Test
    void followSelfApiErrorPreservesManagedUserBusinessContext() throws Exception {
        LoginSession actor = loginAsRandomUser("interaction-log-follow-self");

        Logger errorLogger = (Logger) LoggerFactory.getLogger(ApiExceptionHandler.class);
        ListAppender<ILoggingEvent> errorAppender = attachAppender(errorLogger);

        try {
            MvcResult result = mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/interactions/follow")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(new FollowPayload(actor.userId()))),
                            actor.accessToken()))
                    .andExpect(status().isBadRequest())
                    .andReturn();

            JsonNode body = readBody(result);
            assertThat(body.path("code").asText()).isEqualTo("FOLLOW_SELF_FORBIDDEN");

            ILoggingEvent event = findEvent(errorAppender, "code=FOLLOW_SELF_FORBIDDEN");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("managedUserId", actor.userId())
                    .containsEntry("bizContext", "managedUserId=" + actor.userId());
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

    private record CreateCommentPayload(
            String targetType,
            String targetId,
            String content,
            String parentId
    ) {
    }

    private record TargetActionPayload(
            String targetType,
            String targetId
    ) {
    }

    private record FollowPayload(
            String followeeId
    ) {
    }
}
