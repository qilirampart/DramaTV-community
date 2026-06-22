package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminFeedOpsLandingApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void landingFeedOpsReadsAndPersistsRealSlotConfig() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-feedops-landing");
        promoteToRole(admin.userId(), "operator");
        clearLandingFeedOpsConfig();

        LoginSession author = loginAsRandomUser("admin-feedops-landing-author");
        String videoPromptId = createPublishedPrompt(
                author.userId(),
                "Landing video prompt",
                "video",
                "Landing video prompt summary",
                "Landing video prompt body"
        );
        String imagePromptId = createPublishedPrompt(
                author.userId(),
                "Landing image prompt",
                "image",
                "Landing image prompt summary",
                "Landing image prompt body"
        );
        String workflowId = createPublishedWorkflow(
                author.userId(),
                "Landing workflow",
                "Landing workflow summary",
                "Landing workflow scenario"
        );
        String discussionId = createPublishedDiscussionThread(
                author.userId(),
                "feedops-landing-thread-" + UUID.randomUUID(),
                "official-events",
                "Landing discussion thread",
                "Landing discussion body content."
        );

        String videoCoverAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "media/feed-ops/landing-video-cover.jpg",
                "image/jpeg"
        );
        String videoPreviewAssetId = createPublicMediaAsset(
                author.userId(),
                "video",
                "media/feed-ops/landing-video-preview.mp4",
                "video/mp4"
        );
        String imageCoverAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "media/feed-ops/landing-image-cover.jpg",
                "image/jpeg"
        );
        String workflowCoverAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "media/feed-ops/landing-workflow-cover.jpg",
                "image/jpeg"
        );

        jdbcTemplate.update(
                "update prompt_entries set cover_asset_id = ?, primary_example_asset_id = ?, updated_at = now() where id = ?",
                UUID.fromString(videoCoverAssetId),
                UUID.fromString(videoPreviewAssetId),
                UUID.fromString(videoPromptId)
        );
        jdbcTemplate.update(
                "update prompt_entries set cover_asset_id = ?, updated_at = now() where id = ?",
                UUID.fromString(imageCoverAssetId),
                UUID.fromString(imagePromptId)
        );
        jdbcTemplate.update(
                "update workflows set cover_asset_id = ?, updated_at = now() where id = ?",
                UUID.fromString(workflowCoverAssetId),
                UUID.fromString(workflowId)
        );

        MvcResult initialResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/feed-ops/landing")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode initialBody = readBody(initialResult);
        assertThat(initialBody.path("code").asText()).isEqualTo("OK");
        assertThat(initialBody.at("/data/summary/statusCode").asText()).isEqualTo("draft");
        assertThat(initialBody.at("/data/slots").size()).isEqualTo(1);
        assertThat(findSlot(initialBody, "landing-archive-grid").path("items").size()).isEqualTo(0);
        assertThat(findSlot(initialBody, "landing-archive-grid").path("fallbackItems").isArray()).isTrue();
        assertThat(findSlot(initialBody, "landing-archive-grid").path("fallbackItems").size()).isGreaterThan(0);

        MvcResult candidateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/feed-ops/landing/candidates")
                                .param("slotKey", "landing-archive-grid")
                                .param("page", "1")
                                .param("pageSize", "20")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode candidateBody = readBody(candidateResult);
        JsonNode videoPromptCandidate = findCandidate(candidateBody.at("/data/items"), videoPromptId);
        JsonNode imagePromptCandidate = findCandidate(candidateBody.at("/data/items"), imagePromptId);
        JsonNode workflowCandidate = findCandidate(candidateBody.at("/data/items"), workflowId);
        assertThat(candidateBody.path("code").asText()).isEqualTo("OK");
        assertThat(candidateBody.at("/data/summary/pageKey").asText()).isEqualTo("landing");
        assertThat(candidateBody.at("/data/summary/slotKey").asText()).isEqualTo("landing-archive-grid");
        assertThat(videoPromptCandidate.isMissingNode()).isFalse();
        assertThat(imagePromptCandidate.isMissingNode()).isFalse();
        assertThat(workflowCandidate.isMissingNode()).isFalse();
        assertThat(findCandidate(candidateBody.at("/data/items"), discussionId).isMissingNode()).isTrue();
        assertThat(videoPromptCandidate.at("/previewUrl").asText()).startsWith("/media/");
        assertThat(videoPromptCandidate.at("/sourceUrl").asText()).startsWith("/media/");
        assertThat(imagePromptCandidate.at("/coverUrl").asText()).startsWith("/media/");
        assertThat(workflowCandidate.at("/coverUrl").asText()).startsWith("/media/");

        MvcResult updateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/admin/feed-ops/landing")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "statusCode", "published",
                                        "slots", List.of(
                                                Map.of(
                                                        "slotKey", "landing-archive-grid",
                                                        "items", List.of(
                                                                Map.of("targetType", "prompt", "targetId", videoPromptId),
                                                                Map.of("targetType", "workflow", "targetId", workflowId),
                                                                Map.of("targetType", "prompt", "targetId", imagePromptId)
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
        assertThat(updateBody.at("/data/summary/configuredItemCount").asInt()).isEqualTo(3);
        assertThat(updateBody.at("/data/summary/publishedAt").asText()).isNotBlank();
        assertThat(findSlotItem(updateBody, "landing-archive-grid", videoPromptId).isMissingNode()).isFalse();
        assertThat(findSlotItem(updateBody, "landing-archive-grid", workflowId).isMissingNode()).isFalse();
        assertThat(findSlotItem(updateBody, "landing-archive-grid", imagePromptId).isMissingNode()).isFalse();

        MvcResult readbackResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/feed-ops/landing")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode readbackBody = readBody(readbackResult);
        assertThat(readbackBody.at("/data/summary/statusCode").asText()).isEqualTo("published");
        assertThat(findSlotItem(readbackBody, "landing-archive-grid", videoPromptId).isMissingNode()).isFalse();
        assertThat(findSlotItem(readbackBody, "landing-archive-grid", workflowId).isMissingNode()).isFalse();
        assertThat(findSlotItem(readbackBody, "landing-archive-grid", imagePromptId).isMissingNode()).isFalse();
    }

    private void promoteToRole(String userId, String roleCode) {
        jdbcTemplate.update(
                "update users set role_code = ?, updated_at = now() where id = ?",
                roleCode,
                UUID.fromString(userId)
        );
    }

    private void clearLandingFeedOpsConfig() {
        jdbcTemplate.update("delete from admin_feed_slot_configs where page_key = 'landing'");
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
