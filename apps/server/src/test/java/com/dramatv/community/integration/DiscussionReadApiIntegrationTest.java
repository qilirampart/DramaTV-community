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

class DiscussionReadApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void discussionHomeAndThreadDetailExposePublishedThreadPublicly() throws Exception {
        LoginSession author = loginAsRandomUser("discussion-read");
        String slug = "it-discussion-" + UUID.randomUUID().toString().substring(0, 8);
        String title = "Discussion read integration thread";
        String content = "Thread body for the discussion read integration test.";
        String threadId = createPublishedDiscussionThread(
                author.userId(),
                slug,
                "official-events",
                title,
                content
        );
        String relatedThreadId = createPublishedDiscussionThread(
                author.userId(),
                "it-discussion-related-" + UUID.randomUUID().toString().substring(0, 8),
                "official-events",
                "Discussion read related thread",
                "Related thread body for the discussion read integration test."
        );

        MvcResult homeResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/discussions/home")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode homeBody = readBody(homeResult);
        assertThat(homeBody.path("code").asText()).isEqualTo("OK");
        assertThat(homeBody.path("requestId").asText()).isNotBlank();
        assertThat(homeBody.at("/data/channels").isArray()).isTrue();
        assertThat(homeBody.at("/data/featuredThreads").isArray()).isTrue();
        assertThat(findThreadCard(homeBody.at("/data/featuredThreads"), threadId)).isNotNull();

        MvcResult filteredHomeResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/discussions/home")
                        .param("channel", "official-events")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode filteredHomeBody = readBody(filteredHomeResult);
        JsonNode filteredCard = findThreadCard(filteredHomeBody.at("/data/featuredThreads"), threadId);
        assertThat(filteredCard).as("expected published thread to appear in its channel feed").isNotNull();
        assertThat(filteredCard.path("slug").asText()).isEqualTo(slug);
        assertThat(filteredCard.path("title").asText()).isEqualTo(title);
        assertThat(filteredCard.path("channelSlug").asText()).isEqualTo("official-events");
        assertThat(filteredCard.at("/author/id").asText()).isEqualTo(author.userId());

