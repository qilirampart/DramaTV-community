package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminFeedOpsHomeApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void homeFeedOpsCandidatePoolIncludesPromptsBeyondLegacyWindow() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-feedops-home-pool");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("admin-feedops-home-pool-author");
        List<String> promptIds = new ArrayList<>();
        for (int index = 0; index < 260; index++) {
            promptIds.add(createPublishedPrompt(
                    author.userId(),
                    "FeedOps home pool prompt " + index,
                    index % 2 == 0 ? "video" : "image",
                    "FeedOps home pool summary " + index,
                    "FeedOps home pool body " + index
            ));
        }

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/feed-ops/home")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/summary/candidateItemCount").asInt()).isGreaterThanOrEqualTo(promptIds.size());
        assertThat(body.at("/data/candidatePool").isArray()).isTrue();
        assertThat(body.at("/data/candidatePool").size()).isEqualTo(0);

        MvcResult candidateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/feed-ops/home/candidates")
                                .param("slotKey", "home-hero")
                                .param("page", "52")
                                .param("pageSize", "5")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode candidateBody = readBody(candidateResult);
        assertThat(candidateBody.path("code").asText()).isEqualTo("OK");
        assertThat(candidateBody.at("/data/summary/totalItems").asInt()).isGreaterThanOrEqualTo(promptIds.size());
        assertThat(candidateBody.at("/data/summary/filteredItems").asInt()).isGreaterThanOrEqualTo(promptIds.size());
        assertThat(candidateBody.at("/data/pagination/page").asInt()).isEqualTo(52);
        assertThat(candidateBody.at("/data/items").size()).isEqualTo(5);
        assertThat(candidateBody.at("/data/items/0/targetId").asText()).isNotBlank();
    }

    @Test
    void homeFeedOpsReadsAndPersistsRealSlotConfig() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-feedops-home");
        promoteToRole(admin.userId(), "operator");
        clearHomeFeedOpsConfig();

        LoginSession author = loginAsRandomUser("admin-feedops-home-author");
        String heroPromptId = createPublishedPrompt(
                author.userId(),
                "FeedOps Hero Prompt",
                "video",
                "Hero prompt summary",
                "Hero prompt body"
        );
        String recommendPromptId = createPublishedPrompt(
                author.userId(),
                "FeedOps Recommend Prompt",
                "image",
                "Recommend prompt summary",
                "Recommend prompt body"
        );
        String workflowId = createPublishedWorkflow(
                author.userId(),
                "FeedOps Workflow",
                "Workflow summary",
                "Workflow scenario"
        );
        String extraVideoPromptId = createPublishedPrompt(
                author.userId(),
                "FeedOps Extra Video Prompt",
                "video",
                "Extra video prompt summary",
                "Extra video prompt body"
        );
        String extraImagePromptId = createPublishedPrompt(
                author.userId(),
                "FeedOps Extra Image Prompt",
                "image",
                "Extra image prompt summary",
                "Extra image prompt body"
        );
        String extraWorkflowId = createPublishedWorkflow(
                author.userId(),
                "FeedOps Extra Workflow",
                "Extra workflow summary",
                "Extra workflow scenario"
        );
        String discussionId = createPublishedDiscussionThread(
                author.userId(),
                "feedops-home-thread-" + UUID.randomUUID(),
                "official-events",
                "FeedOps Discussion Thread",
                "Discussion body content for feed ops home."
        );
        String heroCoverAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "media/feed-ops/home-hero-cover.jpg",
                "image/jpeg"
        );
        String heroPreviewAssetId = createPublicMediaAsset(
                author.userId(),
                "video",
                "media/feed-ops/home-hero-preview.mp4",
                "video/mp4"
        );
        String recommendCoverAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "media/feed-ops/home-recommend-cover.jpg",
                "image/jpeg"
        );
        String workflowCoverAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "media/feed-ops/home-workflow-cover.jpg",
                "image/jpeg"
        );

        jdbcTemplate.update(
                "update prompt_entries set cover_asset_id = ?, primary_example_asset_id = ?, updated_at = now() where id = ?",
                UUID.fromString(heroCoverAssetId),
                UUID.fromString(heroPreviewAssetId),
                UUID.fromString(heroPromptId)
        );
        jdbcTemplate.update(
                "update prompt_entries set cover_asset_id = ?, updated_at = now() where id = ?",
                UUID.fromString(recommendCoverAssetId),
                UUID.fromString(recommendPromptId)
        );
        jdbcTemplate.update(
                "update workflows set cover_asset_id = ?, updated_at = now() where id = ?",
                UUID.fromString(workflowCoverAssetId),
                UUID.fromString(workflowId)
        );

        MvcResult initialResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/feed-ops/home")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode initialBody = readBody(initialResult);
        assertThat(initialBody.path("code").asText()).isEqualTo("OK");
        assertThat(initialBody.at("/data/summary/statusCode").asText()).isEqualTo("draft");
        assertThat(initialBody.at("/data/slots").size()).isEqualTo(8);
        assertThat(findSlot(initialBody, "home-hero").path("maxItems").asInt()).isEqualTo(6);
        assertThat(findSlot(initialBody, "home-hero").path("items").isArray()).isTrue();
        assertThat(findSlot(initialBody, "home-hero").path("items").size()).isEqualTo(0);
        assertThat(findSlot(initialBody, "recommended-primary").path("items").isArray()).isTrue();
        assertThat(findSlot(initialBody, "recommended-primary").path("items").size()).isEqualTo(0);
        JsonNode heroFallbackItem = findSlot(initialBody, "home-hero").path("fallbackItems").path(0);
        assertThat(heroFallbackItem.path("targetId").asText()).isNotBlank();

        MvcResult candidateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/feed-ops/home/candidates")
                                .param("slotKey", "home-hero")
                                .param("page", "1")
                                .param("pageSize", "20")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode candidateBody = readBody(candidateResult);
        JsonNode heroCandidate = findCandidate(candidateBody.at("/data/items"), heroPromptId);
        JsonNode workflowCandidate = findCandidate(candidateBody.at("/data/items"), workflowId);
        assertThat(heroCandidate.isMissingNode()).isFalse();
        assertThat(workflowCandidate.isMissingNode()).isFalse();
        assertThat(findCandidate(candidateBody.at("/data/items"), discussionId).isMissingNode()).isTrue();
        assertThat(heroCandidate.at("/coverUrl").asText()).startsWith("/media/");
        assertThat(heroCandidate.at("/posterUrl").asText()).startsWith("/media/");
        assertThat(heroCandidate.at("/previewUrl").asText()).startsWith("/media/");
        assertThat(heroCandidate.at("/sourceUrl").asText()).startsWith("/media/");
        assertThat(workflowCandidate.at("/coverUrl").asText()).startsWith("/media/");

        MvcResult updateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/admin/feed-ops/home")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "statusCode", "published",
                                        "slots", List.of(
                                                Map.of(
                                                        "slotKey", "home-hero",
                                                        "items", List.of(
                                                                Map.of("targetType", "prompt", "targetId", heroPromptId),
                                                                Map.of("targetType", "workflow", "targetId", workflowId),
                                                                Map.of("targetType", "prompt", "targetId", recommendPromptId),
                                                                Map.of("targetType", "prompt", "targetId", extraVideoPromptId),
                                                                Map.of("targetType", "prompt", "targetId", extraImagePromptId),
                                                                Map.of("targetType", "workflow", "targetId", extraWorkflowId)
                                                        )
                                                ),
                                                Map.of(
                                                        "slotKey", "recommended-primary",
                                                        "items", List.of(
                                                                Map.of("targetType", "prompt", "targetId", recommendPromptId)
                                                        )
                                                ),
                                                Map.of(
                                                        "slotKey", "canvas",
                                                        "items", List.of(
                                                                Map.of("targetType", "workflow", "targetId", workflowId)
                                                        )
                                                ),
                                                Map.of(
                                                        "slotKey", "commercial",
                                                        "items", List.of(
                                                                Map.of("targetType", "prompt", "targetId", heroPromptId)
                                                        )
                                                ),
                                                Map.of(
                                                        "slotKey", "animation",
                                                        "items", List.of(
                                                                Map.of("targetType", "prompt", "targetId", recommendPromptId)
                                                        )
                                                ),
                                                Map.of(
                                                        "slotKey", "narrative",
                                                        "items", List.of(
                                                                Map.of("targetType", "workflow", "targetId", workflowId)
                                                        )
                                                ),
                                                Map.of(
                                                        "slotKey", "mv",
                                                        "items", List.of(
                                                                Map.of("targetType", "prompt", "targetId", heroPromptId)
                                                        )
                                                ),
                                                Map.of(
                                                        "slotKey", "creative",
                                                        "items", List.of(
                                                                Map.of("targetType", "workflow", "targetId", workflowId)
                                                        )
                                                )
                                        )
                                ))),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode updateBody = readBody(updateResult);
        assertThat(updateBody.path("code").asText()).isEqualTo("OK");
        assertThat(updateBody.at("/data/summary/statusCode").asText()).isEqualTo("published");
        assertThat(updateBody.at("/data/summary/configuredItemCount").asInt()).isEqualTo(13);
        assertThat(updateBody.at("/data/summary/updatedByDisplayName").asText()).isNotBlank();
        assertThat(updateBody.at("/data/summary/publishedAt").asText()).isNotBlank();
        JsonNode heroSlotItem = findSlotItem(updateBody, "home-hero", heroPromptId);
        JsonNode recommendSlotItem = findSlotItem(updateBody, "recommended-primary", recommendPromptId);
        assertThat(findSlot(updateBody, "home-hero").path("maxItems").asInt()).isEqualTo(6);
        assertThat(findSlot(updateBody, "home-hero").path("items").size()).isEqualTo(6);
        assertThat(heroSlotItem.at("/itemTypeLabel").asText()).isEqualTo("视频提示词");
        assertThat(recommendSlotItem.at("/itemTypeLabel").asText()).isEqualTo("图片提示词");
        assertThat(findSlotItem(updateBody, "canvas", workflowId).isMissingNode()).isFalse();
        assertThat(findSlotItem(updateBody, "creative", workflowId).isMissingNode()).isFalse();
        assertThat(heroSlotItem.at("/coverUrl").asText()).startsWith("/media/");
        assertThat(heroSlotItem.at("/posterUrl").asText()).startsWith("/media/");
        assertThat(heroSlotItem.at("/previewUrl").asText()).startsWith("/media/");
        assertThat(heroSlotItem.at("/sourceUrl").asText()).startsWith("/media/");
        assertThat(recommendSlotItem.at("/coverUrl").asText()).startsWith("/media/");

        MvcResult readbackResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/feed-ops/home")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode readbackBody = readBody(readbackResult);
        assertThat(readbackBody.at("/data/summary/statusCode").asText()).isEqualTo("published");
        assertThat(findSlot(readbackBody, "home-hero").path("items").size()).isEqualTo(6);
        assertThat(findSlotItem(readbackBody, "home-hero", heroPromptId).isMissingNode()).isFalse();
        assertThat(findSlotItem(readbackBody, "recommended-primary", recommendPromptId).isMissingNode()).isFalse();
        assertThat(findSlotItem(readbackBody, "canvas", workflowId).isMissingNode()).isFalse();
        assertThat(findSlotItem(readbackBody, "creative", workflowId).isMissingNode()).isFalse();
    }

    private void promoteToRole(String userId, String roleCode) {
        jdbcTemplate.update(
                "update users set role_code = ?, updated_at = now() where id = ?",
                roleCode,
                UUID.fromString(userId)
        );
    }

    private void clearHomeFeedOpsConfig() {
        jdbcTemplate.update("delete from admin_feed_slot_configs where page_key = 'home'");
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

    private JsonNode findSlot(JsonNode body, String slotKey) {
        JsonNode slots = body.at("/data/slots");
        if (!slots.isArray()) {
            return objectMapper.getNodeFactory().missingNode();
        }

        for (JsonNode slot : slots) {
            if (slotKey.equals(slot.path("key").asText())) {
                return slot;
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

            JsonNode items = slot.path("items");
            if (!items.isArray()) {
                return objectMapper.getNodeFactory().missingNode();
            }

            for (JsonNode item : items) {
                if (targetId.equals(item.path("targetId").asText())) {
                    return item;
                }
            }
        }

        return objectMapper.getNodeFactory().missingNode();
    }
}
