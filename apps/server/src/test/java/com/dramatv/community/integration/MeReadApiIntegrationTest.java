package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MeReadApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void meHubAndRecentNotificationsExposeRealOwnedAndActedData() throws Exception {
        LoginSession session = loginAsRandomUser("me-read-owner");
        LoginSession targetAuthor = loginAsRandomUser("me-read-target");
        LoginSession commenter = loginAsRandomUser("me-read-commenter");
        LoginSession replier = loginAsRandomUser("me-read-replier");
        LoginSession repliedOwner = loginAsRandomUser("me-read-replied-owner");

        String likedVideoId = createPublishedVideo(
                targetAuthor.userId(),
                null,
                "Liked video for me hub",
                "Video liked by current user"
        );
        String favoritedWorkflowId = createPublishedWorkflow(
                targetAuthor.userId(),
                "Favorited workflow for me hub",
                "Workflow favorited by current user",
                "Workflow scenario for me hub"
        );
        String ownVideoId = createPublishedVideo(
                session.userId(),
                null,
                "Owned video for notifications",
                "Owned video summary"
        );
        String repliedOwnerVideoId = createPublishedVideo(
                repliedOwner.userId(),
                null,
                "Replied owner video for notifications",
                "Replied owner summary"
        );
        String ownWorkflowId = createPublishedWorkflow(
                session.userId(),
                "Owned workflow for me hub",
                "Owned workflow summary",
                "Owned workflow scenario"
        );
        String ownPostId = createPublishedDiscussionThread(
                session.userId(),
                "me-owned-thread",
                "video-production",
                "Owned post for me hub",
                "Owned post content for me hub"
        );
        String draftId = createDraft(
                session.userId(),
                "video",
                "Me draft title",
                "Me draft summary",
                "details"
        );

        insertActiveInteractionAction(session.userId(), "like", "video", likedVideoId);
        insertActiveInteractionAction(session.userId(), "favorite", "workflow", favoritedWorkflowId);
        createActiveComment(commenter.userId(), "video", ownVideoId, "新的评论通知内容");
        String repliedOwnersRootCommentId = createActiveComment(
                repliedOwner.userId(),
                "video",
                repliedOwnerVideoId,
                "这是被回复的根评论"
        );
        createActiveReplyComment(
                replier.userId(),
                "video",
                repliedOwnerVideoId,
                "这是回复评论的通知内容",
                repliedOwnersRootCommentId,
                repliedOwnersRootCommentId,
                repliedOwnersRootCommentId
        );

        MvcResult hubResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/me/hub")
                                .accept(MediaType.APPLICATION_JSON),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode hubBody = readBody(hubResult);
        assertThat(hubBody.path("code").asText()).isEqualTo("OK");
        assertThat(hubBody.path("requestId").asText()).isNotBlank();
        assertThat(hubBody.at("/data/profile/id").asText()).isEqualTo(session.userId());
        assertThat(hubBody.at("/data/profile/displayName").asText()).isEqualTo(session.username());

        JsonNode likedItem = findItemByTargetId(hubBody.at("/data/likedItems"), likedVideoId);
        assertThat(likedItem).isNotNull();
        assertThat(likedItem.path("itemType").asText()).isEqualTo("video");
        assertThat(likedItem.path("title").asText()).isEqualTo("Liked video for me hub");

        JsonNode favoritedItem = findItemByTargetId(hubBody.at("/data/favoritedItems"), favoritedWorkflowId);
        assertThat(favoritedItem).isNotNull();
        assertThat(favoritedItem.path("itemType").asText()).isEqualTo("workflow");
        assertThat(favoritedItem.path("title").asText()).isEqualTo("Favorited workflow for me hub");

        JsonNode draftItem = findDraftById(hubBody.at("/data/draftItems"), draftId);
        assertThat(draftItem).isNotNull();
        assertThat(draftItem.path("draftType").asText()).isEqualTo("video");
        assertThat(draftItem.path("title").asText()).isEqualTo("Me draft title");
        assertThat(draftItem.path("summary").asText()).isEqualTo("Me draft summary");
        assertThat(draftItem.path("currentStep").asText()).isEqualTo("details");
        assertThat(draftItem.at("/lifecycle/draftStatus").asText()).isEqualTo("draft");
        assertThat(draftItem.at("/lifecycle/processingStatus").asText()).isEqualTo("not_submitted");
        assertThat(draftItem.at("/lifecycle/editable").asBoolean()).isTrue();
        assertThat(draftItem.path("continueHref").asText()).isEqualTo("/publish?draftId=" + draftId);
        assertThat(draftItem.path("editable").asBoolean()).isTrue();

        JsonNode publishedVideo = findItemById(hubBody.at("/data/publishedContent/videos"), ownVideoId);
        assertThat(publishedVideo).isNotNull();
        assertThat(publishedVideo.path("title").asText()).isEqualTo("Owned video for notifications");

        JsonNode publishedWorkflow = findItemById(hubBody.at("/data/publishedContent/workflows"), ownWorkflowId);
        assertThat(publishedWorkflow).isNotNull();
        assertThat(publishedWorkflow.path("title").asText()).isEqualTo("Owned workflow for me hub");

        JsonNode publishedPost = findItemById(hubBody.at("/data/publishedContent/posts"), ownPostId);
        assertThat(publishedPost).isNotNull();
        assertThat(publishedPost.path("title").asText()).isEqualTo("Owned post for me hub");

        MvcResult notificationsResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/me/notifications/recent")
                                .accept(MediaType.APPLICATION_JSON),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode notificationsBody = readBody(notificationsResult);
        JsonNode notificationItem = findNotificationByActionTypeAndTargetId(
                notificationsBody.at("/data/items"),
                "comment",
                ownVideoId
        );
        assertThat(notificationsBody.path("code").asText()).isEqualTo("OK");
        assertThat(notificationsBody.path("requestId").asText()).isNotBlank();
        assertThat(notificationItem).isNotNull();
        assertThat(notificationItem.path("actionType").asText()).isEqualTo("comment");
        assertThat(notificationItem.path("excerpt").asText()).contains("新的评论通知内容");
        assertThat(notificationItem.path("commentId").asText()).isNotBlank();
        assertThat(notificationItem.at("/actor/id").asText()).isEqualTo(commenter.userId());
        assertThat(notificationItem.at("/target/id").asText()).isEqualTo(ownVideoId);
        assertThat(notificationItem.at("/target/type").asText()).isEqualTo("video");
        assertThat(notificationItem.at("/target/title").asText()).isEqualTo("Owned video for notifications");

        JsonNode ownerReplyNotificationItem = findNotificationByActionType(notificationsBody.at("/data/items"), "reply");
        assertThat(ownerReplyNotificationItem).isNull();

        MvcResult repliedOwnerNotificationsResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/me/notifications/recent")
                                .accept(MediaType.APPLICATION_JSON),
                        repliedOwner.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode repliedOwnerNotificationsBody = readBody(repliedOwnerNotificationsResult);
        JsonNode replyNotificationItem = findNotificationByActionTypeAndTargetId(
                repliedOwnerNotificationsBody.at("/data/items"),
                "reply",
                repliedOwnerVideoId
        );
        assertThat(repliedOwnerNotificationsBody.path("code").asText()).isEqualTo("OK");
        assertThat(repliedOwnerNotificationsBody.path("requestId").asText()).isNotBlank();
        assertThat(replyNotificationItem).isNotNull();
        assertThat(replyNotificationItem.path("excerpt").asText()).contains("这是回复评论的通知内容");
        assertThat(replyNotificationItem.path("replyToActorName").isNull()).isTrue();
        assertThat(replyNotificationItem.path("commentId").asText()).isNotBlank();
        assertThat(replyNotificationItem.at("/actor/id").asText()).isEqualTo(replier.userId());
        assertThat(replyNotificationItem.at("/target/id").asText()).isEqualTo(repliedOwnerVideoId);
    }

    @Test
    void recentNotificationsReturnLikeAndReplyTogetherForPromptOwner() throws Exception {
        LoginSession promptOwner = loginAsRandomUser("me-prompt-owner");
        LoginSession liker = loginAsRandomUser("me-prompt-liker");
        LoginSession replier = loginAsRandomUser("me-prompt-replier");

        String promptId = createPublishedPrompt(
                promptOwner.userId(),
                "Prompt notifications coverage",
                "video",
                "Prompt summary",
                "Prompt body"
        );
        String rootCommentId = createActiveComment(
                promptOwner.userId(),
                "prompt",
                promptId,
                "owner root comment"
        );

        insertActiveInteractionAction(liker.userId(), "like", "prompt", promptId);
        createActiveReplyComment(
                replier.userId(),
                "prompt",
                promptId,
                "reply for prompt owner",
                rootCommentId,
                rootCommentId,
                rootCommentId
        );

        MvcResult notificationsResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/me/notifications/recent")
                                .accept(MediaType.APPLICATION_JSON),
                        promptOwner.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode notificationsBody = readBody(notificationsResult);
        assertThat(notificationsBody.path("code").asText()).isEqualTo("OK");

        JsonNode likeNotificationItem = findNotificationByActionTypeAndTargetId(
                notificationsBody.at("/data/items"),
                "like",
                promptId
        );
        assertThat(likeNotificationItem).isNotNull();
        assertThat(likeNotificationItem.at("/actor/id").asText()).isEqualTo(liker.userId());
        assertThat(likeNotificationItem.at("/target/type").asText()).isEqualTo("prompt");
        assertThat(likeNotificationItem.path("commentId").isNull()).isTrue();

        JsonNode replyNotificationItem = findNotificationByActionTypeAndTargetId(
                notificationsBody.at("/data/items"),
                "reply",
                promptId
        );
        assertThat(replyNotificationItem).isNotNull();
        assertThat(replyNotificationItem.at("/actor/id").asText()).isEqualTo(replier.userId());
        assertThat(replyNotificationItem.path("excerpt").asText()).contains("reply for prompt owner");
        assertThat(replyNotificationItem.path("commentId").asText()).isNotBlank();
    }

    @Test
    void meHubIncludesSubmittedVideoDraftForStatusTracking() throws Exception {
        LoginSession session = loginAsRandomUser("me-submitted-draft");
        String draftId = createDraft(
                session.userId(),
                "video",
                "Submitted tracking draft",
                "Submitted tracking summary",
                "submitted"
        );

        jdbcTemplate.update("""
                update publish_drafts
                set status_code = 'submitted',
                    target_id = ?,
                    submitted_at = now(),
                    updated_at = now()
                where id = ?
                """,
                UUID.randomUUID(),
                UUID.fromString(draftId)
        );

        MvcResult hubResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/me/hub")
                                .accept(MediaType.APPLICATION_JSON),
                        session.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode hubBody = readBody(hubResult);
        JsonNode draftItem = findDraftById(hubBody.at("/data/draftItems"), draftId);
        assertThat(draftItem).isNotNull();
        assertThat(draftItem.path("statusCode").asText()).isEqualTo("submitted");
        assertThat(draftItem.at("/lifecycle/draftStatus").asText()).isEqualTo("submitted");
        assertThat(draftItem.path("continueHref").asText()).isEqualTo("/publish?draftId=" + draftId);
    }

    private JsonNode findItemByTargetId(JsonNode items, String targetId) {
        for (JsonNode item : items) {
            if (targetId.equals(item.path("targetId").asText())) {
                return item;
            }
        }
        return null;
    }

    private JsonNode findDraftById(JsonNode items, String draftId) {
        for (JsonNode item : items) {
            if (draftId.equals(item.path("draftId").asText())) {
                return item;
            }
        }
        return null;
    }

    private JsonNode findItemById(JsonNode items, String id) {
        for (JsonNode item : items) {
            if (id.equals(item.path("id").asText())) {
                return item;
            }
        }
        return null;
    }

    private JsonNode findNotificationByTargetId(JsonNode items, String targetId) {
        for (JsonNode item : items) {
            if (targetId.equals(item.at("/target/id").asText())) {
                return item;
            }
        }
        return null;
    }

    private JsonNode findNotificationByActionType(JsonNode items, String actionType) {
        for (JsonNode item : items) {
            if (actionType.equals(item.path("actionType").asText())) {
                return item;
            }
        }
        return null;
    }

    private JsonNode findNotificationByActionTypeAndTargetId(JsonNode items, String actionType, String targetId) {
        for (JsonNode item : items) {
            if (actionType.equals(item.path("actionType").asText())
                    && targetId.equals(item.at("/target/id").asText())) {
                return item;
            }
        }
        return null;
    }
}
