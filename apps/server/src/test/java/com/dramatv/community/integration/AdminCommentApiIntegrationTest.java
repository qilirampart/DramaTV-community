package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminCommentApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void adminCommentListReturnsLiveCommentsAndFilteredSummary() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-comments-list");
        promoteToRole(admin.userId(), "moderator");

        LoginSession author = loginAsRandomUser("admin-comments-author");
        String videoId = createPublishedVideo(author.userId(), "Admin list video target");
        String promptId = createPublishedPrompt(author.userId(), "Admin list prompt target", "video", "summary", "prompt");
        String threadId = createPublishedDiscussionThread(
                author.userId(),
                "admin-comments-thread-" + System.currentTimeMillis(),
                "official-events",
                "Admin list discussion target",
                "thread content"
        );

        String queryToken = "admin-comments-token";
        String activeCommentId = createActiveComment(author.userId(), "video", videoId, queryToken + " active comment");
        String hiddenCommentId = createActiveComment(author.userId(), "prompt", promptId, queryToken + " hidden comment");
        String postCommentId = createActiveComment(author.userId(), "post", threadId, queryToken + " reported thread comment");

        jdbcTemplate.update("update comments set status_code = 'hidden', updated_at = now() where id = ?", UUID.fromString(hiddenCommentId));
        jdbcTemplate.update("update videos set comments_enabled = false, updated_at = now() where id = ?", UUID.fromString(videoId));
        insertReportTicket(admin.userId(), postCommentId, "abuse", "pending");

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/comments")
                                .param("q", queryToken)
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/summary/todayComments").asInt()).isEqualTo(3);
        assertThat(body.at("/data/summary/reportedComments").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/hiddenComments").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/closedTargets").asInt()).isEqualTo(1);
        assertThat(body.at("/data/items").size()).isEqualTo(3);

        assertThat(body.at("/data/items/0/id").asText()).isEqualTo(postCommentId);
        assertThat(body.at("/data/items/0/targetType").asText()).isEqualTo("post");
        assertThat(body.at("/data/items/0/reportCount").asInt()).isEqualTo(1);
        assertThat(body.at("/data/items/0/openReportCount").asInt()).isEqualTo(1);
        assertThat(body.at("/data/items/0/riskLevel").asText()).isEqualTo("high");

        assertThat(body.at("/data/items/1/id").asText()).isEqualTo(hiddenCommentId);
        assertThat(body.at("/data/items/1/targetType").asText()).isEqualTo("prompt");
        assertThat(body.at("/data/items/1/targetPromptModality").asText()).isEqualTo("video");
        assertThat(body.at("/data/items/1/statusCode").asText()).isEqualTo("hidden");

        assertThat(body.at("/data/items/2/id").asText()).isEqualTo(activeCommentId);
        assertThat(body.at("/data/items/2/targetType").asText()).isEqualTo("video");
        assertThat(body.at("/data/items/2/targetCommentsEnabled").asBoolean()).isFalse();
    }

    @Test
    void adminCanHideRestoreDeleteCommentsAndToggleTargetSettings() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-comments-manage");
        promoteToRole(admin.userId(), "admin");

        LoginSession author = loginAsRandomUser("admin-comments-target-owner");
        String videoId = createPublishedVideo(author.userId(), "Admin manage video target");
        String commentId = createActiveComment(author.userId(), "video", videoId, "comment to moderate");

        assertThat(videoCommentCount(videoId)).isEqualTo(1);

        MvcResult hideResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/comments/{commentId}/hide", commentId)
                                .contentType(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode hideBody = readBody(hideResult);
        assertThat(hideBody.path("code").asText()).isEqualTo("OK");
        assertThat(hideBody.at("/data/action").asText()).isEqualTo("hide");
        assertThat(commentStatus(commentId)).isEqualTo("hidden");
        assertThat(videoCommentCount(videoId)).isEqualTo(0);

        MvcResult restoreResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/comments/{commentId}/restore", commentId)
                                .contentType(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode restoreBody = readBody(restoreResult);
        assertThat(restoreBody.path("code").asText()).isEqualTo("OK");
        assertThat(restoreBody.at("/data/action").asText()).isEqualTo("restore");
        assertThat(commentStatus(commentId)).isEqualTo("active");
        assertThat(videoCommentCount(videoId)).isEqualTo(1);

        MvcResult disableResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.patch("/api/admin/comments/targets/{targetType}/{targetId}/settings", "video", videoId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"commentsEnabled":false}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode disableBody = readBody(disableResult);
        assertThat(disableBody.path("code").asText()).isEqualTo("OK");
        assertThat(disableBody.at("/data/commentsEnabled").asBoolean()).isFalse();
        assertThat(targetCommentsEnabled("video", videoId)).isFalse();

        MvcResult deleteResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.delete("/api/admin/comments/{commentId}", commentId),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode deleteBody = readBody(deleteResult);
        assertThat(deleteBody.path("code").asText()).isEqualTo("OK");
        assertThat(deleteBody.at("/data/action").asText()).isEqualTo("delete");
        assertThat(commentStatus(commentId)).isEqualTo("deleted");
        assertThat(videoCommentCount(videoId)).isEqualTo(0);
    }

    @Test
    void adminHideAndRestoreAreReflectedOnPublicCommentList() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-comments-public");
        promoteToRole(admin.userId(), "admin");

        LoginSession author = loginAsRandomUser("admin-comments-public-owner");
        String videoId = createPublishedVideo(author.userId(), "Admin public comment visibility video");
        String commentId = createActiveComment(author.userId(), "video", videoId, "public comment visibility chain");

        assertThat(videoCommentCount(videoId)).isEqualTo(1);
        assertCommentVisibleInPublicList("video", videoId, commentId);

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/comments/{commentId}/hide", commentId)
                                .contentType(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk());
        assertThat(commentStatus(commentId)).isEqualTo("hidden");
        assertThat(videoCommentCount(videoId)).isEqualTo(0);
        assertCommentHiddenFromPublicList("video", videoId, commentId);

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/comments/{commentId}/restore", commentId)
                                .contentType(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk());
        assertThat(commentStatus(commentId)).isEqualTo("active");
        assertThat(videoCommentCount(videoId)).isEqualTo(1);
        assertCommentVisibleInPublicList("video", videoId, commentId);
    }

    private void promoteToRole(String userId, String roleCode) {
        jdbcTemplate.update(
                "update users set role_code = ?, updated_at = now() where id = ?",
                roleCode,
                UUID.fromString(userId)
        );
    }

    private void insertReportTicket(String reporterId, String commentId, String reasonCode, String statusCode) {
        jdbcTemplate.update("""
                insert into report_tickets (
                    id, reporter_id, target_type, target_id, reason_code, description_text, status_code, created_at, updated_at
                )
                values (?, ?, 'comment', ?, ?, 'integration test ticket', ?, now(), now())
                """,
                UUID.randomUUID(),
                UUID.fromString(reporterId),
                UUID.fromString(commentId),
                reasonCode,
                statusCode
        );
    }

    private boolean targetCommentsEnabled(String targetType, String targetId) {
        String tableName = switch (targetType) {
            case "video" -> "videos";
            case "workflow" -> "workflows";
            case "prompt" -> "prompt_entries";
            case "post" -> "discussion_threads";
            default -> throw new IllegalArgumentException("unsupported target type");
        };

        Boolean enabled = jdbcTemplate.queryForObject(
                "select comments_enabled from " + tableName + " where id = ?",
                Boolean.class,
                UUID.fromString(targetId)
        );
        return enabled != null && enabled;
    }

    private void assertCommentVisibleInPublicList(String targetType, String targetId, String commentId) throws Exception {
        MvcResult listResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/comments")
                        .param("targetType", targetType)
                        .param("targetId", targetId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(listResult);
        assertThat(findCommentById(body.at("/data/items"), commentId)).isNotNull();
    }

    private void assertCommentHiddenFromPublicList(String targetType, String targetId, String commentId) throws Exception {
        MvcResult listResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/comments")
                        .param("targetType", targetType)
                        .param("targetId", targetId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(listResult);
        assertThat(findCommentById(body.at("/data/items"), commentId)).isNull();
    }

    private JsonNode findCommentById(JsonNode items, String commentId) {
        for (JsonNode item : items) {
            if (commentId.equals(item.path("id").asText())) {
                return item;
            }
        }
        return null;
    }
}
