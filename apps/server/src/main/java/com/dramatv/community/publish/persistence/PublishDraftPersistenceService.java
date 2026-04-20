package com.dramatv.community.publish.persistence;

import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PublishDraftPersistenceService {

    private final PublishDraftRepository publishDraftRepository;
    private final PublishedContentPersistenceService publishedContentPersistenceService;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final CurrentUserService currentUserService;

    public PublishDraftPersistenceService(
            PublishDraftRepository publishDraftRepository,
            PublishedContentPersistenceService publishedContentPersistenceService,
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            CurrentUserService currentUserService
    ) {
        this.publishDraftRepository = publishDraftRepository;
        this.publishedContentPersistenceService = publishedContentPersistenceService;
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
                        "draft"
                )
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
                    entity.setPayloadJson(payloadJson.deepCopy());
                    entity.setTitleDraft(titleDraft);
                    entity.setCurrentStep(currentStep);
                    entity.setStatusCode(statusCode);
                    entity.setAutosaveVersion(entity.getAutosaveVersion() + 1);
                    return toRecord(publishDraftRepository.save(entity));
                });
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
    public Optional<PersistedPublishDraft> submitVideoDraft(
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

                    return toRecord(savedEntity);
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
        entity.setStatusCode("draft");
        entity.setAutosaveVersion(1);
        return entity;
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
}
