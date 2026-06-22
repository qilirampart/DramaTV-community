package com.dramatv.community.integration;

import com.dramatv.community.bootstrap.DramaTvCommunityServerApplication;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(
        classes = DramaTvCommunityServerApplication.class,
        properties = "dramatv.media.processing.worker-enabled=false"
)
@AutoConfigureMockMvc
class CommunityAuthDefaultsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void localPasswordLoginIsDisabledByDefault() throws Exception {
        String username = "it-default-auth-disabled-" + System.currentTimeMillis();

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequestBody(
                                "local_password",
                                username,
                                "dramatv-local-dev"
                        ))))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(body.path("code").asText()).isEqualTo("AUTH_LOGIN_TYPE_DISABLED");

        Integer createdCount = jdbcTemplate.queryForObject(
                "select count(*) from users where username = ?",
                Integer.class,
                username
        );
        assertThat(createdCount).isZero();
    }

    private record LoginRequestBody(
            String loginType,
            String username,
            String password
    ) {
    }
}
