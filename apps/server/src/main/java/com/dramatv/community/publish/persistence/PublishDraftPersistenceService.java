package com.dramatv.community.publish.persistence;

import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserService;
import com.dramatv.community.shared.error.ApiBusinessException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PublishDraftPersistenceService {

    private static final String DRAFT_STATUS_DRAFT = "draft";

    private final PublishDraftRepository publishDraftRepository;
    private final PublishedContentPersistenceService publishedContentPersistenceService;
    private final PublishAsyncTaskPersistenceService publishAsyncTaskPersistenceService;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final CurrentUserService currentUserService;

    public PublishDraftPersistenceService(
            PublishDraftRepository publishDraftRepository,
            PublishedContentPersistenceService publishedContentPersistenceService,
            PublishAsyncTaskPersistenceService publishAsyncTaskPersistenceService,
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            CurrentUserService currentUserService
    ) {
        this.publishDraftRepository = publishDraftRepository;
        this.publishedContentPersistenceService = publishedContentPersistenceService;
        this.publishAsyncTaskPersistenceService = publishAsyncTaskPersistenceService;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.currentUserService = currentUserService;
    }

    public PersistedPublishDraft createOrReuse(
            PublishDraftType draftType,
            ObjectNode payloadJson,
            String titleDraft,
            String currentStep
    ) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        ensureCreatorProfileExists(currentUser);

        return publishDraftRepository
                .findTopByAuthorIdAndDraftTypeAndStatusCodeOrderByUpdatedAtDesc(
                        currentUser.id(),
                        draftType.code(),
                        DRAFT_STATUS_DRAFT
                )
                .filter(this::isEditable)
                .map(this::toRecord)
                .orElseGet(() -> toRecord(publishDraftRepository.save(newEntity(
                        draftType,
                        payloadJson,
                        titleDraft,
                        currentStep,
                        currentUser.id()
                ))));
    }

    public Optional<PersistedPublishDraft> find(UUID draftId, PublishDraftType draftType) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();

        return publishDraftRepository.findByIdAndDraftTypeAndAuthorId(draftId, draftType.code(), currentUser.id())
                .map(this::toRecord);
    }

    public Optional<PersistedPublishDraft> save(
            UUID draftId,
            PublishDraftType draftType,
            ObjectNode payloadJson,
            String titleDraft,
            String currentStep,
            String statusCode
    ) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();

        return publishDraftRepository.findByIdAndDraftTypeAndAuthorId(draftId, draftType.code(), currentUser.id())
                .map(entity -> {
                    ensureEditable(entity, "DRAFT_ALREADY_SUBMITTED", "draft has already been submitted");
                    entity.setPayloadJson(payloadJson.deepCopy());
                    entity.setTitleDraft(titleDraft);
                    entity.setCurrentStep(currentStep);
                    entity.setStatusCode(statusCode);
                    entity.setAutosaveVersion(entity.getAutosaveVersion() + 1);
                    return toRecord(publishDraftRepository.save(entity));
                });
    }

    public boolean delete(UUID draftId, PublishDraftType draftType) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();

        Optional<PublishDraftEntity> existing = publishDraftRepository.findByIdAndDraftTypeAndAuthorId(
                draftId,
                draftType.code(),
                currentUser.id()
        );

        if (existing.isEmpty()) {
            return false;
        }

        ensureEditable(existing.get(), "DRAFT_ALREADY_SUBMITTED", "draft has already been submitted");
        publishDraftRepository.delete(existing.get());
        return true;
    }

    public Optional<PersistedPublishDraft> submit(
            UUID draftId,
            PublishDraftType draftType,
            ObjectNode payloadJson,
            String titleDraft,
            String currentStep,
            String statusCode
    ) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();

        return publishDraftRepository.findByIdAndDraftTypeAndAuthorId(draftId, draftType.code(), currentUser.id())
                .map(entity -> {
                    ensureEditable(entity, "DRAFT_ALREADY_SUBMITTED", "draft has already been submitted");
                    entity.setTargetId(entity.getTargetId() == null ? UUID.randomUUID() : entity.getTargetId());
                    entity.setPayloadJson(payloadJson.deepCopy());
                    entity.setTitleDraft(titleDraft);
                    entity.setCurrentStep(currentStep);
                    entity.setStatusCode(statusCode);
                    entity.setSubmittedAt(OffsetDateTime.now());
                    entity.setAutosaveVersion(entity.getAutosaveVersion() + 1);
                    return toRecord(publishDraftRepository.save(entity));
                });
    }

    @Transactional
    public Optional<SubmittedPublishDraft> submitVideoDraft(
            UUID draftId,
            ObjectNode payloadJson,
            String titleDraft,
            String currentStep,
            String statusCode,
            String submitMode
    ) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();

        return publishDraftRepository.findByIdAndDraftTypeAndAuthorId(draftId, PublishDraftType.VIDEO.code(), currentUser.id())
                .map(entity -> {
                    ensureEditable(entity, "VIDEO_DRAFT_ALREADY_SUBMITTED", "video draft has already been submitted");
                    entity.setTargetId(entity.getTargetId() == null ? UUID.randomUUID() : entity.getTargetId());
                    entity.setPayloadJson(payloadJson.deepCopy());
                    entity.setTitleDraft(titleDraft);
                    entity.setCurrentStep(currentStep);
                    entity.setStatusCode(statusCode);
                    entity.setSubmittedAt(OffsetDateTime.now());
                    entity.setAutosaveVersion(entity.getAutosaveVersion() + 1);

                    PublishDraftEntity savedEntity = publishDraftRepository.save(entity);
                    publishedContentPersistenceService.upsertVideoForReview(
                            savedEntity.getTargetId(),
                            savedEntity.getAuthorId(),
                            payloadJson,
                            titleDraft,
                            submitMode
                    );

                    PersistedPublishDraft savedDraft = toRecord(savedEntity);
                    return new SubmittedPublishDraft(
                            savedDraft,
                            createVideoSubmitTasks(savedDraft, payloadJson, submitMode)
                    );
                });
    }

    @Transactional
    public Optional<PersistedPublishDraft> submitWorkflowDraft(
            UUID draftId,
            ObjectNode payloadJson,
            String titleDraft,
            String currentStep,
            String statusCode,
            String submitMode
    ) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();

        return publishDraftRepository.findByIdAndDraftTypeAndAuthorId(draftId, PublishDraftType.WORKFLOW.code(), currentUser.id())
                .map(entity -> {
                    ensureEditable(entity, "WORKFLOW_DRAFT_ALREADY_SUBMITTED", "workflow draft has already been submitted");
                    entity.setTargetId(entity.getTargetId() == null ? UUID.randomUUID() : entity.getTargetId());
                    entity.setPayloadJson(payloadJson.deepCopy());
                    entity.setTitleDraft(titleDraft);
                    entity.setCurrentStep(currentStep);
                    entity.setStatusCode(statusCode);
                    entity.setSubmittedAt(OffsetDateTime.now());
                    entity.setAutosaveVersion(entity.getAutosaveVersion() + 1);

                    PublishDraftEntity savedEntity = publishDraftRepository.save(entity);
                    publishedContentPersistenceService.upsertWorkflowForReview(
                            savedEntity.getTargetId(),
                            savedEntity.getAuthorId(),
                            payloadJson,
                            titleDraft,
                            submitMode
                    );

                    return toRecord(savedEntity);
                });
    }

    @Transactional
    public Optional<PersistedPublishDraft> submitPostDraft(
            UUID draftId,
            ObjectNode payloadJson,
            String titleDraft,
            String currentStep,
            String statusCode,
            String submitMode
    ) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();

        return publishDraftRepository.findByIdAndDraftTypeAndAuthorId(draftId, PublishDraftType.POST.code(), currentUser.id())
                .map(entity -> {
                    ensureEditable(entity, "POST_DRAFT_ALREADY_SUBMITTED", "post draft has already been submitted");
                    entity.setTargetId(entity.getTargetId() == null ? UUID.randomUUID() : entity.getTargetId());
                    entity.setPayloadJson(payloadJson.deepCopy());
                    entity.setTitleDraft(titleDraft);
                    entity.setCurrentStep(currentStep);
                    entity.setStatusCode(statusCode);
                    entity.setSubmittedAt(OffsetDateTime.now());
                    entity.setAutosaveVersion(entity.getAutosaveVersion() + 1);

                    PublishDraftEntity savedEntity = publishDraftRepository.save(entity);
                    publishedContentPersistenceService.upsertDiscussionThreadForPublish(
                            savedEntity.getTargetId(),
                            savedEntity.getAuthorId(),
                            payloadJson,
                            titleDraft,
                            submitMode
                    );

                    return toRecord(savedEntity);
                });
    }

    private PublishDraftEntity newEntity(
            PublishDraftType draftType,
            ObjectNode payloadJson,
            String titleDraft,
            String currentStep,
            UUID authorId
    ) {
        PublishDraftEntity entity = new PublishDraftEntity();
        entity.setDraftType(draftType.code());
        entity.setAuthorId(authorId);
        entity.setTitleDraft(titleDraft);
        entity.setPayloadJson(payloadJson.deepCopy());
        entity.setCurrentStep(currentStep);
        entity.setStatusCode(DRAFT_STATUS_DRAFT);
        entity.setAutosaveVersion(1);
        return entity;
    }

    private boolean isEditable(PublishDraftEntity entity) {
        if (entity == null) {
            return false;
        }
        return entity.getSubmittedAt() == null && DRAFT_STATUS_DRAFT.equalsIgnoreCase(entity.getStatusCode());
    }

    private void ensureEditable(PublishDraftEntity entity, String code, String message) {
        if (isEditable(entity)) {
            return;
        }
        throw ApiBusinessException.conflict(code, message);
    }

    private PersistedPublishDraft toRecord(PublishDraftEntity entity) {
        ObjectNode payload = entity.getPayloadJson() == null
                ? objectMapper.createObjectNode()
                : objectMapper.convertValue(entity.getPayloadJson(), ObjectNode.class);

        return new PersistedPublishDraft(
                entity.getId(),
                entity.getDraftType(),
                entity.getAuthorId(),
                entity.getTargetId(),
                entity.getTitleDraft(),
                payload,
                entity.getCurrentStep(),
                entity.getStatusCode(),
                entity.getAutosaveVersion(),
                entity.getSubmittedAt()
        );
    }

    private void ensureCreatorProfileExists(CurrentUser user) {
        jdbcTemplate.update("""
                insert into creator_profiles (
                    user_id, headline, featured_status, created_at, updated_at
                )
                values (?, ?, ?, now(), now())
                on conflict (user_id) do update
                set headline = excluded.headline,
                    updated_at = now()
                """,
                user.id(),
                user.headline(),
                "normal"
        );
    }

    private List<String> createVideoSubmitTasks(
            PersistedPublishDraft savedDraft,
            ObjectNode payloadJson,
            String submitMode
    ) {
        String categoryCode = nullableText(payloadJson, "categoryCode");
        if ("image_prompt".equals(categoryCode)) {
            return publishAsyncTaskPersistenceService.createImagePromptSubmitTasks(savedDraft, submitMode);
        }
        if ("video_prompt".equals(categoryCode)) {
            return publishAsyncTaskPersistenceService.createVideoPromptSubmitTasks(savedDraft, submitMode);
        }
        return publishAsyncTaskPersistenceService.createVideoSubmitTasks(savedDraft, submitMode);
    }

    private String nullableText(ObjectNode payloadJson, String fieldName) {
        if (payloadJson == null) {
            return null;
        }

        var node = payloadJson.get(fieldName);
        if (node == null || node.isNull()) {
            return null;
        }

        String value = node.asText().trim();
        return value.isEmpty() ? null : value;
    }
}
