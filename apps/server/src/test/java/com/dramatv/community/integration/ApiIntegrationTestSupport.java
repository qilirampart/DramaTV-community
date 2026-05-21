package com.dramatv.community.integration;

import com.dramatv.community.bootstrap.DramaTvCommunityServerApplication;
import com.dramatv.community.shared.config.MediaStorageProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(
        classes = DramaTvCommunityServerApplication.class,
        properties = "dramatv.media.processing.worker-enabled=false"
)
@AutoConfigureMockMvc
abstract class ApiIntegrationTestSupport {

    protected static final String DEFAULT_PASSWORD = "dramatv-local-dev";
    private static final String TEST_USER_PREFIX = "it-";

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected JdbcTemplate jdbcTemplate;

    @Autowired
    protected MediaStorageProperties mediaStorageProperties;

    @BeforeEach
    void cleanupBeforeEach() {
        cleanupTestUsers();
    }

    @AfterEach
    void cleanupAfterEach() {
        cleanupTestUsers();
    }

    private void cleanupTestUsers() {
        List<String> mediaObjectKeys = jdbcTemplate.query("""
                select object_key
                from media_assets
                where created_by in (
                    select id from users where username like ?
                )
                """,
                (resultSet, rowNum) -> resultSet.getString("object_key"),
                TEST_USER_PREFIX + "%"
        );

        jdbcTemplate.update("""
                delete from auth_sessions
                where user_id in (
                    select id from users where username like ?
                )
                """, TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from admin_operation_logs
                where operator_id in (
                    select id from users where username like ?
                )
                """, TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from interaction_actions
                where actor_id in (
                    select id from users where username like ?
                )
                """, TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from follow_relations
                where follower_id in (
                    select id from users where username like ?
                )
                   or followee_id in (
                    select id from users where username like ?
                )
                """, TEST_USER_PREFIX + "%", TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from task_callback_logs
                where task_id in (
                    select id from async_task_records
                    where (target_type = 'video'
                           and target_id in (
                               select id from videos
                               where author_id in (
                                   select id from users where username like ?
                               )
                           ))
                       or (target_type = 'prompt'
                           and target_id in (
                               select id from prompt_entries
                               where author_id in (
                                   select id from users where username like ?
                               )
                           ))
                )
                """, TEST_USER_PREFIX + "%", TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from canvas_runtime_assets
                where runtime_id in (
                    select id
                    from canvas_workflow_runtimes
                    where owner_id in (
                        select id from users where username like ?
                    )
                       or source_workflow_id in (
                        select id from workflows
                        where author_id in (
                            select id from users where username like ?
                        )
                    )
                )
                """, TEST_USER_PREFIX + "%", TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from canvas_copy_tasks
                where operator_id in (
                    select id from users where username like ?
                )
                   or target_runtime_id in (
                    select id
                    from canvas_workflow_runtimes
                    where owner_id in (
                        select id from users where username like ?
                    )
                       or source_workflow_id in (
                        select id from workflows
                        where author_id in (
                            select id from users where username like ?
                        )
                    )
                )
                   or source_workflow_id in (
                    select id from workflows
                    where author_id in (
                        select id from users where username like ?
                    )
                )
                """, TEST_USER_PREFIX + "%", TEST_USER_PREFIX + "%", TEST_USER_PREFIX + "%", TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from canvas_workflow_runtimes
                where owner_id in (
                    select id from users where username like ?
                )
                   or source_workflow_id in (
                    select id from workflows
                    where author_id in (
                        select id from users where username like ?
                    )
                )
                """, TEST_USER_PREFIX + "%", TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from canvas_bindings
                where workflow_id in (
                    select id from workflows
                    where author_id in (
                        select id from users where username like ?
                    )
                )
                """, TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from async_task_records
                where (target_type = 'video'
                       and target_id in (
                           select id from videos
                           where author_id in (
                               select id from users where username like ?
                           )
                       ))
                   or (target_type = 'prompt'
                       and target_id in (
                           select id from prompt_entries
                           where author_id in (
                               select id from users where username like ?
                           )
                       ))
                """, TEST_USER_PREFIX + "%", TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from audit_records
                where operator_id in (
                           select id from users where username like ?
                       )
                   or (target_type = 'video' and target_id in (
                           select id from videos
                           where author_id in (
                               select id from users where username like ?
                           )
                       ))
                   or (target_type = 'workflow' and target_id in (
                           select id from workflows
                           where author_id in (
                               select id from users where username like ?
                           )
                       ))
                   or (target_type = 'prompt' and target_id in (
                           select id from prompt_entries
                           where author_id in (
                               select id from users where username like ?
                           )
                       ))
                   or (target_type = 'post' and target_id in (
                           select id from discussion_threads
                           where author_id in (
                               select id from users where username like ?
                           )
                       ))
                """, TEST_USER_PREFIX + "%", TEST_USER_PREFIX + "%", TEST_USER_PREFIX + "%", TEST_USER_PREFIX + "%", TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from admin_taxonomy_configs
                where updated_by in (
                    select id from users where username like ?
                )
                """, TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from admin_feed_slot_configs
                where updated_by in (
                    select id from users where username like ?
                )
                """, TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from report_tickets
                where reporter_id in (
                    select id from users where username like ?
                )
                   or assignee_id in (
                    select id from users where username like ?
                )
                """, TEST_USER_PREFIX + "%", TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from feed_items
                where (target_type = 'video' and target_id in (
                           select id from videos
                           where author_id in (
                               select id from users where username like ?
                           )
                       ))
                   or (target_type = 'workflow' and target_id in (
                           select id from workflows
                           where author_id in (
                               select id from users where username like ?
                           )
                       ))
                   or (target_type = 'prompt' and target_id in (
                           select id from prompt_entries
                           where author_id in (
                               select id from users where username like ?
                           )
                       ))
                   or (target_type = 'post' and target_id in (
                           select id from discussion_threads
                           where author_id in (
                               select id from users where username like ?
                           )
                       ))
                """, TEST_USER_PREFIX + "%", TEST_USER_PREFIX + "%", TEST_USER_PREFIX + "%", TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from prompt_example_links
                where prompt_id in (
                    select id from prompt_entries
                    where author_id in (
                        select id from users where username like ?
                    )
                )
                """, TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from comments
                where author_id in (
                    select id from users where username like ?
                )
                """, TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from videos
                where author_id in (
                    select id from users where username like ?
                )
                """, TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from workflows
                where author_id in (
                    select id from users where username like ?
                )
                """, TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from prompt_entries
                where author_id in (
                    select id from users where username like ?
                )
                """, TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from discussion_threads
                where author_id in (
                    select id from users where username like ?
                )
                """, TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from discussion_channels channel
                where channel.title = 'Integration Channel'
                  and channel.description_text = 'Integration channel for API tests'
                  and not exists (
                      select 1
                      from discussion_threads thread
                      where thread.channel_id = channel.id
                  )
                """);

        jdbcTemplate.update("""
                delete from publish_drafts
                where author_id in (
                    select id from users where username like ?
                )
                """, TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from creator_profiles
                where user_id in (
                    select id from users where username like ?
                )
                """, TEST_USER_PREFIX + "%");

        jdbcTemplate.update("""
                delete from media_assets
                where created_by in (
                    select id from users where username like ?
                )
                """, TEST_USER_PREFIX + "%");

        jdbcTemplate.update("delete from users where username like ?", TEST_USER_PREFIX + "%");

        cleanupMediaFiles(mediaObjectKeys);
    }

