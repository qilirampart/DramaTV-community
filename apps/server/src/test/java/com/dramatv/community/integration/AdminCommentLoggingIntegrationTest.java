package com.dramatv.community.integration;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.dramatv.community.admin.comments.AdminCommentService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminCommentLoggingIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void hideCommentSuccessLogIncludesCommentAndVideoBusinessContext() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-comment-log-hide");
        promoteToRole(admin.userId(), "admin");

        LoginSession author = loginAsRandomUser("admin-comment-log-author");
        String videoId = createPublishedVideo(author.userId(), "Admin comment logging target");
        String commentId = createActiveComment(author.userId(), "video", videoId, "admin comment logging body");

        Logger logger = (Logger) LoggerFactory.getLogger(AdminCommentService.class);
        ListAppender<ILoggingEvent> appender = attachAppender(logger);

        try {
            mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/admin/comments/{commentId}/hide", commentId)
                                    .contentType(MediaType.APPLICATION_JSON),
                            admin.accessToken()))
                    .andExpect(status().isOk());

            ILoggingEvent event = findEvent(appender, "admin comment action success: action=hide");
            assertThat(event.getFormattedMessage())
                    .contains("operatorId=" + admin.userId())
                    .contains("commentId=" + commentId)
                    .contains("targetType=video")
                    .contains("targetId=" + videoId)
                    .contains("previousStatus=active")
                    .contains("nextStatus=hidden");
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
