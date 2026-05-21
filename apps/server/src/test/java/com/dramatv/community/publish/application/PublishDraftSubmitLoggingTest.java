package com.dramatv.community.publish.application;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.dramatv.community.publish.dto.request.SubmitDraftRequest;
import com.dramatv.community.publish.dto.request.UpsertPostDraftRequest;
import com.dramatv.community.publish.dto.request.UpsertVideoDraftRequest;
import com.dramatv.community.publish.dto.request.UpsertWorkflowDraftRequest;
import com.dramatv.community.publish.dto.response.DraftLifecycleResponse;
import com.dramatv.community.publish.persistence.PersistedPublishDraft;
import com.dramatv.community.publish.persistence.PublishDraftPersistenceService;
import com.dramatv.community.publish.persistence.PublishDraftType;
import com.dramatv.community.publish.persistence.SubmittedPublishDraft;
import com.dramatv.community.shared.error.ApiBusinessException;
import com.dramatv.community.shared.request.RequestBusinessContextInterceptor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

class PublishDraftSubmitLoggingTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @AfterEach
    void cleanup() {
        MDC.clear();
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void videoPromptSubmitSuccessLogIncludesPromptBusinessContext() {
        PublishDraftPersistenceService persistenceService = Mockito.mock(PublishDraftPersistenceService.class);
        PublishDraftLifecycleQueryService lifecycleQueryService = Mockito.mock(PublishDraftLifecycleQueryService.class);
        VideoDraftApplicationService service = new VideoDraftApplicationService(
                persistenceService,
                lifecycleQueryService,
                objectMapper
        );

        UUID draftId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        UUID promptId = UUID.randomUUID();
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("categoryCode", "video_prompt");

        PersistedPublishDraft existing = draft(draftId, authorId, null, "video", payload);
        PersistedPublishDraft submitted = draft(draftId, authorId, promptId, "video", payload);
        SubmittedPublishDraft submittedDraft = new SubmittedPublishDraft(submitted, List.of(UUID.randomUUID().toString()));

        when(persistenceService.find(draftId, PublishDraftType.VIDEO)).thenReturn(Optional.of(existing));
        when(persistenceService.submitVideoDraft(
                eq(draftId),
                any(ObjectNode.class),
                anyString(),
                eq("submitted"),
                eq("submitted"),
                eq("publish")
        )).thenReturn(Optional.of(submittedDraft));
        when(lifecycleQueryService.resolve(submitted)).thenReturn(dummyLifecycle());

        Logger logger = (Logger) LoggerFactory.getLogger(VideoDraftApplicationService.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);

        try {
            var response = service.submitDraft(draftId.toString(), new SubmitDraftRequest("publish"));

            assertThat(response).isPresent();
            assertThat(response.get().videoId()).isEqualTo(promptId.toString());
            assertThat(appender.list).hasSize(1);
            ILoggingEvent event = appender.list.get(0);
            assertThat(event.getFormattedMessage()).contains("targetType=prompt", "taskCount=1");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("draftId", draftId.toString())
                    .containsEntry("promptId", promptId.toString())
                    .containsEntry("targetType", "prompt")
                    .containsEntry("targetId", promptId.toString())
                    .containsEntry("bizContext", "promptId=" + promptId + ",draftId=" + draftId + ",targetType=prompt,targetId=" + promptId);
        } finally {
            logger.detachAppender(appender);
            appender.stop();
        }
    }

    @Test
    void workflowSubmitSuccessLogIncludesWorkflowBusinessContext() {
        PublishDraftPersistenceService persistenceService = Mockito.mock(PublishDraftPersistenceService.class);
        PublishDraftLifecycleQueryService lifecycleQueryService = Mockito.mock(PublishDraftLifecycleQueryService.class);
        WorkflowDraftApplicationService service = new WorkflowDraftApplicationService(
                persistenceService,
                lifecycleQueryService,
                objectMapper
        );

        UUID draftId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        UUID workflowId = UUID.randomUUID();
        ObjectNode payload = objectMapper.createObjectNode();

        PersistedPublishDraft existing = draft(draftId, authorId, null, "workflow", payload);
        PersistedPublishDraft submitted = draft(draftId, authorId, workflowId, "workflow", payload);

        when(persistenceService.find(draftId, PublishDraftType.WORKFLOW)).thenReturn(Optional.of(existing));
        when(persistenceService.submitWorkflowDraft(
                eq(draftId),
                any(ObjectNode.class),
                anyString(),
                eq("submitted"),
                eq("submitted"),
                eq("publish")
        )).thenReturn(Optional.of(submitted));
        when(lifecycleQueryService.resolve(submitted)).thenReturn(dummyLifecycle());

        Logger logger = (Logger) LoggerFactory.getLogger(WorkflowDraftApplicationService.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);

        try {
            var response = service.submitDraft(draftId.toString(), new SubmitDraftRequest("publish"));

            assertThat(response).isPresent();
            assertThat(appender.list).hasSize(1);
            ILoggingEvent event = appender.list.get(0);
            assertThat(event.getFormattedMessage()).contains("targetType=workflow", "taskCount=0");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("draftId", draftId.toString())
                    .containsEntry("workflowId", workflowId.toString())
                    .containsEntry("targetType", "workflow")
                    .containsEntry("targetId", workflowId.toString())
                    .containsEntry("bizContext", "workflowId=" + workflowId + ",draftId=" + draftId + ",targetType=workflow,targetId=" + workflowId);
        } finally {
            logger.detachAppender(appender);
            appender.stop();
        }
    }

    @Test
    void postSubmitSuccessLogIncludesThreadSlugBusinessContext() {
        PublishDraftPersistenceService persistenceService = Mockito.mock(PublishDraftPersistenceService.class);
        PublishDraftLifecycleQueryService lifecycleQueryService = Mockito.mock(PublishDraftLifecycleQueryService.class);
        JdbcTemplate jdbcTemplate = Mockito.mock(JdbcTemplate.class);
        PostDraftApplicationService service = new PostDraftApplicationService(
                persistenceService,
                lifecycleQueryService,
                objectMapper,
                jdbcTemplate
        );

        UUID draftId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        ObjectNode payload = objectMapper.createObjectNode();
        String slug = "integration-thread";

        PersistedPublishDraft existing = draft(draftId, authorId, null, "post", payload);
        PersistedPublishDraft submitted = draft(draftId, authorId, postId, "post", payload);

        when(persistenceService.find(draftId, PublishDraftType.POST)).thenReturn(Optional.of(existing));
        when(persistenceService.submitPostDraft(
                eq(draftId),
                any(ObjectNode.class),
                anyString(),
                eq("submitted"),
                eq("submitted"),
                eq("publish")
        )).thenReturn(Optional.of(submitted));
        when(lifecycleQueryService.resolve(submitted)).thenReturn(dummyLifecycle());
        when(jdbcTemplate.query(anyString(), any(org.springframework.jdbc.core.ResultSetExtractor.class), eq(postId)))
                .thenReturn(slug);

        Logger logger = (Logger) LoggerFactory.getLogger(PostDraftApplicationService.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);

        try {
            var response = service.submitDraft(draftId.toString(), new SubmitDraftRequest("publish"));

            assertThat(response).isPresent();
            assertThat(response.get().slug()).isEqualTo(slug);
            assertThat(appender.list).hasSize(1);
            ILoggingEvent event = appender.list.get(0);
            assertThat(event.getFormattedMessage()).contains("targetType=post", "threadSlug=" + slug);
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("draftId", draftId.toString())
                    .containsEntry("postId", postId.toString())
                    .containsEntry("threadSlug", slug)
                    .containsEntry("targetType", "post")
                    .containsEntry("targetId", postId.toString())
                    .containsEntry("bizContext", "postId=" + postId + ",draftId=" + draftId + ",threadSlug=" + slug + ",targetType=post,targetId=" + postId);
        } finally {
            logger.detachAppender(appender);
            appender.stop();
        }
    }

    @Test
    void videoDraftCrudLogsSuccessAndRejectionStates() {
        PublishDraftPersistenceService persistenceService = Mockito.mock(PublishDraftPersistenceService.class);
        PublishDraftLifecycleQueryService lifecycleQueryService = Mockito.mock(PublishDraftLifecycleQueryService.class);
        VideoDraftApplicationService service = new VideoDraftApplicationService(
                persistenceService,
                lifecycleQueryService,
                objectMapper
        );

        UUID draftId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        ObjectNode payload = objectMapper.createObjectNode();
        PersistedPublishDraft draft = draft(draftId, authorId, null, "video", payload);
        PersistedPublishDraft updated = draft(draftId, authorId, null, "video", payload);
        when(persistenceService.createOrReuse(eq(PublishDraftType.VIDEO), any(ObjectNode.class), isNull(), eq("compose")))
                .thenReturn(draft);
        when(persistenceService.find(draftId, PublishDraftType.VIDEO)).thenReturn(Optional.of(draft));
        when(persistenceService.save(
                eq(draftId),
                eq(PublishDraftType.VIDEO),
                any(ObjectNode.class),
                anyString(),
                eq("compose"),
                eq("draft")
        )).thenReturn(Optional.of(updated));
        when(persistenceService.delete(draftId, PublishDraftType.VIDEO)).thenReturn(true);
        when(lifecycleQueryService.resolve(draft)).thenReturn(dummyLifecycle());
        when(lifecycleQueryService.resolve(updated)).thenReturn(dummyLifecycle());

        Logger logger = (Logger) LoggerFactory.getLogger(VideoDraftApplicationService.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);

        try {
            var created = service.createDraft();
            assertThat(created.draftId()).isEqualTo(draftId.toString());

            var updatedResponse = service.updateDraft(
                    draftId.toString(),
                    new UpsertVideoDraftRequest(
                            "title",
                            "summary",
                            "video_prompt",
                            "prompt",
                            null,
                            null,
                            null,
                            null,
                            "model-category",
                            "content-category",
                            "composition-category",
                            null,
                            null,
                            null,
                            null,
                            null,
                            List.of("alpha"),
                            null,
                            "public",
                            null,
                            null
                    )
            );
            assertThat(updatedResponse).isPresent();

            boolean deleted = service.deleteDraft(draftId.toString());
            assertThat(deleted).isTrue();

            assertThat(appender.list.stream().map(ILoggingEvent::getFormattedMessage))
                    .anyMatch(message -> message.contains("video draft create-or-reuse success:"))
                    .anyMatch(message -> message.contains("video draft update success:"))
                    .anyMatch(message -> message.contains("video draft delete success:"));
        } finally {
            logger.detachAppender(appender);
            appender.stop();
        }
    }

    @Test
    void workflowAndPostDraftCrudRejectInvalidDraftIds() {
        PublishDraftPersistenceService persistenceService = Mockito.mock(PublishDraftPersistenceService.class);
        PublishDraftLifecycleQueryService lifecycleQueryService = Mockito.mock(PublishDraftLifecycleQueryService.class);
        JdbcTemplate jdbcTemplate = Mockito.mock(JdbcTemplate.class);
        WorkflowDraftApplicationService workflowService = new WorkflowDraftApplicationService(
                persistenceService,
                lifecycleQueryService,
                objectMapper
        );
        PostDraftApplicationService postService = new PostDraftApplicationService(
                persistenceService,
                lifecycleQueryService,
                objectMapper,
                jdbcTemplate
        );

        Logger workflowLogger = (Logger) LoggerFactory.getLogger(WorkflowDraftApplicationService.class);
        Logger postLogger = (Logger) LoggerFactory.getLogger(PostDraftApplicationService.class);
        ListAppender<ILoggingEvent> workflowAppender = new ListAppender<>();
        ListAppender<ILoggingEvent> postAppender = new ListAppender<>();
        workflowAppender.start();
        postAppender.start();
        workflowLogger.addAppender(workflowAppender);
        postLogger.addAppender(postAppender);

        try {
            assertThat(workflowService.updateDraft("bad-id", new UpsertWorkflowDraftRequest(
                    "title",
                    "summary",
                    "scenario",
                    List.of("tag"),
                    true,
                    false,
                    "public",
                    null,
                    null
            ))).isEmpty();
            assertThat(workflowService.deleteDraft("bad-id")).isFalse();
            assertThat(postService.updateDraft("bad-id", new UpsertPostDraftRequest(
                    "title",
                    "channel",
                    "content",
                    List.of("tag"),
                    "workflow",
                    null
            ))).isEmpty();
            assertThat(postService.deleteDraft("bad-id")).isFalse();

            assertThat(workflowAppender.list.stream().map(ILoggingEvent::getFormattedMessage))
                    .anyMatch(message -> message.contains("workflow draft update rejected: invalid draftId=bad-id"))
                    .anyMatch(message -> message.contains("workflow draft delete rejected: invalid draftId=bad-id"));
            assertThat(postAppender.list.stream().map(ILoggingEvent::getFormattedMessage))
                    .anyMatch(message -> message.contains("post draft update rejected: invalid draftId=bad-id"))
                    .anyMatch(message -> message.contains("post draft delete rejected: invalid draftId=bad-id"));
        } finally {
            workflowLogger.detachAppender(workflowAppender);
            workflowAppender.stop();
            postLogger.detachAppender(postAppender);
            postAppender.stop();
        }
    }

    @Test
    void videoSubmitConflictPersistsRequestBusinessContextForExceptionLogging() {
        PublishDraftPersistenceService persistenceService = Mockito.mock(PublishDraftPersistenceService.class);
        PublishDraftLifecycleQueryService lifecycleQueryService = Mockito.mock(PublishDraftLifecycleQueryService.class);
        VideoDraftApplicationService service = new VideoDraftApplicationService(
                persistenceService,
                lifecycleQueryService,
                objectMapper
        );

        UUID draftId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        UUID promptId = UUID.randomUUID();
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("categoryCode", "video_prompt");

        PersistedPublishDraft existing = draft(draftId, authorId, promptId, "video", payload);
        when(persistenceService.find(draftId, PublishDraftType.VIDEO)).thenReturn(Optional.of(existing));
        when(persistenceService.submitVideoDraft(
                eq(draftId),
                any(ObjectNode.class),
                anyString(),
                eq("submitted"),
                eq("submitted"),
                eq("publish")
        )).thenThrow(new ApiBusinessException(
                HttpStatus.CONFLICT,
                "VIDEO_DRAFT_ALREADY_SUBMITTED",
                "video draft has already been submitted"
        ));

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/video-drafts/" + draftId + "/submit");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        assertThatThrownBy(() -> service.submitDraft(draftId.toString(), new SubmitDraftRequest("publish")))
                .isInstanceOf(ApiBusinessException.class)
                .hasMessage("video draft has already been submitted");

        Map<String, String> requestContext = RequestBusinessContextInterceptor.getRequestContext(request);
        assertThat(requestContext)
                .containsEntry("draftId", draftId.toString())
                .containsEntry("targetType", "prompt")
                .containsEntry("targetId", promptId.toString())
                .containsEntry("promptId", promptId.toString());
        assertThat(RequestBusinessContextInterceptor.getBizContext(request))
                .isEqualTo("promptId=" + promptId + ",draftId=" + draftId + ",targetType=prompt,targetId=" + promptId);
        assertThat(MDC.get("draftId")).isNull();
        assertThat(MDC.get("promptId")).isNull();
        assertThat(MDC.get("targetType")).isNull();
        assertThat(MDC.get("targetId")).isNull();
        assertThat(MDC.get("bizContext")).isNull();
    }

    private PersistedPublishDraft draft(
            UUID draftId,
            UUID authorId,
            UUID targetId,
            String draftType,
            ObjectNode payload
    ) {
        return new PersistedPublishDraft(
                draftId,
                draftType,
                authorId,
                targetId,
                "integration draft",
                payload.deepCopy(),
                "compose",
                "submitted",
                1,
                OffsetDateTime.now()
        );
    }

    private DraftLifecycleResponse dummyLifecycle() {
        return new DraftLifecycleResponse(
                "submitted",
                "not_applicable",
                "当前阶段发布后直接可见，审核链路仅做预留",
                "not_applicable",
                null,
                null,
                false,
                OffsetDateTime.now().toString()
        );
    }
}
