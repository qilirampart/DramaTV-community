package com.dramatv.community.publish.application;

import com.dramatv.community.publish.dto.request.SubmitDraftRequest;
import com.dramatv.community.publish.dto.request.UpsertWorkflowDraftRequest;
import com.dramatv.community.publish.dto.response.WorkflowDraftResponse;
import com.dramatv.community.publish.dto.response.WorkflowDraftSubmitResponse;
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
import org.springframework.stereotype.Service;

@Service
public class WorkflowDraftApplicationService {

    private static final Logger log = LoggerFactory.getLogger(WorkflowDraftApplicationService.class);
    private static final String DRAFT_STEP_SUBMITTED = "submitted";
    private static final String DRAFT_STATUS_SUBMITTED = "submitted";
    private static final String CONTENT_STATUS_PUBLISHED = "published";

    private final PublishDraftPersistenceService persistenceService;
    private final PublishDraftLifecycleQueryService lifecycleQueryService;
    private final ObjectMapper objectMapper;

    public WorkflowDraftApplicationService(
            PublishDraftPersistenceService persistenceService,
            PublishDraftLifecycleQueryService lifecycleQueryService,
            ObjectMapper objectMapper
    ) {
        this.persistenceService = persistenceService;
        this.lifecycleQueryService = lifecycleQueryService;
        this.objectMapper = objectMapper;
    }

    public WorkflowDraftResponse createDraft() {
        PersistedPublishDraft draft = persistenceService.createOrReuse(
                PublishDraftType.WORKFLOW,
                defaultPayload(),
                null,
                "compose"
        );

        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(draftContext(draft.id()))) {
            log.info(
                    "workflow draft create-or-reuse success: authorId={} draftId={} statusCode={} currentStep={} autosaveVersion={}",
                    draft.authorId(),
                    draft.id(),
                    draft.statusCode(),
                    draft.currentStep(),
                    draft.autosaveVersion()
            );
        }

