package com.dramatv.community.publish.application;

import com.dramatv.community.publish.dto.request.SubmitDraftRequest;
import com.dramatv.community.publish.dto.request.UpsertPostDraftRequest;
import com.dramatv.community.publish.dto.response.PostDraftResponse;
import com.dramatv.community.publish.dto.response.PostDraftSubmitResponse;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class PostDraftApplicationService {

    private final PublishDraftPersistenceService persistenceService;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;

    public PostDraftApplicationService(
            PublishDraftPersistenceService persistenceService,
            ObjectMapper objectMapper,
            JdbcTemplate jdbcTemplate
    ) {
        this.persistenceService = persistenceService;
        this.objectMapper = objectMapper;
        this.jdbcTemplate = jdbcTemplate;
    }

    public PostDraftResponse createDraft() {
        return toResponse(persistenceService.createOrReuse(
                PublishDraftType.POST,
                defaultPayload(),
                null,
                "compose"
        ));
    }

    public Optional<PostDraftResponse> findDraft(String draftId) {
        return parseUuid(draftId)
                .flatMap(uuid -> persistenceService.find(uuid, PublishDraftType.POST))
                .map(this::toResponse);
    }

    public Optional<PostDraftResponse> updateDraft(String draftId, UpsertPostDraftRequest request) {
        return parseUuid(draftId)
                .flatMap(uuid -> persistenceService.find(uuid, PublishDraftType.POST)
                        .flatMap(existing -> persistenceService.save(
                                uuid,
                                PublishDraftType.POST,
                                mergePayload(existing.payloadJson(), request),
                                pick(request.title(), existing.titleDraft()),
                                "compose",
                                "draft"
                        )))
                .map(this::toResponse);
    }

    public Optional<PostDraftSubmitResponse> submitDraft(String draftId, SubmitDraftRequest request) {
        return parseUuid(draftId)
                .flatMap(uuid -> persistenceService.find(uuid, PublishDraftType.POST)
                        .flatMap(existing -> persistenceService.submitPostDraft(
                                uuid,
                                existing.payloadJson(),
                                existing.titleDraft(),
                                "published",
                                "published",
                                request.submitMode()
                        )))
                .map(saved -> new PostDraftSubmitResponse(
                        saved.targetId().toString(),
                        findDiscussionSlug(saved.targetId()),
                        saved.statusCode(),
                        List.of(),
                        request.submitMode()
                ));
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
