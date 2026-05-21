package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PromptReadApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void publicPromptListDetailAndRelatedExposePublishedPrompt() throws Exception {
        LoginSession author = loginAsRandomUser("prompt-read-author");
        LoginSession viewer = loginAsRandomUser("prompt-read-viewer");
        String promptId = createPublishedPrompt(
                author.userId(),
                "Prompt read target",
                "image",
                "Prompt read summary",
                "cinematic portrait lighting"
        );
        String relatedPromptId = createPublishedPrompt(
                author.userId(),
                "Prompt read related",
                "image",
                "Related prompt summary",
                "cinematic portrait color grading"
        );

        insertActiveInteractionAction(viewer.userId(), "like", "prompt", promptId);
        insertActiveInteractionAction(viewer.userId(), "favorite", "prompt", promptId);
        insertActiveFollowRelation(viewer.userId(), author.userId());

        MvcResult listResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/prompts")
                        .param("modality", "image")
                        .param("sort", "latest")
                        .param("limit", "500")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode listBody = readBody(listResult);
        JsonNode listItem = findItemById(listBody.at("/data"), promptId);
        assertThat(listBody.path("code").asText()).isEqualTo("OK");
        assertThat(listBody.path("requestId").asText()).isNotBlank();
        assertThat(listItem).isNotNull();
        assertThat(listItem.path("title").asText()).isEqualTo("Prompt read target");
        assertThat(listItem.path("modality").asText()).isEqualTo("image");
        assertThat(listItem.at("/taxonomy/modelCategory").asText()).isEqualTo("gpt-image-2");
        assertThat(listItem.at("/taxonomy/contentCategory").asText()).isEqualTo("real-person");
        assertThat(listItem.at("/taxonomy/compositionCategory").asText()).isEqualTo("single-model");
        assertThat(listItem.at("/author/id").asText()).isEqualTo(author.userId());

        MvcResult detailResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/prompts/{id}", promptId)
                                .accept(MediaType.APPLICATION_JSON),
                        viewer.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode detailBody = readBody(detailResult);
        assertThat(detailBody.path("code").asText()).isEqualTo("OK");
        assertThat(detailBody.path("requestId").asText()).isNotBlank();
        assertThat(detailBody.at("/data/id").asText()).isEqualTo(promptId);
        assertThat(detailBody.at("/data/title").asText()).isEqualTo("Prompt read target");
        assertThat(detailBody.at("/data/summary").asText()).isEqualTo("Prompt read summary");
        assertThat(detailBody.at("/data/promptText").asText()).isEqualTo("cinematic portrait lighting");
        assertThat(detailBody.at("/data/modality").asText()).isEqualTo("image");
        assertThat(detailBody.at("/data/taxonomy/modelCategory").asText()).isEqualTo("gpt-image-2");
        assertThat(detailBody.at("/data/taxonomy/contentCategory").asText()).isEqualTo("real-person");
        assertThat(detailBody.at("/data/taxonomy/compositionCategory").asText()).isEqualTo("single-model");
        assertThat(detailBody.at("/data/author/id").asText()).isEqualTo(author.userId());
        assertThat(detailBody.at("/data/commentPolicy/commentingEnabled").asBoolean()).isTrue();
        assertThat(detailBody.at("/data/viewerActions/liked").asBoolean()).isTrue();
        assertThat(detailBody.at("/data/viewerActions/favorited").asBoolean()).isTrue();
        assertThat(detailBody.at("/data/viewerActions/followedAuthor").asBoolean()).isTrue();

        MvcResult relatedResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/prompts/{id}/related", promptId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode relatedBody = readBody(relatedResult);
        assertThat(relatedBody.path("code").asText()).isEqualTo("OK");
        assertThat(relatedBody.path("requestId").asText()).isNotBlank();
        assertThat(findItemById(relatedBody.at("/data"), relatedPromptId))
                .as("expected related list to contain another published prompt from the same author/modality")
                .isNotNull();
    }

    @Test
    void missingPromptReturns404() throws Exception {
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/prompts/{id}", UUID.randomUUID())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("PROMPT_NOT_FOUND");
        assertThat(body.path("requestId").asText()).isNotBlank();
    }

    @Test
    void promptListSupportsOffsetPagination() throws Exception {
        LoginSession author = loginAsRandomUser("prompt-read-offset-author");
        createPublishedPrompt(
                author.userId(),
                "Prompt pagination older",
                "image",
                "Older prompt summary",
                "cinematic portrait lighting"
        );
        createPublishedPrompt(
                author.userId(),
                "Prompt pagination newer",
                "image",
                "Newer prompt summary",
                "cinematic portrait color grading"
        );

        MvcResult firstTwoResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/prompts")
                        .param("modality", "image")
                        .param("sort", "latest")
                        .param("limit", "2")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode firstTwoItems = readBody(firstTwoResult).at("/data");
        assertThat(firstTwoItems.size()).isEqualTo(2);
        String expectedSecondId = firstTwoItems.get(1).path("id").asText();

        MvcResult offsetResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/prompts")
                        .param("modality", "image")
                        .param("sort", "latest")
                        .param("limit", "1")
                        .param("offset", "1")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode offsetItems = readBody(offsetResult).at("/data");
        assertThat(offsetItems.size()).isEqualTo(1);
        assertThat(offsetItems.get(0).path("id").asText()).isEqualTo(expectedSecondId);
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