    private void cleanupMediaFiles(List<String> mediaObjectKeys) {
        Path mediaRoot = mediaStorageProperties.resolvedLocalDirPath();
        for (String objectKey : mediaObjectKeys) {
            if (objectKey == null || objectKey.isBlank()) {
                continue;
            }

            Path targetPath = mediaRoot.resolve(Path.of(objectKey.replace('/', java.io.File.separatorChar))).normalize();
            if (!targetPath.startsWith(mediaRoot)) {
                continue;
            }

            try {
                Files.deleteIfExists(targetPath);
            } catch (IOException ignored) {
                // Best effort cleanup for test uploads.
            }
        }
    }

    protected LoginSession loginAsRandomUser(String scope) throws Exception {
        String username = TEST_USER_PREFIX + scope + "-" + Instant.now().toEpochMilli();
        return login(username, DEFAULT_PASSWORD);
    }

    protected LoginSession login(String username, String password) throws Exception {
        return login(username, password, "local_password");
    }

    protected LoginSession login(String username, String password, String loginType) throws Exception {
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequestBody(loginType, username, password))))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        String accessToken = body.at("/data/accessToken").asText();
        String userId = body.at("/data/user/id").asText();
        assertThat(accessToken).isNotBlank();
        assertThat(userId).isNotBlank();
        return new LoginSession(username, accessToken, userId);
    }

    protected JsonNode readBody(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    protected MockHttpServletRequestBuilder authorized(MockHttpServletRequestBuilder builder, String accessToken) {
        return builder.header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken);
    }

    protected String anyPublishedVideoId() {
        UUID id = jdbcTemplate.query("""
                select id
                from videos
                where deleted_at is null
                  and publish_status = 'published'
                order by published_at desc nulls last, created_at desc
                limit 1
                """, resultSet -> resultSet.next() ? (UUID) resultSet.getObject("id") : null);
        assertThat(id).as("expected at least one published video for interaction tests").isNotNull();
        return id.toString();
    }

    protected int videoLikeCount(String videoId) {
        Integer count = jdbcTemplate.queryForObject(
                "select like_count from videos where id = ?",
                Integer.class,
                UUID.fromString(videoId)
        );
        return count == null ? 0 : count;
    }

    protected int videoFavoriteCount(String videoId) {
        Integer count = jdbcTemplate.queryForObject(
                "select favorite_count from videos where id = ?",
                Integer.class,
                UUID.fromString(videoId)
        );
        return count == null ? 0 : count;
    }

    protected int videoCommentCount(String videoId) {
        Integer count = jdbcTemplate.queryForObject(
                "select comment_count from videos where id = ?",
                Integer.class,
                UUID.fromString(videoId)
        );
        return count == null ? 0 : count;
    }

    protected int creatorFollowerCount(String userId) {
        Integer count = jdbcTemplate.queryForObject(
                "select follower_count from creator_profiles where user_id = ?",
                Integer.class,
                UUID.fromString(userId)
        );
        return count == null ? 0 : count;
    }

    protected int draftCount(String authorId, String draftType) {
        Integer count = jdbcTemplate.queryForObject("""
                select count(*)
                from publish_drafts
                where author_id = ?
                  and draft_type = ?
                """,
                Integer.class,
                UUID.fromString(authorId),
                draftType
        );
        return count == null ? 0 : count;
    }

    protected String createPublicMediaAsset(String createdById, String assetKind, String objectKey, String mimeType) {
        UUID assetId = UUID.randomUUID();
        String fileName = Path.of(objectKey).getFileName().toString();
        jdbcTemplate.update("""
                insert into media_assets (
                    id, asset_kind, storage_provider, bucket_name, object_key, file_name, mime_type,
                    status_code, is_public, created_by, created_at, updated_at
                )
                values (?, ?, 'apps-web-public', 'apps-web-public', ?, ?, ?, 'ready', true, ?, now(), now())
                """,
                assetId,
                assetKind,
                objectKey,
                fileName,
                mimeType,
                UUID.fromString(createdById)
        );
        return assetId.toString();
    }

    protected String createPublishedVideo(String authorId, String title) {
        return createPublishedVideo(authorId, null, title, null);
    }

    protected String createPublishedVideo(String authorId, String workflowId, String title, String summary) {
        UUID videoId = UUID.randomUUID();
        jdbcTemplate.update("""
                insert into videos (
                    id, author_id, workflow_id, title, summary, visibility, publish_status, published_at, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, 'public', 'published', now(), now(), now())
                """,
                videoId,
                UUID.fromString(authorId),
                workflowId == null ? null : UUID.fromString(workflowId),
                title,
                summary
        );
        return videoId.toString();
    }

    protected String createPublishedWorkflow(String authorId, String title) {
        return createPublishedWorkflow(authorId, title, null, null);
    }

    protected String createPublishedWorkflow(String authorId, String title, String summary, String scenarioText) {
        UUID workflowId = UUID.randomUUID();
        jdbcTemplate.update("""
                insert into workflows (
                    id, author_id, title, summary, scenario_text, visibility, publish_status,
                    allow_copy, allow_fork, published_at, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, 'public', 'published', true, false, now(), now(), now())
                """,
                workflowId,
                UUID.fromString(authorId),
                title,
                summary,
                scenarioText
        );
        return workflowId.toString();
    }

    protected String createPublishedPrompt(
            String authorId,
            String title,
            String modality,
            String summary,
            String promptText
    ) {
        UUID promptId = UUID.randomUUID();
        jdbcTemplate.update("""
                insert into prompt_entries (
                    id, author_id, title, summary, modality, prompt_text, prompt_text_raw,
                    model_category, content_category, composition_category,
                    visibility, publish_status, published_at, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'public', 'published', now(), now(), now())
                """,
                promptId,
                UUID.fromString(authorId),
                title,
                summary,
                modality,
                promptText,
                promptText,
                "image".equals(modality) ? "gpt-image-2" : "seedance",
                "real-person",
                "single-model"
        );
        return promptId.toString();
    }

    protected String createPublishedDiscussionThread(
            String authorId,
            String slug,
            String channelSlug,
            String title,
            String content
    ) {
        UUID channelId = jdbcTemplate.query("""
                        select id
                        from discussion_channels
                        where slug = ?
                        """,
                resultSet -> resultSet.next() ? (UUID) resultSet.getObject("id") : null,
                channelSlug
        );

        if (channelId == null) {
            channelId = UUID.randomUUID();
            jdbcTemplate.update("""
                            insert into discussion_channels (
                                id, slug, title, description_text, sort_order, status_code, created_at, updated_at
                            )
                            values (?, ?, ?, ?, ?, 'active', now(), now())
                            """,
                    channelId,
                    channelSlug,
                    "Integration Channel",
                    "Integration channel for API tests",
                    999
            );
        }

        UUID threadId = UUID.randomUUID();
        jdbcTemplate.update("""
                        insert into discussion_threads (
                            id, slug, channel_id, author_id, title, content_text, excerpt_text, publish_status,
                            reply_count, published_at, last_activity_at, created_at, updated_at
                        )
                        values (?, ?, ?, ?, ?, ?, ?, 'published', 0, now(), now(), now(), now())
                        """,
                threadId,
                slug,
                channelId,
                UUID.fromString(authorId),
                title,
                content,
                content.length() > 80 ? content.substring(0, 80) : content
        );

        return threadId.toString();
    }

    protected void insertActiveInteractionAction(String actorId, String actionType, String targetType, String targetId) {
        jdbcTemplate.update("""
                insert into interaction_actions (
                    id, actor_id, action_type, target_type, target_id, status_code, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, 'active', now(), now())
                on conflict (actor_id, action_type, target_type, target_id) do update
                set status_code = excluded.status_code,
                    updated_at = now()
                """,
                UUID.randomUUID(),
                UUID.fromString(actorId),
                actionType,
                targetType,
                UUID.fromString(targetId)
        );
    }

    protected void insertActiveFollowRelation(String followerId, String followeeId) {
        jdbcTemplate.update("""
                insert into follow_relations (
                    id, follower_id, followee_id, status_code, created_at, updated_at
                )
                values (?, ?, ?, 'active', now(), now())
                on conflict (follower_id, followee_id) do update
                set status_code = excluded.status_code,
                    updated_at = now()
                """,
                UUID.randomUUID(),
                UUID.fromString(followerId),
                UUID.fromString(followeeId)
        );
    }

    protected String createDraft(
            String authorId,
            String draftType,
            String title,
            String summary,
            String currentStep
    ) throws Exception {
        UUID draftId = UUID.randomUUID();
        ObjectNode payloadJson = objectMapper.createObjectNode();
        if (title != null) {
            payloadJson.put("title", title);
        }
        if (summary != null) {
            payloadJson.put("summary", summary);
        }

        jdbcTemplate.update("""
                insert into publish_drafts (
                    id, draft_type, author_id, title_draft, payload_json, current_step, status_code, created_at, updated_at
                )
                values (?, ?, ?, ?, cast(? as jsonb), ?, 'draft', now(), now())
                """,
                draftId,
                draftType,
                UUID.fromString(authorId),
                title,
                objectMapper.writeValueAsString(payloadJson),
                currentStep
        );

        return draftId.toString();
    }

    protected String createActiveComment(String authorId, String targetType, String targetId, String content) {
        UUID commentId = UUID.randomUUID();
        jdbcTemplate.update("""
                insert into comments (
                    id, target_type, target_id, author_id, content_text, status_code, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, 'active', now(), now())
                """,
                commentId,
                targetType,
                UUID.fromString(targetId),
                UUID.fromString(authorId),
                content
        );
        syncTargetCommentCount(targetType, targetId);
        return commentId.toString();
    }

    protected String createActiveReplyComment(
            String authorId,
            String targetType,
            String targetId,
            String content,
            String parentId,
            String rootId,
            String replyToCommentId
    ) {
        UUID commentId = UUID.randomUUID();
        jdbcTemplate.update("""
                insert into comments (
                    id, target_type, target_id, author_id, parent_id, root_id, reply_to_comment_id,
                    content_text, status_code, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, 'active', now(), now())
                """,
                commentId,
                targetType,
                UUID.fromString(targetId),
                UUID.fromString(authorId),
                parentId == null ? null : UUID.fromString(parentId),
                rootId == null ? null : UUID.fromString(rootId),
                replyToCommentId == null ? null : UUID.fromString(replyToCommentId),
                content
        );
        syncTargetCommentCount(targetType, targetId);
        return commentId.toString();
    }

    private void syncTargetCommentCount(String targetType, String targetId) {
        UUID parsedTargetId = UUID.fromString(targetId);

        if ("post".equals(targetType)) {
            jdbcTemplate.update("""
                    update discussion_threads target
                    set reply_count = (
                            select count(*)
                            from comments comment
                            where comment.target_type = 'post'
                              and comment.target_id = target.id
                              and comment.status_code = 'active'
                              and comment.deleted_at is null
                        ),
                        last_activity_at = coalesce(
                            (
                                select max(comment.created_at)
                                from comments comment
                                where comment.target_type = 'post'
                                  and comment.target_id = target.id
                                  and comment.status_code = 'active'
                                  and comment.deleted_at is null
                            ),
                            target.published_at,
                            now()
                        ),
                        updated_at = now()
                    where target.id = ?
                    """,
                    parsedTargetId
            );
            return;
        }

        String tableName = switch (targetType) {
            case "video" -> "videos";
            case "workflow" -> "workflows";
            case "prompt" -> "prompt_entries";
            default -> null;
        };

        if (tableName == null) {
            return;
        }

        jdbcTemplate.update("""
                update %s target
                set comment_count = (
                        select count(*)
                        from comments comment
                        where comment.target_type = ?
                          and comment.target_id = target.id
                          and comment.status_code = 'active'
                          and comment.deleted_at is null
                    ),
                    updated_at = now()
                where target.id = ?
                """.formatted(tableName),
                targetType,
                parsedTargetId
        );
    }

    protected String createActiveCanvasBinding(String workflowId, String bindingType, String openUrl) {
        UUID bindingId = UUID.randomUUID();
        jdbcTemplate.update("""
                insert into canvas_bindings (
                    id, workflow_id, binding_type, open_url, binding_status, created_at, updated_at
                )
                values (?, ?, ?, ?, 'active', now(), now())
                """,
                bindingId,
                UUID.fromString(workflowId),
                bindingType,
                openUrl
        );
        return bindingId.toString();
    }

    protected String commentStatus(String commentId) {
        return jdbcTemplate.query(
                "select status_code from comments where id = ?",
                resultSet -> resultSet.next() ? resultSet.getString("status_code") : null,
                UUID.fromString(commentId)
        );
    }

    protected record LoginSession(
            String username,
            String accessToken,
            String userId
    ) {
    }

    private record LoginRequestBody(
            String loginType,
            String username,
            String password
    ) {
    }
}