        return toResponse(draft);
    }

    public Optional<WorkflowDraftResponse> findDraft(String draftId) {
        return parseUuid(draftId)
                .flatMap(uuid -> persistenceService.find(uuid, PublishDraftType.WORKFLOW))
                .map(this::toResponse);
    }

    public Optional<WorkflowDraftResponse> updateDraft(String draftId, UpsertWorkflowDraftRequest request) {
        Optional<UUID> parsedDraftId = parseUuid(draftId);
        if (parsedDraftId.isEmpty()) {
            log.warn("workflow draft update rejected: invalid draftId={}", draftId);
            return Optional.empty();
        }

        UUID resolvedDraftId = parsedDraftId.get();
        Optional<PersistedPublishDraft> existingOptional = persistenceService.find(resolvedDraftId, PublishDraftType.WORKFLOW);
        if (existingOptional.isEmpty()) {
            log.warn("workflow draft update rejected: draft not found, draftId={}", resolvedDraftId);
            return Optional.empty();
        }

        PersistedPublishDraft existing = existingOptional.get();
        Optional<PersistedPublishDraft> savedOptional = persistenceService.save(
                resolvedDraftId,
                PublishDraftType.WORKFLOW,
                mergePayload(existing.payloadJson(), request),
                pick(request.title(), existing.titleDraft()),
                "compose",
                "draft"
        );
        if (savedOptional.isEmpty()) {
            log.warn("workflow draft update rejected: draft not found after lookup, draftId={}", resolvedDraftId);
            return Optional.empty();
        }

        PersistedPublishDraft savedDraft = savedOptional.get();
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(draftContext(savedDraft.id()))) {
            log.info(
                    "workflow draft update success: authorId={} draftId={} statusCode={} currentStep={} autosaveVersion={}",
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
            log.warn("workflow draft delete rejected: invalid draftId={}", draftId);
            return false;
        }

        UUID resolvedDraftId = parsedDraftId.get();
        boolean deleted = persistenceService.delete(resolvedDraftId, PublishDraftType.WORKFLOW);
        if (!deleted) {
            log.warn("workflow draft delete rejected: draft not found, draftId={}", resolvedDraftId);
            return false;
        }

        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(draftContext(resolvedDraftId))) {
            log.info("workflow draft delete success: draftId={}", resolvedDraftId);
        }
        return true;
    }

    public Optional<WorkflowDraftSubmitResponse> submitDraft(String draftId, SubmitDraftRequest request) {
        Optional<UUID> parsedDraftId = parseUuid(draftId);
        if (parsedDraftId.isEmpty()) {
            log.warn("workflow draft submit rejected: invalid draftId={}", draftId);
            return Optional.empty();
        }

        UUID resolvedDraftId = parsedDraftId.get();
        Optional<PersistedPublishDraft> existingOptional = persistenceService.find(resolvedDraftId, PublishDraftType.WORKFLOW);
        if (existingOptional.isEmpty()) {
            log.warn("workflow draft submit rejected: draft not found, draftId={}", resolvedDraftId);
            return Optional.empty();
        }

        PersistedPublishDraft existing = existingOptional.get();
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(submitContext(existing))) {
            Optional<PersistedPublishDraft> submittedOptional = persistenceService.submitWorkflowDraft(
                    resolvedDraftId,
                    existing.payloadJson(),
                    existing.titleDraft(),
                    DRAFT_STEP_SUBMITTED,
                    DRAFT_STATUS_SUBMITTED,
                    request.submitMode()
            );
            if (submittedOptional.isEmpty()) {
                log.warn("workflow draft submit rejected: draft not found after lookup, draftId={}", resolvedDraftId);
                return Optional.empty();
            }

            PersistedPublishDraft savedDraft = submittedOptional.get();
            try (MdcBusinessContextScope successContext = MdcBusinessContextScope.open(submitContext(savedDraft))) {
                log.info(
                        "publish draft submit success: draftType=workflow authorId={} draftId={} targetType=workflow targetId={} submitMode={} taskCount=0 draftStatus={} contentStatus={}",
                        savedDraft.authorId(),
                        savedDraft.id(),
                        savedDraft.targetId(),
                        request.submitMode(),
                        savedDraft.statusCode(),
                        CONTENT_STATUS_PUBLISHED
                );
                return Optional.of(new WorkflowDraftSubmitResponse(
                        savedDraft.targetId().toString(),
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

    private String pick(String candidate, String fallback) {
        return candidate == null ? fallback : candidate;
    }

    private Optional<UUID> parseUuid(String draftId) {
        try {
            return Optional.of(UUID.fromString(draftId));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    private ObjectNode defaultPayload() {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.putNull("title");
        payload.putNull("summary");
        payload.putNull("scenarioText");
        payload.set("tagNames", objectMapper.createArrayNode());
        payload.put("allowCopy", true);
        payload.put("allowFork", false);
        payload.put("visibility", "public");
        payload.putNull("coverAssetId");
        payload.putNull("exampleAssetId");
        return payload;
    }

    private ObjectNode mergePayload(ObjectNode existingPayload, UpsertWorkflowDraftRequest request) {
        ObjectNode payload = existingPayload.deepCopy();

        if (request.title() != null) {
            putNullableText(payload, "title", request.title());
        }
        if (request.summary() != null) {
            putNullableText(payload, "summary", request.summary());
        }
        if (request.scenarioText() != null) {
            putNullableText(payload, "scenarioText", request.scenarioText());
        }
        if (request.tagNames() != null) {
            ArrayNode tags = objectMapper.createArrayNode();
            request.tagNames().forEach(tags::add);
            payload.set("tagNames", tags);
        }
        if (request.allowCopy() != null) {
            payload.put("allowCopy", request.allowCopy());
        }
        if (request.allowFork() != null) {
            payload.put("allowFork", request.allowFork());
        }
        if (request.visibility() != null) {
            putNullableText(payload, "visibility", request.visibility());
        }
        if (request.coverAssetId() != null) {
            putNullableText(payload, "coverAssetId", request.coverAssetId());
        }
        if (request.exampleAssetId() != null) {
            putNullableText(payload, "exampleAssetId", request.exampleAssetId());
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

    private WorkflowDraftResponse toResponse(PersistedPublishDraft draft) {
        ObjectNode payload = draft.payloadJson();

        return new WorkflowDraftResponse(
                draft.id().toString(),
                draft.targetId() == null ? null : draft.targetId().toString(),
                nullableText(payload, "title"),
                nullableText(payload, "summary"),
                nullableText(payload, "scenarioText"),
                stringList(payload.get("tagNames")),
                booleanOrDefault(payload, "allowCopy", true),
                booleanOrDefault(payload, "allowFork", false),
                textOrDefault(payload, "visibility", "public"),
                nullableText(payload, "coverAssetId"),
                nullableText(payload, "exampleAssetId"),
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

    private Map<String, String> submitContext(PersistedPublishDraft draft) {
        LinkedHashMap<String, String> context = new LinkedHashMap<>();
        context.put("draftId", draft.id().toString());
        context.put("targetType", "workflow");
        if (draft.targetId() != null) {
            context.put("targetId", draft.targetId().toString());
        }
        return context;
    }

    private Map<String, String> draftContext(UUID draftId) {
        return Map.of("draftId", draftId.toString());
    }

    private boolean booleanOrDefault(ObjectNode payload, String fieldName, boolean fallback) {
        JsonNode node = payload.get(fieldName);
        if (node == null || node.isNull()) {
            return fallback;
        }

        return node.asBoolean();
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
