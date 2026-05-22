package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminMediaTaskApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void mediaTaskListAndDetailReturnLiveVideoAndPromptTasks() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-media-list");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("admin-media-author");
        String videoId = createPublishedVideo(author.userId(), "Admin media task video");
        String promptId = createPublishedPrompt(
                author.userId(),
                "Admin media task prompt",
                "video",
                "Admin media task prompt summary",
                "prompt body"
        );

        String failedTaskId = insertMediaTask(
                "video",
                videoId,
                "failed",
                1,
                3,
                "ffmpeg worker timeout",
                """
                        {
                          "draftId": "draft-video-1",
                          "submitMode": "publish",
                          "sourceAssetId": "%s",
                          "desiredOutputs": ["preview", "cover", "duration"]
                        }
                        """.formatted(UUID.randomUUID())
        );
        insertTaskCallbackLog(failedTaskId, "media_callback", "video-worker", "passed", "failed");

        String processingTaskId = insertMediaTask(
                "prompt",
                promptId,
                "processing",
                0,
                3,
                null,
                """
                        {
                          "draftId": "draft-prompt-1",
                          "submitMode": "publish",
                          "sourceAssetId": "%s",
                          "workflowId": "%s",
                          "desiredOutputs": ["preview", "cover"]
                        }
                        """.formatted(UUID.randomUUID(), UUID.randomUUID())
        );

        MvcResult listResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/media-tasks")
                                .param("q", "Admin media task")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode listBody = readBody(listResult);
        assertThat(listBody.path("code").asText()).isEqualTo("OK");
        assertThat(listBody.at("/data/summary/totalTasks").asInt()).isEqualTo(2);
        assertThat(listBody.at("/data/summary/failedTasks").asInt()).isEqualTo(1);
        assertThat(listBody.at("/data/summary/retryableTasks").asInt()).isEqualTo(1);
        assertThat(listBody.at("/data/pagination/page").asInt()).isEqualTo(1);
        assertThat(listBody.at("/data/pagination/pageSize").asInt()).isEqualTo(15);
        assertThat(listBody.at("/data/pagination/totalItems").asInt()).isEqualTo(2);
        assertThat(listBody.at("/data/pagination/totalPages").asInt()).isEqualTo(1);
        assertThat(listBody.at("/data/items").size()).isEqualTo(2);
        assertThat(listBody.at("/data/items/0/taskId").asText()).isEqualTo(failedTaskId);
        assertThat(listBody.at("/data/items/1/taskId").asText()).isEqualTo(processingTaskId);

        MvcResult detailResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/media-tasks/{taskId}", failedTaskId)
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode detailBody = readBody(detailResult);
        assertThat(detailBody.at("/data/taskId").asText()).isEqualTo(failedTaskId);
        assertThat(detailBody.at("/data/targetType").asText()).isEqualTo("video");
        assertThat(detailBody.at("/data/targetTitle").asText()).isEqualTo("Admin media task video");
        assertThat(detailBody.at("/data/payloadSummary/draftId").asText()).isEqualTo("draft-video-1");
        assertThat(detailBody.at("/data/payloadSummary/desiredOutputs/0").asText()).isEqualTo("preview");
        assertThat(detailBody.at("/data/callbackLogs/0/processStatus").asText()).isEqualTo("failed");
    }

    @Test
    void mediaTaskRetryRequeuesFailedTask() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-media-retry");
        promoteToRole(admin.userId(), "moderator");

        LoginSession author = loginAsRandomUser("admin-media-owner");
        String videoId = createPublishedVideo(author.userId(), "Admin media retry video");
        String taskId = insertMediaTask(
                "video",
                videoId,
                "failed",
                2,
                4,
                "preview generation failed",
                """
                        {
                          "draftId": "draft-video-retry",
                          "submitMode": "publish",
                          "sourceAssetId": "%s",
                          "desiredOutputs": ["preview", "cover"]
                        }
                        """.formatted(UUID.randomUUID())
        );

        jdbcTemplate.update("""
                update async_task_records
                set result_json = '{"error":"preview generation failed"}'::jsonb,
                    started_at = now() - interval '5 minutes',
                    finished_at = now() - interval '4 minutes'
                where id = ?
                """,
                UUID.fromString(taskId)
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
        assertThat(retryBody.at("/data/statusCode").asText()).isEqualTo("queued");
        assertThat(retryBody.at("/data/retryCount").asInt()).isEqualTo(3);
        assertThat(retryBody.at("/data/retryable").asBoolean()).isFalse();

        JsonNode taskRow = jdbcTemplate.query("""
                select status_code, retry_count, error_message, result_json::text as result_json, started_at, finished_at
                from async_task_records
                where id = ?
                """,
                resultSet -> {
                    if (!resultSet.next()) {
                        return null;
                    }
                    return objectMapper.createObjectNode()
                            .put("statusCode", resultSet.getString("status_code"))
                            .put("retryCount", resultSet.getInt("retry_count"))
                            .put("errorMessageNull", resultSet.getString("error_message") == null)
                            .put("resultJsonNull", resultSet.getString("result_json") == null)
                            .put("startedAtNull", resultSet.getObject("started_at") == null)
                            .put("finishedAtNull", resultSet.getObject("finished_at") == null);
                },
                UUID.fromString(taskId)
        );

        assertThat(taskRow).isNotNull();
        assertThat(taskRow.path("statusCode").asText()).isEqualTo("queued");
        assertThat(taskRow.path("retryCount").asInt()).isEqualTo(3);
        assertThat(taskRow.path("errorMessageNull").asBoolean()).isTrue();
        assertThat(taskRow.path("resultJsonNull").asBoolean()).isTrue();
        assertThat(taskRow.path("startedAtNull").asBoolean()).isTrue();
        assertThat(taskRow.path("finishedAtNull").asBoolean()).isTrue();
    }

    @Test
    void mediaTaskDetailSanitizesLegacySensitivePayloadsOnRead() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-media-sanitize");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("admin-media-sanitize-author");
        String videoId = createPublishedVideo(author.userId(), "Admin media sanitize video");
        String rawSecret = "Bearer super-secret-token";
        String longPrompt = "prompt-" + "x".repeat(900);
        String taskId = insertMediaTask(
                "video",
                videoId,
                "failed",
                0,
                3,
                "signature=very-secret " + "y".repeat(700),
                """
                        {
                          "draftId": "draft-video-sanitize",
                          "submitMode": "publish",
                          "sourceAssetId": "%s",
                          "desiredOutputs": ["preview", "cover"]
                        }
                        """.formatted(UUID.randomUUID())
        );

        jdbcTemplate.update("""
                update async_task_records
                set result_json = cast(? as jsonb)
                where id = ?
                """,
                """
                        {
                          "accessToken": "super-secret-token",
                          "signature": "signed-secret",
                          "message": "%s"
                        }
                        """.formatted(longPrompt),
                UUID.fromString(taskId)
        );

        insertTaskCallbackLog(
                taskId,
                "media_callback",
                "video-worker",
                "passed",
                "failed",
                """
                        {
                          "authorization": "%s",
                          "policy": "oss-signed-policy",
                          "prompt": "%s"
                        }
                        """.formatted(rawSecret, longPrompt)
        );

        MvcResult detailResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/media-tasks/{taskId}", taskId)
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode detailBody = readBody(detailResult);
        String errorMessage = detailBody.at("/data/errorMessage").asText();
        String resultJson = detailBody.at("/data/resultJson").asText();
        String callbackRawPayload = detailBody.at("/data/callbackLogs/0/rawPayloadJson").asText();

        assertThat(errorMessage).doesNotContain("very-secret");
        assertThat(errorMessage).contains("[TRUNCATED len=");

        assertThat(resultJson).doesNotContain("super-secret-token");
        assertThat(resultJson).doesNotContain("signed-secret");
        assertThat(resultJson).contains("[REDACTED]");
        assertThat(resultJson).contains("[TRUNCATED len=");

        assertThat(callbackRawPayload).doesNotContain(rawSecret);
        assertThat(callbackRawPayload).doesNotContain("oss-signed-policy");
        assertThat(callbackRawPayload).contains("[REDACTED]");
        assertThat(callbackRawPayload).contains("[TRUNCATED len=");
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

    private void insertTaskCallbackLog(
            String taskId,
            String callbackType,
            String sourceName,
            String verifyStatus,
            String processStatus
    ) {
        insertTaskCallbackLog(taskId, callbackType, sourceName, verifyStatus, processStatus, "{\"status\":\"ok\"}");
    }

    private void insertTaskCallbackLog(
            String taskId,
            String callbackType,
            String sourceName,
            String verifyStatus,
            String processStatus,
            String rawPayloadJson
    ) {
        jdbcTemplate.update("""
                insert into task_callback_logs (
                    id, task_id, callback_type, source_name, request_id,
                    verify_status, process_status, raw_payload_json, created_at
                )
                values (?, ?, ?, ?, ?, ?, ?, cast(? as jsonb), now())
                """,
                UUID.randomUUID(),
                UUID.fromString(taskId),
                callbackType,
                sourceName,
                "req-media-task-it",
                verifyStatus,
                processStatus,
                rawPayloadJson
        );
    }
}
