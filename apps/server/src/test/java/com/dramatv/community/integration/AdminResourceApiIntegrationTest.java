package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminResourceApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void resourceListReturnsPublishedContentWithoutAuditAcrossTargetTypes() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-resource-list");
        promoteToRole(admin.userId(), "moderator");

        LoginSession author = loginAsRandomUser("admin-resource-list-owner");
        String videoId = createPublishedVideo(author.userId(), "Admin resource video");
        String workflowId = createPublishedWorkflow(author.userId(), "Admin resource workflow");
        String promptId = createPublishedPrompt(
                author.userId(),
                "Admin resource prompt",
                "image",
                "resource prompt summary",
                "resource prompt body"
        );
        String postId = createPublishedDiscussionThread(
                author.userId(),
                "admin-resource-thread-" + System.currentTimeMillis(),
                "prompt-lab",
                "Admin resource post",
                "resource post body"
        );

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/resources")
                                .param("q", "Admin resource")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/summary/totalItems").asInt()).isEqualTo(4);
        assertThat(body.at("/data/summary/publishedItems").asInt()).isEqualTo(4);
        assertThat(body.at("/data/summary/pendingItems").asInt()).isEqualTo(0);
        assertThat(body.at("/data/summary/offlineItems").asInt()).isEqualTo(0);
        assertThat(body.at("/data/summary/rejectedItems").asInt()).isEqualTo(0);
        assertThat(body.at("/data/pagination/totalItems").asInt()).isEqualTo(4);
        assertThat(findResourceItemByTargetId(body.at("/data/items"), videoId)).isNotNull();
        assertThat(findResourceItemByTargetId(body.at("/data/items"), workflowId)).isNotNull();
        assertThat(findResourceItemByTargetId(body.at("/data/items"), promptId)).isNotNull();
        assertThat(findResourceItemByTargetId(body.at("/data/items"), postId)).isNotNull();
    }

    @Test
    void resourceListSupportsPromptModalityFiltersAndReturnsRealMedia() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-resource-modality");
        promoteToRole(admin.userId(), "moderator");

        LoginSession author = loginAsRandomUser("admin-resource-modality-owner");
        String imagePromptId = createPublishedPrompt(
                author.userId(),
                "Admin resource image prompt",
                "image",
                "image resource summary",
                "image resource body"
        );
        String videoPromptId = createPublishedPrompt(
                author.userId(),
                "Admin resource video prompt",
                "video",
                "video resource summary",
                "video resource body"
        );
        String imageCoverAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "community/test/admin-resource-image-cover.png",
                "image/png"
        );
        String videoCoverAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "community/test/admin-resource-video-cover.png",
                "image/png"
        );
        String videoPreviewAssetId = createPublicMediaAsset(
                author.userId(),
                "video",
                "community/test/admin-resource-video-preview.mp4",
                "video/mp4"
        );

        jdbcTemplate.update(
                "update prompt_entries set cover_asset_id = ?, updated_at = now() where id = ?",
                UUID.fromString(imageCoverAssetId),
                UUID.fromString(imagePromptId)
        );
        jdbcTemplate.update(
                "update prompt_entries set cover_asset_id = ?, primary_example_asset_id = ?, updated_at = now() where id = ?",
                UUID.fromString(videoCoverAssetId),
                UUID.fromString(videoPreviewAssetId),
                UUID.fromString(videoPromptId)
        );

        MvcResult imageResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/resources")
                                .param("targetType", "image_prompt")
                                .param("q", "Admin resource")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode imageBody = readBody(imageResult);
        assertThat(imageBody.at("/data/summary/totalItems").asInt()).isEqualTo(1);
        assertThat(imageBody.at("/data/items").size()).isEqualTo(1);
        assertThat(imageBody.at("/data/items/0/targetType").asText()).isEqualTo("prompt");
        assertThat(imageBody.at("/data/items/0/media/coverUrl").asText()).isNotBlank();

        MvcResult videoResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/resources")
                                .param("targetType", "video_prompt")
                                .param("q", "Admin resource")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode videoBody = readBody(videoResult);
        assertThat(videoBody.at("/data/summary/totalItems").asInt()).isEqualTo(1);
        assertThat(videoBody.at("/data/items").size()).isEqualTo(1);
        assertThat(videoBody.at("/data/items/0/targetType").asText()).isEqualTo("prompt");
        assertThat(videoBody.at("/data/items/0/media/previewUrl").asText()).isNotBlank();
        assertThat(videoBody.at("/data/items/0/media/sourceUrl").asText()).isNotBlank();
    }

    @Test
    void resourceDetailReturnsBoundPromptMediaForPost() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-resource-detail");
        promoteToRole(admin.userId(), "moderator");

        LoginSession author = loginAsRandomUser("admin-resource-detail-owner");
        String promptId = createPublishedPrompt(
                author.userId(),
                "Admin resource bound prompt",
                "video",
                "bound prompt summary",
                "bound prompt body"
        );
        String postId = createPublishedDiscussionThread(
                author.userId(),
                "admin-resource-bound-thread-" + System.currentTimeMillis(),
                "official-events",
                "Admin resource bound post",
                "bound post body"
        );
        String promptCoverAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "community/test/admin-resource-bound-cover.png",
                "image/png"
        );
        String promptPreviewAssetId = createPublicMediaAsset(
                author.userId(),
                "video",
                "community/test/admin-resource-bound-preview.mp4",
                "video/mp4"
        );

        jdbcTemplate.update(
                "update prompt_entries set cover_asset_id = ?, primary_example_asset_id = ?, updated_at = now() where id = ?",
                UUID.fromString(promptCoverAssetId),
                UUID.fromString(promptPreviewAssetId),
                UUID.fromString(promptId)
        );
        jdbcTemplate.update(
                "update discussion_threads set binding_target_type = 'prompt', binding_target_id = ?, updated_at = now() where id = ?",
                UUID.fromString(promptId),
                UUID.fromString(postId)
        );

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/resources/post/{targetId}", postId)
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.at("/data/targetType").asText()).isEqualTo("post");
        assertThat(body.at("/data/bindingTargetType").asText()).isEqualTo("prompt");
        assertThat(body.at("/data/bindingTargetId").asText()).isEqualTo(promptId);
        assertThat(body.at("/data/media/coverUrl").asText()).isNotBlank();
        assertThat(body.at("/data/media/previewUrl").asText()).isNotBlank();
        assertThat(body.at("/data/media/sourceUrl").asText()).isNotBlank();
    }

    @Test
    void resourceDetailPrefersPromptRawTextOverSummary() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-resource-raw-text");
        promoteToRole(admin.userId(), "moderator");

        LoginSession author = loginAsRandomUser("admin-resource-raw-text-owner");
        String promptId = createPublishedPrompt(
                author.userId(),
                "Admin resource raw prompt",
                "video",
                "raw prompt summary",
                "display prompt text"
        );

        jdbcTemplate.update(
                "update prompt_entries set prompt_text = ?, prompt_text_raw = ?, updated_at = now() where id = ?",
                "display prompt text",
                "full raw prompt body with more lines and more detail",
                UUID.fromString(promptId)
        );

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/resources/prompt/{targetId}", promptId)
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.at("/data/summaryText").asText()).isEqualTo("raw prompt summary");
        assertThat(body.at("/data/contentText").asText()).isEqualTo("full raw prompt body with more lines and more detail");
    }

    @Test
    void resourceGovernanceReflectsOfflineAndRestoreFlowAndPublicVisibility() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-resource-governance");
        promoteToRole(admin.userId(), "admin");

        LoginSession author = loginAsRandomUser("admin-resource-governance-owner");
        LoginSession viewer = loginAsRandomUser("admin-resource-governance-viewer");
        String promptId = createPublishedPrompt(
                author.userId(),
                "Admin resource governed prompt",
                "image",
                "governed prompt summary",
                "governed prompt body"
        );

        MvcResult initialDetailResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/resources/prompt/{targetId}", promptId)
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode initialDetailBody = readBody(initialDetailResult);
        assertThat(initialDetailBody.at("/data/governanceStatusCode").asText()).isEqualTo("published");

        assertPromptVisibleInPublicList(promptId);
        assertPromptDetailAvailable(promptId, viewer.accessToken());

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/moderation/items/prompt/{targetId}/offline", promptId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"offline for admin resource governance"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk());

        MvcResult offlineListResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/resources")
                                .param("targetType", "image_prompt")
                                .param("status", "taken_down")
                                .param("q", "Admin resource governed")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode offlineListBody = readBody(offlineListResult);
        assertThat(offlineListBody.at("/data/summary/offlineItems").asInt()).isEqualTo(1);
        assertThat(findResourceItemByTargetId(offlineListBody.at("/data/items"), promptId)).isNotNull();

        MvcResult offlineDetailResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/resources/prompt/{targetId}", promptId)
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode offlineDetailBody = readBody(offlineDetailResult);
        assertThat(offlineDetailBody.at("/data/governanceStatusCode").asText()).isEqualTo("taken_down");
        assertThat(offlineDetailBody.at("/data/latestAuditStatusCode").asText()).isEqualTo("taken_down");

        assertPromptHiddenFromPublicList(promptId);
        assertPromptDetailMissing(promptId);

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/moderation/items/prompt/{targetId}/restore", promptId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"restore for admin resource governance"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk());

        MvcResult restoreDetailResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/resources/prompt/{targetId}", promptId)
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode restoreDetailBody = readBody(restoreDetailResult);
        assertThat(restoreDetailBody.at("/data/governanceStatusCode").asText()).isEqualTo("published");
        assertThat(restoreDetailBody.at("/data/latestAuditStatusCode").asText()).isEqualTo("approved");

        assertPromptVisibleInPublicList(promptId);
        assertPromptDetailAvailable(promptId, viewer.accessToken());
    }

    private JsonNode findResourceItemByTargetId(JsonNode items, String targetId) {
        for (JsonNode item : items) {
            if (targetId.equals(item.path("targetId").asText())) {
                return item;
            }
        }
        return null;
    }

    private void promoteToRole(String userId, String roleCode) {
        jdbcTemplate.update(
                "update users set role_code = ?, updated_at = now() where id = ?",
                roleCode,
                UUID.fromString(userId)
        );
    }

    private void assertPromptVisibleInPublicList(String promptId) throws Exception {
        MvcResult listResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/prompts")
                        .param("modality", "image")
                        .param("sort", "latest")
                        .param("limit", "500")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(listResult);
        assertThat(findPromptItemById(body.at("/data"), promptId)).isNotNull();
    }

    private void assertPromptHiddenFromPublicList(String promptId) throws Exception {
        MvcResult listResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/prompts")
                        .param("modality", "image")
                        .param("sort", "latest")
                        .param("limit", "500")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(listResult);
        assertThat(findPromptItemById(body.at("/data"), promptId)).isNull();
    }

    private void assertPromptDetailAvailable(String promptId, String accessToken) throws Exception {
        MvcResult detailResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/prompts/{id}", promptId)
                                .accept(MediaType.APPLICATION_JSON),
                        accessToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(detailResult);
        assertThat(body.at("/data/id").asText()).isEqualTo(promptId);
    }

    private void assertPromptDetailMissing(String promptId) throws Exception {
        MvcResult detailResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/prompts/{id}", promptId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode body = readBody(detailResult);
        assertThat(body.path("code").asText()).isEqualTo("PROMPT_NOT_FOUND");
    }

    private JsonNode findPromptItemById(JsonNode items, String id) {
        for (JsonNode item : items) {
            if (id.equals(item.path("id").asText())) {
                return item;
            }
        }
        return null;
    }
}
