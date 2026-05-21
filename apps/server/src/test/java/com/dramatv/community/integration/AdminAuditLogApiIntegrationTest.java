package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminAuditLogApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void auditLogListAndDetailExposeRecentAdminOperations() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-audit-list");
        promoteToRole(admin.userId(), "moderator");
        LoginSession observer = login(admin.username(), DEFAULT_PASSWORD);

        LoginSession author = loginAsRandomUser("admin-audit-author");
        String videoId = createPublishedVideo(author.userId(), "Admin audit log video");
        String commentId = createActiveComment(author.userId(), "video", videoId, "Admin audit log comment");

        MvcResult hideCommentResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/comments/{commentId}/hide", commentId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode hideBody = readBody(hideCommentResult);
        assertThat(hideBody.path("code").asText()).isEqualTo("OK");

        String taskId = insertMediaTask(
                "video",
                videoId,
                "failed",
                1,
                3,
                "preview generation failed",
                """
                        {
                          "draftId": "draft-audit-log",
                          "submitMode": "publish",
                          "sourceAssetId": "%s",
                          "desiredOutputs": ["preview", "cover"]
                        }
                        """.formatted(UUID.randomUUID())
        );

        MvcResult retryResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/media-tasks/{taskId}/retry", taskId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode retryBody = readBody(retryResult);
        assertThat(retryBody.at("/data/action").asText()).isEqualTo("retry");

        MvcResult logoutResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/auth/logout")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode logoutBody = readBody(logoutResult);
        assertThat(logoutBody.path("code").asText()).isEqualTo("OK");

        MvcResult listResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/audit-logs")
                                .param("q", "admin-audit")
                                .accept(MediaType.APPLICATION_JSON),
                        observer.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode listBody = readBody(listResult);
        assertThat(listBody.path("code").asText()).isEqualTo("OK");
        assertThat(listBody.at("/data/summary/totalLogs").asLong()).isGreaterThanOrEqualTo(3);
        assertThat(listBody.at("/data/summary/reviewLogs").asLong()).isGreaterThanOrEqualTo(1);
        assertThat(listBody.at("/data/items").size()).isGreaterThanOrEqualTo(3);
        JsonNode retryItem = findItemByActionCode(listBody.at("/data/items"), "retry");
        JsonNode logoutItem = findItemByActionCode(listBody.at("/data/items"), "logout");
        JsonNode hideItem = findItemByActionCode(listBody.at("/data/items"), "hide_comment");
        assertThat(retryItem).isNotNull();
        assertThat(logoutItem).isNotNull();
        assertThat(hideItem).isNotNull();

        String retryLogId = retryItem.path("id").asText();
        MvcResult detailResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/audit-logs/{logId}", retryLogId)
                                .accept(MediaType.APPLICATION_JSON),
                        observer.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode detailBody = readBody(detailResult);
        assertThat(detailBody.path("code").asText()).isEqualTo("OK");
        assertThat(detailBody.at("/data/actionCode").asText()).isEqualTo("retry");
        assertThat(detailBody.at("/data/targetTitle").asText()).contains(taskId);
        assertThat(detailBody.at("/data/requestPath").asText()).isEqualTo("/api/admin/media-tasks/" + taskId + "/retry");
    }

    private JsonNode findItemByActionCode(JsonNode items, String actionCode) {
        if (items == null || !items.isArray()) {
            return null;
        }

        for (JsonNode item : items) {
            if (actionCode.equals(item.path("actionCode").asText())) {
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

    private String insertMediaTask(
            String targetType,
            String targetId,
            String statusCode,
            int retryCount,
            int maxRetryCount,
            String errorMessage,
            String payloadJson
    ) {
        UUID taskId = UUID.randomUUID();
        jdbcTemplate.update("""
                insert into async_task_records (
                    id, task_type, target_type, target_id, queue_name, priority_level,
                    status_code, payload_json, retry_count, max_retry_count,
                    scheduled_at, created_at, updated_at, error_message
                )
                values (?, 'video_media_process', ?, ?, 'media-processing', 3, ?, cast(? as jsonb), ?, ?, now(), now(), now(), ?)
                """,
                taskId,
                targetType,
                UUID.fromString(targetId),
                statusCode,
                payloadJson,
                retryCount,
                maxRetryCount,
                errorMessage
        );
        return taskId.toString();
    }
}