        MvcResult detailResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/discussions/threads/{slug}", slug)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode detailBody = readBody(detailResult);
        assertThat(detailBody.path("code").asText()).isEqualTo("OK");
        assertThat(detailBody.path("requestId").asText()).isNotBlank();
        assertThat(detailBody.at("/data/id").asText()).isEqualTo(threadId);
        assertThat(detailBody.at("/data/slug").asText()).isEqualTo(slug);
        assertThat(detailBody.at("/data/title").asText()).isEqualTo(title);
        assertThat(detailBody.at("/data/content").asText()).isEqualTo(content);
        assertThat(detailBody.at("/data/channel/slug").asText()).isEqualTo("official-events");
        assertThat(detailBody.at("/data/author/id").asText()).isEqualTo(author.userId());
        assertThat(detailBody.at("/data/commentPolicy/commentingEnabled").isBoolean()).isTrue();
        assertThat(findThreadCard(detailBody.at("/data/relatedThreads"), relatedThreadId)).isNotNull();
    }

    @Test
    void discussionHomePrioritizesPublishedFeedOpsOrdering() throws Exception {
        LoginSession admin = loginAsRandomUser("discussion-feedops-order");
        promoteToRole(admin.userId(), "operator");
        LoginSession author = loginAsRandomUser("discussion-feedops-order-author");

        String olderOfficialThreadId = createPublishedDiscussionThread(
                author.userId(),
                "it-discussion-official-older-" + UUID.randomUUID().toString().substring(0, 8),
                "official-events",
                "Official Older Thread",
                "Older official thread body"
        );
        String newerOfficialThreadId = createPublishedDiscussionThread(
                author.userId(),
                "it-discussion-official-newer-" + UUID.randomUUID().toString().substring(0, 8),
                "official-events",
                "Official Newer Thread",
                "Newer official thread body"
        );
        String promptThreadId = createPublishedDiscussionThread(
                author.userId(),
                "it-discussion-prompt-" + UUID.randomUUID().toString().substring(0, 8),
                "prompt-lab",
                "Prompt Lab Priority Thread",
                "Prompt lab priority thread body"
        );

        String officialChannelId = jdbcTemplate.query(
                "select id from discussion_channels where slug = ?",
                resultSet -> resultSet.next() ? resultSet.getObject("id").toString() : null,
                "official-events"
        );
        String promptChannelId = jdbcTemplate.query(
                "select id from discussion_channels where slug = ?",
                resultSet -> resultSet.next() ? resultSet.getObject("id").toString() : null,
                "prompt-lab"
        );
        assertThat(officialChannelId).isNotBlank();
        assertThat(promptChannelId).isNotBlank();

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/admin/feed-ops/discussions")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "statusCode", "published",
                                        "slots", List.of(
                                                Map.of("slotKey", "discussion-channel-order", "items", List.of(
                                                        Map.of("targetType", "channel", "targetId", officialChannelId),
                                                        Map.of("targetType", "channel", "targetId", promptChannelId)
                                                )),
                                                Map.of("slotKey", "discussion-all-thread-stream", "items", List.of(
                                                        Map.of("targetType", "post", "targetId", promptThreadId),
                                                        Map.of("targetType", "post", "targetId", olderOfficialThreadId)
                                                )),
                                                Map.of("slotKey", "discussion-channel-official-events-thread-stream", "items", List.of(
                                                        Map.of("targetType", "post", "targetId", olderOfficialThreadId)
                                                )),
                                                Map.of("slotKey", "discussion-channel-prompt-lab-thread-stream", "items", List.of(
                                                        Map.of("targetType", "post", "targetId", promptThreadId)
                                                ))
                                        )
                                ))),
                        admin.accessToken()))
                .andExpect(status().isOk());

        MvcResult homeResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/discussions/home")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode homeBody = readBody(homeResult);
        assertThat(homeBody.at("/data/channels/0/slug").asText()).isEqualTo("official-events");
        assertThat(homeBody.at("/data/channels/1/slug").asText()).isEqualTo("prompt-lab");
        assertThat(homeBody.at("/data/featuredThreads/0/id").asText()).isEqualTo(promptThreadId);
        assertThat(homeBody.at("/data/featuredThreads/1/id").asText()).isEqualTo(olderOfficialThreadId);

        MvcResult officialResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/discussions/home")
                        .param("channel", "official-events")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode officialBody = readBody(officialResult);
        assertThat(officialBody.at("/data/featuredThreads/0/id").asText()).isEqualTo(olderOfficialThreadId);
        assertThat(findThreadCard(officialBody.at("/data/featuredThreads"), newerOfficialThreadId)).isNotNull();

        MvcResult promptResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/discussions/home")
                        .param("channel", "prompt-lab")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode promptBody = readBody(promptResult);
        assertThat(promptBody.at("/data/featuredThreads/0/id").asText()).isEqualTo(promptThreadId);
    }

    @Test
    void discussionHomeIgnoresDraftFeedOpsOrdering() throws Exception {
        LoginSession admin = loginAsRandomUser("discussion-feedops-draft");
        promoteToRole(admin.userId(), "operator");
        LoginSession author = loginAsRandomUser("discussion-feedops-draft-author");

        String threadId = createPublishedDiscussionThread(
                author.userId(),
                "it-discussion-draft-" + UUID.randomUUID().toString().substring(0, 8),
                "official-events",
                "Discussion Draft Ordered Thread",
                "Discussion draft ordered thread body"
        );
        jdbcTemplate.update(
                "update discussion_threads set published_at = now() - interval '30 days', last_activity_at = now() - interval '30 days', updated_at = now() - interval '30 days' where id = ?",
                UUID.fromString(threadId)
        );
        for (int index = 0; index < 12; index += 1) {
            createPublishedDiscussionThread(
                    author.userId(),
                    "it-discussion-draft-newer-" + index + "-" + UUID.randomUUID().toString().substring(0, 4),
                    "official-events",
                    "Discussion Draft Newer Thread " + index,
                    "Discussion draft newer thread body " + index
            );
        }
        String officialChannelId = jdbcTemplate.query(
                "select id from discussion_channels where slug = ?",
                resultSet -> resultSet.next() ? resultSet.getObject("id").toString() : null,
                "official-events"
        );
        assertThat(officialChannelId).isNotBlank();

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/admin/feed-ops/discussions")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "statusCode", "draft",
                                        "slots", List.of(
                                                Map.of("slotKey", "discussion-channel-order", "items", List.of(
                                                        Map.of("targetType", "channel", "targetId", officialChannelId)
                                                )),
                                                Map.of("slotKey", "discussion-all-thread-stream", "items", List.of(
                                                        Map.of("targetType", "post", "targetId", threadId)
                                                )),
                                                Map.of("slotKey", "discussion-channel-official-events-thread-stream", "items", List.of(
                                                        Map.of("targetType", "post", "targetId", threadId)
                                                ))
                                        )
                                ))),
                        admin.accessToken()))
                .andExpect(status().isOk());

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/api/discussions/home")
                        .param("channel", "official-events")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/featuredThreads/0/id").asText()).isNotEqualTo(threadId);
    }

    private void promoteToRole(String userId, String roleCode) {
        jdbcTemplate.update(
                "update users set role_code = ?, updated_at = now() where id = ?",
                roleCode,
                java.util.UUID.fromString(userId)
        );
    }

    private JsonNode findThreadCard(JsonNode items, String threadId) {
        for (JsonNode item : items) {
            if (threadId.equals(item.path("id").asText())) {
                return item;
            }
        }
        return null;
    }
}
