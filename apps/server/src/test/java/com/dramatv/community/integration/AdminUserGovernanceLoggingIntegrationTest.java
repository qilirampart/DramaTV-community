package com.dramatv.community.integration;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.dramatv.community.admin.users.AdminUserGovernanceService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminUserGovernanceLoggingIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void updateGovernanceSuccessLogKeepsManagedUserBusinessContext() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-user-log-update-admin");
        promoteToRole(admin.userId(), "admin");

        LoginSession target = loginAsRandomUser("admin-user-log-update-target");
        String previousRoleCode = userRole(target.userId());
        String previousStatusCode = userStatus(target.userId());

        Logger logger = (Logger) LoggerFactory.getLogger(AdminUserGovernanceService.class);
        ListAppender<ILoggingEvent> appender = attachAppender(logger);

        try {
            mockMvc.perform(authorized(
                            MockMvcRequestBuilders.put("/api/admin/users/{userId}/governance", target.userId())
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content("""
                                            {
                                              "roleCode": "moderator",
                                              "statusCode": "disabled"
                                            }
                                            """),
                            admin.accessToken()))
                    .andExpect(status().isOk());

            ILoggingEvent event = findEvent(appender, "admin user governance update success:");
            assertThat(event.getFormattedMessage())
                    .contains("operatorId=" + admin.userId())
                    .contains("managedUserId=" + target.userId())
                    .contains("previousRoleCode=" + previousRoleCode)
                    .contains("nextRoleCode=moderator")
                    .contains("previousStatusCode=" + previousStatusCode)
                    .contains("nextStatusCode=disabled")
                    .contains("revokedSessions=1");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("managedUserId", target.userId())
                    .containsEntry("bizContext", "managedUserId=" + target.userId());
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

    private String userRole(String userId) {
        return jdbcTemplate.queryForObject(
                "select role_code from users where id = ?",
                String.class,
                UUID.fromString(userId)
        );
    }

    private String userStatus(String userId) {
        return jdbcTemplate.queryForObject(
                "select status_code from users where id = ?",
                String.class,
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
