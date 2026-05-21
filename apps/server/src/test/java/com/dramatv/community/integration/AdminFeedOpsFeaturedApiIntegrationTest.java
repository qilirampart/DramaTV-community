package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminFeedOpsFeaturedApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void featuredFeedOpsCandidatePoolReturnsAllPublishedResourcesWithinQueryWindow() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-feedops-featured-pool");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("admin-feedops-featured-pool-author");
        int imagePromptCount = 44;
        int videoPromptCount = 31;
        int workflowCount = 2;

        for (int index = 0; index < imagePromptCount; index++) {
            createPublishedPrompt(
                    author.userId(),
                    "Featured image prompt " + index,
                    "image",
                    "Featured image summary " + index,
                    "Featured image body " + index
            );
        }

        for (int index = 0; index < videoPromptCount; index++) {
            createPublishedPrompt(
                    author.userId(),
                    "Featured video prompt " + index,
                    "video",
                    "Featured video summary " + index,
                    "Featured video body " + index
            );
        }

        for (int index = 0; index < workflowCount; index++) {
            createPublishedWorkflow(
                    author.userId(),
                    "Featured workflow " + index,
                    "Featured workflow summary " + index,
                    "Featured workflow scenario " + index
            );
        }

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/feed-ops/featured").accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/summary/candidateItemCount").asInt()).isGreaterThanOrEqualTo(imagePromptCount + videoPromptCount + workflowCount);
    }

    @Test
    void featuredFeedOpsReadsAndPersistsRealSlotConfig() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-feedops-featured");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("admin-feedops-featured-author");
        String mainPromptId = createPublishedPrompt(author.userId(), "Featured Main Prompt", "video", "Featured main summary", "Featured main body");
        String workflowId = createPublishedWorkflow(author.userId(), "Featured Workflow", "Featured workflow summary", "Featured workflow scenario");
        String newcomerPromptId = createPublishedPrompt(author.userId(), "Featured Newcomer Prompt", "image", "Featured newcomer summary", "Featured newcomer body");
        String discussionId = createPublishedDiscussionThread(author.userId(), "feedops-featured-thread", "official-events", "Featured Discussion", "Featured discussion body");

        MvcResult initialResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/feed-ops/featured").accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode initialBody = readBody(initialResult);
        assertThat(initialBody.path("code").asText()).isEqualTo("OK");
        assertThat(initialBody.at("/data/summary/pageKey").asText()).isEqualTo("featured");
        assertThat(initialBody.at("/data/slots").size()).isEqualTo(5);
        assertThat(findCandidate(initialBody.at("/data/candidatePool"), mainPromptId).isMissingNode()).isFalse();
        assertThat(findCandidate(initialBody.at("/data/candidatePool"), workflowId).isMissingNode()).isFalse();
        assertThat(findCandidate(initialBody.at("/data/candidatePool"), discussionId).isMissingNode()).isFalse();

        MvcResult updateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/admin/feed-ops/featured")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "statusCode", "published",
                                        "slots", List.of(
                                                Map.of("slotKey", "featured-all", "items", List.of(Map.of("targetType", "prompt", "targetId", mainPromptId))),
                                                Map.of("slotKey", "featured-workflow", "items", List.of(Map.of("targetType", "workflow", "targetId", workflowId))),
                                                Map.of("slotKey", "featured-video-prompt", "items", List.of(Map.of("targetType", "prompt", "targetId", mainPromptId))),
                                                Map.of("slotKey", "featured-image-prompt", "items", List.of(Map.of("targetType", "prompt", "targetId", newcomerPromptId))),
                                                Map.of("slotKey", "featured-activity", "items", List.of(Map.of("targetType", "post", "targetId", discussionId)))
                                        )
                                ))),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode updateBody = readBody(updateResult);
        assertThat(updateBody.at("/data/summary/statusCode").asText()).isEqualTo("published");
        assertThat(updateBody.at("/data/summary/configuredItemCount").asInt()).isEqualTo(5);
        assertThat(findSlotItem(updateBody, "featured-all", mainPromptId).at("/itemTypeLabel").asText()).isEqualTo("视频提示词");
        assertThat(findSlotItem(updateBody, "featured-workflow", workflowId).at("/itemTypeLabel").asText()).isEqualTo("工作流");
        assertThat(findSlotItem(updateBody, "featured-video-prompt", mainPromptId).at("/itemTypeLabel").asText()).isEqualTo("视频提示词");
        assertThat(findSlotItem(updateBody, "featured-image-prompt", newcomerPromptId).at("/itemTypeLabel").asText()).isEqualTo("图片提示词");
        assertThat(findSlotItem(updateBody, "featured-activity", discussionId).at("/channelTitle").asText()).isEqualTo("官方活动");
    }

    private void promoteToRole(String userId, String roleCode) {
        jdbcTemplate.update(
                "update users set role_code = ?, updated_at = now() where id = ?",
                roleCode,
                java.util.UUID.fromString(userId)
        );
    }

    private JsonNode findCandidate(JsonNode items, String targetId) {
        if (!items.isArray()) {
            return objectMapper.getNodeFactory().missingNode();
        }
        for (JsonNode item : items) {
            if (targetId.equals(item.path("targetId").asText())) {
                return item;
            }
        }
        return objectMapper.getNodeFactory().missingNode();
    }

    private JsonNode findSlotItem(JsonNode body, String slotKey, String targetId) {
        JsonNode slots = body.at("/data/slots");
        if (!slots.isArray()) {
            return objectMapper.getNodeFactory().missingNode();
        }
        for (JsonNode slot : slots) {
            if (!slotKey.equals(slot.path("key").asText())) {
                continue;
            }
            for (JsonNode item : slot.path("items")) {
                if (targetId.equals(item.path("targetId").asText())) {
                    return item;
                }
            }
        }
        return objectMapper.getNodeFactory().missingNode();
    }
}
