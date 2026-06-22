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

class FeedReadApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void anonymousHomeFeedReturnsNewestPublishedVideoAndSections() throws Exception {
        LoginSession author = loginAsRandomUser("feed-read");
        String videoId = createPublishedVideo(author.userId(), "Feed integration video");
        jdbcTemplate.update("""
                insert into feed_items (
                    id, channel_code, item_type, target_type, target_id, content_kind,
                    rank_score, status_code, published_at, created_at, updated_at
                )
                values (
                    ?, 'recommend', 'video', 'video', ?, 'workflow_work',
                    99999999.9999, 'active',
                    '2999-01-01T00:00:00Z'::timestamptz,
                    now(),
                    now()
                )
                """,
                UUID.randomUUID(),
                UUID.fromString(videoId)
        );

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/feed/home")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.path("requestId").asText()).isNotBlank();
        assertThat(body.at("/data/items").isArray()).isTrue();
        assertThat(body.at("/data/sections/hotWorkflows").isArray()).isTrue();
        assertThat(body.at("/data/sections/featuredCreators").isArray()).isTrue();

        JsonNode matchedItem = null;
        for (JsonNode item : body.at("/data/items")) {
            if (videoId.equals(item.path("targetId").asText())) {
                matchedItem = item;
                break;
            }
        }

