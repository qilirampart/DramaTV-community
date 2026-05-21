package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminModerationApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void moderationListReturnsPendingPublishedContentAcrossTargetTypes() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-moderation-list");
        promoteToRole(admin.userId(), "moderator");

        LoginSession author = loginAsRandomUser("admin-moderation-author");
        String videoId = createPublishedVideo(author.userId(), "Admin moderation video");
        String workflowId = createPublishedWorkflow(author.userId(), "Admin moderation workflow");
        String promptId = createPublishedPrompt(author.userId(), "Admin moderation prompt", "video", "summary", "prompt text");
        String postId = createPublishedDiscussionThread(
                author.userId(),
                "admin-moderation-thread-" + System.currentTimeMillis(),
                "video-production",
                "Admin moderation post",
                "discussion content"
        );

        insertAuditRecord("video", videoId, author.userId(), "pending_review", "high");
        insertAuditRecord("workflow", workflowId, author.userId(), "approved", "low");
        insertAuditRecord("prompt", promptId, author.userId(), "taken_down", "high");
        insertAuditRecord("post", postId, author.userId(), "pending_review", "medium");

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/moderation/items")
                                .param("q", "Admin moderation")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/summary/pendingItems").asInt()).isEqualTo(2);
        assertThat(body.at("/data/summary/highRiskItems").asInt()).isEqualTo(2);
        assertThat(body.at("/data/summary/offlineItems").asInt()).isEqualTo(1);
        assertThat(body.at("/data/items").size()).isEqualTo(4);
        assertThat(body.at("/data/items/0/targetType").asText()).isIn("video", "post");
    }

    @Test
    void moderationListSupportsPromptModalityFilters() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-moderation-modality-filter");
        promoteToRole(admin.userId(), "moderator");

        LoginSession author = loginAsRandomUser("admin-moderation-modality-owner");
        String imagePromptId = createPublishedPrompt(
                author.userId(),
                "Admin moderation image prompt",
                "image",
                "image moderation summary",
                "image prompt text"
        );
        String videoPromptId = createPublishedPrompt(
                author.userId(),
                "Admin moderation video prompt",
                "video",
                "video moderation summary",
                "video prompt text"
        );

        insertAuditRecord("prompt", imagePromptId, author.userId(), "pending_review", "medium");
        insertAuditRecord("prompt", videoPromptId, author.userId(), "pending_review", "medium");

        MvcResult imageResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/moderation/items")
                                .param("targetType", "image_prompt")
                                .param("q", "Admin moderation")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode imageBody = readBody(imageResult);
        assertThat(imageBody.at("/data/items").size()).isEqualTo(1);
        assertThat(imageBody.at("/data/items/0/targetType").asText()).isEqualTo("prompt");
        assertThat(imageBody.at("/data/items/0/modelTags/0").asText()).isEqualTo("图片提示词");
        assertThat(imageBody.at("/data/items/0/media/coverUrl").asText()).isNotBlank();

        MvcResult videoResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/moderation/items")
                                .param("targetType", "video_prompt")
                                .param("q", "Admin moderation")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode videoBody = readBody(videoResult);
        assertThat(videoBody.at("/data/items").size()).isEqualTo(1);
        assertThat(videoBody.at("/data/items/0/targetType").asText()).isEqualTo("prompt");
        assertThat(videoBody.at("/data/items/0/modelTags/0").asText()).isEqualTo("视频提示词");
        assertThat(videoBody.at("/data/items/0/media/coverUrl").asText()).isNotBlank();
    }

    @Test
    void moderationDetailExposesRealMediaAssetsForVideoAndPrompt() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-moderation-media-detail");
        promoteToRole(admin.userId(), "moderator");

        LoginSession author = loginAsRandomUser("admin-moderation-media-owner");
        String videoId = createPublishedVideo(author.userId(), "Admin moderation media video");
        String promptId = createPublishedPrompt(
                author.userId(),
                "Admin moderation media prompt",
                "image",
                "media detail summary",
                "media prompt text"
        );
        String promptExampleAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "community/test/admin-moderation-prompt-example.png",
                "image/png"
        );
        jdbcTemplate.update("""
                        insert into prompt_example_links (
                            id, prompt_id, media_asset_id, role_code, sort_order, created_at
                        )
                        values (?, ?, ?, 'example', 0, now())
                        """,
                UUID.randomUUID(),
                UUID.fromString(promptId),
                UUID.fromString(promptExampleAssetId)
        );

        insertAuditRecord("video", videoId, author.userId(), "pending_review", "high");
        insertAuditRecord("prompt", promptId, author.userId(), "pending_review", "medium");

        MvcResult videoResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/moderation/items/video/{targetId}", videoId)
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode videoBody = readBody(videoResult);
        assertThat(videoBody.at("/data/media/coverUrl").asText()).isNotBlank();
        assertThat(videoBody.at("/data/media/posterUrl").asText()).isNotBlank();
        assertThat(videoBody.at("/data/media/previewUrl").asText()).isNotBlank();
        assertThat(videoBody.at("/data/media/sourceUrl").asText()).isNotBlank();

        MvcResult promptResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/moderation/items/prompt/{targetId}", promptId)
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode promptBody = readBody(promptResult);
        assertThat(promptBody.at("/data/media/coverUrl").asText()).isNotBlank();
        assertThat(promptBody.at("/data/media/posterUrl").asText()).isNotBlank();
        assertThat(promptBody.at("/data/media/sourceUrl").asText()).isNotBlank();
    }

    @Test
    void moderationActionsUpdatePublishAndAuditStates() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-moderation-actions");
        promoteToRole(admin.userId(), "admin");

        LoginSession author = loginAsRandomUser("admin-moderation-owner");
        String videoId = createPublishedVideo(author.userId(), "Admin moderation action video");
        insertAuditRecord("video", videoId, author.userId(), "pending_review", "high");

        MvcResult approveResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/moderation/items/video/{targetId}/approve", videoId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"approve by integration"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode approveBody = readBody(approveResult);
        assertThat(approveBody.at("/data/statusCode").asText()).isEqualTo("approved");
        assertThat(videoPublishStatus(videoId)).isEqualTo("published");
        assertThat(latestAuditStatus("video", videoId)).isEqualTo("approved");
        assertThat(latestAuditDetail(videoId).path("adminDecisionAt").asText()).isNotBlank();
        assertThat(latestAuditDetail(videoId).path("adminDecisionStatus").asText()).isEqualTo("approved");

        MvcResult offlineResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/moderation/items/video/{targetId}/offline", videoId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"offline by integration"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode offlineBody = readBody(offlineResult);
        assertThat(offlineBody.at("/data/statusCode").asText()).isEqualTo("taken_down");
        assertThat(videoPublishStatus(videoId)).isEqualTo("taken_down");
        assertThat(latestAuditStatus("video", videoId)).isEqualTo("taken_down");

        MvcResult restoreResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/moderation/items/video/{targetId}/restore", videoId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"restore by integration"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode restoreBody = readBody(restoreResult);
        assertThat(restoreBody.at("/data/statusCode").asText()).isEqualTo("approved");
        assertThat(videoPublishStatus(videoId)).isEqualTo("published");
        assertThat(latestAuditStatus("video", videoId)).isEqualTo("approved");

        MvcResult rejectResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/moderation/items/video/{targetId}/reject", videoId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"reject by integration"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode rejectBody = readBody(rejectResult);
        assertThat(rejectBody.at("/data/statusCode").asText()).isEqualTo("rejected");
        assertThat(videoPublishStatus(videoId)).isEqualTo("rejected");
        assertThat(latestAuditStatus("video", videoId)).isEqualTo("rejected");
    }

    @Test
    void moderationSummaryUsesLatestAdminDecisionTimeForProcessedToday() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-moderation-summary");
        promoteToRole(admin.userId(), "admin");

        LoginSession author = loginAsRandomUser("admin-moderation-summary-owner");
        String videoId = createPublishedVideo(author.userId(), "Admin moderation summary video");
        insertAuditRecordDaysAgo("video", videoId, author.userId(), "pending_review", "low", 7);

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/moderation/items/video/{targetId}/approve", videoId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"approve for processed today summary"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk());

        MvcResult listResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/moderation/items")
                                .param("q", "Admin moderation summary")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(listResult);
        assertThat(body.at("/data/summary/processedToday").asInt()).isEqualTo(1);
    }

    @Test
    void moderationActionsChangePublicPromptVisibilityAcrossListAndDetail() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-moderation-public");
        promoteToRole(admin.userId(), "admin");

        LoginSession author = loginAsRandomUser("admin-moderation-public-owner");
        LoginSession viewer = loginAsRandomUser("admin-moderation-public-viewer");
        String promptId = createPublishedPrompt(
                author.userId(),
                "Admin moderation public prompt",
                "image",
                "Prompt should appear and disappear from public surfaces",
                "prompt visibility chain"
        );
        insertAuditRecord("prompt", promptId, author.userId(), "pending_review", "high");

        assertPromptVisibleInPublicList(promptId);
        assertPromptDetailAvailable(promptId, viewer.accessToken());

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/moderation/items/prompt/{targetId}/reject", promptId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"reject for public visibility regression"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk());
        assertThat(promptPublishStatus(promptId)).isEqualTo("rejected");
        assertPromptHiddenFromPublicList(promptId);
        assertPromptDetailMissing(promptId);

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/moderation/items/prompt/{targetId}/approve", promptId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"approve for public visibility regression"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk());
        assertThat(promptPublishStatus(promptId)).isEqualTo("published");
        assertPromptVisibleInPublicList(promptId);
        assertPromptDetailAvailable(promptId, viewer.accessToken());

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/moderation/items/prompt/{targetId}/offline", promptId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"offline for public visibility regression"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk());
        assertThat(promptPublishStatus(promptId)).isEqualTo("taken_down");
        assertPromptHiddenFromPublicList(promptId);
        assertPromptDetailMissing(promptId);

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/moderation/items/prompt/{targetId}/restore", promptId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"restore for public visibility regression"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk());
        assertThat(promptPublishStatus(promptId)).isEqualTo("published");
        assertPromptVisibleInPublicList(promptId);
        assertPromptDetailAvailable(promptId, viewer.accessToken());
    }

    @Test
    void moderationActionsChangePublicWorkflowAndPostVisibilityAcrossDetails() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-moderation-shared-public");
        promoteToRole(admin.userId(), "admin");

        LoginSession author = loginAsRandomUser("admin-moderation-shared-owner");
        String workflowId = createPublishedWorkflow(
                author.userId(),
                "Admin moderation public workflow",
                "Workflow should appear and disappear from public detail",
                "workflow moderation visibility chain"
        );
        String postSlug = "admin-moderation-public-thread-" + System.currentTimeMillis();
        String postId = createPublishedDiscussionThread(
                author.userId(),
                postSlug,
                "prompt-lab",
                "Admin moderation public discussion",
                "discussion visibility chain"
        );
        insertAuditRecord("workflow", workflowId, author.userId(), "pending_review", "medium");
        insertAuditRecord("post", postId, author.userId(), "pending_review", "medium");

        assertWorkflowDetailAvailable(workflowId);
        assertDiscussionThreadDetailAvailable(postSlug, postId);

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/moderation/items/workflow/{targetId}/offline", workflowId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"offline workflow for public visibility regression"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk());
        assertThat(workflowPublishStatus(workflowId)).isEqualTo("taken_down");
        assertThat(latestAuditStatus("workflow", workflowId)).isEqualTo("taken_down");
        assertWorkflowDetailMissing(workflowId);

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/moderation/items/workflow/{targetId}/restore", workflowId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"restore workflow for public visibility regression"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk());
        assertThat(workflowPublishStatus(workflowId)).isEqualTo("published");
        assertThat(latestAuditStatus("workflow", workflowId)).isEqualTo("approved");
        assertWorkflowDetailAvailable(workflowId);

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/moderation/items/post/{targetId}/reject", postId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"reject post for public visibility regression"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk());
        assertThat(postPublishStatus(postId)).isEqualTo("rejected");
        assertThat(latestAuditStatus("post", postId)).isEqualTo("rejected");
        assertDiscussionThreadDetailMissing(postSlug);

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/moderation/items/post/{targetId}/approve", postId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"approve post for public visibility regression"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk());
        assertThat(postPublishStatus(postId)).isEqualTo("published");
        assertThat(latestAuditStatus("post", postId)).isEqualTo("approved");
        assertDiscussionThreadDetailAvailable(postSlug, postId);
    }

    private void promoteToRole(String userId, String roleCode) {
        jdbcTemplate.update(
                "update users set role_code = ?, updated_at = now() where id = ?",
                roleCode,
                UUID.fromString(userId)
        );
    }

    private void insertAuditRecord(String targetType, String targetId, String operatorId, String statusCode, String riskLevel) {
        jdbcTemplate.update("""
                insert into audit_records (
                    id, target_type, target_id, audit_type, status_code, risk_level,
                    operator_type, operator_id, detail_json, created_at
                )
                values (?, ?, ?, 'publish_review', ?, ?, 'creator', ?, '{}'::jsonb, now())
                """,
                UUID.randomUUID(),
                targetType,
                UUID.fromString(targetId),
                statusCode,
                riskLevel,
                UUID.fromString(operatorId)
        );
    }

    private void insertAuditRecordDaysAgo(
            String targetType,
            String targetId,
            String operatorId,
            String statusCode,
            String riskLevel,
            int daysAgo
    ) {
        jdbcTemplate.update("""
                insert into audit_records (
                    id, target_type, target_id, audit_type, status_code, risk_level,
                    operator_type, operator_id, detail_json, created_at
                )
                values (?, ?, ?, 'publish_review', ?, ?, 'creator', ?, '{}'::jsonb, now() - (? * interval '1 day'))
                """,
                UUID.randomUUID(),
                targetType,
                UUID.fromString(targetId),
                statusCode,
                riskLevel,
                UUID.fromString(operatorId),
                daysAgo
        );
    }

    private String videoPublishStatus(String videoId) {
        return jdbcTemplate.query(
                "select publish_status from videos where id = ?",
                resultSet -> resultSet.next() ? resultSet.getString("publish_status") : null,
                UUID.fromString(videoId)
        );
    }

    private String promptPublishStatus(String promptId) {
        return jdbcTemplate.query(
                "select publish_status from prompt_entries where id = ?",
                resultSet -> resultSet.next() ? resultSet.getString("publish_status") : null,
                UUID.fromString(promptId)
        );
    }

    private String workflowPublishStatus(String workflowId) {
        return jdbcTemplate.query(
                "select publish_status from workflows where id = ?",
                resultSet -> resultSet.next() ? resultSet.getString("publish_status") : null,
                UUID.fromString(workflowId)
        );
    }

    private String postPublishStatus(String postId) {
        return jdbcTemplate.query(
                "select publish_status from discussion_threads where id = ?",
                resultSet -> resultSet.next() ? resultSet.getString("publish_status") : null,
                UUID.fromString(postId)
        );
    }

    private String latestAuditStatus(String targetType, String targetId) {
        return jdbcTemplate.query("""
                select status_code
                from audit_records
                where audit_type = 'publish_review'
                  and target_type = ?
                  and target_id = ?
                order by created_at desc
                limit 1
                """,
                resultSet -> resultSet.next() ? resultSet.getString("status_code") : null,
                targetType,
                UUID.fromString(targetId)
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
        assertThat(findItemById(body.at("/data"), promptId)).isNotNull();
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
        assertThat(findItemById(body.at("/data"), promptId)).isNull();
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

    private void assertWorkflowDetailAvailable(String workflowId) throws Exception {
        MvcResult detailResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/workflows/{id}", workflowId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(detailResult);
        assertThat(body.at("/data/id").asText()).isEqualTo(workflowId);
    }

    private void assertWorkflowDetailMissing(String workflowId) throws Exception {
        MvcResult detailResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/workflows/{id}", workflowId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode body = readBody(detailResult);
        assertThat(body.path("code").asText()).isEqualTo("WORKFLOW_NOT_FOUND");
    }

    private void assertDiscussionThreadDetailAvailable(String slug, String postId) throws Exception {
        MvcResult detailResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/discussions/threads/{slug}", slug)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(detailResult);
        assertThat(body.at("/data/id").asText()).isEqualTo(postId);
        assertThat(body.at("/data/slug").asText()).isEqualTo(slug);
    }

    private void assertDiscussionThreadDetailMissing(String slug) throws Exception {
        MvcResult detailResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/discussions/threads/{slug}", slug)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode body = readBody(detailResult);
        assertThat(body.path("code").asText()).isEqualTo("DISCUSSION_THREAD_NOT_FOUND");
    }

    private JsonNode findItemById(JsonNode items, String id) {
        for (JsonNode item : items) {
            if (id.equals(item.path("id").asText())) {
                return item;
            }
        }
        return null;
    }

    private JsonNode latestAuditDetail(String targetId) throws Exception {
        String raw = jdbcTemplate.query("""
                select detail_json::text
                from audit_records
                where audit_type = 'publish_review'
                  and target_type = 'video'
                  and target_id = ?
                order by created_at desc
                limit 1
                """,
                resultSet -> resultSet.next() ? resultSet.getString(1) : "{}",
                UUID.fromString(targetId)
        );
        return objectMapper.readTree(raw == null || raw.isBlank() ? "{}" : raw);
    }
}
