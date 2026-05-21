package com.dramatv.community.publish.application;

import com.dramatv.community.publish.dto.request.SubmitDraftRequest;
import com.dramatv.community.publish.dto.request.UpsertVideoDraftRequest;
import com.dramatv.community.publish.dto.response.VideoDraftResponse;
import com.dramatv.community.publish.dto.response.VideoDraftSubmitResponse;
import com.dramatv.community.publish.persistence.PublishDraftPersistenceService;
import com.dramatv.community.publish.persistence.PublishDraftType;
import com.dramatv.community.publish.persistence.PersistedPublishDraft;
import com.dramatv.community.publish.persistence.SubmittedPublishDraft;
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
public class VideoDraftApplicationService {

    private static final Logger log = LoggerFactory.getLogger(VideoDraftApplicationService.class);
    private static final String DRAFT_STEP_SUBMITTED = "submitted";
    private static final String DRAFT_STATUS_SUBMITTED = "submitted";
    private static final String CONTENT_STATUS_PUBLISHED = "published";

    private final PublishDraftPersistenceService persistenceService;
    private final PublishDraftLifecycleQueryService lifecycleQueryService;
    private final ObjectMapper objectMapper;

    public VideoDraftApplicationService(
            PublishDraftPersistenceService persistenceService,
            PublishDraftLifecycleQueryService lifecycleQueryService,
            ObjectMapper objectMapper
    ) {
        this.persistenceService = persistenceService;
        this.lifecycleQueryService = lifecycleQueryService;
        this.objectMapper = objectMapper;
    }

    public VideoDraftResponse createDraft() {
        PersistedPublishDraft draft = persistenceService.createOrReuse(
                PublishDraftType.VIDEO,
                defaultPayload(),
                null,
                "compose"
        );

        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(draftContext(draft.id()))) {
            log.info(
                    "video draft create-or-reuse success: authorId={} draftId={} statusCode={} currentStep={} autosaveVersion={}",
                    draft.authorId(),
                    draft.id(),
                    draft.statusCode(),
                    draft.currentStep(),
                    draft.autosaveVersion()
            );
        }

