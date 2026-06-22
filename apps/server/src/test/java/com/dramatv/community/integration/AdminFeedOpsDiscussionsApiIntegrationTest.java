package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminFeedOpsDiscussionsApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void discussionFeedOpsSupportsChannelAndThreadArrangement() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-feedops-discussions");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("admin-feedops-discussions-author");
        String threadId = createPublishedDiscussionThread(author.userId(), "feedops-discussions-thread", "official-events", "Discussion Focus Thread", "Discussion focus thread body");
        String promptLabThreadId = createPublishedDiscussionThread(author.userId(), "feedops-discussions-prompt-thread", "prompt-lab", "Prompt Lab Discussion", "Prompt lab discussion body");

        String channelId = jdbcTemplate.query(
                "select id from discussion_channels where slug = ?",
                resultSet -> resultSet.next() ? resultSet.getObject("id").toString() : null,
                "official-events"
        );
        assertThat(channelId).isNotBlank();

        MvcResult initialResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/feed-ops/discussions").accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode initialBody = readBody(initialResult);
        assertThat(initialBody.at("/data/summary/pageKey").asText()).isEqualTo("discussions");
        assertThat(initialBody.at("/data/candidatePool").isArray()).isTrue();
        assertThat(initialBody.at("/data/candidatePool").size()).isEqualTo(0);
        assertThat(findSlot(initialBody, "discussion-all-thread-stream").isMissingNode()).isFalse();
        assertThat(findSlot(initialBody, "discussion-channel-official-events-thread-stream").isMissingNode()).isFalse();
        assertThat(findSlot(initialBody, "discussion-channel-prompt-lab-thread-stream").isMissingNode()).isFalse();

        MvcResult channelCandidateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/feed-ops/discussions/candidates")
                                .param("slotKey", "discussion-channel-order")
                                .param("page", "1")
                                .param("pageSize", "20")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode channelCandidateBody = readBody(channelCandidateResult);
        assertThat(findCandidate(channelCandidateBody.at("/data/items"), channelId).path("targetType").asText()).isEqualTo("channel");

        MvcResult threadCandidateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/feed-ops/discussions/candidates")
                                .param("slotKey", "discussion-all-thread-stream")
                                .param("page", "1")
                                .param("pageSize", "20")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode threadCandidateBody = readBody(threadCandidateResult);
        assertThat(findCandidate(threadCandidateBody.at("/data/items"), threadId).path("targetType").asText()).isEqualTo("post");

        MvcResult updateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/admin/feed-ops/discussions")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "statusCode", "published",
                                        "slots", List.of(
                                                Map.of("slotKey", "discussion-channel-order", "items", List.of(Map.of("targetType", "channel", "targetId", channelId))),
                                                Map.of("slotKey", "discussion-all-thread-stream", "items", List.of(Map.of("targetType", "post", "targetId", threadId))),
                                                Map.of("slotKey", "discussion-channel-official-events-thread-stream", "items", List.of(Map.of("targetType", "post", "targetId", threadId))),
                                                Map.of("slotKey", "discussion-channel-prompt-lab-thread-stream", "items", List.of(Map.of("targetType", "post", "targetId", promptLabThreadId)))
                                        )
                                ))),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode updateBody = readBody(updateResult);
        assertThat(updateBody.at("/data/summary/statusCode").asText()).isEqualTo("published");
        assertThat(findSlotItem(updateBody, "discussion-channel-order", channelId).at("/itemTypeLabel").asText()).isEqualTo("讨论频道");
        assertThat(findSlotItem(updateBody, "discussion-all-thread-stream", threadId).at("/channelTitle").asText()).isEqualTo("官方活动");
        assertThat(findSlotItem(updateBody, "discussion-all-thread-stream", threadId).at("/channelSlug").asText()).isEqualTo("official-events");
        assertThat(findSlotItem(updateBody, "discussion-channel-official-events-thread-stream", threadId).path("summaryText").asText()).isNotBlank();
        assertThat(findSlotItem(updateBody, "discussion-channel-prompt-lab-thread-stream", promptLabThreadId).at("/channelSlug").asText()).isEqualTo("prompt-lab");
    }

    private void promoteToRole(String userId, String roleCode) {
        jdbcTemplate.update(
                "update users set role_code = ?, updated_at = now() where id = ?",
                roleCode,
                java.util.UUID.fromString(userId)
        );
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

    private JsonNode findSlotItem(JsonNode body, String slotKey, String targetId) {
        JsonNode slots = body.at("/data/slots");
        if (!slots.isArray()) {
            return objectMapper.getNodeFactory().missingNode();
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
}