        assertThat(matchedItem).as("expected newly published video to appear in home feed").isNotNull();
        assertThat(matchedItem.path("itemType").asText()).isEqualTo("video");
        assertThat(matchedItem.path("contentKind").asText()).isEqualTo("workflow_work");
        assertThat(matchedItem.path("title").asText()).isEqualTo("Feed integration video");
        assertThat(matchedItem.at("/author/id").asText()).isEqualTo(author.userId());
        assertThat(matchedItem.at("/author/displayName").asText()).isEqualTo(author.username());
    }

    @Test
    void homeFeedDoesNotPromotePromptSourceVideoAsPreviewWhenPreviewAssetIsMissing() throws Exception {
        LoginSession author = loginAsRandomUser("feed-read-prompt-source-only");
        String promptId = createPublishedPrompt(
                author.userId(),
                "Feed prompt source only",
                "video",
                "Feed prompt source only summary",
                "Feed prompt source only body"
        );
        String sourceObjectKey = "community/test/feed-prompt-source-only.mp4";
        String sourceAssetId = createPublicMediaAsset(
                author.userId(),
                "video",
                sourceObjectKey,
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
                insert into feed_items (
                    id, channel_code, item_type, target_type, target_id, content_kind,
                    rank_score, status_code, published_at, created_at, updated_at
                )
                values (
                    ?, 'recommend', 'prompt', 'prompt', ?, 'prompt',
                    99999998.9999, 'active',
                    '2999-01-02T00:00:00Z'::timestamptz,
                    now(),
                    now()
                )
                """,
                UUID.randomUUID(),
                UUID.fromString(promptId)
        );

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/feed/home")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        JsonNode matchedItem = null;
        for (JsonNode item : body.at("/data/items")) {
            if (promptId.equals(item.path("targetId").asText())) {
                matchedItem = item;
                break;
            }
        }

        assertThat(matchedItem).isNotNull();
        assertThat(matchedItem.path("itemType").asText()).isEqualTo("prompt");
        assertThat(matchedItem.path("promptModality").asText()).isEqualTo("video");
        assertThat(matchedItem.path("previewUrl").isNull() || matchedItem.path("previewUrl").asText().isBlank()).isTrue();
        assertThat(matchedItem.path("sourceUrl").asText()).contains(sourceObjectKey);
    }

    @Test
    void featuredFeedDoesNotPromotePromptSourceVideoAsPreviewWhenPreviewAssetIsMissing() throws Exception {
        LoginSession admin = loginAsRandomUser("feed-featured-prompt-source-only-admin");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("feed-featured-prompt-source-only-author");
        String promptId = createPublishedPrompt(
                author.userId(),
                "Featured prompt source only",
                "video",
                "Featured prompt source only summary",
                "Featured prompt source only body"
        );
        String sourceObjectKey = "community/test/featured-prompt-source-only.mp4";
        String sourceAssetId = createPublicMediaAsset(
                author.userId(),
                "video",
                sourceObjectKey,
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
                insert into prompt_example_links (
                    id, prompt_id, media_asset_id, role_code, sort_order, created_at
                )
                values (?, ?, ?, 'example', 0, now())
                """,
                UUID.randomUUID(),
                UUID.fromString(promptId),
                UUID.fromString(sourceAssetId)
        );

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/admin/feed-ops/featured")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "statusCode", "published",
                                        "slots", List.of(
                                                Map.of("slotKey", "featured-video-prompt", "items", List.of(
                                                        Map.of("targetType", "prompt", "targetId", promptId)
                                                ))
                                        )
                                ))),
                        admin.accessToken()))
                .andExpect(status().isOk());

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/feed/featured")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        JsonNode matchedItem = findFeaturedSlotItem(body, "featured-video-prompt", promptId);

        assertThat(matchedItem).isNotNull();
        assertThat(matchedItem.path("itemType").asText()).isEqualTo("prompt");
        assertThat(matchedItem.path("promptModality").asText()).isEqualTo("video");
        assertThat(matchedItem.path("previewUrl").isNull() || matchedItem.path("previewUrl").asText().isBlank()).isTrue();
        assertThat(matchedItem.path("sourceUrl").asText()).contains(sourceObjectKey);
    }

    @Test
    void homeFeedBuildsFallbackLayoutWhenNoPublishedFeedOpsConfigExists() throws Exception {
        jdbcTemplate.update("delete from admin_feed_slot_configs where page_key = 'home'");

        LoginSession author = loginAsRandomUser("feed-home-fallback");
        createPublishedPrompt(
                author.userId(),
                "Fallback home prompt",
                "video",
                "Fallback home summary",
                "Fallback home body"
        );
        createPublishedWorkflow(
                author.userId(),
                "Fallback home workflow",
                "Fallback workflow summary",
                "Fallback workflow scenario"
        );

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/feed/home")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/layout/slots").isArray()).isTrue();
        assertThat(body.at("/data/layout/slots").size()).isEqualTo(8);
        assertThat(body.at("/data/layout/slots/0/key").asText()).isEqualTo("home-hero");
        assertThat(body.at("/data/layout/slots/0/items").isArray()).isTrue();
        assertThat(body.at("/data/layout/slots/0/items").size()).isGreaterThan(0);
    }

    @Test
    void homeFeedReturnsPublishedHomeHeroLayoutFromAdminFeedOps() throws Exception {
        LoginSession admin = loginAsRandomUser("feed-read-admin");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("feed-read-layout-author");
        String heroPromptId = createPublishedPrompt(
                author.userId(),
                "Feed layout hero prompt",
                "video",
                "Layout hero summary",
                "Layout hero prompt body"
        );
        String workflowId = createPublishedWorkflow(
                author.userId(),
                "Feed layout workflow",
                "Layout workflow summary",
                "Layout workflow scenario"
        );
        String imagePromptId = createPublishedPrompt(
                author.userId(),
                "Feed layout image prompt",
                "image",
                "Layout image prompt summary",
                "Layout image prompt body"
        );
        String extraVideoPromptId = createPublishedPrompt(
                author.userId(),
                "Feed layout extra video prompt",
                "video",
                "Layout extra video prompt summary",
                "Layout extra video prompt body"
        );
        String extraImagePromptId = createPublishedPrompt(
                author.userId(),
                "Feed layout extra image prompt",
                "image",
                "Layout extra image prompt summary",
                "Layout extra image prompt body"
        );
        String extraWorkflowId = createPublishedWorkflow(
                author.userId(),
                "Feed layout extra workflow",
                "Layout extra workflow summary",
                "Layout extra workflow scenario"
        );

        mockMvc.perform(authorized(
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
                                                                Map.of("targetType", "prompt", "targetId", imagePromptId),
                                                                Map.of("targetType", "prompt", "targetId", extraVideoPromptId),
                                                                Map.of("targetType", "prompt", "targetId", extraImagePromptId),
                                                                Map.of("targetType", "workflow", "targetId", extraWorkflowId)
                                                        )
                                                )
                                        )
                                ))),
                        admin.accessToken()))
                .andExpect(status().isOk());

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/feed/home")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        JsonNode heroItems = body.at("/data/layout/slots/0/items");
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/layout/slots").isArray()).isTrue();
        assertThat(body.at("/data/layout/slots/0/key").asText()).isEqualTo("home-hero");
        assertThat(heroItems.isArray()).isTrue();
        assertThat(heroItems.size()).isEqualTo(6);
        assertThat(heroItems.get(0).path("targetId").asText()).isEqualTo(heroPromptId);
        assertThat(heroItems.get(0).path("itemType").asText()).isEqualTo("prompt");
        assertThat(heroItems.get(0).at("/author/id").asText()).isEqualTo(author.userId());
        assertThat(heroItems.get(0).at("/author/displayName").asText()).isEqualTo(author.username());
        assertThat(heroItems.get(1).path("targetId").asText()).isEqualTo(workflowId);
        assertThat(heroItems.get(1).path("itemType").asText()).isEqualTo("workflow");
        assertThat(heroItems.get(1).at("/author/id").asText()).isEqualTo(author.userId());
        assertThat(heroItems.get(2).path("targetId").asText()).isEqualTo(imagePromptId);
        assertThat(heroItems.get(3).path("targetId").asText()).isEqualTo(extraVideoPromptId);
        assertThat(heroItems.get(4).path("targetId").asText()).isEqualTo(extraImagePromptId);
        assertThat(heroItems.get(5).path("targetId").asText()).isEqualTo(extraWorkflowId);
    }

    @Test
    void featuredFeedReturnsPublishedFeaturedSlotsFromAdminFeedOps() throws Exception {
        LoginSession admin = loginAsRandomUser("feed-featured-admin");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("feed-featured-author");
        String videoPromptId = createPublishedPrompt(
                author.userId(),
                "Featured published video prompt",
                "video",
                "Featured published video prompt summary",
                "Featured published video prompt body"
        );
        String imagePromptId = createPublishedPrompt(
                author.userId(),
                "Featured published image prompt",
                "image",
                "Featured published image prompt summary",
                "Featured published image prompt body"
        );
        String workflowId = createPublishedWorkflow(
                author.userId(),
                "Featured published workflow",
                "Featured published workflow summary",
                "Featured published workflow scenario"
        );
        String videoPromptCoverAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "media/feed-featured/video-cover.jpg",
                "image/jpeg"
        );
        String imagePromptCoverAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "media/feed-featured/image-cover.jpg",
                "image/jpeg"
        );
        String workflowCoverAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "media/feed-featured/workflow-cover.jpg",
                "image/jpeg"
        );
        updateMediaAssetDimensions(videoPromptCoverAssetId, 1920, 1080);
        updateMediaAssetDimensions(imagePromptCoverAssetId, 960, 1440);
        updateMediaAssetDimensions(workflowCoverAssetId, 1600, 900);
        jdbcTemplate.update(
                "update prompt_entries set cover_asset_id = ?, updated_at = now() where id = ?",
                UUID.fromString(videoPromptCoverAssetId),
                UUID.fromString(videoPromptId)
        );
        jdbcTemplate.update(
                "update prompt_entries set cover_asset_id = ?, updated_at = now() where id = ?",
                UUID.fromString(imagePromptCoverAssetId),
                UUID.fromString(imagePromptId)
        );
        jdbcTemplate.update(
                "update workflows set cover_asset_id = ?, updated_at = now() where id = ?",
                UUID.fromString(workflowCoverAssetId),
                UUID.fromString(workflowId)
        );
        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/admin/feed-ops/featured")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "statusCode", "published",
                                        "slots", List.of(
                                                Map.of("slotKey", "featured-all", "items", List.of(
                                                        Map.of("targetType", "prompt", "targetId", videoPromptId),
                                                        Map.of("targetType", "workflow", "targetId", workflowId)
                                                )),
                                                Map.of("slotKey", "featured-workflow", "items", List.of(
                                                        Map.of("targetType", "workflow", "targetId", workflowId)
                                                )),
                                                Map.of("slotKey", "featured-video-prompt", "items", List.of(
                                                        Map.of("targetType", "prompt", "targetId", videoPromptId)
                                                )),
                                                Map.of("slotKey", "featured-image-prompt", "items", List.of(
                                                        Map.of("targetType", "prompt", "targetId", imagePromptId)
                                                )),
                                                Map.of("slotKey", "featured-activity", "items", List.of(
                                                        Map.of("targetType", "prompt", "targetId", imagePromptId)
                                                ))
                                        )
                                ))),
                        admin.accessToken()))
                .andExpect(status().isOk());

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/feed/featured")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/slots").isArray()).isTrue();
        assertThat(findFeaturedSlotItem(body, "featured-all", videoPromptId)).isNotNull();
        assertThat(findFeaturedSlotItem(body, "featured-workflow", workflowId)).isNotNull();
        assertThat(findFeaturedSlotItem(body, "featured-video-prompt", videoPromptId)).isNotNull();
        assertThat(findFeaturedSlotItem(body, "featured-image-prompt", imagePromptId)).isNotNull();
        assertThat(findFeaturedSlotItem(body, "featured-activity", imagePromptId)).isNotNull();
        assertThat(findFeaturedSlotItem(body, "featured-video-prompt", videoPromptId).at("/author/id").asText())
                .isEqualTo(author.userId());
        assertThat(findFeaturedSlotItem(body, "featured-workflow", workflowId).at("/author/id").asText())
                .isEqualTo(author.userId());
        assertThat(findFeaturedSlotItem(body, "featured-video-prompt", videoPromptId).path("width").asInt()).isEqualTo(1920);
        assertThat(findFeaturedSlotItem(body, "featured-video-prompt", videoPromptId).path("height").asInt()).isEqualTo(1080);
        assertThat(findFeaturedSlotItem(body, "featured-image-prompt", imagePromptId).path("width").asInt()).isEqualTo(960);
        assertThat(findFeaturedSlotItem(body, "featured-image-prompt", imagePromptId).path("height").asInt()).isEqualTo(1440);
        assertThat(findFeaturedSlotItem(body, "featured-workflow", workflowId).path("width").asInt()).isEqualTo(1600);
        assertThat(findFeaturedSlotItem(body, "featured-workflow", workflowId).path("height").asInt()).isEqualTo(900);
    }

    @Test
    void featuredFeedReadsDifferentPublishedConfigsForLatestAndHotSort() throws Exception {
        LoginSession admin = loginAsRandomUser("feed-featured-sort-admin");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("feed-featured-sort-author");
        String latestPromptId = createPublishedPrompt(
                author.userId(),
                "Featured sort latest prompt",
                "video",
                "Featured sort latest summary",
                "Featured sort latest body"
        );
        String hotPromptId = createPublishedPrompt(
                author.userId(),
                "Featured sort hot prompt",
                "image",
                "Featured sort hot summary",
                "Featured sort hot body"
        );

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/admin/feed-ops/featured")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "statusCode", "published",
                                        "slots", List.of(
                                                Map.of("slotKey", "featured-all", "items", List.of(
                                                        Map.of("targetType", "prompt", "targetId", latestPromptId)
                                                ))
                                        )
                                ))),
                        admin.accessToken()))
                .andExpect(status().isOk());

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/admin/feed-ops/featured")
                                .param("sort", "hot")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "statusCode", "published",
                                        "slots", List.of(
                                                Map.of("slotKey", "featured-all", "items", List.of(
                                                        Map.of("targetType", "prompt", "targetId", hotPromptId)
                                                ))
                                        )
                                ))),
                        admin.accessToken()))
                .andExpect(status().isOk());

        MvcResult latestResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/feed/featured")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();
        MvcResult hotResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/feed/featured")
                        .param("sort", "hot")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode latestBody = readBody(latestResult);
        JsonNode hotBody = readBody(hotResult);

        assertThat(findFeaturedSlotItem(latestBody, "featured-all", latestPromptId)).isNotNull();
        assertThat(findFeaturedSlotItem(latestBody, "featured-all", hotPromptId)).isNull();
        assertThat(findFeaturedSlotItem(hotBody, "featured-all", hotPromptId)).isNotNull();
        assertThat(findFeaturedSlotItem(hotBody, "featured-all", latestPromptId)).isNull();
    }

    @Test
    void landingFeedReturnsPublishedLandingSlotFromAdminFeedOps() throws Exception {
        LoginSession admin = loginAsRandomUser("feed-landing-admin");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("feed-landing-author");
        String videoPromptId = createPublishedPrompt(
                author.userId(),
                "Landing published video prompt",
                "video",
                "Landing published video prompt summary",
                "Landing published video prompt body"
        );
        String imagePromptId = createPublishedPrompt(
                author.userId(),
                "Landing published image prompt",
                "image",
                "Landing published image prompt summary",
                "Landing published image prompt body"
        );
        String workflowId = createPublishedWorkflow(
                author.userId(),
                "Landing published workflow",
                "Landing published workflow summary",
                "Landing published workflow scenario"
        );
        String videoPromptCoverAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "media/feed-landing/video-cover.jpg",
                "image/jpeg"
        );
        String imagePromptCoverAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "media/feed-landing/image-cover.jpg",
                "image/jpeg"
        );
        String workflowCoverAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "media/feed-landing/workflow-cover.jpg",
                "image/jpeg"
        );
        updateMediaAssetDimensions(videoPromptCoverAssetId, 1600, 900);
        updateMediaAssetDimensions(imagePromptCoverAssetId, 1080, 1440);
        updateMediaAssetDimensions(workflowCoverAssetId, 1440, 900);
        jdbcTemplate.update(
                "update prompt_entries set cover_asset_id = ?, updated_at = now() where id = ?",
                UUID.fromString(videoPromptCoverAssetId),
                UUID.fromString(videoPromptId)
        );
        jdbcTemplate.update(
                "update prompt_entries set cover_asset_id = ?, updated_at = now() where id = ?",
                UUID.fromString(imagePromptCoverAssetId),
                UUID.fromString(imagePromptId)
        );
        jdbcTemplate.update(
                "update workflows set cover_asset_id = ?, updated_at = now() where id = ?",
                UUID.fromString(workflowCoverAssetId),
                UUID.fromString(workflowId)
        );

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/admin/feed-ops/landing")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "statusCode", "published",
                                        "slots", List.of(
                                                Map.of("slotKey", "landing-archive-grid", "items", List.of(
                                                        Map.of("targetType", "prompt", "targetId", videoPromptId),
                                                        Map.of("targetType", "workflow", "targetId", workflowId),
                                                        Map.of("targetType", "prompt", "targetId", imagePromptId)
                                                ))
                                        )
                                ))),
                        admin.accessToken()))
                .andExpect(status().isOk());

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/feed/landing")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        JsonNode slot = findFeaturedSlot(body, "landing-archive-grid");
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(slot).isNotNull();
        assertThat(slot.path("items").isArray()).isTrue();
        assertThat(slot.path("items").size()).isGreaterThanOrEqualTo(3);
        assertThat(findFeaturedSlotItem(body, "landing-archive-grid", videoPromptId)).isNotNull();
        assertThat(findFeaturedSlotItem(body, "landing-archive-grid", workflowId)).isNotNull();
        assertThat(findFeaturedSlotItem(body, "landing-archive-grid", imagePromptId)).isNotNull();
        assertThat(findFeaturedSlotItem(body, "landing-archive-grid", videoPromptId).at("/author/id").asText())
                .isEqualTo(author.userId());
        assertThat(findFeaturedSlotItem(body, "landing-archive-grid", workflowId).at("/author/id").asText())
                .isEqualTo(author.userId());
        assertThat(findFeaturedSlotItem(body, "landing-archive-grid", videoPromptId).path("width").asInt()).isEqualTo(1600);
        assertThat(findFeaturedSlotItem(body, "landing-archive-grid", videoPromptId).path("height").asInt()).isEqualTo(900);
        assertThat(findFeaturedSlotItem(body, "landing-archive-grid", imagePromptId).path("width").asInt()).isEqualTo(1080);
        assertThat(findFeaturedSlotItem(body, "landing-archive-grid", imagePromptId).path("height").asInt()).isEqualTo(1440);
        assertThat(findFeaturedSlotItem(body, "landing-archive-grid", workflowId).path("width").asInt()).isEqualTo(1440);
        assertThat(findFeaturedSlotItem(body, "landing-archive-grid", workflowId).path("height").asInt()).isEqualTo(900);
    }

    @Test
    void homeFeedIgnoresDraftHomeFeedOpsConfig() throws Exception {
        LoginSession admin = loginAsRandomUser("feed-home-draft-admin");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("feed-home-draft-author");
        String heroPromptId = createPublishedPrompt(
                author.userId(),
                "Draft only home prompt",
                "video",
                "Draft only home summary",
                "Draft only home body"
        );
        jdbcTemplate.update(
                "update prompt_entries set published_at = now() - interval '30 days', updated_at = now() - interval '30 days' where id = ?",
                UUID.fromString(heroPromptId)
        );

        for (int index = 0; index < 4; index += 1) {
            createPublishedPrompt(
                    author.userId(),
                    "Newer fallback home prompt " + index,
                    "video",
                    "Newer fallback home summary " + index,
                    "Newer fallback home body " + index
            );
        }

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/admin/feed-ops/home")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "statusCode", "draft",
                                        "slots", List.of(
                                                Map.of(
                                                        "slotKey", "home-hero",
                                                        "items", List.of(
                                                                Map.of("targetType", "prompt", "targetId", heroPromptId)
                                                        )
                                                )
                                        )
                                ))),
                        admin.accessToken()))
                .andExpect(status().isOk());

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/feed/home")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(findLayoutSlotItem(body, "home-hero", heroPromptId)).isNull();
    }

    @Test
    void featuredFeedIgnoresDraftFeaturedFeedOpsConfig() throws Exception {
        LoginSession admin = loginAsRandomUser("feed-featured-draft-admin");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("feed-featured-draft-author");
        String videoPromptId = createPublishedPrompt(
                author.userId(),
                "Draft only featured prompt",
                "video",
                "Draft only featured summary",
                "Draft only featured body"
        );
        jdbcTemplate.update(
                "update prompt_entries set published_at = now() - interval '30 days', updated_at = now() - interval '30 days' where id = ?",
                UUID.fromString(videoPromptId)
        );

        for (int index = 0; index < 14; index += 1) {
            createPublishedPrompt(
                    author.userId(),
                    "Featured draft newer prompt " + index,
                    "video",
                    "Featured draft newer summary " + index,
                    "Featured draft newer body " + index
            );
        }

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/admin/feed-ops/featured")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "statusCode", "draft",
                                        "slots", List.of(
                                                Map.of("slotKey", "featured-video-prompt", "items", List.of(
                                                        Map.of("targetType", "prompt", "targetId", videoPromptId)
                                                ))
                                        )
                                ))),
                        admin.accessToken()))
                .andExpect(status().isOk());

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/feed/featured")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(findFeaturedSlotItem(body, "featured-video-prompt", videoPromptId)).isNull();
    }

    @Test
    void landingFeedIgnoresDraftLandingFeedOpsConfig() throws Exception {
        LoginSession admin = loginAsRandomUser("feed-landing-draft-admin");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("feed-landing-draft-author");
        String oldPromptId = createPublishedPrompt(
                author.userId(),
                "Draft only landing prompt",
                "video",
                "Draft only landing summary",
                "Draft only landing body"
        );
        jdbcTemplate.update(
                "update prompt_entries set published_at = now() - interval '30 days', updated_at = now() - interval '30 days' where id = ?",
                UUID.fromString(oldPromptId)
        );

        for (int index = 0; index < 14; index += 1) {
            createPublishedPrompt(
                    author.userId(),
                    "Landing fallback newer prompt " + index,
                    index % 2 == 0 ? "video" : "image",
                    "Landing fallback newer summary " + index,
                    "Landing fallback newer body " + index
            );
        }

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/admin/feed-ops/landing")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "statusCode", "draft",
                                        "slots", List.of(
                                                Map.of("slotKey", "landing-archive-grid", "items", List.of(
                                                        Map.of("targetType", "prompt", "targetId", oldPromptId)
                                                ))
                                        )
                                ))),
                        admin.accessToken()))
                .andExpect(status().isOk());

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/feed/landing")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(findFeaturedSlotItem(body, "landing-archive-grid", oldPromptId)).isNull();
    }

    @Test
    void featuredFeedReturnsEmptyPromptPinsWhenNoPublishedFeaturedConfigExists() throws Exception {
        jdbcTemplate.update("delete from admin_feed_slot_configs where page_key = 'featured'");
        LoginSession author = loginAsRandomUser("feed-featured-image-fill");

        String latestVideoPromptId = createPublishedPrompt(
                author.userId(),
                "Featured latest video prompt",
                "video",
                "Featured latest video prompt summary",
                "Featured latest video prompt body"
        );
        jdbcTemplate.update(
                "update prompt_entries set published_at = now() - interval '1 minute', updated_at = now() - interval '1 minute' where id = ?",
                UUID.fromString(latestVideoPromptId)
        );

        for (int index = 0; index < 12; index += 1) {
            String imagePromptId = createPublishedPrompt(
                    author.userId(),
                    "Featured image prompt " + index,
                    "image",
                    "Featured image prompt summary " + index,
                    "Featured image prompt body " + index
            );
            jdbcTemplate.update(
                    "update prompt_entries set published_at = now() - (? * interval '1 minute'), updated_at = now() - (? * interval '1 minute') where id = ?",
                    index + 2,
                    index + 2,
                    UUID.fromString(imagePromptId)
            );
        }

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/feed/featured")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        JsonNode imageSlot = findFeaturedSlot(body, "featured-image-prompt");
        JsonNode videoSlot = findFeaturedSlot(body, "featured-video-prompt");
        JsonNode allSlot = findFeaturedSlot(body, "featured-all");

        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(allSlot).isNotNull();
        assertThat(allSlot.path("items").isArray()).isTrue();
        assertThat(allSlot.path("items")).isEmpty();
        assertThat(imageSlot).isNotNull();
        assertThat(imageSlot.path("items").isArray()).isTrue();
        assertThat(imageSlot.path("items")).isEmpty();

        assertThat(videoSlot).isNotNull();
        assertThat(videoSlot.path("items").isArray()).isTrue();
        assertThat(videoSlot.path("items")).isEmpty();
    }

    @Test
    void featuredInventoryReturnsAllCountsAndCursorPage() throws Exception {
        LoginSession author = loginAsRandomUser("feed-featured-inventory-all");
        String inventoryKeyword = "feed-featured-inventory-all-" + UUID.randomUUID().toString().substring(0, 8);
        String imagePromptId = createPublishedPrompt(
                author.userId(),
                inventoryKeyword + " image prompt",
                "image",
                "Featured inventory image summary",
                "Featured inventory image body"
        );
        String videoPromptId = createPublishedPrompt(
                author.userId(),
                inventoryKeyword + " video prompt",
                "video",
                "Featured inventory video summary",
                "Featured inventory video body"
        );
        String workflowId = createPublishedWorkflow(
                author.userId(),
                inventoryKeyword + " workflow",
                "Featured inventory workflow summary",
                "Featured inventory workflow scenario"
        );
        String imagePromptCoverAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "media/feed-featured-inventory/image-cover.jpg",
                "image/jpeg"
        );
        String videoPromptCoverAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "media/feed-featured-inventory/video-cover.jpg",
                "image/jpeg"
        );
        String workflowCoverAssetId = createPublicMediaAsset(
                author.userId(),
                "image",
                "media/feed-featured-inventory/workflow-cover.jpg",
                "image/jpeg"
        );
        updateMediaAssetDimensions(imagePromptCoverAssetId, 900, 1440);
        updateMediaAssetDimensions(videoPromptCoverAssetId, 1280, 720);
        updateMediaAssetDimensions(workflowCoverAssetId, 1600, 900);
        jdbcTemplate.update(
                "update prompt_entries set cover_asset_id = ?, updated_at = now() where id = ?",
                UUID.fromString(imagePromptCoverAssetId),
                UUID.fromString(imagePromptId)
        );
        jdbcTemplate.update(
                "update prompt_entries set cover_asset_id = ?, updated_at = now() where id = ?",
                UUID.fromString(videoPromptCoverAssetId),
                UUID.fromString(videoPromptId)
        );
        jdbcTemplate.update(
                "update workflows set cover_asset_id = ?, updated_at = now() where id = ?",
                UUID.fromString(workflowCoverAssetId),
                UUID.fromString(workflowId)
        );
        String threadId = createPublishedDiscussionThread(
                author.userId(),
                "it-feed-featured-inventory-all-" + UUID.randomUUID().toString().substring(0, 8),
                "official-events",
                inventoryKeyword + " activity thread",
                "Featured inventory activity body"
        );

        jdbcTemplate.update("""
                update prompt_entries
                set model_category = 'nanobanana',
                    content_category = 'animation',
                    published_at = now() - interval '4 minutes',
                    updated_at = now() - interval '4 minutes'
                where id = ?
                """,
                UUID.fromString(imagePromptId)
        );
        jdbcTemplate.update("""
                update prompt_entries
                set model_category = 'wan',
                    content_category = 'real-person',
                    published_at = now() - interval '3 minutes',
                    updated_at = now() - interval '3 minutes'
                where id = ?
                """,
                UUID.fromString(videoPromptId)
        );
        jdbcTemplate.update("""
                update workflows
                set allow_copy = true,
                    published_at = now() - interval '2 minutes',
                    updated_at = now() - interval '2 minutes'
                where id = ?
                """,
                UUID.fromString(workflowId)
        );
        jdbcTemplate.update("""
                update discussion_threads
                set published_at = now() - interval '1 minute',
                    updated_at = now() - interval '1 minute',
                    last_activity_at = now() - interval '1 minute'
                where id = ?
                """,
                UUID.fromString(threadId)
        );

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/feed/featured-inventory")
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
        assertThat(body.at("/data/summary/counts/all").asInt()).isEqualTo(3);
        assertThat(body.at("/data/summary/counts/workflow").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/counts/videoPrompt").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/counts/imagePrompt").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/counts/activity").asInt()).isEqualTo(0);
        assertThat(body.at("/data/summary/workflowFacets/copyable").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/workflowFacets/placeholder").asInt()).isEqualTo(0);
        assertThat(body.at("/data/summary/videoPromptFacets/modelCounts/wan").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/imagePromptFacets/modelCounts/nanobanana").asInt()).isEqualTo(1);
        assertThat(body.at("/data/page/items").size()).isEqualTo(2);
        assertThat(body.at("/data/page/hasMore").asBoolean()).isTrue();
        assertThat(body.at("/data/page/nextCursor").asText()).isEqualTo("offset:2");
        assertThat(body.at("/data/page/items/0/itemType").asText()).isEqualTo("workflow");
        assertThat(body.at("/data/page/items/0/targetId").asText()).isEqualTo(workflowId);
        assertThat(body.at("/data/page/items/0/width").asInt()).isEqualTo(1600);
        assertThat(body.at("/data/page/items/0/height").asInt()).isEqualTo(900);
        assertThat(body.at("/data/page/items/1/itemType").asText()).isEqualTo("prompt");
        assertThat(body.at("/data/page/items/1/promptModality").asText()).isEqualTo("video");
        assertThat(body.at("/data/page/items/1/targetId").asText()).isEqualTo(videoPromptId);
        assertThat(body.at("/data/page/items/1/width").asInt()).isEqualTo(1280);
        assertThat(body.at("/data/page/items/1/height").asInt()).isEqualTo(720);
    }

    @Test
    void featuredInventoryAppliesWorkflowTypeFilterWithRealFacetCounts() throws Exception {
        LoginSession author = loginAsRandomUser("feed-featured-inventory-workflow");
        String inventoryKeyword = "feed-featured-inventory-workflow-" + UUID.randomUUID().toString().substring(0, 8);
        String copyableWorkflowId = createPublishedWorkflow(
                author.userId(),
                inventoryKeyword + " copyable workflow",
                "Copyable workflow summary",
                "Copyable workflow scenario"
        );
        String placeholderWorkflowId = createPublishedWorkflow(
                author.userId(),
                inventoryKeyword + " placeholder workflow",
                "Placeholder workflow summary",
                "Placeholder workflow scenario"
        );

        jdbcTemplate.update("""
                update workflows
                set allow_copy = true,
                    published_at = now() - interval '1 minute',
                    updated_at = now() - interval '1 minute'
                where id = ?
                """,
                UUID.fromString(copyableWorkflowId)
        );
        jdbcTemplate.update("""
                update workflows
                set allow_copy = false,
                    published_at = now() - interval '2 minutes',
                    updated_at = now() - interval '2 minutes'
                where id = ?
                """,
                UUID.fromString(placeholderWorkflowId)
        );

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/feed/featured-inventory")
                        .param("filter", "workflow")
                        .param("workflowType", "copyable")
                        .param("q", inventoryKeyword)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        JsonNode items = body.at("/data/page/items");
        assertThat(body.at("/data/summary/counts/all").asInt()).isEqualTo(2);
        assertThat(body.at("/data/summary/counts/workflow").asInt()).isEqualTo(2);
        assertThat(body.at("/data/summary/workflowFacets/copyable").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/workflowFacets/placeholder").asInt()).isEqualTo(1);
        assertThat(items.size()).isEqualTo(1);
        assertThat(items.get(0).path("targetId").asText()).isEqualTo(copyableWorkflowId);
        assertThat(items.get(0).path("allowCopy").asBoolean()).isTrue();
        assertThat(body.at("/data/page/hasMore").asBoolean()).isFalse();
    }

    @Test
    void featuredInventoryAppliesPromptFacetFilters() throws Exception {
        LoginSession author = loginAsRandomUser("feed-featured-inventory-prompts");
        String inventoryKeyword = "feed-featured-inventory-prompts-" + UUID.randomUUID().toString().substring(0, 8);
        createPublishedPrompt(
                author.userId(),
                inventoryKeyword + " image prompt",
                "image",
                "Inventory image summary",
                "Inventory image body"
        );
        String wanPromptId = createPublishedPrompt(
                author.userId(),
                inventoryKeyword + " wan prompt",
                "video",
                "Inventory wan summary",
                "Inventory wan body"
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

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/feed/featured-inventory")
                        .param("filter", "video_prompt")
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
        assertThat(items.size()).isEqualTo(1);
        assertThat(items.get(0).path("targetId").asText()).isEqualTo(wanPromptId);
        assertThat(items.get(0).path("promptModality").asText()).isEqualTo("video");
    }

    @Test
    void featuredInventorySearchesSemanticRealPersonCategory() throws Exception {
        LoginSession author = loginAsRandomUser("feed-featured-inventory-real-person");
        String inventoryKeyword = "feed-featured-inventory-real-person-" + UUID.randomUUID().toString().substring(0, 8);
        String promptId = createPublishedPrompt(
                author.userId(),
                inventoryKeyword + " portrait prompt",
                "video",
                "真人 portrait summary",
                "real person video body"
        );

        jdbcTemplate.update("""
                update prompt_entries
                set model_category = 'wan',
                    content_category = 'real-person',
                    updated_at = now()
                where id = ?
                """,
                UUID.fromString(promptId)
        );

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/feed/featured-inventory")
                        .param("filter", "video_prompt")
                        .param("sort", "latest")
                        .param("q", "真人")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        JsonNode items = body.at("/data/page/items");
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/summary/counts/videoPrompt").asInt()).isGreaterThanOrEqualTo(1);
        assertThat(items.size()).isGreaterThanOrEqualTo(1);
        assertThat(findItemById(items, promptId)).isNotNull();
    }

    @Test
    void featuredInventoryActivityTabReturnsEmptyInventoryBecauseActivityUsesCuratedSlots() throws Exception {
        LoginSession author = loginAsRandomUser("feed-featured-inventory-activity");
        String inventoryKeyword = "feed-featured-inventory-activity-" + UUID.randomUUID().toString().substring(0, 8);
        createPublishedDiscussionThread(
                author.userId(),
                "it-feed-featured-inventory-activity-" + UUID.randomUUID().toString().substring(0, 8),
                "official-events",
                inventoryKeyword + " activity thread",
                "Inventory activity body"
        );

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/feed/featured-inventory")
                        .param("filter", "activity")
                        .param("q", inventoryKeyword)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        JsonNode items = body.at("/data/page/items");
        assertThat(body.at("/data/summary/counts/all").asInt()).isEqualTo(0);
        assertThat(body.at("/data/summary/counts/activity").asInt()).isEqualTo(0);
        assertThat(items.size()).isEqualTo(0);
    }

    private void promoteToRole(String userId, String roleCode) {
        jdbcTemplate.update(
                "update users set role_code = ?, updated_at = now() where id = ?",
                roleCode,
                UUID.fromString(userId)
        );
    }

    private JsonNode findLayoutSlotItem(JsonNode body, String slotKey, String targetId) {
        JsonNode slots = body.at("/data/layout/slots");
        if (!slots.isArray()) {
            return null;
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
        return null;
    }

    private void updateMediaAssetDimensions(String assetId, int width, int height) {
        jdbcTemplate.update(
                "update media_assets set width = ?, height = ?, updated_at = now() where id = ?",
                width,
                height,
                UUID.fromString(assetId)
        );
    }

    private JsonNode findFeaturedSlotItem(JsonNode body, String slotKey, String targetId) {
        JsonNode slot = findFeaturedSlot(body, slotKey);
        if (slot == null) {
            return null;
        }
        for (JsonNode item : slot.path("items")) {
            if (targetId.equals(item.path("targetId").asText())) {
                return item;
            }
        }
        return null;
    }

    private JsonNode findFeaturedSlot(JsonNode body, String slotKey) {
        JsonNode slots = body.at("/data/slots");
        if (!slots.isArray()) {
            return null;
        }
        for (JsonNode slot : slots) {
            if (!slotKey.equals(slot.path("key").asText())) {
                continue;
            }
            return slot;
        }
        return null;
    }

    private JsonNode findItemById(JsonNode items, String id) {
        for (JsonNode item : items) {
            if (id.equals(item.path("id").asText()) || id.equals(item.path("targetId").asText())) {
                return item;
            }
        }
        return null;
    }
}
