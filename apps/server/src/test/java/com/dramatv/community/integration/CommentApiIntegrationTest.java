package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CommentApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void anonymousListIsPublicButCreateRequiresLogin() throws Exception {
        String videoId = anyPublishedVideoId();

        MvcResult listResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/comments")
                        .param("targetType", "video")
                        .param("targetId", videoId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode listBody = readBody(listResult);
        assertThat(listBody.path("code").asText()).isEqualTo("OK");
        assertThat(listBody.at("/data/items").isArray()).isTrue();

        MvcResult createResult = mockMvc.perform(MockMvcRequestBuilders.post("/api/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateCommentPayload(
                                "video",
                                videoId,
                                "anonymous comment should fail",
                                null
                        ))))
                .andExpect(status().isForbidden())
                .andReturn();

        JsonNode createBody = readBody(createResult);
        assertThat(createBody.path("code").asText()).isEqualTo("FORBIDDEN");
    }

    @Test
    void targetOwnerCanDisableAndReEnableCommentsForOwnVideo() throws Exception {
        LoginSession owner = loginAsRandomUser("comment-owner");
        LoginSession viewer = loginAsRandomUser("comment-viewer");
        String videoId = createPublishedVideo(owner.userId(), "Comment governance test video");

        MvcResult forbiddenManageResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/comments/target-settings")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new CommentTargetSettingsPayload(
                                        "video",
                                        videoId,
                                        false
                                ))),
                        viewer.accessToken()))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode forbiddenManageBody = readBody(forbiddenManageResult);
        assertThat(forbiddenManageBody.path("code").asText()).isEqualTo("COMMENT_MANAGE_FORBIDDEN");

        MvcResult disableResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/comments/target-settings")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new CommentTargetSettingsPayload(
                                        "video",
                                        videoId,
                                        false
                                ))),
                        owner.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode disableBody = readBody(disableResult);
        assertThat(disableBody.path("code").asText()).isEqualTo("OK");
        assertThat(disableBody.at("/data/commentsEnabled").asBoolean()).isFalse();
        assertThat(disableBody.at("/data/canManageComments").asBoolean()).isTrue();

        MvcResult blockedCreateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/comments")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new CreateCommentPayload(
                                        "video",
                                        videoId,
                                        "viewer should be blocked while comments are disabled",
                                        null
                                ))),
                        viewer.accessToken()))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode blockedCreateBody = readBody(blockedCreateResult);
        assertThat(blockedCreateBody.path("code").asText()).isEqualTo("COMMENT_DISABLED");

        mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/comments/target-settings")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new CommentTargetSettingsPayload(
                                        "video",
                                        videoId,
                                        true
                                ))),
                        owner.accessToken()))
                .andExpect(status().isOk());

        MvcResult reopenedCreateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/comments")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new CreateCommentPayload(
                                        "video",
                                        videoId,
                                        "viewer can comment again after reopening",
                                        null
                                ))),
                        viewer.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode reopenedCreateBody = readBody(reopenedCreateResult);
        assertThat(reopenedCreateBody.path("code").asText()).isEqualTo("OK");
        assertThat(reopenedCreateBody.at("/data/statusCode").asText()).isEqualTo("active");
        assertThat(videoCommentCount(videoId)).isEqualTo(1);
    }

    @Test
    void ownerCanSeeNestedRepliesAndDeleteWholeThread() throws Exception {
        LoginSession owner = loginAsRandomUser("comment-thread-owner");
        LoginSession commenter = loginAsRandomUser("comment-thread-commenter");
        LoginSession secondReplier = loginAsRandomUser("comment-thread-replier");
        String videoId = createPublishedVideo(owner.userId(), "Comment thread cascade test video");

        MvcResult rootCreateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/comments")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new CreateCommentPayload(
                                        "video",
                                        videoId,
                                        "root integration comment",
                                        null
                                ))),
                        commenter.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        String rootCommentId = readBody(rootCreateResult).at("/data/id").asText();
        assertThat(rootCommentId).isNotBlank();

        MvcResult replyCreateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/comments")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new CreateCommentPayload(
                                        "video",
                                        videoId,
                                        "creator reply integration comment",
                                        rootCommentId
                                ))),
                        owner.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        String replyCommentId = readBody(replyCreateResult).at("/data/id").asText();
        assertThat(replyCommentId).isNotBlank();

        MvcResult secondReplyCreateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/comments")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new CreateCommentPayload(
                                        "video",
                                        videoId,
                                        "third comment should still stay on level two",
                                        replyCommentId
                                ))),
                        secondReplier.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        String secondReplyCommentId = readBody(secondReplyCreateResult).at("/data/id").asText();
        assertThat(secondReplyCommentId).isNotBlank();
        assertThat(videoCommentCount(videoId)).isEqualTo(3);

        MvcResult listResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/comments")
                                .param("targetType", "video")
                                .param("targetId", videoId)
                                .accept(MediaType.APPLICATION_JSON),
                        owner.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode listBody = readBody(listResult);
        assertThat(listBody.path("code").asText()).isEqualTo("OK");
        assertThat(listBody.at("/data/items").size()).isEqualTo(1);
        assertThat(listBody.at("/data/items/0/id").asText()).isEqualTo(rootCommentId);
        assertThat(listBody.at("/data/items/0/replyCount").asInt()).isEqualTo(2);
        assertThat(listBody.at("/data/items/0/viewerActions/canDelete").asBoolean()).isTrue();
        assertThat(listBody.at("/data/items/0/replies").size()).isEqualTo(2);
        assertThat(listBody.at("/data/items/0/replies/0/id").asText()).isEqualTo(replyCommentId);
        assertThat(listBody.at("/data/items/0/replies/0/parentId").asText()).isEqualTo(rootCommentId);
        assertThat(listBody.at("/data/items/0/replies/0/viewerActions/canDelete").asBoolean()).isTrue();
        assertThat(listBody.at("/data/items/0/replies/1/id").asText()).isEqualTo(secondReplyCommentId);
        assertThat(listBody.at("/data/items/0/replies/1/parentId").asText()).isEqualTo(rootCommentId);
        assertThat(listBody.at("/data/items/0/replies/1/replies").size()).isEqualTo(0);
        assertThat(listBody.at("/data/items/0/replies/1/replyTarget/commentId").asText()).isEqualTo(replyCommentId);
        assertThat(listBody.at("/data/items/0/replies/1/replyTarget/author/id").asText()).isEqualTo(owner.userId());
        assertThat(listBody.at("/data/items/0/replies/1/replyTarget/author/displayName").asText()).isNotBlank();

        MvcResult deleteResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.delete("/api/comments/{commentId}", rootCommentId),
                        owner.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode deleteBody = readBody(deleteResult);
        assertThat(deleteBody.path("code").asText()).isEqualTo("OK");
        assertThat(deleteBody.at("/data/action").asText()).isEqualTo("delete");
        assertThat(deleteBody.at("/data/targetId").asText()).isEqualTo(rootCommentId);
        assertThat(deleteBody.at("/data/active").asBoolean()).isFalse();

        assertThat(commentStatus(rootCommentId)).isEqualTo("deleted");
        assertThat(commentStatus(replyCommentId)).isEqualTo("deleted");
        assertThat(commentStatus(secondReplyCommentId)).isEqualTo("deleted");
        assertThat(videoCommentCount(videoId)).isEqualTo(0);

        MvcResult afterDeleteListResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/comments")
                        .param("targetType", "video")
                        .param("targetId", videoId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode afterDeleteListBody = readBody(afterDeleteListResult);
        assertThat(afterDeleteListBody.at("/data/items").size()).isEqualTo(0);
    }

    @Test
    void listCommentsPaginatesRootCommentsButKeepsRepliesEmbedded() throws Exception {
        LoginSession owner = loginAsRandomUser("comment-page-owner");
        String videoId = createPublishedVideo(owner.userId(), "Comment pagination test video");

        String firstRootId = null;
        String firstRootReplyId = null;
        String eleventhRootId = null;

        for (int i = 0; i < 11; i++) {
            LoginSession commenter = loginAsRandomUser("comment-page-root-" + i);
            MvcResult rootCreateResult = mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/comments")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(new CreateCommentPayload(
                                            "video",
                                            videoId,
                                            "root pagination comment " + i,
                                            null
                                    ))),
                            commenter.accessToken()))
                    .andExpect(status().isOk())
                    .andReturn();

            String rootId = readBody(rootCreateResult).at("/data/id").asText();
            assertThat(rootId).isNotBlank();

            if (i == 0) {
                firstRootId = rootId;

                LoginSession replier = loginAsRandomUser("comment-page-root-reply");
                MvcResult replyCreateResult = mockMvc.perform(authorized(
                                MockMvcRequestBuilders.post("/api/comments")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(new CreateCommentPayload(
                                                "video",
                                                videoId,
                                                "reply on first root",
                                                rootId
                                        ))),
                                replier.accessToken()))
                        .andExpect(status().isOk())
                        .andReturn();

                firstRootReplyId = readBody(replyCreateResult).at("/data/id").asText();
                assertThat(firstRootReplyId).isNotBlank();
            }

            if (i == 10) {
                eleventhRootId = rootId;
            }
        }

        assertThat(firstRootId).isNotBlank();
        assertThat(firstRootReplyId).isNotBlank();
        assertThat(eleventhRootId).isNotBlank();
        assertThat(videoCommentCount(videoId)).isEqualTo(12);

        MvcResult firstPageResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/comments")
                                .param("targetType", "video")
                                .param("targetId", videoId)
                                .accept(MediaType.APPLICATION_JSON),
                        owner.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode firstPageBody = readBody(firstPageResult);
        assertThat(firstPageBody.path("code").asText()).isEqualTo("OK");
        assertThat(firstPageBody.at("/data/items").size()).isEqualTo(10);
        assertThat(firstPageBody.at("/data/hasMore").asBoolean()).isTrue();
        String nextCursor = firstPageBody.at("/data/nextCursor").asText();
        assertThat(nextCursor).isNotBlank();

        JsonNode firstRoot = firstPageBody.at("/data/items/0");
        assertThat(firstRoot.at("/id").asText()).isEqualTo(firstRootId);
        assertThat(firstRoot.at("/replyCount").asInt()).isEqualTo(1);
        assertThat(firstRoot.at("/replies").size()).isEqualTo(1);
        assertThat(firstRoot.at("/replies/0/id").asText()).isEqualTo(firstRootReplyId);

        JsonNode tenthRoot = firstPageBody.at("/data/items/9");
        assertThat(tenthRoot.at("/replies").size()).isEqualTo(0);

        MvcResult secondPageResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/comments")
                                .param("targetType", "video")
                                .param("targetId", videoId)
                                .param("cursor", nextCursor)
                                .accept(MediaType.APPLICATION_JSON),
                        owner.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode secondPageBody = readBody(secondPageResult);
        assertThat(secondPageBody.path("code").asText()).isEqualTo("OK");
        assertThat(secondPageBody.at("/data/items").size()).isEqualTo(1);
        assertThat(secondPageBody.at("/data/hasMore").asBoolean()).isFalse();
        assertThat(secondPageBody.at("/data/nextCursor").isNull()).isTrue();
        assertThat(secondPageBody.at("/data/items/0/id").asText()).isEqualTo(eleventhRootId);
        assertThat(secondPageBody.at("/data/items/0/replies").size()).isEqualTo(0);
    }

    @Test
    void moderationBlocksExplicitRiskAndHidesSpamLikeComments() throws Exception {
        LoginSession owner = loginAsRandomUser("comment-moderation-owner");
        LoginSession commenter = loginAsRandomUser("comment-moderation-commenter");
        String videoId = createPublishedVideo(owner.userId(), "Comment moderation test video");

        MvcResult blockedResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/comments")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new CreateCommentPayload(
                                        "video",
                                        videoId,
                                        "这个评论包含色情视频关键词",
                                        null
                                ))),
                        commenter.accessToken()))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode blockedBody = readBody(blockedResult);
        assertThat(blockedBody.path("code").asText()).isEqualTo("COMMENT_CONTENT_BLOCKED");
        assertThat(videoCommentCount(videoId)).isEqualTo(0);

        MvcResult hiddenResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/comments")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new CreateCommentPayload(
                                        "video",
                                        videoId,
                                        "加微信领取资源",
                                        null
                                ))),
                        commenter.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode hiddenBody = readBody(hiddenResult);
        String hiddenCommentId = hiddenBody.at("/data/id").asText();
        assertThat(hiddenBody.path("code").asText()).isEqualTo("OK");
        assertThat(hiddenBody.at("/data/statusCode").asText()).isEqualTo("hidden");
        assertThat(hiddenCommentId).isNotBlank();
        assertThat(commentStatus(hiddenCommentId)).isEqualTo("hidden");
        assertThat(videoCommentCount(videoId)).isEqualTo(0);

        MvcResult listResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/comments")
                        .param("targetType", "video")
                        .param("targetId", videoId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode listBody = readBody(listResult);
        assertThat(listBody.at("/data/items").size()).isEqualTo(0);
    }

    private record CreateCommentPayload(
            String targetType,
            String targetId,
            String content,
            String parentId
    ) {
    }

    private record CommentTargetSettingsPayload(
            String targetType,
            String targetId,
            boolean commentsEnabled
    ) {
    }
}
