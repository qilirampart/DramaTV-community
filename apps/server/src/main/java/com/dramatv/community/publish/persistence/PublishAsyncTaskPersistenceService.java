package com.dramatv.community.publish.persistence;

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

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public PublishAsyncTaskPersistenceService(
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public List<String> createVideoSubmitTasks(PersistedPublishDraft draft, String submitMode) {
        return List.of(createVideoMediaTask("video", draft, submitMode).toString());
    }

    public List<String> createVideoPromptSubmitTasks(PersistedPublishDraft draft, String submitMode) {
        return List.of(createVideoMediaTask("prompt", draft, submitMode).toString());
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
                "video_media_process",
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
}
