package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.test.web.servlet.MvcResult;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class DraftApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void postDraftCrudRoundTripWorks() throws Exception {
        LoginSession session = loginAsRandomUser("post-draft");

        MvcResult createResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/post-drafts")
                                .accept(MediaType.APPLICATION_JSON),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode createBody = readBody(createResult);
        String draftId = createBody.at("/data/draftId").asText();
        assertThat(draftId).isNotBlank();
        assertThat(createBody.at("/data/statusCode").asText()).isEqualTo("draft");
        assertThat(createBody.at("/data/lifecycle/draftStatus").asText()).isEqualTo("draft");
        assertThat(createBody.at("/data/lifecycle/moderationStatus").asText()).isEqualTo("not_applicable");
        assertThat(createBody.at("/data/lifecycle/processingStatus").asText()).isEqualTo("not_applicable");
        assertThat(createBody.at("/data/lifecycle/editable").asBoolean()).isTrue();

        MvcResult updateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/post-drafts/{id}", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new PostDraftPayload(
                                        "Integration post draft",
                                        "video-production",
                                        "Draft content for integration test",
                                        List.of("integration", "post"),
                                        "workflow",
                                        null
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode updateBody = readBody(updateResult);
        assertThat(updateBody.at("/data/title").asText()).isEqualTo("Integration post draft");
        assertThat(updateBody.at("/data/channelSlug").asText()).isEqualTo("video-production");

        MvcResult getResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/post-drafts/{id}", draftId),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode getBody = readBody(getResult);
        assertThat(getBody.at("/data/content").asText()).contains("integration test");

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.delete("/api/post-drafts/{id}", draftId),
                        session.accessToken()))
                .andExpect(status().isOk());

        MvcResult deletedResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/post-drafts/{id}", draftId),
                        session.accessToken()))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode deletedBody = readBody(deletedResult);
        assertThat(deletedBody.path("code").asText()).isEqualTo("POST_DRAFT_NOT_FOUND");
    }

    @Test
    void videoDraftCrudRoundTripWorks() throws Exception {
        LoginSession session = loginAsRandomUser("video-draft");

        MvcResult createResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/video-drafts")
                                .accept(MediaType.APPLICATION_JSON),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode createBody = readBody(createResult);
        String draftId = createBody.at("/data/draftId").asText();
        assertThat(draftId).isNotBlank();
        assertThat(createBody.at("/data/statusCode").asText()).isEqualTo("draft");
        assertThat(createBody.at("/data/lifecycle/draftStatus").asText()).isEqualTo("draft");
        assertThat(createBody.at("/data/lifecycle/moderationStatus").asText()).isEqualTo("not_submitted");
        assertThat(createBody.at("/data/lifecycle/processingStatus").asText()).isEqualTo("not_submitted");
        assertThat(createBody.at("/data/lifecycle/editable").asBoolean()).isTrue();

        MvcResult updateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/video-drafts/{id}", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new VideoDraftPayload(
                                        "Integration video draft",
                                        "Video draft summary",
                                        "video_prompt",
                                        "seedance",
                                        "real-person",
                                        "single-model",
                                        List.of("integration", "video"),
                                        null,
                                        "public",
                                        null,
                                        null
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode updateBody = readBody(updateResult);
        assertThat(updateBody.at("/data/title").asText()).isEqualTo("Integration video draft");
        assertThat(updateBody.at("/data/categoryCode").asText()).isEqualTo("video_prompt");
        assertThat(updateBody.at("/data/modelCategory").asText()).isEqualTo("seedance");
        assertThat(updateBody.at("/data/contentCategory").asText()).isEqualTo("real-person");
        assertThat(updateBody.at("/data/compositionCategory").asText()).isEqualTo("single-model");

        MvcResult getResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/video-drafts/{id}", draftId),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode getBody = readBody(getResult);
        assertThat(getBody.at("/data/summary").asText()).isEqualTo("Video draft summary");
        assertThat(getBody.at("/data/modelCategory").asText()).isEqualTo("seedance");
        assertThat(getBody.at("/data/contentCategory").asText()).isEqualTo("real-person");
        assertThat(getBody.at("/data/compositionCategory").asText()).isEqualTo("single-model");

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.delete("/api/video-drafts/{id}", draftId),
                        session.accessToken()))
                .andExpect(status().isOk());

        MvcResult deletedResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/video-drafts/{id}", draftId),
                        session.accessToken()))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode deletedBody = readBody(deletedResult);
        assertThat(deletedBody.path("code").asText()).isEqualTo("VIDEO_DRAFT_NOT_FOUND");
    }

    @Test
    void workflowDraftCrudRoundTripWorks() throws Exception {
        LoginSession session = loginAsRandomUser("workflow-draft");

        MvcResult createResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/workflow-drafts")
                                .accept(MediaType.APPLICATION_JSON),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode createBody = readBody(createResult);
        String draftId = createBody.at("/data/draftId").asText();
        assertThat(draftId).isNotBlank();
        assertThat(createBody.at("/data/statusCode").asText()).isEqualTo("draft");
        assertThat(createBody.at("/data/lifecycle/draftStatus").asText()).isEqualTo("draft");
        assertThat(createBody.at("/data/lifecycle/moderationStatus").asText()).isEqualTo("not_submitted");
        assertThat(createBody.at("/data/lifecycle/processingStatus").asText()).isEqualTo("not_applicable");
        assertThat(createBody.at("/data/lifecycle/editable").asBoolean()).isTrue();

        MvcResult updateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/workflow-drafts/{id}", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new WorkflowDraftPayload(
                                        "Integration workflow draft",
                                        "Workflow summary",
                                        "Reusable workflow scenario",
                                        List.of("integration", "workflow"),
                                        true,
                                        true,
                                        "public",
                                        null
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode updateBody = readBody(updateResult);
        assertThat(updateBody.at("/data/title").asText()).isEqualTo("Integration workflow draft");
        assertThat(updateBody.at("/data/allowCopy").asBoolean()).isTrue();
        assertThat(updateBody.at("/data/allowFork").asBoolean()).isTrue();

        MvcResult getResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/workflow-drafts/{id}", draftId),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode getBody = readBody(getResult);
        assertThat(getBody.at("/data/scenarioText").asText()).contains("Reusable workflow scenario");

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.delete("/api/workflow-drafts/{id}", draftId),
                        session.accessToken()))
                .andExpect(status().isOk());

        MvcResult deletedResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/workflow-drafts/{id}", draftId),
                        session.accessToken()))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode deletedBody = readBody(deletedResult);
        assertThat(deletedBody.path("code").asText()).isEqualTo("WORKFLOW_DRAFT_NOT_FOUND");
    }

    @Test
    void submittedVideoDraftCanNotBeEditedOrSubmittedAgain() throws Exception {
        LoginSession session = loginAsRandomUser("video-draft-submit-lock");
        UploadedAsset sourceAsset = uploadAsset(
                session,
                "/api/uploads/video-policy",
                "video-draft-submit-lock.mp4",
                "video/mp4",
                "source",
                "fake-video-source".getBytes()
        );

        MvcResult createResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/video-drafts")
                                .accept(MediaType.APPLICATION_JSON),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        String draftId = readBody(createResult).at("/data/draftId").asText();
        assertThat(draftId).isNotBlank();

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/video-drafts/{id}", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new FullVideoDraftPayload(
                                        "Submitted integration video draft",
                                        "Video draft summary",
                                        "workflow",
                                        "Prompt text",
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        List.of("integration", "lock"),
                                        null,
                                        "public",
                                        null,
                                        sourceAsset.assetId()
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk());

        MvcResult submitResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/video-drafts/{id}/submit", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new SubmitDraftPayload("creator_submit"))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode submitBody = readBody(submitResult);
        assertThat(submitBody.at("/data/draftStatus").asText()).isEqualTo("submitted");
        assertThat(submitBody.at("/data/contentStatus").asText()).isEqualTo("published");
        assertThat(submitBody.at("/data/publishStatus").asText()).isEqualTo("submitted");
        assertThat(submitBody.at("/data/lifecycle/draftStatus").asText()).isEqualTo("submitted");
        assertThat(submitBody.at("/data/lifecycle/editable").asBoolean()).isFalse();

        MvcResult resubmitResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/video-drafts/{id}/submit", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new SubmitDraftPayload("creator_submit"))),
                        session.accessToken()))
                .andExpect(status().isConflict())
                .andReturn();

        JsonNode resubmitBody = readBody(resubmitResult);
        assertThat(resubmitBody.path("code").asText()).isEqualTo("VIDEO_DRAFT_ALREADY_SUBMITTED");

        MvcResult updateSubmittedResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/video-drafts/{id}", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new FullVideoDraftPayload(
                                        "Should not update",
                                        "Should not update",
                                        "workflow",
                                        "Should not update",
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        List.of("integration"),
                                        null,
                                        "public",
                                        null,
                                        sourceAsset.assetId()
                                ))),
                        session.accessToken()))
                .andExpect(status().isConflict())
                .andReturn();

        JsonNode updateSubmittedBody = readBody(updateSubmittedResult);
        assertThat(updateSubmittedBody.path("code").asText()).isEqualTo("DRAFT_ALREADY_SUBMITTED");
    }

    @Test
    void postDraftSubmitBuildsPlainTextExcerptFromRichContent() throws Exception {
        LoginSession session = loginAsRandomUser("post-rich-submit");

        MvcResult createResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/post-drafts")
                                .accept(MediaType.APPLICATION_JSON),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        String draftId = readBody(createResult).at("/data/draftId").asText();
        assertThat(draftId).isNotBlank();

        String richContent = """
                <h1>Story Title</h1>
                <p><span style="font-size:28px;color:#d84d4d">Opening paragraph</span> with <a href="https://example.com">linked text</a>.</p>
                <figure class="discussion-rich-video">
                  <video src="/demo.mp4"></video>
                  <figcaption>Demo video</figcaption>
                </figure>
                """;

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/post-drafts/{id}", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new PostDraftPayload(
                                        "Rich post draft",
                                        "video-production",
                                        richContent,
                                        List.of("integration", "rich"),
                                        null,
                                        null
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk());

        MvcResult submitResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/post-drafts/{id}/submit", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new SubmitDraftPayload("creator_submit"))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode submitBody = readBody(submitResult);
        assertThat(submitBody.at("/data/draftStatus").asText()).isEqualTo("submitted");

        String threadId = submitBody.at("/data/targetId").asText();
        Map<String, Object> threadRow = jdbcTemplate.queryForMap("""
                select content_text, excerpt_text, publish_status
                from discussion_threads
                where id = ?
                """,
                UUID.fromString(threadId)
        );

        assertThat(threadRow.get("publish_status")).isEqualTo("published");
        assertThat(String.valueOf(threadRow.get("content_text"))).isEqualTo(richContent.trim());
        assertThat(String.valueOf(threadRow.get("excerpt_text"))).contains("Story Title");
        assertThat(String.valueOf(threadRow.get("excerpt_text"))).contains("Opening paragraph");
        assertThat(String.valueOf(threadRow.get("excerpt_text"))).contains("Demo video");
        assertThat(String.valueOf(threadRow.get("excerpt_text"))).doesNotContain("<h1>");
        assertThat(String.valueOf(threadRow.get("excerpt_text"))).doesNotContain("https://example.com");
    }

    private UploadedAsset uploadAsset(
            LoginSession session,
            String policyPath,
            String fileName,
            String mimeType,
            String assetRole,
            byte[] content
    ) throws Exception {
        MvcResult policyResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post(policyPath)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new UploadPolicyPayload(
                                        fileName,
                                        mimeType,
                                        content.length,
                                        assetRole
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode policyBody = readBody(policyResult);
        assertThat(policyBody.path("code").asText()).isEqualTo("OK");

        String assetId = policyBody.at("/data/assetId").asText();
        String uploadUrl = policyBody.at("/data/uploadUrl").asText();
        assertThat(assetId).isNotBlank();
        assertThat(uploadUrl).isNotBlank();

        MvcResult uploadResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put(uploadUrl)
                                .contentType(mimeType)
                                .content(content),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode uploadBody = readBody(uploadResult);
        assertThat(uploadBody.path("code").asText()).isEqualTo("OK");
        return new UploadedAsset(assetId);
    }

    private record PostDraftPayload(
            String title,
            String channelSlug,
            String content,
            List<String> tagNames,
            String bindingTargetType,
            String bindingTargetId
    ) {
    }

    private record VideoDraftPayload(
            String title,
            String summary,
            String categoryCode,
            String modelCategory,
            String contentCategory,
            String compositionCategory,
            List<String> tagNames,
            String workflowId,
            String visibility,
            String coverAssetId,
            String sourceAssetId
    ) {
    }

    private record FullVideoDraftPayload(
            String title,
            String summary,
            String categoryCode,
            String promptText,
            String promptTextZh,
            String promptTextEn,
            String promptTextRaw,
            String modelName,
            String modelCategory,
            String contentCategory,
            String compositionCategory,
            String sourcePlatform,
            String sourceCampaign,
            String sourceItemId,
            String sourceUrl,
            String publishedAt,
            List<String> tagNames,
            String workflowId,
            String visibility,
            String coverAssetId,
            String sourceAssetId
    ) {
    }

    private record SubmitDraftPayload(
            String submitMode
    ) {
    }

    private record UploadPolicyPayload(
            String fileName,
            String mimeType,
            long sizeBytes,
            String assetRole
    ) {
    }

    private record UploadedAsset(
            String assetId
    ) {
    }

    private record WorkflowDraftPayload(
            String title,
            String summary,
            String scenarioText,
            List<String> tagNames,
            Boolean allowCopy,
            Boolean allowFork,
            String visibility,
            String coverAssetId
    ) {
    }
}
