package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
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

        MvcResult promptsResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/creators/{id}/prompts", creator.userId())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode promptsBody = readBody(promptsResult);
        JsonNode promptItem = findItemById(promptsBody.at("/data/items"), promptId);
        assertThat(promptsBody.path("code").asText()).isEqualTo("OK");
        assertThat(promptsBody.at("/data/hasMore").asBoolean()).isFalse();
        assertThat(promptItem).isNotNull();
        assertThat(promptItem.path("title").asText()).isEqualTo("Creator read prompt");
        assertThat(promptItem.path("modality").asText()).isEqualTo("video");

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

    @Test
    void creatorListsPageHeavyAuthorsWithCursor() throws Exception {
        LoginSession creator = loginAsRandomUser("creator-read-heavy");

        for (int index = 0; index < 30; index += 1) {
            createPublishedVideo(
                    creator.userId(),
                    null,
                    "Heavy creator video " + index,
                    "Heavy creator video summary " + index
            );
        }

        MvcResult videosResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/creators/{id}/videos", creator.userId())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode firstPageBody = readBody(videosResult);
        assertThat(firstPageBody.path("code").asText()).isEqualTo("OK");
        assertThat(firstPageBody.at("/data/items").size()).isEqualTo(24);
        assertThat(firstPageBody.at("/data/hasMore").asBoolean()).isTrue();
        String nextCursor = firstPageBody.at("/data/nextCursor").asText();
        assertThat(nextCursor).isNotBlank();
        assertThat(nextCursor).doesNotStartWith("offset:");

        MvcResult secondPageResult = mockMvc.perform(
                        MockMvcRequestBuilders.get("/api/creators/{id}/videos", creator.userId())
                                .queryParam("cursor", nextCursor)
                                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode secondPageBody = readBody(secondPageResult);
        assertThat(secondPageBody.path("code").asText()).isEqualTo("OK");
        assertThat(secondPageBody.at("/data/items").size()).isEqualTo(6);
        assertThat(secondPageBody.at("/data/hasMore").asBoolean()).isFalse();
        assertThat(secondPageBody.at("/data/nextCursor").isNull()).isTrue();

        Set<String> collectedIds = new HashSet<>();
        collectItemIds(firstPageBody.at("/data/items"), collectedIds);
        collectItemIds(secondPageBody.at("/data/items"), collectedIds);
        assertThat(collectedIds).hasSize(30);
    }

    @Test
    void creatorWorksListMergesVideosAndPromptsIntoSingleChronologicalStream() throws Exception {
        LoginSession creator = loginAsRandomUser("creator-read-works");
        OffsetDateTime baseTime = OffsetDateTime.parse("2026-01-30T12:00:00Z");
        List<String> expectedIds = new ArrayList<>();
        List<String> expectedTypes = new ArrayList<>();

        for (int index = 0; index < 30; index += 1) {
            OffsetDateTime publishedAt = baseTime.minusMinutes(index);
            if (index % 2 == 0) {
                String videoId = createPublishedVideo(
                        creator.userId(),
                        null,
                        "Mixed creator video " + index,
                        "Mixed creator video summary " + index
                );
                updatePublishedTimestamp("videos", videoId, publishedAt);
                expectedIds.add(videoId);
                expectedTypes.add("video");
                continue;
            }

            String promptId = createPublishedPrompt(
                    creator.userId(),
                    "Mixed creator prompt " + index,
                    index % 4 == 1 ? "video" : "image",
                    "Mixed creator prompt summary " + index,
                    "Mixed creator prompt body " + index
            );
            updatePublishedTimestamp("prompt_entries", promptId, publishedAt);
            expectedIds.add(promptId);
            expectedTypes.add("prompt");
        }

        MvcResult firstPageResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/creators/{id}/works", creator.userId())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode firstPageBody = readBody(firstPageResult);
        assertThat(firstPageBody.path("code").asText()).isEqualTo("OK");
        assertThat(firstPageBody.at("/data/items").size()).isEqualTo(24);
        assertThat(firstPageBody.at("/data/hasMore").asBoolean()).isTrue();
        String nextCursor = firstPageBody.at("/data/nextCursor").asText();
        assertThat(nextCursor).isNotBlank();
        assertThat(nextCursor).doesNotStartWith("offset:");
        assertCreatorWorkOrder(firstPageBody.at("/data/items"), expectedIds.subList(0, 24), expectedTypes.subList(0, 24));

        MvcResult secondPageResult = mockMvc.perform(
                        MockMvcRequestBuilders.get("/api/creators/{id}/works", creator.userId())
                                .queryParam("cursor", nextCursor)
                                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode secondPageBody = readBody(secondPageResult);
        assertThat(secondPageBody.path("code").asText()).isEqualTo("OK");
        assertThat(secondPageBody.at("/data/items").size()).isEqualTo(6);
        assertThat(secondPageBody.at("/data/hasMore").asBoolean()).isFalse();
        assertThat(secondPageBody.at("/data/nextCursor").isNull()).isTrue();
        assertCreatorWorkOrder(secondPageBody.at("/data/items"), expectedIds.subList(24, 30), expectedTypes.subList(24, 30));
    }

    private JsonNode findItemById(JsonNode items, String id) {
        for (JsonNode item : items) {
            if (id.equals(item.path("id").asText())) {
                return item;
            }
        }
        return null;
    }

    private void collectItemIds(JsonNode items, Set<String> collector) {
        for (JsonNode item : items) {
            collector.add(item.path("id").asText());
        }
    }

    private void assertCreatorWorkOrder(JsonNode items, List<String> expectedIds, List<String> expectedTypes) {
        assertThat(items).hasSize(expectedIds.size());
        for (int index = 0; index < expectedIds.size(); index += 1) {
            JsonNode item = items.get(index);
            assertThat(item.path("id").asText()).isEqualTo(expectedIds.get(index));
            assertThat(item.path("itemType").asText()).isEqualTo(expectedTypes.get(index));
        }
    }

    private void updatePublishedTimestamp(String tableName, String id, OffsetDateTime publishedAt) {
        jdbcTemplate.update(
                "update " + tableName + " set published_at = ?, updated_at = ? where id = ?",
                publishedAt,
                publishedAt,
                UUID.fromString(id)
        );
    }
}
