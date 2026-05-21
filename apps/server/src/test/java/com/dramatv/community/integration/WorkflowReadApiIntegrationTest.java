package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class WorkflowReadApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void publicWorkflowDetailAndRelatedVideosExposePublishedContext() throws Exception {
        LoginSession author = loginAsRandomUser("workflow-read-author");
        LoginSession viewer = loginAsRandomUser("workflow-read-viewer");
        String workflowId = createPublishedWorkflow(
                author.userId(),
                "Workflow read target",
                "Workflow read summary",
                "Workflow read scenario"
        );
        String relatedVideoId = createPublishedVideo(
                author.userId(),
                workflowId,
                "Workflow related video",
                "Video attached to workflow"
        );

        insertActiveInteractionAction(viewer.userId(), "like", "workflow", workflowId);
        insertActiveInteractionAction(viewer.userId(), "favorite", "workflow", workflowId);

        MvcResult detailResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/workflows/{id}", workflowId)
                                .accept(MediaType.APPLICATION_JSON),
                        viewer.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode detailBody = readBody(detailResult);
        assertThat(detailBody.path("code").asText()).isEqualTo("OK");
        assertThat(detailBody.path("requestId").asText()).isNotBlank();
        assertThat(detailBody.at("/data/id").asText()).isEqualTo(workflowId);
        assertThat(detailBody.at("/data/title").asText()).isEqualTo("Workflow read target");
        assertThat(detailBody.at("/data/summary").asText()).isEqualTo("Workflow read summary");
        assertThat(detailBody.at("/data/scenarioText").asText()).isEqualTo("Workflow read scenario");
        assertThat(detailBody.at("/data/author/id").asText()).isEqualTo(author.userId());
        assertThat(detailBody.at("/data/permissions/allowCopy").asBoolean()).isTrue();
        assertThat(detailBody.at("/data/permissions/allowFork").asBoolean()).isFalse();
        assertThat(detailBody.at("/data/commentPolicy/commentingEnabled").asBoolean()).isTrue();
        assertThat(detailBody.at("/data/viewerActions/liked").asBoolean()).isTrue();
        assertThat(detailBody.at("/data/viewerActions/favorited").asBoolean()).isTrue();
        assertThat(findItemById(detailBody.at("/data/relatedVideos"), relatedVideoId)).isNotNull();

        MvcResult relatedResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/workflows/{id}/related-videos", workflowId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode relatedBody = readBody(relatedResult);
        assertThat(relatedBody.path("code").asText()).isEqualTo("OK");
        assertThat(relatedBody.path("requestId").asText()).isNotBlank();
        assertThat(findItemById(relatedBody.at("/data"), relatedVideoId))
                .as("expected workflow related-videos endpoint to include linked published video")
                .isNotNull();
    }

    @Test
    void missingWorkflowReturns404() throws Exception {
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/workflows/{id}", UUID.randomUUID())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("WORKFLOW_NOT_FOUND");
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
