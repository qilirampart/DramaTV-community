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
        assertThat(body.at("/data/layout/slots").size()).isEqualTo(9);
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
                                                                Map.of("targetType", "workflow", "targetId", workflowId)
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
        assertThat(heroItems.size()).isGreaterThanOrEqualTo(2);
        assertThat(heroItems.get(0).path("targetId").asText()).isEqualTo(heroPromptId);
        assertThat(heroItems.get(0).path("itemType").asText()).isEqualTo("prompt");
        assertThat(heroItems.get(0).at("/author/id").asText()).isEqualTo(author.userId());
        assertThat(heroItems.get(0).at("/author/displayName").asText()).isEqualTo(author.username());
        assertThat(heroItems.get(1).path("targetId").asText()).isEqualTo(workflowId);
        assertThat(heroItems.get(1).path("itemType").asText()).isEqualTo("workflow");
        assertThat(heroItems.get(1).at("/author/id").asText()).isEqualTo(author.userId());
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
        String threadId = createPublishedDiscussionThread(
                author.userId(),
                "it-featured-feed-thread-" + UUID.randomUUID().toString().substring(0, 8),
                "official-events",
                "Featured published activity thread",
                "Featured published activity thread body"
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
                                                        Map.of("targetType", "post", "targetId", threadId)
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
        assertThat(findFeaturedSlotItem(body, "featured-activity", threadId)).isNotNull();
        assertThat(findFeaturedSlotItem(body, "featured-video-prompt", videoPromptId).at("/author/id").asText())
                .isEqualTo(author.userId());
        assertThat(findFeaturedSlotItem(body, "featured-workflow", workflowId).at("/author/id").asText())
                .isEqualTo(author.userId());
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

    private JsonNode findFeaturedSlotItem(JsonNode body, String slotKey, String targetId) {
        JsonNode slots = body.at("/data/slots");
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
}
