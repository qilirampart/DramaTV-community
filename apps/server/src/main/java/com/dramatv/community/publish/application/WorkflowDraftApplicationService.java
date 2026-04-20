package com.dramatv.community.publish.application;

import com.dramatv.community.publish.dto.request.SubmitDraftRequest;
import com.dramatv.community.publish.dto.request.UpsertWorkflowDraftRequest;
import com.dramatv.community.publish.dto.response.WorkflowDraftResponse;
import com.dramatv.community.publish.dto.response.WorkflowDraftSubmitResponse;
import com.dramatv.community.publish.persistence.PersistedPublishDraft;
import com.dramatv.community.publish.persistence.PublishDraftPersistenceService;
import com.dramatv.community.publish.persistence.PublishDraftType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class WorkflowDraftApplicationService {

    private final PublishDraftPersistenceService persistenceService;
    private final ObjectMapper objectMapper;

    public WorkflowDraftApplicationService(
            PublishDraftPersistenceService persistenceService,
            ObjectMapper objectMapper
    ) {
        this.persistenceService = persistenceService;
        this.objectMapper = objectMapper;
    }

    public WorkflowDraftResponse createDraft() {
        return toResponse(persistenceService.createOrReuse(
                PublishDraftType.WORKFLOW,
                defaultPayload(),
                null,
                "compose"
        ));
    }

    public Optional<WorkflowDraftResponse> findDraft(String draftId) {
        return parseUuid(draftId)
                .flatMap(uuid -> persistenceService.find(uuid, PublishDraftType.WORKFLOW))
                .map(this::toResponse);
    }

    public Optional<WorkflowDraftResponse> updateDraft(String draftId, UpsertWorkflowDraftRequest request) {
        return parseUuid(draftId)
                .flatMap(uuid -> persistenceService.find(uuid, PublishDraftType.WORKFLOW)
                        .flatMap(existing -> persistenceService.save(
                                uuid,
                                PublishDraftType.WORKFLOW,
                                mergePayload(existing.payloadJson(), request),
                                pick(request.title(), existing.titleDraft()),
                                "compose",
                                "draft"
                        )))
                .map(this::toResponse);
    }

    public Optional<WorkflowDraftSubmitResponse> submitDraft(String draftId, SubmitDraftRequest request) {
        return parseUuid(draftId)
                .flatMap(uuid -> persistenceService.find(uuid, PublishDraftType.WORKFLOW)
                        .flatMap(existing -> persistenceService.submitWorkflowDraft(
                                uuid,
                                existing.payloadJson(),
                                existing.titleDraft(),
                                "review",
                                "in_review",
                                request.submitMode()
                        )))
                .map(saved -> new WorkflowDraftSubmitResponse(
                        saved.targetId().toString(),
                        saved.statusCode(),
                        List.of("workflow-validate-task-" + saved.id(), "audit-task-" + saved.id()),
                        request.submitMode()
                ));
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
                draft.statusCode()
        );
    }

    private String nullableText(ObjectNode payload, String fieldName) {
        JsonNode node = payload.get(fieldName);
        if (node == null || node.isNull()) {
            return null;
        }

        return node.asText();
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
