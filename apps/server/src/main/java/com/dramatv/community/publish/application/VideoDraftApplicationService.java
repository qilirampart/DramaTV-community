package com.dramatv.community.publish.application;

import com.dramatv.community.publish.dto.request.SubmitDraftRequest;
import com.dramatv.community.publish.dto.request.UpsertVideoDraftRequest;
import com.dramatv.community.publish.dto.response.VideoDraftResponse;
import com.dramatv.community.publish.dto.response.VideoDraftSubmitResponse;
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
public class VideoDraftApplicationService {

    private final PublishDraftPersistenceService persistenceService;
    private final ObjectMapper objectMapper;

    public VideoDraftApplicationService(
            PublishDraftPersistenceService persistenceService,
            ObjectMapper objectMapper
    ) {
        this.persistenceService = persistenceService;
        this.objectMapper = objectMapper;
    }

    public VideoDraftResponse createDraft() {
        return toResponse(persistenceService.createOrReuse(
                PublishDraftType.VIDEO,
                defaultPayload(),
                null,
                "compose"
        ));
    }

    public Optional<VideoDraftResponse> findDraft(String draftId) {
        return parseUuid(draftId)
                .flatMap(uuid -> persistenceService.find(uuid, PublishDraftType.VIDEO))
                .map(this::toResponse);
    }

    public Optional<VideoDraftResponse> updateDraft(String draftId, UpsertVideoDraftRequest request) {
        return parseUuid(draftId)
                .flatMap(uuid -> persistenceService.find(uuid, PublishDraftType.VIDEO)
                        .flatMap(existing -> persistenceService.save(
                                uuid,
                                PublishDraftType.VIDEO,
                                mergePayload(existing.payloadJson(), request),
                                pick(request.title(), existing.titleDraft()),
                                "compose",
                                "draft"
                        )))
                .map(this::toResponse);
    }

    public Optional<VideoDraftSubmitResponse> submitDraft(String draftId, SubmitDraftRequest request) {
        return parseUuid(draftId)
                .flatMap(uuid -> persistenceService.find(uuid, PublishDraftType.VIDEO)
                        .flatMap(existing -> persistenceService.submitVideoDraft(
                                uuid,
                                existing.payloadJson(),
                                existing.titleDraft(),
                                "review",
                                "in_review",
                                request.submitMode()
                        )))
                .map(saved -> new VideoDraftSubmitResponse(
                        saved.targetId().toString(),
                        saved.statusCode(),
                        List.of("media-task-" + saved.id(), "audit-task-" + saved.id()),
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
        payload.putNull("categoryCode");
        payload.set("tagNames", objectMapper.createArrayNode());
        payload.putNull("workflowId");
        payload.put("visibility", "public");
        payload.putNull("coverAssetId");
        payload.putNull("sourceAssetId");
        return payload;
    }

    private ObjectNode mergePayload(ObjectNode existingPayload, UpsertVideoDraftRequest request) {
        ObjectNode payload = existingPayload.deepCopy();

        if (request.title() != null) {
            putNullableText(payload, "title", request.title());
        }
        if (request.summary() != null) {
            putNullableText(payload, "summary", request.summary());
        }
        if (request.categoryCode() != null) {
            putNullableText(payload, "categoryCode", request.categoryCode());
        }
        if (request.tagNames() != null) {
            ArrayNode tags = objectMapper.createArrayNode();
            request.tagNames().forEach(tags::add);
            payload.set("tagNames", tags);
        }
        if (request.workflowId() != null) {
            putNullableText(payload, "workflowId", request.workflowId());
        }
        if (request.visibility() != null) {
            putNullableText(payload, "visibility", request.visibility());
        }
        if (request.coverAssetId() != null) {
            putNullableText(payload, "coverAssetId", request.coverAssetId());
        }
        if (request.sourceAssetId() != null) {
            putNullableText(payload, "sourceAssetId", request.sourceAssetId());
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

    private VideoDraftResponse toResponse(PersistedPublishDraft draft) {
        ObjectNode payload = draft.payloadJson();

        return new VideoDraftResponse(
                draft.id().toString(),
                draft.targetId() == null ? null : draft.targetId().toString(),
                nullableText(payload, "title"),
                nullableText(payload, "summary"),
                nullableText(payload, "categoryCode"),
                stringList(payload.get("tagNames")),
                nullableText(payload, "workflowId"),
                textOrDefault(payload, "visibility", "public"),
                nullableText(payload, "coverAssetId"),
                nullableText(payload, "sourceAssetId"),
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
