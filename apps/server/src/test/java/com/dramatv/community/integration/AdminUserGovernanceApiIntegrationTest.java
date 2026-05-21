package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminUserGovernanceApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void adminCanListUsersWithoutQueryFilter() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-users-list");
        promoteToRole(admin.userId(), "admin");

        LoginSession target = loginAsRandomUser("admin-users-list-target");
        createPublishedPrompt(target.userId(), "Admin users list prompt", "image", "summary", "prompt");

        MvcResult listResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/users")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode listBody = readBody(listResult);
        assertThat(listBody.path("code").asText()).isEqualTo("OK");
        assertThat(listBody.at("/data/summary/totalUsers").asInt()).isGreaterThan(0);
        assertThat(listBody.at("/data/items").isArray()).isTrue();
        assertThat(listBody.at("/data/items/0/id").asText()).isNotBlank();
        assertThat(listBody.at("/data/pagination/page").asInt()).isEqualTo(1);
        assertThat(listBody.at("/data/pagination/pageSize").asInt()).isEqualTo(20);
    }

    @Test
    void adminUserListSupportsRealPagination() throws Exception {
        String paginationQuery = "admin-users-page-batch-";
        LoginSession admin = loginAsRandomUser("admin-users-pagination-controller");
        promoteToRole(admin.userId(), "admin");

        for (int index = 0; index < 24; index++) {
            loginAsRandomUser(paginationQuery + index + "-" + System.nanoTime());
        }

        MvcResult firstPageResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/users")
                                .param("q", paginationQuery)
                                .param("page", "1")
                                .param("pageSize", "10")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode firstPageBody = readBody(firstPageResult);
        assertThat(firstPageBody.at("/data/items")).hasSize(10);
        assertThat(firstPageBody.at("/data/pagination/page").asInt()).isEqualTo(1);
        assertThat(firstPageBody.at("/data/pagination/pageSize").asInt()).isEqualTo(10);
        assertThat(firstPageBody.at("/data/pagination/totalItems").asInt()).isEqualTo(24);
        assertThat(firstPageBody.at("/data/pagination/totalPages").asInt()).isEqualTo(3);
        assertThat(firstPageBody.at("/data/pagination/hasPrevious").asBoolean()).isFalse();
        assertThat(firstPageBody.at("/data/pagination/hasNext").asBoolean()).isTrue();

        String firstPageFirstUserId = firstPageBody.at("/data/items/0/id").asText();

        MvcResult secondPageResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/users")
                                .param("q", paginationQuery)
                                .param("page", "2")
                                .param("pageSize", "10")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode secondPageBody = readBody(secondPageResult);
        assertThat(secondPageBody.at("/data/items")).hasSize(10);
        assertThat(secondPageBody.at("/data/pagination/page").asInt()).isEqualTo(2);
        assertThat(secondPageBody.at("/data/pagination/hasPrevious").asBoolean()).isTrue();
        assertThat(secondPageBody.at("/data/pagination/hasNext").asBoolean()).isTrue();
        assertThat(secondPageBody.at("/data/items/0/id").asText()).isNotEqualTo(firstPageFirstUserId);
    }

    @Test
    void adminCanReadUserDetailAndUpdateGovernance() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-users-manage");
        promoteToRole(admin.userId(), "admin");

        LoginSession target = loginAsRandomUser("admin-users-target");
        String workflowId = createPublishedWorkflow(target.userId(), "Admin users workflow");
        createPublishedVideo(target.userId(), workflowId, "Admin users video", "summary");
        createPublishedPrompt(target.userId(), "Admin users prompt", "video", "summary", "prompt");
        createPublishedDiscussionThread(
                target.userId(),
                "admin-users-thread-" + System.currentTimeMillis(),
                "official-events",
                "Admin users discussion",
                "thread body"
        );

        insertFollowRelation(admin.userId(), target.userId());
        insertLikeAction(admin.userId(), "video", findSingleVideoIdByAuthor(target.userId()));
        insertReportTicket(admin.userId(), "video", findSingleVideoIdByAuthor(target.userId()), "abuse", "pending");

        MvcResult detailResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/users/{userId}", target.userId())
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode detailBody = readBody(detailResult);
        assertThat(detailBody.path("code").asText()).isEqualTo("OK");
        assertThat(detailBody.at("/data/id").asText()).isEqualTo(target.userId());
        assertThat(detailBody.at("/data/contentStats/videoCount").asInt()).isEqualTo(1);
        assertThat(detailBody.at("/data/contentStats/workflowCount").asInt()).isEqualTo(1);
        assertThat(detailBody.at("/data/contentStats/promptCount").asInt()).isEqualTo(1);
        assertThat(detailBody.at("/data/contentStats/postCount").asInt()).isEqualTo(1);
        assertThat(detailBody.at("/data/governanceSummary/canLogin").asBoolean()).isTrue();

        MvcResult updateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/admin/users/{userId}/governance", target.userId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "roleCode": "moderator",
                                          "statusCode": "disabled"
                                        }
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode updateBody = readBody(updateResult);
        assertThat(updateBody.path("code").asText()).isEqualTo("OK");
        assertThat(updateBody.at("/data/roleCode").asText()).isEqualTo("moderator");
        assertThat(updateBody.at("/data/statusCode").asText()).isEqualTo("disabled");
        assertThat(userRole(target.userId())).isEqualTo("moderator");
        assertThat(userStatus(target.userId())).isEqualTo("disabled");
        assertThat(activeSessionCount(target.userId())).isEqualTo(0);

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/auth/session")
                                .accept(MediaType.APPLICATION_JSON),
                        target.accessToken()))
                .andExpect(status().isForbidden());

        assertThat(countAuditLogs("update_user_governance", target.userId())).isEqualTo(1);
    }

    @Test
    void operatorCannotDisableSelfOrAssignAdminRole() throws Exception {
        LoginSession operator = loginAsRandomUser("admin-users-operator");
        promoteToRole(operator.userId(), "operator");

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/admin/users/{userId}/governance", operator.userId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "roleCode": "operator",
                                          "statusCode": "disabled"
                                        }
                                        """),
                        operator.accessToken()))
                .andExpect(status().isConflict());

        LoginSession target = loginAsRandomUser("admin-users-operator-target");

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/admin/users/{userId}/governance", target.userId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "roleCode": "admin",
                                          "statusCode": "active"
                                        }
                                        """),
                        operator.accessToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanInitializePasswordAndTargetCanLoginWithTemporaryPassword() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-users-password-admin");
        promoteToRole(admin.userId(), "admin");

        LoginSession target = loginAsRandomUser("admin-users-password-target");
        jdbcTemplate.update(
                "update users set password_hash = null, identity_provider = 'canvas', external_subject = ?, updated_at = now() where id = ?",
                "canvas-" + target.userId(),
                UUID.fromString(target.userId())
        );

        MvcResult resetResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/users/{userId}/password/reset", target.userId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode resetBody = readBody(resetResult);
        String temporaryPassword = resetBody.at("/data/temporaryPassword").asText();
        assertThat(resetBody.at("/data/passwordAction").asText()).isEqualTo("initialize");
        assertThat(temporaryPassword).startsWith("DT");
        assertThat(activeSessionCount(target.userId())).isEqualTo(0);
        assertThat(countAuditLogs("reset_user_password", target.userId())).isEqualTo(1);

        LoginSession relogin = login(target.username(), temporaryPassword, "local_password");
        assertThat(relogin.userId()).isEqualTo(target.userId());
        assertThat(userIdentityProvider(target.userId())).isEqualTo("local");
    }

    @Test
    void operatorCannotResetOwnPasswordOrAdminPassword() throws Exception {
        LoginSession operator = loginAsRandomUser("admin-users-password-operator");
        promoteToRole(operator.userId(), "operator");

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/users/{userId}/password/reset", operator.userId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"),
                        operator.accessToken()))
                .andExpect(status().isConflict());

        LoginSession targetAdmin = loginAsRandomUser("admin-users-password-target-admin");
        promoteToRole(targetAdmin.userId(), "admin");

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/users/{userId}/password/reset", targetAdmin.userId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"),
                        operator.accessToken()))
                .andExpect(status().isForbidden());
    }

    private void promoteToRole(String userId, String roleCode) {
        jdbcTemplate.update(
                "update users set role_code = ?, updated_at = now() where id = ?",
                roleCode,
                UUID.fromString(userId)
        );
    }

    private void insertFollowRelation(String followerId, String followeeId) {
        jdbcTemplate.update("""
                insert into follow_relations (id, follower_id, followee_id, status_code, created_at, updated_at)
                values (?, ?, ?, 'active', now(), now())
                """,
                UUID.randomUUID(),
                UUID.fromString(followerId),
                UUID.fromString(followeeId)
        );
    }

    private void insertLikeAction(String actorId, String targetType, String targetId) {
        jdbcTemplate.update("""
                insert into interaction_actions (id, actor_id, action_type, target_type, target_id, status_code, created_at, updated_at)
                values (?, ?, 'like', ?, ?, 'active', now(), now())
                """,
                UUID.randomUUID(),
                UUID.fromString(actorId),
                targetType,
                UUID.fromString(targetId)
        );
    }

    private void insertReportTicket(String reporterId, String targetType, String targetId, String reasonCode, String statusCode) {
        jdbcTemplate.update("""
                insert into report_tickets (
                    id, reporter_id, target_type, target_id, reason_code, description_text, status_code, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, 'integration test ticket', ?, now(), now())
                """,
                UUID.randomUUID(),
                UUID.fromString(reporterId),
                targetType,
                UUID.fromString(targetId),
                reasonCode,
                statusCode
        );
    }

    private String findSingleVideoIdByAuthor(String authorId) {
        return jdbcTemplate.queryForObject(
                "select id::text from videos where author_id = ? limit 1",
                String.class,
                UUID.fromString(authorId)
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

    private String userIdentityProvider(String userId) {
        return jdbcTemplate.queryForObject(
                "select identity_provider from users where id = ?",
                String.class,
                UUID.fromString(userId)
        );
    }

    private int activeSessionCount(String userId) {
        Integer count = jdbcTemplate.queryForObject(
                "select count(*) from auth_sessions where user_id = ? and status_code = 'active' and revoked_at is null",
                Integer.class,
                UUID.fromString(userId)
        );
        return count == null ? 0 : count;
    }

    private int countAuditLogs(String actionCode, String targetUserId) {
        Integer count = jdbcTemplate.queryForObject(
                "select count(*) from admin_operation_logs where action_code = ? and target_id = ?",
                Integer.class,
                actionCode,
                targetUserId
        );
        return count == null ? 0 : count;
    }
}
