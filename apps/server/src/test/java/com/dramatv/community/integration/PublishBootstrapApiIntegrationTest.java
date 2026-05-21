package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PublishBootstrapApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void publishBootstrapCreatesOnlyVideoAndWorkflowDraftsAndReturnsAvailableWorkflows() throws Exception {
        LoginSession session = loginAsRandomUser("publish-bootstrap");
        String workflowId = createPublishedWorkflow(
                session.userId(),
                "Owned workflow for publish bootstrap",
                "Owned workflow summary",
                "Owned workflow scenario"
        );

        assertThat(draftCount(session.userId(), "video")).isZero();
        assertThat(draftCount(session.userId(), "workflow")).isZero();
        assertThat(draftCount(session.userId(), "post")).isZero();

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/publish/bootstrap")
                                .accept(MediaType.APPLICATION_JSON),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/currentUser/id").asText()).isEqualTo(session.userId());
        assertThat(body.at("/data/videoDraft/draftId").asText()).isNotBlank();
        assertThat(body.at("/data/workflowDraft/draftId").asText()).isNotBlank();
        assertThat(body.at("/data/videoDraft/lifecycle/draftStatus").asText()).isEqualTo("draft");
        assertThat(body.at("/data/videoDraft/lifecycle/processingStatus").asText()).isEqualTo("not_submitted");
        assertThat(body.at("/data/workflowDraft/lifecycle/draftStatus").asText()).isEqualTo("draft");
        assertThat(body.at("/data/workflowDraft/lifecycle/moderationStatus").asText()).isEqualTo("not_submitted");
        assertThat(body.at("/data/availableWorkflows").isArray()).isTrue();
        assertThat(findItemById(body.at("/data/availableWorkflows"), workflowId)).isNotNull();

        assertThat(draftCount(session.userId(), "video")).isEqualTo(1);
        assertThat(draftCount(session.userId(), "workflow")).isEqualTo(1);
        assertThat(draftCount(session.userId(), "post")).isZero();
    }

    @Test
    void discussionComposerBootstrapCreatesOnlyPostDraftAndReturnsChannels() throws Exception {
        LoginSession session = loginAsRandomUser("discussion-bootstrap");

        assertThat(draftCount(session.userId(), "video")).isZero();
        assertThat(draftCount(session.userId(), "workflow")).isZero();
        assertThat(draftCount(session.userId(), "post")).isZero();

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/discussions/composer-bootstrap")
                                .accept(MediaType.APPLICATION_JSON),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/currentUser/id").asText()).isEqualTo(session.userId());
        assertThat(body.at("/data/postDraft/draftId").asText()).isNotBlank();
        assertThat(body.at("/data/postDraft/channelSlug").asText()).isNotBlank();
        assertThat(body.at("/data/postDraft/lifecycle/draftStatus").asText()).isEqualTo("draft");
        assertThat(body.at("/data/postDraft/lifecycle/moderationStatus").asText()).isEqualTo("not_applicable");
        assertThat(body.at("/data/postDraft/lifecycle/processingStatus").asText()).isEqualTo("not_applicable");
        assertThat(body.at("/data/channels").isArray()).isTrue();
        assertThat(body.at("/data/channels/0/slug").asText()).isNotBlank();

        assertThat(draftCount(session.userId(), "video")).isZero();
        assertThat(draftCount(session.userId(), "workflow")).isZero();
        assertThat(draftCount(session.userId(), "post")).isEqualTo(1);
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
