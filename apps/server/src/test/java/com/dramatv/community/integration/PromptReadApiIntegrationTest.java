package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
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
        assertThat(listItem.at("/taxonomy/compositionCategory").isMissingNode() || listItem.at("/taxonomy/compositionCategory").isNull()).isTrue();
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
        assertThat(detailBody.at("/data/taxonomy/compositionCategory").isMissingNode() || detailBody.at("/data/taxonomy/compositionCategory").isNull()).isTrue();
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
    void videoPromptWithoutPreviewKeepsPreviewEmptyWhileStillExposingSource() throws Exception {
        LoginSession author = loginAsRandomUser("prompt-read-video-source-only-author");
        LoginSession viewer = loginAsRandomUser("prompt-read-video-source-only-viewer");
        String promptId = createPublishedPrompt(
                author.userId(),
                "Video prompt source only",
                "video",
                "Video prompt source only summary",
                "Video prompt source only body"
        );
        String relatedPromptId = createPublishedPrompt(
                author.userId(),
                "Video prompt related source only",
                "video",
                "Video prompt related source only summary",
                "Video prompt related source only body"
        );
        String sourceObjectKey = "community/test/prompt-source-only.mp4";
        String sourceAssetId = createPublicMediaAsset(
                author.userId(),
                "video",
                sourceObjectKey,
                "video/mp4"
        );
        String relatedSourceObjectKey = "community/test/prompt-source-only-related.mp4";
        String relatedSourceAssetId = createPublicMediaAsset(
                author.userId(),
                "video",
                relatedSourceObjectKey,
                "video/mp4"
        );

        jdbcTemplate.update("""
                update prompt_entries
                set primary_example_asset_id = ?,
                    example_count = 1,
                    updated_at = now()
                where id = ?
                """,
                UUID.fromString(sourceAssetId),
                UUID.fromString(promptId)
        );
        jdbcTemplate.update("""
                update prompt_entries
                set primary_example_asset_id = ?,
                    example_count = 1,
                    updated_at = now()
                where id = ?
                """,
                UUID.fromString(relatedSourceAssetId),
                UUID.fromString(relatedPromptId)
        );
        jdbcTemplate.update("""
                insert into prompt_example_links (
                    id, prompt_id, media_asset_id, role_code, sort_order, created_at
                )
                values (?, ?, ?, 'example', 0, now())
                """,
                UUID.randomUUID(),
                UUID.fromString(promptId),
                UUID.fromString(sourceAssetId)
        );
        jdbcTemplate.update("""
                insert into prompt_example_links (
                    id, prompt_id, media_asset_id, role_code, sort_order, created_at
                )
                values (?, ?, ?, 'example', 0, now())
                """,
                UUID.randomUUID(),
                UUID.fromString(relatedPromptId),
                UUID.fromString(relatedSourceAssetId)
        );

        MvcResult listResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/prompts")
                        .param("modality", "video")
                        .param("sort", "latest")
                        .param("limit", "500")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode listItem = findItemById(readBody(listResult).at("/data"), promptId);
        assertThat(listItem).isNotNull();
        assertThat(listItem.path("previewUrl").isNull() || listItem.path("previewUrl").asText().isBlank()).isTrue();
        assertThat(listItem.path("sourceUrl").asText()).contains(sourceObjectKey);

        MvcResult detailResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/prompts/{id}", promptId)
                                .accept(MediaType.APPLICATION_JSON),
                        viewer.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode detailBody = readBody(detailResult);
        assertThat(detailBody.at("/data/previewUrl").isNull() || detailBody.at("/data/previewUrl").asText().isBlank()).isTrue();
        assertThat(detailBody.at("/data/sourceUrl").asText()).contains(sourceObjectKey);

        MvcResult relatedResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/prompts/{id}/related", promptId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode relatedItem = findItemById(readBody(relatedResult).at("/data"), relatedPromptId);
        assertThat(relatedItem).isNotNull();
        assertThat(relatedItem.path("previewUrl").isNull() || relatedItem.path("previewUrl").asText().isBlank()).isTrue();
        assertThat(relatedItem.path("sourceUrl").asText()).contains(relatedSourceObjectKey);
    }

    @Test
    void promptDetailExposesReferenceAssetsWithDownloadMetadata() throws Exception {
        LoginSession author = loginAsRandomUser("prompt-read-reference-author");
        LoginSession viewer = loginAsRandomUser("prompt-read-reference-viewer");
        String promptId = createPublishedPrompt(
                author.userId(),
                "Prompt detail references",
                "video",
                "Prompt detail references summary",
                "Prompt detail references body"
        );

        String sourceObjectKey = "community/test/prompt-detail-reference-source.mp4";
        String referenceImageObjectKey = "community/test/prompt-detail-reference-image.png";
        String referenceAudioObjectKey = "community/test/prompt-detail-reference-audio.mp3";
        String sourceAssetId = createPublicMediaAsset(author.userId(), "video", sourceObjectKey, "video/mp4");
        String referenceImageAssetId = createPublicMediaAsset(author.userId(), "image", referenceImageObjectKey, "image/png");
        String referenceAudioAssetId = createPublicMediaAsset(author.userId(), "audio", referenceAudioObjectKey, "audio/mpeg");

        jdbcTemplate.update("""
                update media_assets
                set size_bytes = ?, duration_ms = ?, updated_at = now()
                where id = ?
                """,
                4567L,
                23000,
                UUID.fromString(sourceAssetId)
        );
        jdbcTemplate.update("""
                update media_assets
                set size_bytes = ?, width = ?, height = ?, updated_at = now()
                where id = ?
                """,
                1234L,
                1280,
                720,
                UUID.fromString(referenceImageAssetId)
        );
        jdbcTemplate.update("""
                update media_assets
                set size_bytes = ?, duration_ms = ?, updated_at = now()
                where id = ?
                """,
                2345L,
                18000,
                UUID.fromString(referenceAudioAssetId)
        );

        jdbcTemplate.update("""
                update prompt_entries
                set primary_example_asset_id = ?,
                    example_count = 2,
                    updated_at = now()
                where id = ?
                """,
                UUID.fromString(sourceAssetId),
                UUID.fromString(promptId)
        );

        jdbcTemplate.update("""
                insert into prompt_example_links (
                    id, prompt_id, media_asset_id, role_code, sort_order, created_at
                )
                values (?, ?, ?, ?, ?, now())
                """,
                UUID.randomUUID(),
                UUID.fromString(promptId),
                UUID.fromString(sourceAssetId),
                "example",
                0
        );
        jdbcTemplate.update("""
                insert into prompt_example_links (
                    id, prompt_id, media_asset_id, role_code, sort_order, created_at
                )
                values (?, ?, ?, ?, ?, now())
                """,
                UUID.randomUUID(),
                UUID.fromString(promptId),
                UUID.fromString(referenceImageAssetId),
                "reference_image",
                0
        );
        jdbcTemplate.update("""
                insert into prompt_example_links (
                    id, prompt_id, media_asset_id, role_code, sort_order, created_at
                )
                values (?, ?, ?, ?, ?, now())
                """,
                UUID.randomUUID(),
                UUID.fromString(promptId),
                UUID.fromString(referenceAudioAssetId),
                "reference_audio",
                0
        );

        MvcResult detailResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/prompts/{id}", promptId)
                                .accept(MediaType.APPLICATION_JSON),
                        viewer.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode detailBody = readBody(detailResult);
        assertThat(detailBody.path("code").asText()).isEqualTo("OK");
        assertThat(detailBody.at("/data/sourceUrl").asText()).contains(sourceObjectKey);
        assertThat(detailBody.at("/data/stats/exampleCount").asInt()).isEqualTo(2);

        JsonNode examples = detailBody.at("/data/examples");
        assertThat(examples.isArray()).isTrue();
        assertThat(examples).hasSize(3);
        assertThat(examples.get(0).path("role").asText()).isEqualTo("example");
        assertThat(examples.get(0).path("assetKind").asText()).isEqualTo("video");
        assertThat(examples.get(0).path("fileName").asText()).isEqualTo("prompt-detail-reference-source.mp4");
        assertThat(examples.get(0).path("sizeBytes").asLong()).isEqualTo(4567L);
        assertThat(examples.get(0).path("mimeType").asText()).isEqualTo("video/mp4");
        assertThat(examples.get(0).path("durationMs").asInt()).isEqualTo(23000);
        assertThat(examples.get(0).path("url").asText()).contains(sourceObjectKey);

        JsonNode referenceImage = findExampleByRole(examples, "reference_image");
        assertThat(referenceImage).isNotNull();
        assertThat(referenceImage.path("assetKind").asText()).isEqualTo("image");
        assertThat(referenceImage.path("fileName").asText()).isEqualTo("prompt-detail-reference-image.png");
        assertThat(referenceImage.path("sizeBytes").asLong()).isEqualTo(1234L);
        assertThat(referenceImage.path("mimeType").asText()).isEqualTo("image/png");
        assertThat(referenceImage.path("width").asInt()).isEqualTo(1280);
        assertThat(referenceImage.path("height").asInt()).isEqualTo(720);
        assertThat(referenceImage.path("url").asText()).contains(referenceImageObjectKey);

        JsonNode referenceAudio = findExampleByRole(examples, "reference_audio");
        assertThat(referenceAudio).isNotNull();
        assertThat(referenceAudio.path("assetKind").asText()).isEqualTo("audio");
        assertThat(referenceAudio.path("fileName").asText()).isEqualTo("prompt-detail-reference-audio.mp3");
        assertThat(referenceAudio.path("sizeBytes").asLong()).isEqualTo(2345L);
        assertThat(referenceAudio.path("mimeType").asText()).isEqualTo("audio/mpeg");
        assertThat(referenceAudio.path("durationMs").asInt()).isEqualTo(18000);
        assertThat(referenceAudio.path("url").asText()).contains(referenceAudioObjectKey);
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

    @Test
    void featuredPromptInventoryReturnsCountsFacetsAndCursorPage() throws Exception {
        LoginSession author = loginAsRandomUser("prompt-featured-inventory-author");
        String inventoryKeyword = "featured-inventory-" + UUID.randomUUID().toString().substring(0, 8);
        String imagePromptId = createPublishedPrompt(
                author.userId(),
                inventoryKeyword + " image prompt",
                "image",
                "Featured image summary",
                "cinematic portrait lighting"
        );
        String animationImagePromptId = createPublishedPrompt(
                author.userId(),
                inventoryKeyword + " animation image prompt",
                "image",
                "Featured animation image summary",
                "comic storyboard lighting"
        );
        String seedancePromptId = createPublishedPrompt(
                author.userId(),
                inventoryKeyword + " seedance prompt",
                "video",
                "Featured seedance summary",
                "portrait motion test"
        );
        String wanPromptId = createPublishedPrompt(
                author.userId(),
                inventoryKeyword + " wan prompt",
                "video",
                "Featured wan summary",
                "galaxy motion test"
        );

        jdbcTemplate.update("""
                update prompt_entries
                set model_category = 'nanobanana',
                    content_category = 'animation',
                    updated_at = now()
                where id = ?
                """,
                UUID.fromString(animationImagePromptId)
        );
        jdbcTemplate.update("""
                update prompt_entries
                set model_category = 'wan',
                    content_category = 'animation',
                    updated_at = now()
                where id = ?
                """,
                UUID.fromString(wanPromptId)
        );

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/prompts/featured-inventory")
                        .param("filter", "all")
                        .param("sort", "latest")
                        .param("limit", "2")
                        .param("q", inventoryKeyword)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.path("requestId").asText()).isNotBlank();
        assertThat(body.at("/data/summary/counts/all").asInt()).isEqualTo(4);
        assertThat(body.at("/data/summary/counts/videoPrompt").asInt()).isEqualTo(2);
        assertThat(body.at("/data/summary/counts/imagePrompt").asInt()).isEqualTo(2);
        assertThat(body.at("/data/summary/videoPromptFacets/modelCounts/seedance").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/videoPromptFacets/modelCounts/wan").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/videoPromptFacets/contentCounts/real-person").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/videoPromptFacets/contentCounts/animation").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/imagePromptFacets/modelCounts/gpt-image-2").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/imagePromptFacets/modelCounts/nanobanana").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/imagePromptFacets/contentCounts/real-person").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/imagePromptFacets/contentCounts/animation").asInt()).isEqualTo(1);
        assertThat(body.at("/data/page/items").size()).isEqualTo(2);
        assertThat(body.at("/data/page/hasMore").asBoolean()).isTrue();
        assertThat(body.at("/data/page/nextCursor").asText()).isEqualTo("offset:2");
        assertThat(findItemById(body.at("/data/page/items"), wanPromptId)).isNotNull();
    }

    @Test
    void featuredPromptInventoryAppliesSearchAndFacetFiltersToPage() throws Exception {
        LoginSession author = loginAsRandomUser("prompt-featured-inventory-search-author");
        String inventoryKeyword = "featured-galaxy-" + UUID.randomUUID().toString().substring(0, 8);
        String galaxyImagePromptId = createPublishedPrompt(
                author.userId(),
                inventoryKeyword + " image prompt",
                "image",
                "Galaxy image summary",
                "galaxy illustration"
        );
        String wanPromptId = createPublishedPrompt(
                author.userId(),
                inventoryKeyword + " wan motion prompt",
                "video",
                "Galaxy wan summary",
                "galaxy motion test"
        );
        createPublishedPrompt(
                author.userId(),
                "Portrait seedance prompt",
                "video",
                "Portrait seedance summary",
                "portrait motion test"
        );

        jdbcTemplate.update("""
                update prompt_entries
                set content_category = 'animation',
                    updated_at = now()
                where id = ?
                """,
                UUID.fromString(galaxyImagePromptId)
        );
        jdbcTemplate.update("""
                update prompt_entries
                set model_category = 'wan',
                    content_category = 'animation',
                    updated_at = now()
                where id = ?
                """,
                UUID.fromString(wanPromptId)
        );

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/prompts/featured-inventory")
                        .param("filter", "video_prompt")
                        .param("sort", "latest")
                        .param("q", inventoryKeyword)
                        .param("modelCategory", "wan")
                        .param("contentCategory", "animation")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        JsonNode items = body.at("/data/page/items");
        assertThat(body.at("/data/summary/counts/all").asInt()).isEqualTo(2);
        assertThat(body.at("/data/summary/counts/videoPrompt").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/counts/imagePrompt").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/videoPromptFacets/modelCounts/wan").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/imagePromptFacets/contentCounts/animation").asInt()).isEqualTo(1);
        assertThat(items.size()).isEqualTo(1);
        assertThat(items.get(0).path("id").asText()).isEqualTo(wanPromptId);
        assertThat(body.at("/data/page/hasMore").asBoolean()).isFalse();
        assertThat(body.at("/data/page/nextCursor").isNull()).isTrue();
    }

    private JsonNode findItemById(JsonNode items, String id) {
        for (JsonNode item : items) {
            if (id.equals(item.path("id").asText())) {
                return item;
            }
        }
        return null;
    }

    private JsonNode findExampleByRole(JsonNode items, String role) {
        for (JsonNode item : items) {
            if (role.equals(item.path("role").asText())) {
                return item;
            }
        }
        return null;
    }
}
