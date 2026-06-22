package com.dramatv.community.integration;

import com.dramatv.community.publish.application.ImageMediaProcessingService;
import com.dramatv.community.publish.application.VideoMediaProcessingService;
import com.dramatv.community.shared.media.VideoMediaProcessingProperties;
import com.fasterxml.jackson.databind.JsonNode;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PublishPipelineIntegrationTest extends ApiIntegrationTestSupport {

    @Autowired
    private VideoMediaProcessingService videoMediaProcessingService;

    @Autowired
    private ImageMediaProcessingService imageMediaProcessingService;

    @Autowired
    private VideoMediaProcessingProperties videoMediaProcessingProperties;

    @Test
    void uploadPolicyAndBinaryUploadPersistReadyAssetAndLocalFile() throws Exception {
        LoginSession session = loginAsRandomUser("upload");
        byte[] imageBytes = "fake-image-binary".getBytes(StandardCharsets.UTF_8);

        UploadedAsset asset = uploadAsset(
                session,
                "/api/uploads/image-policy",
                "cover-check.jpg",
                "image/jpeg",
                "cover",
                imageBytes
        );

        assertThat(asset.assetKind()).isEqualTo("image");
        assertThat(asset.assetRole()).isEqualTo("cover");
        assertThat(asset.statusCode()).isEqualTo("ready");
        assertThat(asset.sizeBytes()).isEqualTo(imageBytes.length);
        assertThat(asset.mediaPath()).startsWith("/media/community/local/image/cover/");
        assertThat(asset.publicUrl()).contains(asset.assetId());

        Map<String, Object> row = jdbcTemplate.queryForMap("""
                select asset_kind, asset_role, status_code, object_key, created_by
                from media_assets
                where id = ?
                """,
                UUID.fromString(asset.assetId())
        );

        assertThat(row.get("asset_kind")).isEqualTo("image");
        assertThat(row.get("asset_role")).isEqualTo("cover");
        assertThat(row.get("status_code")).isEqualTo("ready");
        assertThat(String.valueOf(row.get("created_by"))).isEqualTo(session.userId());

        Path localFile = resolveAssetFilePath(String.valueOf(row.get("object_key")));
        assertThat(Files.exists(localFile)).isTrue();
        assertThat(Files.size(localFile)).isEqualTo(imageBytes.length);
    }

    @Test
    void imagePromptSubmitPersistsImportMetadataAndPublishedAt() throws Exception {
        LoginSession session = loginAsRandomUser("prompt-import");
        UploadedAsset sourceAsset = uploadAsset(
                session,
                "/api/uploads/image-policy",
                "prompt-source.jpg",
                "image/jpeg",
                "source",
                "fake-image-source".getBytes(StandardCharsets.UTF_8)
        );

        MvcResult createDraftResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/video-drafts")
                                .accept(MediaType.APPLICATION_JSON),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        String draftId = readBody(createDraftResult).at("/data/draftId").asText();
        assertThat(draftId).isNotBlank();

        String publishedAt = "2026-04-01T12:34:56Z";
        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/video-drafts/{id}", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new VideoDraftPayload(
                                        "Imported prompt",
                                        "Imported prompt summary",
                                        "image_prompt",
                                        "Use this imported prompt text",
                                        "导入提示词",
                                        "Imported prompt text",
                                        "Raw imported prompt text",
                                        "Nano Banana",
                                        "nanobanana",
                                        "animation",
                                        null,
                                        "youmind",
                                        "youmind-nano-banana",
                                        "nano-banana-asset-001",
                                        "https://youmind.example/prompt/001",
                                        publishedAt,
                                        List.of("import", "image"),
                                        null,
                                        "public",
                                        null,
                                        sourceAsset.assetId(),
                                        List.of(),
                                        List.of()
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk());

        MvcResult submitResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/video-drafts/{id}/submit", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new SubmitDraftPayload("import"))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode submitBody = readBody(submitResult);
        assertThat(submitBody.path("code").asText()).isEqualTo("OK");
        assertThat(submitBody.at("/data/draftStatus").asText()).isEqualTo("submitted");
        assertThat(submitBody.at("/data/contentStatus").asText()).isEqualTo("published");
        assertThat(submitBody.at("/data/publishStatus").asText()).isEqualTo("submitted");
        assertThat(submitBody.at("/data/lifecycle/draftStatus").asText()).isEqualTo("submitted");
        assertThat(submitBody.at("/data/lifecycle/moderationStatus").asText()).isEqualTo("not_applicable");
        assertThat(submitBody.at("/data/lifecycle/processingStatus").asText()).isEqualTo("not_requested");
        assertThat(submitBody.at("/data/taskIds").size()).isEqualTo(0);

        String promptId = submitBody.at("/data/videoId").asText();
        Map<String, Object> promptRow = jdbcTemplate.queryForMap("""
                select title, modality, prompt_text, prompt_text_zh, prompt_text_en, prompt_text_raw,
                       model_name, model_category, content_category, composition_category,
                       source_platform, source_campaign, source_item_id, source_url,
                       primary_example_asset_id, example_count, published_at
                from prompt_entries
                where id = ?
                """,
                UUID.fromString(promptId)
        );

        assertThat(promptRow.get("title")).isEqualTo("Imported prompt");
        assertThat(promptRow.get("modality")).isEqualTo("image");
        assertThat(promptRow.get("prompt_text")).isEqualTo("Use this imported prompt text");
        assertThat(promptRow.get("prompt_text_zh")).isEqualTo("导入提示词");
        assertThat(promptRow.get("prompt_text_en")).isEqualTo("Imported prompt text");
        assertThat(promptRow.get("prompt_text_raw")).isEqualTo("Raw imported prompt text");
        assertThat(promptRow.get("model_name")).isEqualTo("Nano Banana");
        assertThat(promptRow.get("model_category")).isEqualTo("nanobanana");
        assertThat(promptRow.get("content_category")).isEqualTo("animation");
        assertThat(promptRow.get("composition_category")).isNull();
        assertThat(promptRow.get("source_platform")).isEqualTo("youmind");
        assertThat(promptRow.get("source_campaign")).isEqualTo("youmind-nano-banana");
        assertThat(promptRow.get("source_item_id")).isEqualTo("nano-banana-asset-001");
        assertThat(promptRow.get("source_url")).isEqualTo("https://youmind.example/prompt/001");
        assertThat(String.valueOf(promptRow.get("primary_example_asset_id"))).isEqualTo(sourceAsset.assetId());
        assertThat(((Number) promptRow.get("example_count")).intValue()).isEqualTo(1);
        OffsetDateTime storedPublishedAt = jdbcTemplate.queryForObject(
                "select published_at from prompt_entries where id = ?",
                OffsetDateTime.class,
                UUID.fromString(promptId)
        );
        assertThat(storedPublishedAt).isNotNull();
        assertThat(storedPublishedAt.toInstant()).isEqualTo(OffsetDateTime.parse(publishedAt).toInstant());

        Integer promptLinkCount = jdbcTemplate.queryForObject(
                "select count(*) from prompt_example_links where prompt_id = ?",
                Integer.class,
                UUID.fromString(promptId)
        );
        assertThat(promptLinkCount).isEqualTo(1);

        Integer feedCount = jdbcTemplate.queryForObject(
                "select count(*) from feed_items where target_type = 'prompt' and target_id = ? and status_code = 'active'",
                Integer.class,
                UUID.fromString(promptId)
        );
        assertThat(feedCount).isEqualTo(2);
    }

    @Test
    void imagePromptSubmitPersistsReferenceImagesIntoPromptExampleLinks() throws Exception {
        LoginSession session = loginAsRandomUser("prompt-image-reference");
        UploadedAsset sourceAsset = uploadAsset(
                session,
                "/api/uploads/image-policy",
                "prompt-image-reference-source.jpg",
                "image/jpeg",
                "source",
                "fake-image-reference-source".getBytes(StandardCharsets.UTF_8)
        );
        UploadedAsset referenceImageOne = uploadAsset(
                session,
                "/api/uploads/image-policy",
                "prompt-image-reference-1.jpg",
                "image/jpeg",
                "attachment",
                "fake-image-reference-1".getBytes(StandardCharsets.UTF_8)
        );
        UploadedAsset referenceImageTwo = uploadAsset(
                session,
                "/api/uploads/image-policy",
                "prompt-image-reference-2.jpg",
                "image/jpeg",
                "attachment",
                "fake-image-reference-2".getBytes(StandardCharsets.UTF_8)
        );

        SubmittedVideo submittedPrompt = submitImagePromptDraft(
                session,
                sourceAsset.assetId(),
                "Prompt image with references",
                null,
                List.of(referenceImageOne.assetId(), referenceImageTwo.assetId()),
                false
        );

        Integer exampleCount = jdbcTemplate.queryForObject("""
                select example_count
                from prompt_entries
                where id = ?
                """,
                Integer.class,
                UUID.fromString(submittedPrompt.videoId())
        );
        assertThat(exampleCount).isEqualTo(3);

        List<Map<String, Object>> links = jdbcTemplate.queryForList("""
                select role_code, media_asset_id, sort_order
                from prompt_example_links
                where prompt_id = ?
                order by
                    case role_code
                        when 'example' then 0
                        when 'reference_image' then 1
                        when 'reference_audio' then 2
                        else 9
                    end,
                    sort_order asc,
                    created_at asc
                """,
                UUID.fromString(submittedPrompt.videoId())
        );

        assertThat(links)
                .extracting(row -> String.valueOf(row.get("role_code")), row -> String.valueOf(row.get("media_asset_id")))
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("example", sourceAsset.assetId()),
                        org.assertj.core.groups.Tuple.tuple("reference_image", referenceImageOne.assetId()),
                        org.assertj.core.groups.Tuple.tuple("reference_image", referenceImageTwo.assetId())
                );
    }

    @Test
    void videoPromptSubmitPersistsReferenceImagesAndAudioIntoPromptExampleLinks() throws Exception {
        LoginSession session = loginAsRandomUser("prompt-video-reference");
        UploadedAsset sourceAsset = uploadAsset(
                session,
                "/api/uploads/video-policy",
                "prompt-video-reference-source.mp4",
                "video/mp4",
                "source",
                "fake-video-reference-source".getBytes(StandardCharsets.UTF_8)
        );
        UploadedAsset referenceImage = uploadAsset(
                session,
                "/api/uploads/image-policy",
                "prompt-video-reference-image.jpg",
                "image/jpeg",
                "attachment",
                "fake-video-reference-image".getBytes(StandardCharsets.UTF_8)
        );
        UploadedAsset referenceAudio = uploadAsset(
                session,
                "/api/uploads/audio-policy",
                "prompt-video-reference-audio.mp3",
                "audio/mpeg",
                "attachment",
                "fake-video-reference-audio".getBytes(StandardCharsets.UTF_8)
        );

        SubmittedVideo submittedPrompt = submitVideoPromptDraft(
                session,
                sourceAsset.assetId(),
                "Prompt video with references",
                List.of(referenceImage.assetId()),
                List.of(referenceAudio.assetId())
        );

        Integer exampleCount = jdbcTemplate.queryForObject("""
                select example_count
                from prompt_entries
                where id = ?
                """,
                Integer.class,
                UUID.fromString(submittedPrompt.videoId())
        );
        assertThat(exampleCount).isEqualTo(2);

        List<Map<String, Object>> links = jdbcTemplate.queryForList("""
                select role_code, media_asset_id, sort_order
                from prompt_example_links
                where prompt_id = ?
                order by
                    case role_code
                        when 'example' then 0
                        when 'reference_image' then 1
                        when 'reference_audio' then 2
                        else 9
                    end,
                    sort_order asc,
                    created_at asc
                """,
                UUID.fromString(submittedPrompt.videoId())
        );

        assertThat(links)
                .extracting(row -> String.valueOf(row.get("role_code")), row -> String.valueOf(row.get("media_asset_id")))
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("example", sourceAsset.assetId()),
                        org.assertj.core.groups.Tuple.tuple("reference_image", referenceImage.assetId()),
                        org.assertj.core.groups.Tuple.tuple("reference_audio", referenceAudio.assetId())
                );
    }

    @Test
    void imagePromptSubmitQueuesImageMediaTaskAndGeneratesDerivedCover() throws Exception {
        long originalThresholdBytes = videoMediaProcessingProperties.getImageCoverThresholdBytes();
        try {
            videoMediaProcessingProperties.setImageCoverThresholdBytes(1024L);

            LoginSession session = loginAsRandomUser("prompt-image-worker");
            UploadedAsset sourceAsset = uploadAsset(
                    session,
                    "/api/uploads/image-policy",
                    "prompt-image-worker-source.png",
                    "image/png",
                    "source",
                    createSampleImageBytes()
            );

            SubmittedVideo submittedPrompt = submitImagePromptDraft(session, sourceAsset.assetId(), "Prompt image worker");

            Map<String, Object> taskRow = jdbcTemplate.queryForMap("""
                    select task_type, target_type, target_id, status_code, payload_json::text as payload_json
                    from async_task_records
                    where id = ?
                    """,
                    UUID.fromString(submittedPrompt.taskId())
            );

            assertThat(taskRow.get("task_type")).isEqualTo("image_media_process");
            assertThat(taskRow.get("target_type")).isEqualTo("prompt");
            assertThat(String.valueOf(taskRow.get("target_id"))).isEqualTo(submittedPrompt.videoId());
            assertThat(taskRow.get("status_code")).isEqualTo("queued");
            assertThat(String.valueOf(taskRow.get("payload_json"))).contains(sourceAsset.assetId());

            int processedCount = imageMediaProcessingService.processAvailableTasks();
            assertThat(processedCount).isEqualTo(1);

            Map<String, Object> promptRow = jdbcTemplate.queryForMap("""
                    select cover_asset_id, primary_example_asset_id
                    from prompt_entries
                    where id = ?
                    """,
                    UUID.fromString(submittedPrompt.videoId())
            );

            assertThat(promptRow.get("cover_asset_id")).isNotNull();
            assertThat(String.valueOf(promptRow.get("cover_asset_id"))).isNotEqualTo(sourceAsset.assetId());
            assertThat(String.valueOf(promptRow.get("primary_example_asset_id"))).isEqualTo(sourceAsset.assetId());

            MvcResult detailResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/prompts/{id}", submittedPrompt.videoId())
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode detailBody = readBody(detailResult);
            assertThat(detailBody.path("code").asText()).isEqualTo("OK");
            assertThat(detailBody.at("/data/coverUrl").asText()).isNotBlank();
            assertThat(detailBody.at("/data/posterUrl").asText()).isNotBlank();
            assertThat(detailBody.at("/data/previewUrl").isMissingNode() || detailBody.at("/data/previewUrl").isNull()).isTrue();
        } finally {
            videoMediaProcessingProperties.setImageCoverThresholdBytes(originalThresholdBytes);
        }
    }

    @Test
    void imagePromptSubmitQueuesMediaTaskWhenCoverPointsToSourceAndReplacesIt() throws Exception {
        long originalThresholdBytes = videoMediaProcessingProperties.getImageCoverThresholdBytes();
        try {
            videoMediaProcessingProperties.setImageCoverThresholdBytes(1024L);

            LoginSession session = loginAsRandomUser("prompt-image-source-cover");
            UploadedAsset sourceAsset = uploadAsset(
                    session,
                    "/api/uploads/image-policy",
                    "prompt-image-source-cover.png",
                    "image/png",
                    "source",
                    createSampleImageBytes()
            );

            SubmittedVideo submittedPrompt = submitImagePromptDraft(
                    session,
                    sourceAsset.assetId(),
                    "Prompt image source cover",
                    sourceAsset.assetId()
            );

            Map<String, Object> taskRow = jdbcTemplate.queryForMap("""
                    select task_type, target_type, target_id, status_code, payload_json::text as payload_json
                    from async_task_records
                    where id = ?
                    """,
                    UUID.fromString(submittedPrompt.taskId())
            );

            assertThat(taskRow.get("task_type")).isEqualTo("image_media_process");
            assertThat(taskRow.get("target_type")).isEqualTo("prompt");
            assertThat(String.valueOf(taskRow.get("target_id"))).isEqualTo(submittedPrompt.videoId());
            assertThat(taskRow.get("status_code")).isEqualTo("queued");
            assertThat(String.valueOf(taskRow.get("payload_json"))).contains(sourceAsset.assetId());

            Map<String, Object> promptBeforeRow = jdbcTemplate.queryForMap("""
                    select cover_asset_id, primary_example_asset_id
                    from prompt_entries
                    where id = ?
                    """,
                    UUID.fromString(submittedPrompt.videoId())
            );

            assertThat(String.valueOf(promptBeforeRow.get("cover_asset_id"))).isEqualTo(sourceAsset.assetId());
            assertThat(String.valueOf(promptBeforeRow.get("primary_example_asset_id"))).isEqualTo(sourceAsset.assetId());

            int processedCount = imageMediaProcessingService.processAvailableTasks();
            assertThat(processedCount).isEqualTo(1);

            Map<String, Object> promptAfterRow = jdbcTemplate.queryForMap("""
                    select cover_asset_id, primary_example_asset_id
                    from prompt_entries
                    where id = ?
                    """,
                    UUID.fromString(submittedPrompt.videoId())
            );

            assertThat(promptAfterRow.get("cover_asset_id")).isNotNull();
            assertThat(String.valueOf(promptAfterRow.get("cover_asset_id"))).isNotEqualTo(sourceAsset.assetId());
            assertThat(String.valueOf(promptAfterRow.get("primary_example_asset_id"))).isEqualTo(sourceAsset.assetId());

            Map<String, Object> coverAssetRow = jdbcTemplate.queryForMap("""
                    select asset_kind, asset_role
                    from media_assets
                    where id = ?
                    """,
                    UUID.fromString(String.valueOf(promptAfterRow.get("cover_asset_id")))
            );

            assertThat(coverAssetRow.get("asset_kind")).isEqualTo("image");
            assertThat(coverAssetRow.get("asset_role")).isEqualTo("cover");

            MvcResult detailResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/prompts/{id}", submittedPrompt.videoId())
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode detailBody = readBody(detailResult);
            assertThat(detailBody.path("code").asText()).isEqualTo("OK");
            assertThat(detailBody.at("/data/coverUrl").asText()).isNotBlank();
            assertThat(detailBody.at("/data/posterUrl").asText()).isNotBlank();
            assertThat(detailBody.at("/data/coverUrl").asText()).isNotEqualTo(detailBody.at("/data/sourceUrl").asText());
        } finally {
            videoMediaProcessingProperties.setImageCoverThresholdBytes(originalThresholdBytes);
        }
    }

    @Test
    void videoDraftSubmitCreatesPublishedVideoAndQueuedAsyncTask() throws Exception {
        LoginSession session = loginAsRandomUser("submit-video");
        UploadedAsset sourceAsset = uploadAsset(
                session,
                "/api/uploads/video-policy",
                "source-check.mp4",
                "video/mp4",
                "source",
                "fake-video-source".getBytes(StandardCharsets.UTF_8)
        );

        SubmittedVideo submittedVideo = submitVideoDraft(session, sourceAsset.assetId(), "Integration submit video");

        Map<String, Object> videoRow = jdbcTemplate.queryForMap("""
                select title, category_code, publish_status, source_asset_id
                from videos
                where id = ?
                """,
                UUID.fromString(submittedVideo.videoId())
        );

        assertThat(videoRow.get("title")).isEqualTo("Integration submit video");
        assertThat(videoRow.get("category_code")).isEqualTo("workflow");
        assertThat(videoRow.get("publish_status")).isEqualTo("published");
        assertThat(String.valueOf(videoRow.get("source_asset_id"))).isEqualTo(sourceAsset.assetId());

        Map<String, Object> taskRow = jdbcTemplate.queryForMap("""
                select task_type, target_type, target_id, queue_name, status_code, payload_json::text as payload_json
                from async_task_records
                where id = ?
                """,
                UUID.fromString(submittedVideo.taskId())
        );

        assertThat(taskRow.get("task_type")).isEqualTo("video_media_process");
        assertThat(taskRow.get("target_type")).isEqualTo("video");
        assertThat(String.valueOf(taskRow.get("target_id"))).isEqualTo(submittedVideo.videoId());
        assertThat(taskRow.get("queue_name")).isEqualTo("media-processing");
        assertThat(taskRow.get("status_code")).isEqualTo("queued");
        assertThat(String.valueOf(taskRow.get("payload_json"))).contains(sourceAsset.assetId());

        MvcResult detailResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/videos/{id}", submittedVideo.videoId())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode detailBody = readBody(detailResult);
        assertThat(detailBody.path("code").asText()).isEqualTo("OK");
        assertThat(detailBody.at("/data/title").asText()).isEqualTo("Integration submit video");
        assertThat(detailBody.at("/data/media/sourceUrl").asText()).contains(sourceAsset.assetId());
    }

    @Test
    void mediaCallbackWritesDerivedAssetsAndMarksTaskSucceeded() throws Exception {
        LoginSession session = loginAsRandomUser("media-callback");
        UploadedAsset sourceAsset = uploadAsset(
                session,
                "/api/uploads/video-policy",
                "callback-source.mp4",
                "video/mp4",
                "source",
                "fake-video-source".getBytes(StandardCharsets.UTF_8)
        );
        SubmittedVideo submittedVideo = submitVideoDraft(session, sourceAsset.assetId(), "Integration callback video");

        UploadedAsset coverAsset = uploadAsset(
                session,
                "/api/uploads/image-policy",
                "callback-cover.jpg",
                "image/jpeg",
                "cover",
                "fake-cover".getBytes(StandardCharsets.UTF_8)
        );
        UploadedAsset previewAsset = uploadAsset(
                session,
                "/api/uploads/video-policy",
                "callback-preview.mp4",
                "video/mp4",
                "preview",
                "fake-preview".getBytes(StandardCharsets.UTF_8)
        );

        MvcResult callbackResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/internal/media-callback")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new MediaCallbackPayload(
                                        submittedVideo.taskId(),
                                        "succeeded",
                                        "video",
                                        submittedVideo.videoId(),
                                        new MediaCallbackResultPayload(
                                                coverAsset.assetId(),
                                                previewAsset.assetId(),
                                                12345L,
                                                null
                                        )
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode callbackBody = readBody(callbackResult);
        assertThat(callbackBody.path("code").asText()).isEqualTo("OK");
        assertThat(callbackBody.at("/data/taskId").asText()).isEqualTo(submittedVideo.taskId());
        assertThat(callbackBody.at("/data/statusCode").asText()).isEqualTo("succeeded");

        Map<String, Object> videoRow = jdbcTemplate.queryForMap("""
                select cover_asset_id, preview_asset_id, duration_ms
                from videos
                where id = ?
                """,
                UUID.fromString(submittedVideo.videoId())
        );

        assertThat(String.valueOf(videoRow.get("cover_asset_id"))).isEqualTo(coverAsset.assetId());
        assertThat(String.valueOf(videoRow.get("preview_asset_id"))).isEqualTo(previewAsset.assetId());
        assertThat(((Number) videoRow.get("duration_ms")).intValue()).isEqualTo(12345);

        Map<String, Object> taskRow = jdbcTemplate.queryForMap("""
                select status_code, error_message, finished_at is not null as finished, result_json::text as result_json
                from async_task_records
                where id = ?
                """,
                UUID.fromString(submittedVideo.taskId())
        );

        assertThat(taskRow.get("status_code")).isEqualTo("succeeded");
        assertThat(taskRow.get("error_message")).isNull();
        assertThat(taskRow.get("finished")).isEqualTo(true);
        assertThat(String.valueOf(taskRow.get("result_json"))).contains(coverAsset.assetId(), previewAsset.assetId(), "12345");

        Map<String, Object> callbackLogRow = jdbcTemplate.queryForMap("""
                select verify_status, process_status
                from task_callback_logs
                where task_id = ?
                order by created_at desc
                limit 1
                """,
                UUID.fromString(submittedVideo.taskId())
        );

        assertThat(callbackLogRow.get("verify_status")).isEqualTo("verified");
        assertThat(callbackLogRow.get("process_status")).isEqualTo("applied");

        Integer sourceDuration = jdbcTemplate.queryForObject(
                "select duration_ms from media_assets where id = ?",
                Integer.class,
                UUID.fromString(sourceAsset.assetId())
        );
        Integer previewDuration = jdbcTemplate.queryForObject(
                "select duration_ms from media_assets where id = ?",
                Integer.class,
                UUID.fromString(previewAsset.assetId())
        );
        assertThat(sourceDuration).isEqualTo(12345);
        assertThat(previewDuration).isEqualTo(12345);

        MvcResult detailResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/videos/{id}", submittedVideo.videoId())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode detailBody = readBody(detailResult);
        assertThat(detailBody.path("code").asText()).isEqualTo("OK");
        assertThat(detailBody.at("/data/media/coverUrl").asText()).contains(coverAsset.assetId());
        assertThat(detailBody.at("/data/media/previewUrl").asText()).contains(previewAsset.assetId());
        assertThat(detailBody.at("/data/media/sourceUrl").asText()).contains(sourceAsset.assetId());
        assertThat(detailBody.at("/data/media/durationMs").asLong()).isEqualTo(12345L);
    }

    @Test
    void videoMediaProcessorGeneratesCoverPosterAndPreviewForQueuedTask() throws Exception {
        Assumptions.assumeTrue(isFfmpegReady(), "ffmpeg/ffprobe is required for media processing integration");

        long originalThresholdBytes = videoMediaProcessingProperties.getCompressionThresholdBytes();
        try {
            videoMediaProcessingProperties.setCompressionThresholdBytes(1024L);

            LoginSession session = loginAsRandomUser("media-worker");
            Path sampleVideoPath = createSampleVideoFile();
            UploadedAsset sourceAsset = uploadAsset(
                    session,
                    "/api/uploads/video-policy",
                    "worker-source.mp4",
                    "video/mp4",
                    "source",
                    Files.readAllBytes(sampleVideoPath)
            );
            SubmittedVideo submittedVideo = submitVideoDraft(session, sourceAsset.assetId(), "Integration worker video");

            int processedCount = videoMediaProcessingService.processAvailableTasks();
            assertThat(processedCount).isEqualTo(1);

            Map<String, Object> videoRow = jdbcTemplate.queryForMap("""
                    select cover_asset_id, poster_asset_id, preview_asset_id, duration_ms
                    from videos
                    where id = ?
                    """,
                    UUID.fromString(submittedVideo.videoId())
            );

            assertThat(videoRow.get("cover_asset_id")).isNotNull();
            assertThat(videoRow.get("poster_asset_id")).isNotNull();
            assertThat(videoRow.get("preview_asset_id")).isNotNull();
            assertThat(((Number) videoRow.get("duration_ms")).intValue()).isGreaterThan(0);

            Map<String, Object> taskRow = jdbcTemplate.queryForMap("""
                    select status_code, error_message
                    from async_task_records
                    where id = ?
                    """,
                    UUID.fromString(submittedVideo.taskId())
            );

            assertThat(taskRow.get("status_code")).isEqualTo("succeeded");
            assertThat(taskRow.get("error_message")).isNull();

            MvcResult detailResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/videos/{id}", submittedVideo.videoId())
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode detailBody = readBody(detailResult);
            assertThat(detailBody.at("/data/media/coverUrl").asText()).isNotBlank();
            assertThat(detailBody.at("/data/media/previewUrl").asText()).isNotBlank();
            assertThat(detailBody.at("/data/media/durationMs").asLong()).isGreaterThan(0L);
        } finally {
            videoMediaProcessingProperties.setCompressionThresholdBytes(originalThresholdBytes);
        }
    }

    @Test
    void videoMediaProcessorRebuildsPreviewWhenExistingPreviewAssetIsNotDerivedPreview() throws Exception {
        Assumptions.assumeTrue(isFfmpegReady(), "ffmpeg/ffprobe is required for media processing integration");

        long originalThresholdBytes = videoMediaProcessingProperties.getCompressionThresholdBytes();
        try {
            videoMediaProcessingProperties.setCompressionThresholdBytes(1024L);

            LoginSession session = loginAsRandomUser("media-worker-preview-fix");
            Path sampleVideoPath = createSampleVideoFile();
            UploadedAsset sourceAsset = uploadAsset(
                    session,
                    "/api/uploads/video-policy",
                    "worker-preview-fix-source.mp4",
                    "video/mp4",
                    "source",
                    Files.readAllBytes(sampleVideoPath)
            );
            SubmittedVideo submittedVideo = submitVideoDraft(session, sourceAsset.assetId(), "Integration worker preview fix");

            jdbcTemplate.update("""
                    update videos
                    set preview_asset_id = source_asset_id,
                        updated_at = now()
                    where id = ?
                    """,
                    UUID.fromString(submittedVideo.videoId())
            );

            int processedCount = videoMediaProcessingService.processAvailableTasks();
            assertThat(processedCount).isEqualTo(1);

            Map<String, Object> videoRow = jdbcTemplate.queryForMap("""
                    select preview_asset_id, poster_asset_id
                    from videos
                    where id = ?
                    """,
                    UUID.fromString(submittedVideo.videoId())
            );

            UUID previewAssetId = (UUID) videoRow.get("preview_asset_id");
            assertThat(previewAssetId).isNotNull();
            assertThat(previewAssetId.toString()).isNotEqualTo(sourceAsset.assetId());
            assertThat(videoRow.get("poster_asset_id")).isNotNull();

            Map<String, Object> previewAssetRow = jdbcTemplate.queryForMap("""
                    select asset_kind, asset_role
                    from media_assets
                    where id = ?
                    """,
                    previewAssetId
            );

            assertThat(previewAssetRow.get("asset_kind")).isEqualTo("video");
            assertThat(previewAssetRow.get("asset_role")).isEqualTo("preview");
        } finally {
            videoMediaProcessingProperties.setCompressionThresholdBytes(originalThresholdBytes);
        }
    }

    @Test
    void videoPromptSubmitQueuesMediaTaskAndGeneratesDerivedAssets() throws Exception {
        Assumptions.assumeTrue(isFfmpegReady(), "ffmpeg/ffprobe is required for media processing integration");

        long originalThresholdBytes = videoMediaProcessingProperties.getCompressionThresholdBytes();
        try {
            videoMediaProcessingProperties.setCompressionThresholdBytes(1024L);

            LoginSession session = loginAsRandomUser("prompt-video-worker");
            Path sampleVideoPath = createSampleVideoFile();
            UploadedAsset sourceAsset = uploadAsset(
                    session,
                    "/api/uploads/video-policy",
                    "prompt-worker-source.mp4",
                    "video/mp4",
                    "source",
                    Files.readAllBytes(sampleVideoPath)
            );

            SubmittedVideo submittedPrompt = submitVideoPromptDraft(
                    session,
                    sourceAsset.assetId(),
                    "Prompt video worker"
            );

            Map<String, Object> promptRow = jdbcTemplate.queryForMap("""
                    select modality, cover_asset_id, primary_example_asset_id
                    from prompt_entries
                    where id = ?
                    """,
                    UUID.fromString(submittedPrompt.videoId())
            );

            assertThat(promptRow.get("modality")).isEqualTo("video");
            assertThat(promptRow.get("cover_asset_id")).isNull();
            assertThat(String.valueOf(promptRow.get("primary_example_asset_id"))).isEqualTo(sourceAsset.assetId());

            Map<String, Object> taskRow = jdbcTemplate.queryForMap("""
                    select task_type, target_type, target_id, status_code, payload_json::text as payload_json
                    from async_task_records
                    where id = ?
                    """,
                    UUID.fromString(submittedPrompt.taskId())
            );

            assertThat(taskRow.get("task_type")).isEqualTo("video_media_process");
            assertThat(taskRow.get("target_type")).isEqualTo("prompt");
            assertThat(String.valueOf(taskRow.get("target_id"))).isEqualTo(submittedPrompt.videoId());
            assertThat(taskRow.get("status_code")).isEqualTo("queued");
            assertThat(String.valueOf(taskRow.get("payload_json"))).contains(sourceAsset.assetId());

            int processedCount = videoMediaProcessingService.processAvailableTasks();
            assertThat(processedCount).isEqualTo(1);

            UUID previewAssetId = jdbcTemplate.queryForObject("""
                    select media_asset_id
                    from prompt_example_links
                    where prompt_id = ?
                      and role_code = 'preview'
                    order by sort_order asc, created_at asc
                    limit 1
                    """,
                    UUID.class,
                    UUID.fromString(submittedPrompt.videoId())
            );

            Map<String, Object> updatedPromptRow = jdbcTemplate.queryForMap("""
                    select cover_asset_id
                    from prompt_entries
                    where id = ?
                    """,
                    UUID.fromString(submittedPrompt.videoId())
            );

            assertThat(updatedPromptRow.get("cover_asset_id")).isNotNull();
            assertThat(previewAssetId).isNotNull();

            Integer exampleLinkCount = jdbcTemplate.queryForObject("""
                    select count(*)
                    from prompt_example_links
                    where prompt_id = ?
                      and role_code = 'example'
                    """,
                    Integer.class,
                    UUID.fromString(submittedPrompt.videoId())
            );
            assertThat(exampleLinkCount).isEqualTo(1);

            MvcResult detailResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/prompts/{id}", submittedPrompt.videoId())
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode detailBody = readBody(detailResult);
            assertThat(detailBody.path("code").asText()).isEqualTo("OK");
            assertThat(detailBody.at("/data/coverUrl").asText()).isNotBlank();
            assertThat(detailBody.at("/data/previewUrl").asText()).contains(previewAssetId.toString());
            assertThat(detailBody.at("/data/sourceUrl").asText()).contains(sourceAsset.assetId());
        } finally {
            videoMediaProcessingProperties.setCompressionThresholdBytes(originalThresholdBytes);
        }
    }

    @Test
    void videoPromptMediaProcessorSupportsLocalPublicSourceAssets() throws Exception {
        Assumptions.assumeTrue(isFfmpegReady(), "ffmpeg/ffprobe is required for media processing integration");

        long originalThresholdBytes = videoMediaProcessingProperties.getCompressionThresholdBytes();
        Path webPublicVideoPath = null;
        try {
            videoMediaProcessingProperties.setCompressionThresholdBytes(1024L);

            LoginSession session = loginAsRandomUser("prompt-local-public-worker");
            Path sampleVideoPath = createSampleVideoFile();
            String objectKey = "integration-media/local-public-" + UUID.randomUUID() + ".mp4";
            webPublicVideoPath = resolveWebPublicAssetPath(objectKey);
            Files.createDirectories(webPublicVideoPath.getParent());
            Files.copy(sampleVideoPath, webPublicVideoPath, StandardCopyOption.REPLACE_EXISTING);

            String sourceAssetId = createPublicMediaAsset(session.userId(), "video", objectKey, "video/mp4");
            jdbcTemplate.update("""
                    update media_assets
                    set size_bytes = ?,
                        updated_at = now()
                    where id = ?
                    """,
                    Files.size(webPublicVideoPath),
                    UUID.fromString(sourceAssetId)
            );

            SubmittedVideo submittedPrompt = submitVideoPromptDraft(
                    session,
                    sourceAssetId,
                    "Prompt local public worker"
            );

            int processedCount = videoMediaProcessingService.processAvailableTasks();
            assertThat(processedCount).isEqualTo(1);

            UUID previewAssetId = jdbcTemplate.queryForObject("""
                    select media_asset_id
                    from prompt_example_links
                    where prompt_id = ?
                      and role_code = 'preview'
                    order by sort_order asc, created_at asc
                    limit 1
                    """,
                    UUID.class,
                    UUID.fromString(submittedPrompt.videoId())
            );

            Map<String, Object> promptRow = jdbcTemplate.queryForMap("""
                    select cover_asset_id
                    from prompt_entries
                    where id = ?
                    """,
                    UUID.fromString(submittedPrompt.videoId())
            );

            assertThat(promptRow.get("cover_asset_id")).isNotNull();
            assertThat(previewAssetId).isNotNull();

            MvcResult detailResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/prompts/{id}", submittedPrompt.videoId())
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode detailBody = readBody(detailResult);
            assertThat(detailBody.path("code").asText()).isEqualTo("OK");
            assertThat(detailBody.at("/data/coverUrl").asText()).isNotBlank();
            assertThat(detailBody.at("/data/previewUrl").asText()).contains(previewAssetId.toString());
            assertThat(detailBody.at("/data/sourceUrl").asText()).contains(objectKey);
        } finally {
            videoMediaProcessingProperties.setCompressionThresholdBytes(originalThresholdBytes);
            if (webPublicVideoPath != null) {
                Files.deleteIfExists(webPublicVideoPath);
            }
        }
    }

    @Test
    void submittedVideoDraftLifecycleIncludesMediaFailureMessage() throws Exception {
        LoginSession session = loginAsRandomUser("video-media-failed-lifecycle");
        UploadedAsset sourceAsset = uploadAsset(
                session,
                "/api/uploads/video-policy",
                "failed-lifecycle-source.mp4",
                "video/mp4",
                "source",
                "fake-video-source".getBytes(StandardCharsets.UTF_8)
        );

        SubmittedVideo submittedVideo = submitVideoDraft(session, sourceAsset.assetId(), "Lifecycle failed video");

        jdbcTemplate.update("""
                update async_task_records
                set status_code = 'failed',
                    error_message = ?,
                    finished_at = now(),
                    updated_at = now()
                where id = ?
                """,
                "preview transcode failed: ffmpeg timeout",
                UUID.fromString(submittedVideo.taskId())
        );

        MvcResult getDraftResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/video-drafts/{id}", submittedVideo.draftId()),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode getDraftBody = readBody(getDraftResult);
        assertThat(getDraftBody.at("/data/lifecycle/draftStatus").asText()).isEqualTo("submitted");
        assertThat(getDraftBody.at("/data/lifecycle/processingStatus").asText()).isEqualTo("failed");
        assertThat(getDraftBody.at("/data/lifecycle/processingMessage").asText())
                .contains("preview transcode failed");
        assertThat(getDraftBody.at("/data/lifecycle/mediaTask/taskId").asText())
                .isEqualTo(submittedVideo.taskId());
    }

    @Test
    void mediaTaskDetailReturnsOwnedFailedTaskState() throws Exception {
        LoginSession session = loginAsRandomUser("media-task-detail");
        UploadedAsset sourceAsset = uploadAsset(
                session,
                "/api/uploads/video-policy",
                "media-task-detail.mp4",
                "video/mp4",
                "source",
                "fake-video-source".getBytes(StandardCharsets.UTF_8)
        );

        SubmittedVideo submittedVideo = submitVideoDraft(session, sourceAsset.assetId(), "Task detail video");

        jdbcTemplate.update("""
                update async_task_records
                set status_code = 'failed',
                    retry_count = 1,
                    max_retry_count = 3,
                    error_message = ?,
                    finished_at = now(),
                    updated_at = now()
                where id = ?
                """,
                "preview transcode failed: ffmpeg timeout",
                UUID.fromString(submittedVideo.taskId())
        );

        MvcResult detailResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/media-tasks/{id}", submittedVideo.taskId()),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode detailBody = readBody(detailResult);
        assertThat(detailBody.path("code").asText()).isEqualTo("OK");
        assertThat(detailBody.at("/data/taskId").asText()).isEqualTo(submittedVideo.taskId());
        assertThat(detailBody.at("/data/statusCode").asText()).isEqualTo("failed");
        assertThat(detailBody.at("/data/retryCount").asInt()).isEqualTo(1);
        assertThat(detailBody.at("/data/maxRetryCount").asInt()).isEqualTo(3);
        assertThat(detailBody.at("/data/retryable").asBoolean()).isTrue();
        assertThat(detailBody.at("/data/errorMessage").asText()).contains("preview transcode failed");
    }

    @Test
    void mediaTaskRetryRequeuesFailedOwnedTask() throws Exception {
        LoginSession session = loginAsRandomUser("media-task-retry");
        UploadedAsset sourceAsset = uploadAsset(
                session,
                "/api/uploads/video-policy",
                "media-task-retry.mp4",
                "video/mp4",
                "source",
                "fake-video-source".getBytes(StandardCharsets.UTF_8)
        );

        SubmittedVideo submittedVideo = submitVideoDraft(session, sourceAsset.assetId(), "Task retry video");

        jdbcTemplate.update("""
                update async_task_records
                set status_code = 'failed',
                    retry_count = 1,
                    max_retry_count = 3,
                    error_message = ?,
                    started_at = now() - interval '1 minute',
                    finished_at = now(),
                    updated_at = now()
                where id = ?
                """,
                "preview transcode failed: ffmpeg timeout",
                UUID.fromString(submittedVideo.taskId())
        );

        MvcResult retryResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/media-tasks/{id}/retry", submittedVideo.taskId()),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode retryBody = readBody(retryResult);
        assertThat(retryBody.path("code").asText()).isEqualTo("OK");
        assertThat(retryBody.at("/data/taskId").asText()).isEqualTo(submittedVideo.taskId());
        assertThat(retryBody.at("/data/statusCode").asText()).isEqualTo("queued");
        assertThat(retryBody.at("/data/retryCount").asInt()).isEqualTo(2);
        assertThat(retryBody.at("/data/retryable").asBoolean()).isFalse();

        Map<String, Object> taskRow = jdbcTemplate.queryForMap("""
                select status_code, retry_count, error_message, started_at, finished_at
                from async_task_records
                where id = ?
                """,
                UUID.fromString(submittedVideo.taskId())
        );

        assertThat(taskRow.get("status_code")).isEqualTo("queued");
        assertThat(((Number) taskRow.get("retry_count")).intValue()).isEqualTo(2);
        assertThat(taskRow.get("error_message")).isNull();
        assertThat(taskRow.get("started_at")).isNull();
        assertThat(taskRow.get("finished_at")).isNull();
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
        return new UploadedAsset(
                assetId,
                uploadBody.at("/data/assetKind").asText(),
                uploadBody.at("/data/assetRole").asText(),
                uploadBody.at("/data/statusCode").asText(),
                uploadBody.at("/data/mediaPath").asText(),
                uploadBody.at("/data/publicUrl").asText(),
                uploadBody.at("/data/sizeBytes").asLong()
        );
    }

    private SubmittedVideo submitVideoDraft(LoginSession session, String sourceAssetId, String title) throws Exception {
        MvcResult createDraftResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/video-drafts")
                                .accept(MediaType.APPLICATION_JSON),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        String draftId = readBody(createDraftResult).at("/data/draftId").asText();
        assertThat(draftId).isNotBlank();

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/video-drafts/{id}", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new VideoDraftPayload(
                                        title,
                                        "Integration draft summary",
                                        "workflow",
                                        "Integration prompt text",
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
                                        List.of("integration", "pipeline"),
                                        null,
                                        "public",
                                        null,
                                        sourceAssetId,
                                        List.of(),
                                        List.of()
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk());

        MvcResult submitResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/video-drafts/{id}/submit", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new SubmitDraftPayload("publish"))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode submitBody = readBody(submitResult);
        assertThat(submitBody.path("code").asText()).isEqualTo("OK");
        assertThat(submitBody.at("/data/draftStatus").asText()).isEqualTo("submitted");
        assertThat(submitBody.at("/data/contentStatus").asText()).isEqualTo("published");
        assertThat(submitBody.at("/data/publishStatus").asText()).isEqualTo("submitted");
        assertThat(submitBody.at("/data/lifecycle/draftStatus").asText()).isEqualTo("submitted");
        assertThat(submitBody.at("/data/lifecycle/moderationStatus").asText()).isEqualTo("not_applicable");
        assertThat(submitBody.at("/data/lifecycle/processingStatus").asText()).isEqualTo("queued");
        assertThat(submitBody.at("/data/taskIds").size()).isEqualTo(1);

        return new SubmittedVideo(
                draftId,
                submitBody.at("/data/videoId").asText(),
                submitBody.at("/data/taskIds/0").asText()
        );
    }

    private SubmittedVideo submitVideoPromptDraft(LoginSession session, String sourceAssetId, String title) throws Exception {
        return submitVideoPromptDraft(session, sourceAssetId, title, List.of(), List.of());
    }

    private SubmittedVideo submitVideoPromptDraft(
            LoginSession session,
            String sourceAssetId,
            String title,
            List<String> referenceImageAssetIds,
            List<String> referenceAudioAssetIds
    ) throws Exception {
        MvcResult createDraftResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/video-drafts")
                                .accept(MediaType.APPLICATION_JSON),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        String draftId = readBody(createDraftResult).at("/data/draftId").asText();
        assertThat(draftId).isNotBlank();

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/video-drafts/{id}", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new VideoDraftPayload(
                                        title,
                                        "Integration prompt video summary",
                                        "video_prompt",
                                        "Integration prompt video text",
                                        "集成测试视频提示词",
                                        "Integration prompt video text",
                                        "Integration prompt video raw text",
                                        "Seedance",
                                        "seedance",
                                        "real-person",
                                        "single-model",
                                        "integration",
                                        "integration-video-prompt",
                                        "integration-video-prompt-001",
                                        "https://integration.example/prompts/video-001",
                                        null,
                                        List.of("integration", "video-prompt"),
                                        null,
                                        "public",
                                        null,
                                        sourceAssetId,
                                        referenceImageAssetIds,
                                        referenceAudioAssetIds
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk());

        MvcResult submitResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/video-drafts/{id}/submit", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new SubmitDraftPayload("publish"))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode submitBody = readBody(submitResult);
        assertThat(submitBody.path("code").asText()).isEqualTo("OK");
        assertThat(submitBody.at("/data/draftStatus").asText()).isEqualTo("submitted");
        assertThat(submitBody.at("/data/contentStatus").asText()).isEqualTo("published");
        assertThat(submitBody.at("/data/publishStatus").asText()).isEqualTo("submitted");
        assertThat(submitBody.at("/data/lifecycle/draftStatus").asText()).isEqualTo("submitted");
        assertThat(submitBody.at("/data/lifecycle/moderationStatus").asText()).isEqualTo("not_applicable");
        assertThat(submitBody.at("/data/lifecycle/processingStatus").asText()).isEqualTo("queued");
        assertThat(submitBody.at("/data/taskIds").size()).isEqualTo(1);

        return new SubmittedVideo(
                draftId,
                submitBody.at("/data/videoId").asText(),
                submitBody.at("/data/taskIds/0").asText()
        );
    }

    private SubmittedVideo submitImagePromptDraft(LoginSession session, String sourceAssetId, String title) throws Exception {
        return submitImagePromptDraft(session, sourceAssetId, title, null, List.of(), true);
    }

    private SubmittedVideo submitImagePromptDraft(
            LoginSession session,
            String sourceAssetId,
            String title,
            String coverAssetId
    ) throws Exception {
        return submitImagePromptDraft(session, sourceAssetId, title, coverAssetId, List.of(), true);
    }

    private SubmittedVideo submitImagePromptDraft(
            LoginSession session,
            String sourceAssetId,
            String title,
            String coverAssetId,
            List<String> referenceImageAssetIds
    ) throws Exception {
        return submitImagePromptDraft(session, sourceAssetId, title, coverAssetId, referenceImageAssetIds, true);
    }

    private SubmittedVideo submitImagePromptDraft(
            LoginSession session,
            String sourceAssetId,
            String title,
            String coverAssetId,
            List<String> referenceImageAssetIds,
            boolean expectProcessingQueued
    ) throws Exception {
        MvcResult createDraftResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/video-drafts")
                                .accept(MediaType.APPLICATION_JSON),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        String draftId = readBody(createDraftResult).at("/data/draftId").asText();
        assertThat(draftId).isNotBlank();

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/video-drafts/{id}", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new VideoDraftPayload(
                                        title,
                                        "Integration prompt image summary",
                                        "image_prompt",
                                        "Integration prompt image text",
                                        "集成测试图片提示词",
                                        "Integration prompt image text",
                                        "Integration prompt image raw text",
                                        "GPT-Image-2",
                                        "gpt-image-2",
                                        "animation",
                                        null,
                                        "integration",
                                        "integration-image-prompt",
                                        "integration-image-prompt-001",
                                        "https://integration.example/prompts/image-001",
                                        null,
                                        List.of("integration", "image-prompt"),
                                        null,
                                        "public",
                                        coverAssetId,
                                        sourceAssetId,
                                        referenceImageAssetIds,
                                        List.of()
                                ))),
                        session.accessToken()))
                .andExpect(status().isOk());

        MvcResult submitResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/video-drafts/{id}/submit", draftId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new SubmitDraftPayload("publish"))),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode submitBody = readBody(submitResult);
        assertThat(submitBody.path("code").asText()).isEqualTo("OK");
        if (expectProcessingQueued) {
            assertThat(submitBody.at("/data/lifecycle/processingStatus").asText()).isEqualTo("queued");
            assertThat(submitBody.at("/data/taskIds").size()).isEqualTo(1);
        }

        return new SubmittedVideo(
                draftId,
                submitBody.at("/data/videoId").asText(),
                submitBody.at("/data/taskIds/0").asText()
        );
    }

    private boolean isFfmpegReady() {
        return runCommand(List.of(videoMediaProcessingProperties.resolveFfmpegCommand(), "-version"))
                && runCommand(List.of(videoMediaProcessingProperties.resolveFfprobeCommand(), "-version"));
    }

    private boolean runCommand(List<String> command) {
        try {
            Process process = new ProcessBuilder(command)
                    .redirectErrorStream(true)
                    .start();
            process.getInputStream().readAllBytes();
            int exitCode = process.waitFor();
            return exitCode == 0;
        } catch (Exception ex) {
            return false;
        }
    }

    private Path createSampleVideoFile() throws IOException, InterruptedException {
        Path sampleVideo = Files.createTempFile("dramatv-it-video-", ".mp4");
        sampleVideo.toFile().deleteOnExit();
        Process process = new ProcessBuilder(
                videoMediaProcessingProperties.resolveFfmpegCommand(),
                "-y",
                "-f",
                "lavfi",
                "-i",
                "testsrc=size=640x360:rate=24",
                "-t",
                "2",
                "-pix_fmt",
                "yuv420p",
                sampleVideo.toString()
        ).redirectErrorStream(true).start();
        process.getInputStream().readAllBytes();
        int exitCode = process.waitFor();
        assertThat(exitCode).isEqualTo(0);
        assertThat(Files.size(sampleVideo)).isGreaterThan(0L);
        return sampleVideo;
    }

    private byte[] createSampleImageBytes() throws IOException {
        BufferedImage image = new BufferedImage(640, 360, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < image.getHeight(); y++) {
            for (int x = 0; x < image.getWidth(); x++) {
                int red = (x * 255) / Math.max(1, image.getWidth() - 1);
                int green = (y * 255) / Math.max(1, image.getHeight() - 1);
                int blue = (x + y) % 256;
                image.setRGB(x, y, (red << 16) | (green << 8) | blue);
            }
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        boolean written = ImageIO.write(image, "png", outputStream);
        assertThat(written).isTrue();
        return outputStream.toByteArray();
    }

    private Path resolveAssetFilePath(String objectKey) {
        return mediaStorageProperties.resolvedLocalDirPath()
                .resolve(Path.of(objectKey.replace('/', java.io.File.separatorChar)))
                .normalize();
    }

    private Path resolveWebPublicAssetPath(String objectKey) {
        Path cursor = Path.of("").toAbsolutePath().normalize();
        while (cursor != null) {
            Path publicRoot = cursor.resolve("apps").resolve("web").resolve("public").normalize();
            if (Files.isDirectory(publicRoot)) {
                return publicRoot.resolve(objectKey).normalize();
            }
            cursor = cursor.getParent();
        }

        throw new IllegalStateException("workspace web public root does not exist");
    }

    private record UploadPolicyPayload(
            String fileName,
            String mimeType,
            long sizeBytes,
            String assetRole
    ) {
    }

    private record VideoDraftPayload(
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
            String sourceAssetId,
            List<String> referenceImageAssetIds,
            List<String> referenceAudioAssetIds
    ) {
    }

    private record SubmitDraftPayload(
            String submitMode
    ) {
    }

    private record MediaCallbackPayload(
            String taskId,
            String statusCode,
            String targetType,
            String targetId,
            MediaCallbackResultPayload result
    ) {
    }

    private record MediaCallbackResultPayload(
            String coverAssetId,
            String previewAssetId,
            Long durationMs,
            String errorMessage
    ) {
    }

    private record UploadedAsset(
            String assetId,
            String assetKind,
            String assetRole,
            String statusCode,
            String mediaPath,
            String publicUrl,
            long sizeBytes
    ) {
    }

    private record SubmittedVideo(
            String draftId,
            String videoId,
            String taskId
    ) {
    }
}
