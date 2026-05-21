package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthMeApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void providerConfigExposesLocalPasswordAsCurrentPrimaryProvider() throws Exception {
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/auth/providers"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/primaryProvider").asText()).isEqualTo("local_password");
        assertThat(body.at("/data/loginProviders/0/code").asText()).isEqualTo("local_password");
        assertThat(body.at("/data/loginProviders/0/formType").asText()).isEqualTo("password");
        assertThat(body.at("/data/loginProviders/0/enabled").asBoolean()).isTrue();
    }

    @Test
    void anonymousProtectedEndpointsAreRejected() throws Exception {
        MvcResult authMeResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/auth/me"))
                .andExpect(status().isForbidden())
                .andReturn();

        JsonNode authMeBody = readBody(authMeResult);
        assertThat(authMeBody.path("code").asText()).isEqualTo("FORBIDDEN");

        MvcResult meHubResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/me/hub"))
                .andExpect(status().isForbidden())
                .andReturn();

        JsonNode meHubBody = readBody(meHubResult);
        assertThat(meHubBody.path("code").asText()).isEqualTo("FORBIDDEN");
    }

    @Test
    void loginCurrentUserHubAndLogoutWorkAsSessionFlow() throws Exception {
        LoginSession session = loginAsRandomUser("auth");

        MvcResult authMeResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/auth/me")
                                .accept(MediaType.APPLICATION_JSON),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode authMeBody = readBody(authMeResult);
        assertThat(authMeBody.path("code").asText()).isEqualTo("OK");
        assertThat(authMeBody.at("/data/username").asText()).isEqualTo(session.username());
        assertThat(authMeBody.at("/data/identityProvider").asText()).isEqualTo("local");
        assertThat(authMeBody.at("/data/externalSubject").asText()).isEqualTo(session.username());

        MvcResult meHubResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/me/hub")
                                .accept(MediaType.APPLICATION_JSON),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode meHubBody = readBody(meHubResult);
        assertThat(meHubBody.path("code").asText()).isEqualTo("OK");
        assertThat(meHubBody.at("/data/profile/displayName").asText()).isEqualTo(session.username());
        assertThat(meHubBody.at("/data/profile/headline").asText()).isEqualTo("Local creator");
        assertThat(meHubBody.at("/data/profile/stats/videoCount").isMissingNode()).isFalse();
        assertThat(meHubBody.at("/data/profile/stats/workflowCount").isMissingNode()).isFalse();
        assertThat(meHubBody.at("/data/draftItems").isArray()).isTrue();

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/auth/logout")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"),
                        session.accessToken()))
                .andExpect(status().isOk());

        MvcResult revokedResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/auth/me"),
                        session.accessToken()))
                .andExpect(status().isForbidden())
                .andReturn();

        JsonNode revokedBody = readBody(revokedResult);
        assertThat(revokedBody.path("code").asText()).isEqualTo("FORBIDDEN");
    }

    @Test
    void legacyPasswordLoginTypeRemainsCompatibleWithProviderReadyFlow() throws Exception {
        LoginSession session = login("it-auth-legacy-" + System.currentTimeMillis(), DEFAULT_PASSWORD, "password");

        MvcResult authMeResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/auth/me")
                                .accept(MediaType.APPLICATION_JSON),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode authMeBody = readBody(authMeResult);
        assertThat(authMeBody.path("code").asText()).isEqualTo("OK");
        assertThat(authMeBody.at("/data/identityProvider").asText()).isEqualTo("local");
    }
}
