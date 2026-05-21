package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminDashboardOverviewApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void adminCanReadDashboardOverviewFromRealDataSources() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-dashboard-admin");
        promoteToRole(admin.userId(), "admin");

        LoginSession moderator = loginAsRandomUser("admin-dashboard-moderator");
        promoteToRole(moderator.userId(), "moderator");

        LoginSession creator = loginAsRandomUser("admin-dashboard-creator");
        String workflowId = createPublishedWorkflow(creator.userId(), "Dashboard workflow");
        String videoId = createPublishedVideo(creator.userId(), workflowId, "Dashboard video", "video summary");
        String promptId = createPublishedPrompt(creator.userId(), "Dashboard prompt", "video", "prompt summary", "prompt body");
        createPublishedDiscussionThread(
                creator.userId(),
                "admin-dashboard-thread-" + System.currentTimeMillis(),
                "official-events",
                "Dashboard discussion",
                "thread body"
        );

        insertAuditRecord("video", videoId, moderator.userId(), "pending_review", "high");
        insertAuditRecord("prompt", promptId, moderator.userId(), "in_review", "medium");
        insertReportTicket(admin.userId(), "video", videoId, "abuse", "pending", moderator.userId(), null);
        insertMediaTask("video", videoId, "failed", 1, 3, "ffmpeg crashed", "{\"draftId\":\"draft-1\"}");

        jdbcTemplate.update(
                "update users set status_code = 'disabled', updated_at = now() where id = ?",
                UUID.fromString(creator.userId())
        );

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/dashboard/overview")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/summary/pendingModerationCount").asInt()).isGreaterThanOrEqualTo(2);
        assertThat(body.at("/data/summary/pendingReportCount").asInt()).isGreaterThanOrEqualTo(1);
        assertThat(body.at("/data/summary/failedMediaTaskCount").asInt()).isGreaterThanOrEqualTo(1);
        assertThat(body.at("/data/summary/retryableMediaTaskCount").asInt()).isGreaterThanOrEqualTo(1);
        assertThat(body.at("/data/summary/nonActiveUsers").asInt()).isGreaterThanOrEqualTo(1);

        assertThat(body.at("/data/moderationQueue/0/title").asText()).isEqualTo("Dashboard video");
        assertThat(body.at("/data/latestReports/0/targetTitle").asText()).isEqualTo("Dashboard video");
        assertThat(body.at("/data/failedMediaTasks/0/targetTitle").asText()).isEqualTo("Dashboard video");

        boolean creatorFoundInWatchItems = false;
        for (JsonNode item : body.path("data").path("userWatchItems")) {
            if (creator.userId().equals(item.path("userId").asText())) {
                creatorFoundInWatchItems = true;
                break;
            }
        }
        assertThat(creatorFoundInWatchItems).isTrue();
    }

    private void promoteToRole(String userId, String roleCode) {
        jdbcTemplate.update(
                "update users set role_code = ?, updated_at = now() where id = ?",
                roleCode,
                UUID.fromString(userId)
        );
    }

    private void insertAuditRecord(String targetType, String targetId, String operatorId, String statusCode, String riskLevel) {
        jdbcTemplate.update("""
                insert into audit_records (
                    id, target_type, target_id, audit_type, status_code, risk_level,
                    operator_type, operator_id, detail_json, created_at
                )
                values (?, ?, ?, 'publish_review', ?, ?, 'creator', ?, '{}'::jsonb, now())
                """,
                UUID.randomUUID(),
                targetType,
                UUID.fromString(targetId),
                statusCode,
                riskLevel,
                UUID.fromString(operatorId)
        );
    }

    private String insertReportTicket(
            String reporterId,
            String targetType,
            String targetId,
            String reasonCode,
            String statusCode,
            String assigneeId,
            String resultNote
    ) {
        UUID reportId = UUID.randomUUID();
        jdbcTemplate.update("""
                insert into report_tickets (
                    id, reporter_id, target_type, target_id, reason_code, description_text,
                    status_code, assignee_id, result_note, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, 'integration test ticket', ?, ?, ?, now(), now())
                """,
                reportId,
                UUID.fromString(reporterId),
                targetType,
                UUID.fromString(targetId),
                reasonCode,
                statusCode,
                assigneeId == null ? null : UUID.fromString(assigneeId),
                resultNote
        );
        return reportId.toString();
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
