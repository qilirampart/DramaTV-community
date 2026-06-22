package com.dramatv.community.publish.persistence;

import com.dramatv.community.shared.media.VideoMediaProcessingProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class PublishAsyncTaskPersistenceService {

    private static final short DEFAULT_PRIORITY = 3;
    private static final int DEFAULT_MAX_RETRY_COUNT = 3;
    private static final String VIDEO_MEDIA_PROCESS = "video_media_process";
    private static final String IMAGE_MEDIA_PROCESS = "image_media_process";

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final VideoMediaProcessingProperties processingProperties;

    public PublishAsyncTaskPersistenceService(
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            VideoMediaProcessingProperties processingProperties
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.processingProperties = processingProperties;
    }

    public List<String> createVideoSubmitTasks(PersistedPublishDraft draft, String submitMode) {
        return List.of(createVideoMediaTask("video", draft, submitMode).toString());
    }

    public List<String> createVideoPromptSubmitTasks(PersistedPublishDraft draft, String submitMode) {
        return List.of(createVideoMediaTask("prompt", draft, submitMode).toString());
    }

    public List<String> createImagePromptSubmitTasks(PersistedPublishDraft draft, String submitMode) {
        String sourceAssetId = nullablePayloadText(draft.payloadJson(), "sourceAssetId");
        if (sourceAssetId == null) {
            return List.of();
        }

        ReadyAsset sourceAsset = loadReadyAsset(sourceAssetId);
        if (sourceAsset == null || !"image".equalsIgnoreCase(sourceAsset.assetKind())) {
            return List.of();
        }

        if (sourceAsset.sizeBytes() <= Math.max(1L, processingProperties.getImageCoverThresholdBytes())) {
            return List.of();
        }

        String coverAssetId = nullablePayloadText(draft.payloadJson(), "coverAssetId");
        if (!requiresDerivedImageCover(sourceAssetId, coverAssetId)) {
            return List.of();
        }

        return List.of(createImageMediaTask("prompt", draft, submitMode).toString());
    }

    private boolean requiresDerivedImageCover(String sourceAssetId, String coverAssetId) {
        if (coverAssetId == null) {
            return true;
        }

        if (sourceAssetId.trim().equalsIgnoreCase(coverAssetId.trim())) {
            return true;
        }

        ReadyAsset coverAsset = loadReadyAsset(coverAssetId);
        if (coverAsset == null) {
            return true;
        }

        if (!"image".equalsIgnoreCase(coverAsset.assetKind())) {
            return true;
        }

        return !"cover".equalsIgnoreCase(coverAsset.assetRole());
    }

    private UUID createVideoMediaTask(String targetType, PersistedPublishDraft draft, String submitMode) {
        ObjectNode payloadJson = objectMapper.createObjectNode();
        payloadJson.put("draftId", draft.id().toString());
        payloadJson.put("targetType", targetType);
        payloadJson.put("targetId", draft.targetId().toString());
        payloadJson.put("submitMode", submitMode);
        copyText(draft.payloadJson(), payloadJson, "sourceAssetId");
        copyText(draft.payloadJson(), payloadJson, "coverAssetId");
        copyText(draft.payloadJson(), payloadJson, "workflowId");

        ArrayNode desiredOutputs = payloadJson.putArray("desiredOutputs");
        desiredOutputs.add("preview");
        desiredOutputs.add("cover");
        desiredOutputs.add("duration");

        return insertTask(
                VIDEO_MEDIA_PROCESS,
                targetType,
                draft.targetId(),
                "media-processing",
                DEFAULT_PRIORITY,
                payloadJson
        );
    }

    private UUID createImageMediaTask(String targetType, PersistedPublishDraft draft, String submitMode) {
        ObjectNode payloadJson = objectMapper.createObjectNode();
        payloadJson.put("draftId", draft.id().toString());
        payloadJson.put("targetType", targetType);
        payloadJson.put("targetId", draft.targetId().toString());
        payloadJson.put("submitMode", submitMode);
        copyText(draft.payloadJson(), payloadJson, "sourceAssetId");
        copyText(draft.payloadJson(), payloadJson, "coverAssetId");
        copyText(draft.payloadJson(), payloadJson, "workflowId");

        ArrayNode desiredOutputs = payloadJson.putArray("desiredOutputs");
        desiredOutputs.add("cover");

        return insertTask(
                IMAGE_MEDIA_PROCESS,
                targetType,
                draft.targetId(),
                "media-processing",
                DEFAULT_PRIORITY,
                payloadJson
        );
    }

    private UUID insertTask(
            String taskType,
            String targetType,
            UUID targetId,
            String queueName,
            short priorityLevel,
            ObjectNode payloadJson
    ) {
        UUID taskId = UUID.randomUUID();

        jdbcTemplate.update("""
                insert into async_task_records (
                    id, task_type, target_type, target_id, queue_name, priority_level,
                    status_code, payload_json, retry_count, max_retry_count, scheduled_at, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, ?, 'queued', cast(? as jsonb), 0, ?, now(), now(), now())
                """,
                taskId,
                taskType,
                targetType,
                targetId,
                queueName,
                priorityLevel,
                payloadJson.toString(),
                DEFAULT_MAX_RETRY_COUNT
        );

        return taskId;
    }

    private void copyText(ObjectNode source, ObjectNode target, String fieldName) {
        if (source == null) {
            return;
        }

        var node = source.get(fieldName);
        if (node == null || node.isNull()) {
            return;
        }

        String value = node.asText().trim();
        if (!value.isEmpty()) {
            target.put(fieldName, value);
        }
    }

    private ReadyAsset loadReadyAsset(String assetIdText) {
        UUID assetId;
        try {
            assetId = UUID.fromString(assetIdText);
        } catch (IllegalArgumentException ex) {
            return null;
        }

        return jdbcTemplate.query("""
                select asset_kind, asset_role, coalesce(size_bytes, 0) as size_bytes
                from media_assets
                where id = ?
                  and status_code = 'ready'
                """, resultSet -> {
            if (!resultSet.next()) {
                return null;
            }
            return new ReadyAsset(
                    resultSet.getString("asset_kind"),
                    resultSet.getString("asset_role"),
                    resultSet.getLong("size_bytes")
            );
        }, assetId);
    }

    private String nullablePayloadText(ObjectNode payloadJson, String fieldName) {
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

    private record ReadyAsset(
            String assetKind,
            String assetRole,
            long sizeBytes
    ) {
    }
}
