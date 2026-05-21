package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminAccessBoundaryApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void anonymousCannotAccessAdminRoutes() throws Exception {
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/admin/dashboard/overview")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("FORBIDDEN");
    }

    @Test
    void creatorCannotAccessAdminRoutesEvenWithValidCommunitySession() throws Exception {
        LoginSession creator = loginAsRandomUser("admin-access-creator");

        MvcResult dashboardResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/dashboard/overview")
                                .accept(MediaType.APPLICATION_JSON),
                        creator.accessToken()))
                .andExpect(status().isForbidden())
                .andReturn();

        assertThat(readBody(dashboardResult).path("code").asText()).isEqualTo("ADMIN_FORBIDDEN");

        MvcResult sessionResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/auth/session")
                                .accept(MediaType.APPLICATION_JSON),
                        creator.accessToken()))
                .andExpect(status().isForbidden())
                .andReturn();

        assertThat(readBody(sessionResult).path("code").asText()).isEqualTo("ADMIN_FORBIDDEN");
    }

    @Test
    void operatorCannotAccessModeratorOnlyModules() throws Exception {
        LoginSession operator = loginAsRandomUser("admin-access-operator");
        promoteToRole(operator.userId(), "operator");

        MvcResult reportsResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/reports")
                                .accept(MediaType.APPLICATION_JSON),
                        operator.accessToken()))
                .andExpect(status().isForbidden())
                .andReturn();

        assertThat(readBody(reportsResult).path("code").asText()).isEqualTo("ADMIN_FORBIDDEN");

        MvcResult commentsResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/comments")
                                .accept(MediaType.APPLICATION_JSON),
                        operator.accessToken()))
                .andExpect(status().isForbidden())
                .andReturn();

        assertThat(readBody(commentsResult).path("code").asText()).isEqualTo("ADMIN_FORBIDDEN");
    }

    @Test
    void moderatorCannotAccessOperatorOnlyModules() throws Exception {
        LoginSession moderator = loginAsRandomUser("admin-access-moderator");
        promoteToRole(moderator.userId(), "moderator");

        MvcResult feedOpsResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/feed-ops/home")
                                .accept(MediaType.APPLICATION_JSON),
                        moderator.accessToken()))
                .andExpect(status().isForbidden())
                .andReturn();

        assertThat(readBody(feedOpsResult).path("code").asText()).isEqualTo("ADMIN_FORBIDDEN");

        MvcResult taxonomyResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/taxonomy")
                                .accept(MediaType.APPLICATION_JSON),
                        moderator.accessToken()))
                .andExpect(status().isForbidden())
                .andReturn();

        assertThat(readBody(taxonomyResult).path("code").asText()).isEqualTo("ADMIN_FORBIDDEN");
    }

    @Test
    void adminLoginRejectsNonAdminRoleUsers() throws Exception {
        String username = "it-admin-access-login-" + System.currentTimeMillis();
        login(username, DEFAULT_PASSWORD);

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/api/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AdminLoginRequest("password", username, DEFAULT_PASSWORD))))
                .andExpect(status().isForbidden())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("ADMIN_ROLE_REQUIRED");
    }

    private void promoteToRole(String userId, String roleCode) {
        jdbcTemplate.update(
                "update users set role_code = ?, updated_at = now() where id = ?",
                roleCode,
                UUID.fromString(userId)
        );
    }

    private record AdminLoginRequest(
            String loginType,
            String username,
            String password
    ) {
    }
}
