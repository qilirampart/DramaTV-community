package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class VideoReadApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void publicVideoDetailAndRelatedExposeViewerActionsAndWorkflowContext() throws Exception {
        LoginSession author = loginAsRandomUser("video-read-author");
        LoginSession viewer = loginAsRandomUser("video-read-viewer");
        String workflowId = createPublishedWorkflow(
                author.userId(),
                "Video read workflow",
                "Workflow summary for video read test",
                "Workflow scenario for video read test"
        );
        String videoId = createPublishedVideo(
                author.userId(),
                workflowId,
                "Video read target",
                "Target video summary"
        );
        String relatedVideoId = createPublishedVideo(
                author.userId(),
                workflowId,
                "Video read related",
                "Related video summary"
        );

        insertActiveInteractionAction(viewer.userId(), "like", "video", videoId);
        insertActiveInteractionAction(viewer.userId(), "favorite", "video", videoId);
        insertActiveFollowRelation(viewer.userId(), author.userId());

        MvcResult detailResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/videos/{id}", videoId)
                                .accept(MediaType.APPLICATION_JSON),
                        viewer.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode detailBody = readBody(detailResult);
        assertThat(detailBody.path("code").asText()).isEqualTo("OK");
        assertThat(detailBody.path("requestId").asText()).isNotBlank();
        assertThat(detailBody.at("/data/id").asText()).isEqualTo(videoId);
        assertThat(detailBody.at("/data/title").asText()).isEqualTo("Video read target");
        assertThat(detailBody.at("/data/summary").asText()).isEqualTo("Target video summary");
        assertThat(detailBody.at("/data/author/id").asText()).isEqualTo(author.userId());
        assertThat(detailBody.at("/data/workflow/id").asText()).isEqualTo(workflowId);
        assertThat(detailBody.at("/data/workflow/title").asText()).isEqualTo("Video read workflow");
        assertThat(detailBody.at("/data/workflow/allowCopy").asBoolean()).isTrue();
        assertThat(detailBody.at("/data/commentPolicy/commentingEnabled").asBoolean()).isTrue();
        assertThat(detailBody.at("/data/viewerActions/liked").asBoolean()).isTrue();
        assertThat(detailBody.at("/data/viewerActions/favorited").asBoolean()).isTrue();
        assertThat(detailBody.at("/data/viewerActions/followedAuthor").asBoolean()).isTrue();

        MvcResult relatedResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/videos/{id}/related", videoId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode relatedBody = readBody(relatedResult);
        assertThat(relatedBody.path("code").asText()).isEqualTo("OK");
        assertThat(relatedBody.path("requestId").asText()).isNotBlank();
        assertThat(findItemById(relatedBody.at("/data"), relatedVideoId))
                .as("expected related list to contain the other published video under the same workflow")
                .isNotNull();
        assertThat(findItemById(relatedBody.at("/data"), videoId)).isNull();
    }

    @Test
    void missingVideoReturns404() throws Exception {
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/videos/{id}", UUID.randomUUID())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("VIDEO_NOT_FOUND");
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