        return toResponse(draft);
    }

    public Optional<VideoDraftResponse> findDraft(String draftId) {
        return parseUuid(draftId)
                .flatMap(uuid -> persistenceService.find(uuid, PublishDraftType.VIDEO))
                .map(this::toResponse);
    }

    public Optional<VideoDraftResponse> updateDraft(String draftId, UpsertVideoDraftRequest request) {
        Optional<UUID> parsedDraftId = parseUuid(draftId);
        if (parsedDraftId.isEmpty()) {
            log.warn("video draft update rejected: invalid draftId={}", draftId);
            return Optional.empty();
        }

        UUID resolvedDraftId = parsedDraftId.get();
        Optional<PersistedPublishDraft> existingOptional = persistenceService.find(resolvedDraftId, PublishDraftType.VIDEO);
        if (existingOptional.isEmpty()) {
            log.warn("video draft update rejected: draft not found, draftId={}", resolvedDraftId);
            return Optional.empty();
        }

        PersistedPublishDraft existing = existingOptional.get();
        Optional<PersistedPublishDraft> savedOptional = persistenceService.save(
                resolvedDraftId,
                PublishDraftType.VIDEO,
                mergePayload(existing.payloadJson(), request),
                pick(request.title(), existing.titleDraft()),
                "compose",
                "draft"
        );
        if (savedOptional.isEmpty()) {
            log.warn("video draft update rejected: draft not found after lookup, draftId={}", resolvedDraftId);
            return Optional.empty();
        }

        PersistedPublishDraft savedDraft = savedOptional.get();
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(draftContext(savedDraft.id()))) {
            log.info(
                    "video draft update success: authorId={} draftId={} statusCode={} currentStep={} autosaveVersion={}",
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
            log.warn("video draft delete rejected: invalid draftId={}", draftId);
            return false;
        }

        UUID resolvedDraftId = parsedDraftId.get();
        boolean deleted = persistenceService.delete(resolvedDraftId, PublishDraftType.VIDEO);
        if (!deleted) {
            log.warn("video draft delete rejected: draft not found, draftId={}", resolvedDraftId);
            return false;
        }

        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(draftContext(resolvedDraftId))) {
            log.info("video draft delete success: draftId={}", resolvedDraftId);
        }
        return true;
    }

    public Optional<VideoDraftSubmitResponse> submitDraft(String draftId, SubmitDraftRequest request) {
        Optional<UUID> parsedDraftId = parseUuid(draftId);
        if (parsedDraftId.isEmpty()) {
            log.warn("video draft submit rejected: invalid draftId={}", draftId);
            return Optional.empty();
        }

        UUID resolvedDraftId = parsedDraftId.get();
        Optional<PersistedPublishDraft> existingOptional = persistenceService.find(resolvedDraftId, PublishDraftType.VIDEO);
        if (existingOptional.isEmpty()) {
            log.warn("video draft submit rejected: draft not found, draftId={}", resolvedDraftId);
            return Optional.empty();
        }

        PersistedPublishDraft existing = existingOptional.get();
        String initialTargetType = resolveSubmitTargetType(existing.payloadJson());
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(submitContext(existing, initialTargetType, null))) {
            Optional<SubmittedPublishDraft> submittedOptional = persistenceService.submitVideoDraft(
                    resolvedDraftId,
                    existing.payloadJson(),
                    existing.titleDraft(),
                    DRAFT_STEP_SUBMITTED,
                    DRAFT_STATUS_SUBMITTED,
                    request.submitMode()
            );
            if (submittedOptional.isEmpty()) {
                log.warn(
                        "video draft submit rejected: draft not found after lookup, draftId={} targetType={}",
                        resolvedDraftId,
                        initialTargetType
                );
                return Optional.empty();
            }

            SubmittedPublishDraft submitted = submittedOptional.get();
            PersistedPublishDraft savedDraft = submitted.draft();
            String savedTargetType = resolveSubmitTargetType(savedDraft.payloadJson());
            try (MdcBusinessContextScope successContext =
                         MdcBusinessContextScope.open(submitContext(savedDraft, savedTargetType, null))) {
                log.info(
                        "publish draft submit success: draftType=video authorId={} draftId={} targetType={} targetId={} submitMode={} taskCount={} draftStatus={} contentStatus={}",
                        savedDraft.authorId(),
                        savedDraft.id(),
                        savedTargetType,
                        savedDraft.targetId(),
                        request.submitMode(),
                        submitted.taskIds().size(),
                        savedDraft.statusCode(),
                        CONTENT_STATUS_PUBLISHED
                );
                return Optional.of(new VideoDraftSubmitResponse(
                        savedDraft.targetId().toString(),
                        savedDraft.statusCode(),
                        CONTENT_STATUS_PUBLISHED,
                        savedDraft.statusCode(),
                        lifecycleQueryService.resolve(savedDraft),
                        submitted.taskIds(),
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
        payload.put("categoryCode", "video_prompt");
        payload.putNull("promptText");
        payload.putNull("promptTextZh");
        payload.putNull("promptTextEn");
        payload.putNull("promptTextRaw");
        payload.putNull("modelName");
        payload.putNull("modelCategory");
        payload.putNull("contentCategory");
        payload.putNull("compositionCategory");
        payload.putNull("sourcePlatform");
        payload.putNull("sourceCampaign");
        payload.putNull("sourceItemId");
        payload.putNull("sourceUrl");
        payload.putNull("publishedAt");
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
        if (request.promptText() != null) {
            putNullableText(payload, "promptText", request.promptText());
        }
        if (request.promptTextZh() != null) {
            putNullableText(payload, "promptTextZh", request.promptTextZh());
        }
        if (request.promptTextEn() != null) {
            putNullableText(payload, "promptTextEn", request.promptTextEn());
        }
        if (request.promptTextRaw() != null) {
            putNullableText(payload, "promptTextRaw", request.promptTextRaw());
        }
        if (request.modelName() != null) {
            putNullableText(payload, "modelName", request.modelName());
        }
        if (request.modelCategory() != null) {
            putNullableText(payload, "modelCategory", request.modelCategory());
        }
        if (request.contentCategory() != null) {
            putNullableText(payload, "contentCategory", request.contentCategory());
        }
        if (request.compositionCategory() != null) {
            putNullableText(payload, "compositionCategory", request.compositionCategory());
        }
        if (request.sourcePlatform() != null) {
            putNullableText(payload, "sourcePlatform", request.sourcePlatform());
        }
        if (request.sourceCampaign() != null) {
            putNullableText(payload, "sourceCampaign", request.sourceCampaign());
        }
        if (request.sourceItemId() != null) {
            putNullableText(payload, "sourceItemId", request.sourceItemId());
        }
        if (request.sourceUrl() != null) {
            putNullableText(payload, "sourceUrl", request.sourceUrl());
        }
        if (request.publishedAt() != null) {
            putNullableText(payload, "publishedAt", request.publishedAt());
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
                nullableText(payload, "promptText"),
                nullableText(payload, "modelCategory"),
                nullableText(payload, "contentCategory"),
                nullableText(payload, "compositionCategory"),
                stringList(payload.get("tagNames")),
                nullableText(payload, "workflowId"),
                textOrDefault(payload, "visibility", "public"),
                nullableText(payload, "coverAssetId"),
                nullableText(payload, "sourceAssetId"),
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

    private String resolveSubmitTargetType(ObjectNode payload) {
        String categoryCode = nullableText(payload, "categoryCode");
        if ("video_prompt".equals(categoryCode) || "image_prompt".equals(categoryCode)) {
            return "prompt";
        }
        return "video";
    }

    private Map<String, String> submitContext(
            PersistedPublishDraft draft,
            String targetType,
            String threadSlug
    ) {
        LinkedHashMap<String, String> context = new LinkedHashMap<>();
        context.put("draftId", draft.id().toString());
        context.put("targetType", targetType);
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
