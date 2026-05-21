package com.dramatv.community.integration;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.dramatv.community.identity.application.AuthApplicationService;
import com.dramatv.community.me.application.MeProfileApplicationService;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CommunitySessionLoggingIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void loginAndLogoutSuccessLogsCarrySessionBusinessContext() throws Exception {
        Logger logger = (Logger) LoggerFactory.getLogger(AuthApplicationService.class);
        ListAppender<ILoggingEvent> appender = attachAppender(logger);

        try {
            LoginSession session = login("it-community-auth-log-" + System.currentTimeMillis(), DEFAULT_PASSWORD);

            ILoggingEvent loginEvent = findEvent(appender, "auth login success:");
            assertThat(loginEvent.getFormattedMessage())
                    .contains("userId=" + session.userId())
                    .contains("username=" + session.username())
                    .contains("roleCode=creator")
                    .contains("sessionExpiresInSeconds=7200");
            assertThat(loginEvent.getMDCPropertyMap())
                    .containsEntry("targetType", "session")
                    .containsEntry("targetId", session.userId())
                    .containsEntry("bizContext", "targetType=session,targetId=" + session.userId());

            mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/auth/logout"),
                            session.accessToken()))
                    .andExpect(status().isOk());

            ILoggingEvent logoutEvent = findEvent(appender, "auth logout success:");
            assertThat(logoutEvent.getFormattedMessage())
                    .contains("userId=" + session.userId())
                    .contains("username=" + session.username())
                    .contains("roleCode=creator");
            assertThat(logoutEvent.getMDCPropertyMap())
                    .containsEntry("targetType", "session")
                    .containsEntry("targetId", session.userId())
                    .containsEntry("bizContext", "targetType=session,targetId=" + session.userId());
        } finally {
            detachAppender(logger, appender);
        }
    }

    @Test
    void updateProfileSuccessLogCarriesCreatorBusinessContext() throws Exception {
        LoginSession session = loginAsRandomUser("community-profile-log");
        Logger logger = (Logger) LoggerFactory.getLogger(MeProfileApplicationService.class);
        ListAppender<ILoggingEvent> appender = attachAppender(logger);

        try {
            String displayName = "Community Profile Log";
            String bio = "profile update log coverage";
            String headline = "profile headline for logging";
            String avatarUrl = "https://cdn.example.com/community-profile-log-avatar.png";

            MvcResult result = mockMvc.perform(authorized(
                            MockMvcRequestBuilders.put("/api/me/profile")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(new UpdateMeProfilePayload(
                                            displayName,
                                            bio,
                                            headline,
                                            null,
                                            avatarUrl
                                    ))),
                            session.accessToken()))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode body = readBody(result);
            assertThat(body.path("code").asText()).isEqualTo("OK");
            assertThat(body.at("/data/displayName").asText()).isEqualTo(displayName);
            assertThat(body.at("/data/avatarUrl").asText()).isEqualTo(avatarUrl);

            ILoggingEvent event = findEvent(appender, "me profile update success:");
            assertThat(event.getFormattedMessage())
                    .contains("creatorId=" + session.userId())
                    .contains("displayNameLength=" + displayName.length())
                    .contains("bioLength=" + bio.length())
                    .contains("headlineLength=" + headline.length())
                    .contains("avatarSource=url")
                    .contains("avatarChanged=true");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("creatorId", session.userId())
                    .containsEntry("bizContext", "creatorId=" + session.userId());
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

    private record UpdateMeProfilePayload(
            String displayName,
            String bio,
            String headline,
            String avatarAssetId,
            String avatarUrl
    ) {
    }
}
