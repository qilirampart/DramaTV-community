package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class InteractionApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void videoLikeAndFavoriteToggleUpdateAndRestoreCounters() throws Exception {
        LoginSession owner = loginAsRandomUser("interaction-video-owner");
        LoginSession session = loginAsRandomUser("interaction-video-actor");
        String videoId = createPublishedVideo(owner.userId(), "interaction-like-target");

        int initialLikeCount = videoLikeCount(videoId);
        int initialFavoriteCount = videoFavoriteCount(videoId);

        MvcResult likeResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/interactions/like")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new TargetActionPayload("video", videoId))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode likeBody = readBody(likeResult);
        assertThat(likeBody.at("/data/action").asText()).isEqualTo("like");
        assertThat(likeBody.at("/data/targetId").asText()).isEqualTo(videoId);
        assertThat(likeBody.at("/data/active").asBoolean()).isTrue();
        assertThat(videoLikeCount(videoId)).isEqualTo(initialLikeCount + 1);

        MvcResult favoriteResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/interactions/favorite")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new TargetActionPayload("video", videoId))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode favoriteBody = readBody(favoriteResult);
        assertThat(favoriteBody.at("/data/action").asText()).isEqualTo("favorite");
        assertThat(favoriteBody.at("/data/targetId").asText()).isEqualTo(videoId);
        assertThat(favoriteBody.at("/data/active").asBoolean()).isTrue();
        assertThat(videoFavoriteCount(videoId)).isEqualTo(initialFavoriteCount + 1);

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.delete("/api/interactions/like")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new TargetActionPayload("video", videoId))),
                        session.accessToken()))
                .andExpect(status().isOk());

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.delete("/api/interactions/favorite")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new TargetActionPayload("video", videoId))),
                        session.accessToken()))
                .andExpect(status().isOk());

        assertThat(videoLikeCount(videoId)).isEqualTo(initialLikeCount);
        assertThat(videoFavoriteCount(videoId)).isEqualTo(initialFavoriteCount);
    }

    @Test
    void followToggleUpdatesAndRestoresFollowerCount() throws Exception {
        LoginSession actor = loginAsRandomUser("follow-actor");
        LoginSession followee = loginAsRandomUser("followee");

        int initialFollowerCount = creatorFollowerCount(followee.userId());

        MvcResult followResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/interactions/follow")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new FollowPayload(followee.userId()))),
                        actor.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode followBody = readBody(followResult);
        assertThat(followBody.at("/data/action").asText()).isEqualTo("follow");
        assertThat(followBody.at("/data/targetId").asText()).isEqualTo(followee.userId());
        assertThat(followBody.at("/data/active").asBoolean()).isTrue();
        assertThat(creatorFollowerCount(followee.userId())).isEqualTo(initialFollowerCount + 1);

        MvcResult unfollowResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.delete("/api/interactions/follow/{followeeId}", followee.userId()),
                        actor.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode unfollowBody = readBody(unfollowResult);
        assertThat(unfollowBody.at("/data/action").asText()).isEqualTo("follow");
        assertThat(unfollowBody.at("/data/targetId").asText()).isEqualTo(followee.userId());
        assertThat(unfollowBody.at("/data/active").asBoolean()).isFalse();
        assertThat(creatorFollowerCount(followee.userId())).isEqualTo(initialFollowerCount);
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
