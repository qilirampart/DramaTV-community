package com.dramatv.community.publish.application;

import com.dramatv.community.publish.dto.request.SubmitDraftRequest;
import com.dramatv.community.publish.dto.request.UpsertPostDraftRequest;
import com.dramatv.community.publish.dto.response.PostDraftResponse;
import com.dramatv.community.publish.dto.response.PostDraftSubmitResponse;
import com.dramatv.community.publish.persistence.PersistedPublishDraft;
import com.dramatv.community.publish.persistence.PublishDraftPersistenceService;
import com.dramatv.community.publish.persistence.PublishDraftType;
import com.dramatv.community.shared.request.MdcBusinessContextScope;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class PostDraftApplicationService {

    private static final Logger log = LoggerFactory.getLogger(PostDraftApplicationService.class);
    private static final String DRAFT_STEP_SUBMITTED = "submitted";
    private static final String DRAFT_STATUS_SUBMITTED = "submitted";
    private static final String CONTENT_STATUS_PUBLISHED = "published";

    private final PublishDraftPersistenceService persistenceService;
    private final PublishDraftLifecycleQueryService lifecycleQueryService;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;

    public PostDraftApplicationService(
            PublishDraftPersistenceService persistenceService,
            PublishDraftLifecycleQueryService lifecycleQueryService,
            ObjectMapper objectMapper,
            JdbcTemplate jdbcTemplate
    ) {
        this.persistenceService = persistenceService;
        this.lifecycleQueryService = lifecycleQueryService;
        this.objectMapper = objectMapper;
        this.jdbcTemplate = jdbcTemplate;
    }

    public PostDraftResponse createDraft() {
        PersistedPublishDraft draft = persistenceService.createOrReuse(
                PublishDraftType.POST,
                defaultPayload(),
                null,
                "compose"
        );

        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(draftContext(draft.id()))) {
            log.info(
                    "post draft create-or-reuse success: authorId={} draftId={} statusCode={} currentStep={} autosaveVersion={}",
                    draft.authorId(),
                    draft.id(),
                    draft.statusCode(),
                    draft.currentStep(),
                    draft.autosaveVersion()
            );
        }

        return toResponse(draft);
    }

    public Optional<PostDraftResponse> findDraft(String draftId) {
        return parseUuid(draftId)
                .flatMap(uuid -> persistenceService.find(uuid, PublishDraftType.POST))
                .map(this::toResponse);
    }

    public Optional<PostDraftResponse> updateDraft(String draftId, UpsertPostDraftRequest request) {
        Optional<UUID> parsedDraftId = parseUuid(draftId);
        if (parsedDraftId.isEmpty()) {
            log.warn("post draft update rejected: invalid draftId={}", draftId);
            return Optional.empty();
        }

        UUID resolvedDraftId = parsedDraftId.get();
        Optional<PersistedPublishDraft> existingOptional = persistenceService.find(resolvedDraftId, PublishDraftType.POST);
        if (existingOptional.isEmpty()) {
            log.warn("post draft update rejected: draft not found, draftId={}", resolvedDraftId);
            return Optional.empty();
        }

        PersistedPublishDraft existing = existingOptional.get();
        Optional<PersistedPublishDraft> savedOptional = persistenceService.save(
                resolvedDraftId,
                PublishDraftType.POST,
                mergePayload(existing.payloadJson(), request),
                pick(request.title(), existing.titleDraft()),
                "compose",
                "draft"
        );
        if (savedOptional.isEmpty()) {
            log.warn("post draft update rejected: draft not found after lookup, draftId={}", resolvedDraftId);
            return Optional.empty();
        }

        PersistedPublishDraft savedDraft = savedOptional.get();
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(draftContext(savedDraft.id()))) {
            log.info(
                    "post draft update success: authorId={} draftId={} statusCode={} currentStep={} autosaveVersion={}",
                    savedDraft.authorId(),
                    savedDraft.id(),
                    savedDraft.statusCode(),
                    savedDraft.currentStep(),
                    savedDraft.autosaveVersion()
            );
        }

        return Optional.of(toResponse(savedDraft));
    }

    public boolean deleteDraft(String draftId) {
        Optional<UUID> parsedDraftId = parseUuid(draftId);
        if (parsedDraftId.isEmpty()) {
            log.warn("post draft delete rejected: invalid draftId={}", draftId);
            return false;
        }

        UUID resolvedDraftId = parsedDraftId.get();
        boolean deleted = persistenceService.delete(resolvedDraftId, PublishDraftType.POST);
        if (!deleted) {
            log.warn("post draft delete rejected: draft not found, draftId={}", resolvedDraftId);
            return false;
        }

        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(draftContext(resolvedDraftId))) {
            log.info("post draft delete success: draftId={}", resolvedDraftId);
        }
        return true;
    }

    public Optional<PostDraftSubmitResponse> submitDraft(String draftId, SubmitDraftRequest request) {
        Optional<UUID> parsedDraftId = parseUuid(draftId);
        if (parsedDraftId.isEmpty()) {
            log.warn("post draft submit rejected: invalid draftId={}", draftId);
            return Optional.empty();
        }

        UUID resolvedDraftId = parsedDraftId.get();
        Optional<PersistedPublishDraft> existingOptional = persistenceService.find(resolvedDraftId, PublishDraftType.POST);
        if (existingOptional.isEmpty()) {
            log.warn("post draft submit rejected: draft not found, draftId={}", resolvedDraftId);
            return Optional.empty();
        }

        PersistedPublishDraft existing = existingOptional.get();
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(submitContext(existing, null))) {
            Optional<PersistedPublishDraft> submittedOptional = persistenceService.submitPostDraft(
                    resolvedDraftId,
                    existing.payloadJson(),
                    existing.titleDraft(),
                    DRAFT_STEP_SUBMITTED,
                    DRAFT_STATUS_SUBMITTED,
                    request.submitMode()
            );
            if (submittedOptional.isEmpty()) {
                log.warn("post draft submit rejected: draft not found after lookup, draftId={}", resolvedDraftId);
                return Optional.empty();
            }

            PersistedPublishDraft savedDraft = submittedOptional.get();
            String slug = findDiscussionSlug(savedDraft.targetId());
            try (MdcBusinessContextScope successContext = MdcBusinessContextScope.open(submitContext(savedDraft, slug))) {
                log.info(
                        "publish draft submit success: draftType=post authorId={} draftId={} targetType=post targetId={} threadSlug={} submitMode={} taskCount=0 draftStatus={} contentStatus={}",
                        savedDraft.authorId(),
                        savedDraft.id(),
                        savedDraft.targetId(),
                        slug,
                        request.submitMode(),
                        savedDraft.statusCode(),
                        CONTENT_STATUS_PUBLISHED
                );
                return Optional.of(new PostDraftSubmitResponse(
                        savedDraft.targetId().toString(),
                        slug,
                        savedDraft.statusCode(),
                        CONTENT_STATUS_PUBLISHED,
                        savedDraft.statusCode(),
                        lifecycleQueryService.resolve(savedDraft),
                        List.of(),
                        request.submitMode()
                ));
            }
        }
    }

    private String findDiscussionSlug(UUID targetId) {
        if (targetId == null) {
            return null;
        }

        return jdbcTemplate.query("""
                select slug
                from discussion_threads
                where id = ?
                """,
                resultSet -> resultSet.next() ? resultSet.getString("slug") : null,
                targetId
        );
    }

    private Optional<UUID> parseUuid(String draftId) {
        try {
            return Optional.of(UUID.fromString(draftId));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    private String pick(String candidate, String fallback) {
        return candidate == null ? fallback : candidate;
    }

    private ObjectNode defaultPayload() {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.putNull("title");
        payload.put("channelSlug", "video-production");
        payload.putNull("content");
        payload.set("tagNames", objectMapper.createArrayNode());
        payload.putNull("bindingTargetType");
        payload.putNull("bindingTargetId");
        return payload;
    }

    private ObjectNode mergePayload(ObjectNode existingPayload, UpsertPostDraftRequest request) {
        ObjectNode payload = existingPayload.deepCopy();

        if (request.title() != null) {
            putNullableText(payload, "title", request.title());
        }
        if (request.channelSlug() != null) {
            putNullableText(payload, "channelSlug", request.channelSlug());
        }
        if (request.content() != null) {
            putNullableText(payload, "content", request.content());
        }
        if (request.tagNames() != null) {
            ArrayNode tags = objectMapper.createArrayNode();
            request.tagNames().forEach(tags::add);
            payload.set("tagNames", tags);
        }
        if (request.bindingTargetType() != null) {
            putNullableText(payload, "bindingTargetType", request.bindingTargetType());
        }
        if (request.bindingTargetId() != null) {
            putNullableText(payload, "bindingTargetId", request.bindingTargetId());
        }

        return payload;
    }

    private void putNullableText(ObjectNode payload, String fieldName, String value) {
        if (value == null) {
            payload.putNull(fieldName);
            return;
        }

        payload.put(fieldName, value);
    }

    private PostDraftResponse toResponse(PersistedPublishDraft draft) {
        ObjectNode payload = draft.payloadJson();

        return new PostDraftResponse(
                draft.id().toString(),
                draft.targetId() == null ? null : draft.targetId().toString(),
                nullableText(payload, "title"),
                textOrDefault(payload, "channelSlug", "video-production"),
                nullableText(payload, "content"),
                stringList(payload.get("tagNames")),
                nullableText(payload, "bindingTargetType"),
                nullableText(payload, "bindingTargetId"),
                draft.statusCode(),
                lifecycleQueryService.resolve(draft)
        );
    }

    private String nullableText(ObjectNode payload, String fieldName) {
        JsonNode node = payload.get(fieldName);
        if (node == null || node.isNull()) {
            return null;
        }

        return node.asText();
    }

    private Map<String, String> submitContext(PersistedPublishDraft draft, String threadSlug) {
        LinkedHashMap<String, String> context = new LinkedHashMap<>();
        context.put("draftId", draft.id().toString());
        context.put("targetType", "post");
        if (draft.targetId() != null) {
            context.put("targetId", draft.targetId().toString());
        }
        if (threadSlug != null && !threadSlug.isBlank()) {
            context.put("threadSlug", threadSlug);
        }
        return context;
    }

    private Map<String, String> draftContext(UUID draftId) {
        return Map.of("draftId", draftId.toString());
    }

    private String textOrDefault(ObjectNode payload, String fieldName, String fallback) {
        String value = nullableText(payload, fieldName);
        return value == null ? fallback : value;
    }

    private List<String> stringList(JsonNode node) {
        if (node == null || !node.isArray()) {
            return List.of();
        }

        List<String> values = new java.util.ArrayList<>();
        node.forEach(item -> values.add(item.asText()));
        return List.copyOf(values);
    }
}
