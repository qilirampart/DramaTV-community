package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminReportApiIntegrationTest extends ApiIntegrationTestSupport {

    @AfterEach
    void clearMdc() {
        MDC.clear();
    }

    @Test
    void reportListReturnsLiveTicketsAcrossContentAndCommentTargets() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-reports-list");
        promoteToRole(admin.userId(), "moderator");

        LoginSession author = loginAsRandomUser("admin-reports-author");
        LoginSession reporter = loginAsRandomUser("admin-reports-reporter");
        String videoId = createPublishedVideo(author.userId(), "Admin reports video target");
        String postId = createPublishedDiscussionThread(
                author.userId(),
                "admin-reports-thread-" + System.currentTimeMillis(),
                "official-events",
                "Admin reports discussion target",
                "discussion body"
        );
        String commentId = createActiveComment(author.userId(), "post", postId, "Admin reports comment body");

        String videoReportId = insertReportTicket(reporter.userId(), "video", videoId, "copyright", "pending", null, null);
        String commentReportId = insertReportTicket(reporter.userId(), "comment", commentId, "abuse", "processing", admin.userId(), "处理中备注");

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/reports")
                                .param("q", "Admin reports")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/summary/pendingTickets").asInt()).isGreaterThanOrEqualTo(2);
        assertThat(body.at("/data/summary/highRiskTickets").asInt()).isGreaterThanOrEqualTo(1);
        assertThat(body.at("/data/items").size()).isGreaterThanOrEqualTo(2);
        JsonNode videoItem = findReportItem(body.at("/data/items"), videoReportId);
        JsonNode commentItem = findReportItem(body.at("/data/items"), commentReportId);
        assertThat(videoItem).isNotNull();
        assertThat(commentItem).isNotNull();
        assertThat(videoItem.path("targetType").asText()).isEqualTo("video");
        assertThat(commentItem.path("targetType").asText()).isEqualTo("comment");
    }

    @Test
    void reportActionsCanCloseTicketAndOfflineOrHideTarget() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-reports-actions");
        promoteToRole(admin.userId(), "admin");

        LoginSession author = loginAsRandomUser("admin-reports-owner");
        LoginSession reporter = loginAsRandomUser("admin-reports-reporter-2");
        String videoId = createPublishedVideo(author.userId(), "Admin reports action video");
        insertAuditRecord("video", videoId, author.userId(), "pending_review", "high");
        String videoReportId = insertReportTicket(reporter.userId(), "video", videoId, "abuse", "pending", null, null);

        MvcResult processingResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/reports/{reportId}/processing", videoReportId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"开始处理"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode processingBody = readBody(processingResult);
        assertThat(processingBody.at("/data/statusCode").asText()).isEqualTo("processing");
        assertThat(reportStatus(videoReportId)).isEqualTo("processing");

        MvcResult offlineResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/reports/{reportId}/offline-target", videoReportId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"联动下线"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode offlineBody = readBody(offlineResult);
        assertThat(offlineBody.at("/data/action").asText()).isEqualTo("offline_target");
        assertThat(videoPublishStatus(videoId)).isEqualTo("taken_down");
        assertThat(latestAuditStatus("video", videoId)).isEqualTo("taken_down");
        assertThat(reportStatus(videoReportId)).isEqualTo("resolved");

        String threadId = createPublishedDiscussionThread(
                author.userId(),
                "admin-reports-thread-action-" + System.currentTimeMillis(),
                "official-events",
                "Admin reports comment target",
                "thread body"
        );
        String commentId = createActiveComment(author.userId(), "post", threadId, "reported comment to hide");
        String commentReportId = insertReportTicket(reporter.userId(), "comment", commentId, "abuse", "pending", null, null);

        MvcResult hideResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/reports/{reportId}/hide-comment", commentReportId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"联动隐藏评论"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode hideBody = readBody(hideResult);
        assertThat(hideBody.at("/data/action").asText()).isEqualTo("hide_comment");
        assertThat(commentStatus(commentId)).isEqualTo("hidden");
        assertThat(reportStatus(commentReportId)).isEqualTo("resolved");

        MvcResult closeResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/reports/{reportId}/close", commentReportId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"工单关闭"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode closeBody = readBody(closeResult);
        assertThat(closeBody.at("/data/statusCode").asText()).isEqualTo("closed");
        assertThat(reportStatus(commentReportId)).isEqualTo("closed");

        MvcResult closeAgainResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/reports/{reportId}/close", commentReportId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"重复关闭"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode closeAgainBody = readBody(closeAgainResult);
        assertThat(closeAgainBody.at("/data/statusCode").asText()).isEqualTo("closed");
        assertThat(reportStatus(commentReportId)).isEqualTo("closed");
        assertThat(MDC.get("reportId")).isNull();
        assertThat(MDC.get("commentId")).isNull();
        assertThat(MDC.get("targetType")).isNull();
        assertThat(MDC.get("targetId")).isNull();
        assertThat(MDC.get("bizContext")).isNull();
    }

    @Test
    void frontendCreatedReportIsVisibleAndActionableInAdminQueue() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-reports-linkage-admin");
        promoteToRole(admin.userId(), "moderator");

        LoginSession author = loginAsRandomUser("admin-reports-linkage-author");
        LoginSession reporter = loginAsRandomUser("admin-reports-linkage-reporter");
        String videoId = createPublishedVideo(author.userId(), "Linkage report target video");

        MvcResult reportResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/reports")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "targetType": "video",
                                          "targetId": "%s",
                                          "reasonCode": "abuse",
                                          "descriptionText": "reported from frontend integration flow"
                                        }
                                        """.formatted(videoId)),
                        reporter.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode reportBody = readBody(reportResult);
        String reportId = reportBody.at("/data/reportId").asText();
        assertThat(reportBody.path("code").asText()).isEqualTo("OK");
        assertThat(reportId).isNotBlank();
        assertThat(reportBody.at("/data/statusCode").asText()).isEqualTo("pending");
        assertThat(reportStatus(reportId)).isEqualTo("pending");

        MvcResult listResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/reports")
                                .param("q", "Linkage report target")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode listBody = readBody(listResult);
        assertThat(listBody.path("code").asText()).isEqualTo("OK");
        assertThat(listBody.at("/data/summary/pendingTickets").asInt()).isGreaterThanOrEqualTo(1);
        JsonNode linkedItem = findReportItem(listBody.at("/data/items"), reportId);
        assertThat(linkedItem).isNotNull();
        assertThat(linkedItem.path("targetType").asText()).isEqualTo("video");
        assertThat(linkedItem.path("targetId").asText()).isEqualTo(videoId);
        assertThat(linkedItem.path("reasonCode").asText()).isEqualTo("abuse");
        assertThat(linkedItem.path("reporterId").asText()).isEqualTo(reporter.userId());
        assertThat(linkedItem.path("targetAuthorId").asText()).isEqualTo(author.userId());
        assertThat(linkedItem.path("statusCode").asText()).isEqualTo("pending");

        MvcResult processingResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/reports/{reportId}/processing", reportId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"picked from admin queue"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode processingBody = readBody(processingResult);
        assertThat(processingBody.at("/data/statusCode").asText()).isEqualTo("processing");
        assertThat(reportStatus(reportId)).isEqualTo("processing");
        assertThat(reportAssigneeId(reportId)).isEqualTo(admin.userId());

        MvcResult detailResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/reports/{reportId}", reportId)
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode detailBody = readBody(detailResult);
        assertThat(detailBody.path("code").asText()).isEqualTo("OK");
        assertThat(detailBody.at("/data/id").asText()).isEqualTo(reportId);
        assertThat(detailBody.at("/data/statusCode").asText()).isEqualTo("processing");
        assertThat(detailBody.at("/data/targetId").asText()).isEqualTo(videoId);
        assertThat(detailBody.at("/data/targetAuthorId").asText()).isEqualTo(author.userId());

        MvcResult closeResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/reports/{reportId}/close", reportId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"handled via linkage regression"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode closeBody = readBody(closeResult);
        assertThat(closeBody.at("/data/statusCode").asText()).isEqualTo("resolved");
        assertThat(reportStatus(reportId)).isEqualTo("resolved");
        assertThat(reportAssigneeId(reportId)).isEqualTo(admin.userId());
    }

    @Test
    void offlineTargetHidesVideoFromPublicDetail() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-reports-public-offline");
        promoteToRole(admin.userId(), "admin");

        LoginSession author = loginAsRandomUser("admin-reports-public-video-owner");
        LoginSession reporter = loginAsRandomUser("admin-reports-public-video-reporter");
        String videoId = createPublishedVideo(author.userId(), "Report-driven offline target video");
        insertAuditRecord("video", videoId, author.userId(), "pending_review", "high");
        String reportId = insertReportTicket(reporter.userId(), "video", videoId, "abuse", "pending", null, null);

        assertVideoDetailAvailable(videoId);

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/reports/{reportId}/offline-target", reportId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"report-driven offline visibility regression"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk());

        assertThat(videoPublishStatus(videoId)).isEqualTo("taken_down");
        assertThat(latestAuditStatus("video", videoId)).isEqualTo("taken_down");
        assertThat(reportStatus(reportId)).isEqualTo("resolved");
        assertVideoDetailMissing(videoId);
    }

    @Test
    void reportDrivenOfflineTargetBackfillsModerationQueueForPromptWithoutAuditRecord() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-reports-moderation-backfill");
        promoteToRole(admin.userId(), "admin");

        LoginSession author = loginAsRandomUser("admin-reports-moderation-backfill-owner");
        LoginSession reporter = loginAsRandomUser("admin-reports-moderation-backfill-reporter");
        String promptId = createPublishedPrompt(
                author.userId(),
                "Report-driven moderation backfill prompt",
                "video",
                "Prompt should appear in moderation after report-driven offline",
                "report moderation backfill chain"
        );
        String reportId = insertReportTicket(reporter.userId(), "prompt", promptId, "abuse", "pending", null, null);

        assertThat(latestAuditStatus("prompt", promptId)).isNull();
        assertPromptDetailAvailable(promptId);

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/reports/{reportId}/offline-target", reportId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"report-driven moderation backfill regression"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk());

        assertThat(promptPublishStatus(promptId)).isEqualTo("taken_down");
        assertThat(latestAuditStatus("prompt", promptId)).isEqualTo("taken_down");
        assertThat(reportStatus(reportId)).isEqualTo("resolved");
        assertPromptDetailMissing(promptId);

        MvcResult moderationListResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/moderation/items")
                                .param("status", "taken_down")
                                .param("targetType", "prompt")
                                .param("q", "Report-driven moderation backfill")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode moderationListBody = readBody(moderationListResult);
        assertThat(moderationListBody.path("code").asText()).isEqualTo("OK");
        assertThat(moderationListBody.at("/data/summary/offlineItems").asInt()).isGreaterThanOrEqualTo(1);
        JsonNode moderationItem = findModerationItem(moderationListBody.at("/data/items"), "prompt", promptId);
        assertThat(moderationItem).isNotNull();
        assertThat(moderationItem.path("statusCode").asText()).isEqualTo("taken_down");

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/moderation/items/prompt/{targetId}/restore", promptId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"restore after report-driven moderation backfill regression"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk());

        assertThat(promptPublishStatus(promptId)).isEqualTo("published");
        assertThat(latestAuditStatus("prompt", promptId)).isEqualTo("approved");
        assertPromptDetailAvailable(promptId);
    }

    @Test
    void hideCommentRemovesCommentFromPublicList() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-reports-public-comment");
        promoteToRole(admin.userId(), "admin");

        LoginSession author = loginAsRandomUser("admin-reports-public-comment-owner");
        LoginSession reporter = loginAsRandomUser("admin-reports-public-comment-reporter");
        String threadId = createPublishedDiscussionThread(
                author.userId(),
                "admin-reports-public-comment-thread-" + System.currentTimeMillis(),
                "official-events",
                "Report-driven hidden comment target",
                "thread body"
        );
        String commentId = createActiveComment(author.userId(), "post", threadId, "report-driven public comment visibility");
        String reportId = insertReportTicket(reporter.userId(), "comment", commentId, "abuse", "pending", null, null);

        assertCommentVisibleInPublicList("post", threadId, commentId);

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/reports/{reportId}/hide-comment", reportId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"note":"report-driven hide comment visibility regression"}
                                        """),
                        admin.accessToken()))
                .andExpect(status().isOk());

        assertThat(commentStatus(commentId)).isEqualTo("hidden");
        assertThat(reportStatus(reportId)).isEqualTo("resolved");
        assertCommentHiddenFromPublicList("post", threadId, commentId);
    }

    private void promoteToRole(String userId, String roleCode) {
        jdbcTemplate.update(
                "update users set role_code = ?, updated_at = now() where id = ?",
                roleCode,
                UUID.fromString(userId)
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

    private String reportStatus(String reportId) {
        return jdbcTemplate.query(
                "select status_code from report_tickets where id = ?",
                resultSet -> resultSet.next() ? resultSet.getString("status_code") : null,
                UUID.fromString(reportId)
        );
    }

    private String reportAssigneeId(String reportId) {
        return jdbcTemplate.query(
                "select assignee_id from report_tickets where id = ?",
                resultSet -> resultSet.next() && resultSet.getObject("assignee_id") != null
                        ? resultSet.getObject("assignee_id", UUID.class).toString()
                        : null,
                UUID.fromString(reportId)
        );
    }

    private JsonNode findReportItem(JsonNode items, String reportId) {
        for (JsonNode item : items) {
            if (reportId.equals(item.path("id").asText())) {
                return item;
            }
        }
        return null;
    }

    private String videoPublishStatus(String videoId) {
        return jdbcTemplate.query(
                "select publish_status from videos where id = ?",
                resultSet -> resultSet.next() ? resultSet.getString("publish_status") : null,
                UUID.fromString(videoId)
        );
    }

    private String promptPublishStatus(String promptId) {
        return jdbcTemplate.query(
                "select publish_status from prompt_entries where id = ?",
                resultSet -> resultSet.next() ? resultSet.getString("publish_status") : null,
                UUID.fromString(promptId)
        );
    }

    private String latestAuditStatus(String targetType, String targetId) {
        return jdbcTemplate.query("""
                select status_code
                from audit_records
                where audit_type = 'publish_review'
                  and target_type = ?
                  and target_id = ?
                order by created_at desc
                limit 1
                """,
                resultSet -> resultSet.next() ? resultSet.getString("status_code") : null,
                targetType,
                UUID.fromString(targetId)
        );
    }

    private void assertPromptDetailAvailable(String promptId) throws Exception {
        MvcResult detailResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/prompts/{id}", promptId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(detailResult);
        assertThat(body.at("/data/id").asText()).isEqualTo(promptId);
    }

    private void assertPromptDetailMissing(String promptId) throws Exception {
        MvcResult detailResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/prompts/{id}", promptId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode body = readBody(detailResult);
        assertThat(body.path("code").asText()).isEqualTo("PROMPT_NOT_FOUND");
    }

    private void assertVideoDetailAvailable(String videoId) throws Exception {
        MvcResult detailResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/videos/{id}", videoId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(detailResult);
        assertThat(body.at("/data/id").asText()).isEqualTo(videoId);
    }

    private void assertVideoDetailMissing(String videoId) throws Exception {
        MvcResult detailResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/videos/{id}", videoId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode body = readBody(detailResult);
        assertThat(body.path("code").asText()).isEqualTo("VIDEO_NOT_FOUND");
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

    private JsonNode findModerationItem(JsonNode items, String targetType, String targetId) {
        for (JsonNode item : items) {
            if (targetType.equals(item.path("targetType").asText()) && targetId.equals(item.path("targetId").asText())) {
                return item;
            }
        }
        return null;
    }
}
