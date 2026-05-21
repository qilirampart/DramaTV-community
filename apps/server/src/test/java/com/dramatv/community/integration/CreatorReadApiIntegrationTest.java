package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CreatorReadApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void creatorDetailAndPublishedListsExposeUnifiedCommunityContent() throws Exception {
        LoginSession creator = loginAsRandomUser("creator-read-owner");
        LoginSession viewer = loginAsRandomUser("creator-read-viewer");

        String videoId = createPublishedVideo(creator.userId(), null, "Creator read video", "Creator video summary");
        String workflowId = createPublishedWorkflow(
                creator.userId(),
                "Creator read workflow",
                "Creator workflow summary",
                "Creator workflow scenario"
        );
        String promptId = createPublishedPrompt(
                creator.userId(),
                "Creator read prompt",
                "video",
                "Creator prompt summary",
                "dynamic camera movement"
        );
        String slug = "creator-read-" + UUID.randomUUID().toString().substring(0, 8);
        String postId = createPublishedDiscussionThread(
                creator.userId(),
                slug,
                "video-production",
                "Creator read discussion",
                "Creator read discussion body"
        );

        insertActiveFollowRelation(viewer.userId(), creator.userId());

        MvcResult detailResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/creators/{id}", creator.userId())
                                .accept(MediaType.APPLICATION_JSON),
                        viewer.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode detailBody = readBody(detailResult);
        assertThat(detailBody.path("code").asText()).isEqualTo("OK");
        assertThat(detailBody.path("requestId").asText()).isNotBlank();
        assertThat(detailBody.at("/data/id").asText()).isEqualTo(creator.userId());
        assertThat(detailBody.at("/data/displayName").asText()).isEqualTo(creator.username());
        assertThat(detailBody.at("/data/stats/videoCount").asInt()).isEqualTo(2);
        assertThat(detailBody.at("/data/stats/workflowCount").asInt()).isEqualTo(1);
        assertThat(detailBody.at("/data/stats/followerCount").asLong()).isEqualTo(1L);
        assertThat(detailBody.at("/data/viewerActions/followed").asBoolean()).isTrue();

        MvcResult videosResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/creators/{id}/videos", creator.userId())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode videosBody = readBody(videosResult);
        assertThat(videosBody.path("code").asText()).isEqualTo("OK");
        assertThat(videosBody.at("/data/hasMore").asBoolean()).isFalse();
        assertThat(findItemById(videosBody.at("/data/items"), videoId)).isNotNull();

        MvcResult workflowsResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/creators/{id}/workflows", creator.userId())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode workflowsBody = readBody(workflowsResult);
        assertThat(workflowsBody.path("code").asText()).isEqualTo("OK");
        assertThat(workflowsBody.at("/data/hasMore").asBoolean()).isFalse();
        assertThat(findItemById(workflowsBody.at("/data/items"), workflowId)).isNotNull();

        MvcResult postsResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/creators/{id}/posts", creator.userId())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode postsBody = readBody(postsResult);
        JsonNode postItem = findItemById(postsBody.at("/data/items"), postId);
        assertThat(postsBody.path("code").asText()).isEqualTo("OK");
        assertThat(postsBody.at("/data/hasMore").asBoolean()).isFalse();
        assertThat(postItem).isNotNull();
        assertThat(postItem.path("slug").asText()).isEqualTo(slug);
        assertThat(postItem.path("channelSlug").asText()).isEqualTo("video-production");

        assertThat(promptId).isNotBlank();
    }

    @Test
    void missingCreatorReturns404() throws Exception {
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/creators/{id}", UUID.randomUUID())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("CREATOR_NOT_FOUND");
        assertThat(body.path("requestId").asText()).isNotBlank();
    }

    private JsonNode findItemById(JsonNode items, String id) {
        for (JsonNode item : items) {
            if (id.equals(item.path("id").asText())) {
                return item;
            }
        }
        return null;
    }
}
