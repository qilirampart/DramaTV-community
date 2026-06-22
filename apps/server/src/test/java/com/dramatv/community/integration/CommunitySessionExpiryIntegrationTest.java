package com.dramatv.community.integration;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;

class CommunitySessionExpiryIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void currentUserLookupSlidesSessionExpiryForward() throws Exception {
        LoginSession session = loginAsRandomUser("session-expiry-slide");

        OffsetDateTime before = jdbcTemplate.queryForObject(
                "select expires_at from auth_sessions where token_hash = ?",
                OffsetDateTime.class,
                sha256(session.accessToken())
        );
        assertThat(before).isNotNull();

        Thread.sleep(50L);

        mockMvc.perform(authorized(MockMvcRequestBuilders.get("/api/auth/me"), session.accessToken())).andReturn();

        OffsetDateTime after = jdbcTemplate.queryForObject(
                "select expires_at from auth_sessions where token_hash = ?",
                OffsetDateTime.class,
                sha256(session.accessToken())
        );
        assertThat(after).isNotNull();
        assertThat(after).isAfter(before);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}
