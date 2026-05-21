package com.dramatv.community.integration;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.dramatv.community.admin.auth.AdminAuthApplicationService;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminAuthLoggingIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void loginAndLogoutSuccessLogsCarrySessionBusinessContext() throws Exception {
        LoginSession bootstrap = loginAsRandomUser("admin-auth-log-bootstrap");
        promoteToRole(bootstrap.userId(), "admin");

        Logger logger = (Logger) LoggerFactory.getLogger(AdminAuthApplicationService.class);
        ListAppender<ILoggingEvent> appender = attachAppender(logger);

        try {
            MvcResult loginResult = mockMvc.perform(MockMvcRequestBuilders.post("/api/admin/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new LoginRequestBody(
                                    "password",
                                    bootstrap.username(),
                                    DEFAULT_PASSWORD
                            ))))
                    .andExpect(status().isOk())
                    .andReturn();

            String accessToken = readBody(loginResult).at("/data/accessToken").asText();
            assertThat(accessToken).isNotBlank();

            ILoggingEvent loginEvent = findEvent(appender, "admin auth login success:");
            assertThat(loginEvent.getFormattedMessage())
                    .contains("operatorId=" + bootstrap.userId())
                    .contains("username=" + bootstrap.username())
                    .contains("roleCode=admin")
                    .contains("sessionExpiresInSeconds=7200");
            assertThat(loginEvent.getMDCPropertyMap())
                    .containsEntry("targetType", "session")
                    .containsEntry("targetId", bootstrap.userId())
                    .containsEntry("bizContext", "targetType=session,targetId=" + bootstrap.userId());

            mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/admin/auth/logout")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content("{}"),
                            accessToken))
                    .andExpect(status().isOk());

            ILoggingEvent logoutEvent = findEvent(appender, "admin auth logout success:");
            assertThat(logoutEvent.getFormattedMessage())
                    .contains("operatorId=" + bootstrap.userId())
                    .contains("username=" + bootstrap.username())
                    .contains("roleCode=admin");
            assertThat(logoutEvent.getMDCPropertyMap())
                    .containsEntry("targetType", "session")
                    .containsEntry("targetId", bootstrap.userId())
                    .containsEntry("bizContext", "targetType=session,targetId=" + bootstrap.userId());
        } finally {
            detachAppender(logger, appender);
        }
    }

    private void promoteToRole(String userId, String roleCode) {
        jdbcTemplate.update(
                "update users set role_code = ?, updated_at = now() where id = ?",
                roleCode,
                java.util.UUID.fromString(userId)
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

    private record LoginRequestBody(
            String loginType,
            String username,
            String password
    ) {
    }
}
