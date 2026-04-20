package com.dramatv.community.canvas.application;

import com.dramatv.community.canvas.dto.request.CopyToCanvasRequest;
import com.dramatv.community.canvas.dto.request.VisibleAssetsRequest;
import com.dramatv.community.canvas.dto.response.CanvasCopyTaskResponse;
import com.dramatv.community.canvas.dto.response.CanvasLinkResponse;
import com.dramatv.community.canvas.dto.response.CanvasRuntimeResponse;
import com.dramatv.community.canvas.dto.response.CanvasSnapshotResponse;
import com.dramatv.community.canvas.dto.response.CopyToCanvasResponse;
import com.dramatv.community.canvas.dto.response.VisibleAssetsResponse;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserContext;
import com.dramatv.community.identity.application.CurrentUserService;
import com.dramatv.community.shared.error.ApiBusinessException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CanvasApplicationService {

    private static final Set<String> SUPPORTED_COPY_MODES = Set.of("reference_then_async_clone");

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final CurrentUserService currentUserService;

    public CanvasApplicationService(
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            CurrentUserService currentUserService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.currentUserService = currentUserService;
    }

    public Optional<CanvasLinkResponse> findCanvasLink(String workflowId) {
        UUID parsedWorkflowId = parseUuid(workflowId);
        if (parsedWorkflowId == null) {
            return Optional.empty();
        }

        return jdbcTemplate.query("""
                select
                    workflow.allow_copy,
                    binding.binding_type,
                    binding.open_url,
                    coalesce(runtime.light_snapshot_version, 1) as light_snapshot_version
                from workflows workflow
                left join canvas_bindings binding
                    on binding.workflow_id = workflow.id
                   and binding.binding_status = 'active'
                left join canvas_workflow_runtimes runtime
                    on runtime.source_workflow_id = workflow.id
                   and runtime.owner_id = ?
                where workflow.id = ?
                  and workflow.publish_status = 'published'
                  and workflow.deleted_at is null
                order by runtime.updated_at desc nulls last
                limit 1
                """,
                resultSet -> {
                    if (!resultSet.next()) {
                        return Optional.empty();
                    }

                    return Optional.of(new CanvasLinkResponse(
                            defaultString(resultSet.getString("binding_type"), "internal"),
                            resultSet.getString("open_url"),
                            resultSet.getBoolean("allow_copy"),
                            "community-runtime",
                            resultSet.getInt("light_snapshot_version")
                    ));
                },
                optionalViewerId(),
                parsedWorkflowId
        );
    }

    @Transactional
    public Optional<CopyToCanvasResponse> copyToCanvas(String workflowId, CopyToCanvasRequest request) {
        UUID parsedWorkflowId = parseUuid(workflowId);
        if (parsedWorkflowId == null) {
            throw ApiBusinessException.badRequest("WORKFLOW_ID_INVALID", "workflow id is invalid");
        }
        validateCopyRequest(request);

        WorkflowSeed workflow = loadWorkflowSeed(parsedWorkflowId);
        if (workflow == null) {
            return Optional.empty();
        }
        if (!workflow.allowCopy()) {
            throw ApiBusinessException.conflict("CANVAS_COPY_FORBIDDEN", "workflow copy is disabled");
        }

        CurrentUser currentUser = currentUserService.requireCurrentUser();
        ensureCreatorProfileExists(currentUser);

        ExistingCopy existingCopy = loadExistingCopy(request.idempotencyKey());
        if (existingCopy != null) {
            return Optional.of(new CopyToCanvasResponse(
                    existingCopy.copyTaskId().toString(),
                    existingCopy.runtimeId().toString(),
                    existingCopy.canvasWorkflowId(),
                    existingCopy.statusCode(),
                    "/canvas/" + existingCopy.runtimeId(),
                    existingCopy.lightSnapshotVersion()
            ));
        }

        UUID runtimeId = UUID.randomUUID();
        UUID copyTaskId = UUID.randomUUID();
        String canvasWorkflowId = "canvas-" + runtimeId;
        CanvasSnapshotResponse snapshot = buildLightSnapshot(workflow);
        String snapshotJson = writeJson(snapshot);
        int visibleNodeCount = snapshot.nodes().size();

        jdbcTemplate.update("""
                insert into canvas_workflow_runtimes (
                    id,
                    source_workflow_id,
                    source_binding_id,
                    owner_id,
                    canvas_space_id,
                    canvas_workflow_id,
                    runtime_status,
                    light_snapshot_json,
                    full_snapshot_json,
                    light_snapshot_version,
                    graph_checksum,
                    visible_node_count,
                    last_opened_at,
                    created_at,
                    updated_at
                )
                values (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    'runtime_ready',
                    cast(? as jsonb),
                    null,
                    1,
                    null,
                    ?,
                    now(),
                    now(),
                    now()
                )
                """,
                runtimeId,
                parsedWorkflowId,
                workflow.bindingId(),
                currentUser.id(),
                request.targetSpaceId(),
                canvasWorkflowId,
                snapshotJson,
                visibleNodeCount
        );

        ObjectNode resultJson = objectMapper.createObjectNode();
        resultJson.put("openUrl", "/canvas/" + runtimeId);
        resultJson.put("targetCanvasWorkflowId", canvasWorkflowId);

        jdbcTemplate.update("""
                insert into canvas_copy_tasks (
                    id,
                    source_workflow_id,
                    source_binding_id,
                    target_runtime_id,
                    operator_id,
                    target_space_id,
                    idempotency_key,
                    copy_mode,
                    status_code,
                    progress_percent,
                    error_code,
                    error_message,
                    result_json,
                    started_at,
                    finished_at,
                    created_at,
                    updated_at
                )
                values (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    'runtime_ready',
                    100,
                    null,
                    null,
                    cast(? as jsonb),
                    now(),
                    now(),
                    now(),
                    now()
                )
                """,
                copyTaskId,
                parsedWorkflowId,
                workflow.bindingId(),
                runtimeId,
                currentUser.id(),
                request.targetSpaceId(),
                request.idempotencyKey(),
                request.copyMode(),
                writeJson(resultJson)
        );

        return Optional.of(new CopyToCanvasResponse(
                copyTaskId.toString(),
                runtimeId.toString(),
                canvasWorkflowId,
                "runtime_ready",
                "/canvas/" + runtimeId,
                1
        ));
    }

    public Optional<CanvasRuntimeResponse> findRuntime(String runtimeId) {
        UUID parsedRuntimeId = parseUuid(runtimeId);
        if (parsedRuntimeId == null) {
            return Optional.empty();
        }

        RuntimeRecord runtime = jdbcTemplate.query("""
                select
                    id,
                    source_workflow_id,
                    runtime_status,
                    canvas_space_id,
                    canvas_workflow_id,
                    light_snapshot_version
                from canvas_workflow_runtimes
                where id = ?
                """,
                resultSet -> resultSet.next()
                        ? new RuntimeRecord(
                                (UUID) resultSet.getObject("id"),
                                (UUID) resultSet.getObject("source_workflow_id"),
                                resultSet.getString("runtime_status"),
                                resultSet.getString("canvas_space_id"),
                                resultSet.getString("canvas_workflow_id"),
                                resultSet.getInt("light_snapshot_version")
                        )
                        : null,
                parsedRuntimeId
        );

        if (runtime == null) {
            return Optional.empty();
        }

        CopyTaskRecord copyTask = loadLatestCopyTaskForRuntime(parsedRuntimeId);

        return Optional.of(new CanvasRuntimeResponse(
                runtime.id().toString(),
                runtime.sourceWorkflowId() == null ? null : runtime.sourceWorkflowId().toString(),
                runtime.runtimeStatus(),
                runtime.canvasSpaceId(),
                runtime.canvasWorkflowId(),
                runtime.lightSnapshotVersion(),
                copyTask == null ? null : new CanvasRuntimeResponse.CopyTaskSummary(
                        copyTask.id().toString(),
                        copyTask.statusCode(),
                        copyTask.progressPercent()
                )
        ));
    }

    public Optional<CanvasSnapshotResponse> findSnapshot(String runtimeId, String mode) {
        UUID parsedRuntimeId = parseUuid(runtimeId);
        if (parsedRuntimeId == null) {
            return Optional.empty();
        }

        String columnName = "full".equalsIgnoreCase(mode) ? "full_snapshot_json" : "light_snapshot_json";
        String snapshotJson = jdbcTemplate.query("""
                select %s::text as snapshot_json
                from canvas_workflow_runtimes
                where id = ?
                """.formatted(columnName),
                resultSet -> resultSet.next() ? resultSet.getString("snapshot_json") : null,
                parsedRuntimeId
        );

        if (snapshotJson == null && "full".equalsIgnoreCase(mode)) {
            snapshotJson = jdbcTemplate.query("""
                    select light_snapshot_json::text as snapshot_json
                    from canvas_workflow_runtimes
                    where id = ?
                    """,
                    resultSet -> resultSet.next() ? resultSet.getString("snapshot_json") : null,
                    parsedRuntimeId
            );
        }

        return Optional.ofNullable(parseSnapshot(snapshotJson));
    }

    public Optional<VisibleAssetsResponse> visibleAssets(String runtimeId, VisibleAssetsRequest request) {
        Optional<CanvasSnapshotResponse> snapshotOptional = findSnapshot(runtimeId, "light");
        if (snapshotOptional.isEmpty()) {
            return Optional.empty();
        }

        UUID parsedRuntimeId = parseUuid(runtimeId);
        if (parsedRuntimeId == null) {
            return Optional.empty();
        }

        CanvasSnapshotResponse snapshot = snapshotOptional.get();
        int limit = request.limit() == null || request.limit() <= 0 ? 40 : request.limit();
        List<String> nodeIds = request.nodeIds() == null || request.nodeIds().isEmpty()
                ? snapshot.nodes().stream().map(CanvasSnapshotResponse.NodeShell::id).limit(limit).toList()
                : request.nodeIds().stream().limit(limit).toList();

        List<VisibleAssetsResponse.Item> items = new ArrayList<>();
        for (String nodeId : nodeIds) {
            items.add(loadVisibleAsset(parsedRuntimeId, nodeId, snapshot));
        }

        return Optional.of(new VisibleAssetsResponse(items));
    }

    public Optional<CanvasCopyTaskResponse> findCopyTask(String copyTaskId) {
        UUID parsedCopyTaskId = parseUuid(copyTaskId);
        if (parsedCopyTaskId == null) {
            return Optional.empty();
        }

        return jdbcTemplate.query("""
                select
                    id,
                    status_code,
                    progress_percent,
                    target_runtime_id,
                    error_code,
                    error_message
                from canvas_copy_tasks
                where id = ?
                """,
                resultSet -> {
                    if (!resultSet.next()) {
                        return Optional.empty();
                    }

                    return Optional.of(new CanvasCopyTaskResponse(
                            resultSet.getString("status_code"),
                            resultSet.getInt("progress_percent"),
                            toUuidString(resultSet.getObject("target_runtime_id")),
                            List.of(),
                            resultSet.getString("error_code"),
                            resultSet.getString("error_message")
                    ));
                },
                parsedCopyTaskId
        );
    }

    private void validateCopyRequest(CopyToCanvasRequest request) {
        if (!SUPPORTED_COPY_MODES.contains(request.copyMode())) {
            throw ApiBusinessException.badRequest("CANVAS_COPY_MODE_INVALID", "copy mode is invalid");
        }
    }

    private WorkflowSeed loadWorkflowSeed(UUID workflowId) {
        return jdbcTemplate.query("""
                select
                    workflow.id,
                    workflow.title,
                    workflow.summary,
                    workflow.allow_copy,
                    binding.id as binding_id,
                    binding.binding_type,
                    binding.open_url,
                    binding.snapshot_json::text as binding_snapshot_json
                from workflows workflow
                left join canvas_bindings binding
                    on binding.workflow_id = workflow.id
                   and binding.binding_status = 'active'
                where workflow.id = ?
                  and workflow.publish_status = 'published'
                  and workflow.deleted_at is null
                """,
                resultSet -> resultSet.next()
                        ? new WorkflowSeed(
                                (UUID) resultSet.getObject("id"),
                                resultSet.getString("title"),
                                resultSet.getString("summary"),
                                resultSet.getBoolean("allow_copy"),
                                (UUID) resultSet.getObject("binding_id"),
                                resultSet.getString("binding_type"),
                                resultSet.getString("open_url"),
                                resultSet.getString("binding_snapshot_json")
                        )
                        : null,
                workflowId
        );
    }

    private ExistingCopy loadExistingCopy(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return null;
        }

        return jdbcTemplate.query("""
                select
                    task.id,
                    task.status_code,
                    runtime.id as runtime_id,
                    runtime.canvas_workflow_id,
                    runtime.light_snapshot_version
                from canvas_copy_tasks task
                join canvas_workflow_runtimes runtime on runtime.id = task.target_runtime_id
                where task.idempotency_key = ?
                order by task.created_at desc
                limit 1
                """,
                resultSet -> resultSet.next()
                        ? new ExistingCopy(
                                (UUID) resultSet.getObject("id"),
                                (UUID) resultSet.getObject("runtime_id"),
                                resultSet.getString("canvas_workflow_id"),
                                resultSet.getString("status_code"),
                                resultSet.getInt("light_snapshot_version")
                        )
                        : null,
                idempotencyKey
        );
    }

    private CopyTaskRecord loadLatestCopyTaskForRuntime(UUID runtimeId) {
        return jdbcTemplate.query("""
                select
                    id,
                    status_code,
                    progress_percent
                from canvas_copy_tasks
                where target_runtime_id = ?
                order by created_at desc
                limit 1
                """,
                resultSet -> resultSet.next()
                        ? new CopyTaskRecord(
                                (UUID) resultSet.getObject("id"),
                                resultSet.getString("status_code"),
                                resultSet.getInt("progress_percent")
                        )
                        : null,
                runtimeId
        );
    }

    private VisibleAssetsResponse.Item loadVisibleAsset(
            UUID runtimeId,
            String nodeId,
            CanvasSnapshotResponse snapshot
    ) {
        List<AssetRow> assets = jdbcTemplate.query("""
                select
                    asset_role,
                    coalesce(media.object_key, asset.asset_url) as asset_url,
                    status_code
                from canvas_runtime_assets asset
                left join media_assets media on media.id = asset.media_asset_id
                where asset.runtime_id = ?
                  and asset.node_id = ?
                order by asset.load_priority asc, asset.created_at asc
                """,
                (resultSet, rowNum) -> new AssetRow(
                        resultSet.getString("asset_role"),
                        resultSet.getString("asset_url"),
                        resultSet.getString("status_code")
                ),
                runtimeId,
                nodeId
        );

        if (assets.isEmpty()) {
            String fallbackStatus = snapshot.nodes().stream()
                    .filter(node -> node.id().equals(nodeId))
                    .map(CanvasSnapshotResponse.NodeShell::assetState)
                    .findFirst()
                    .orElse("placeholder");

            return new VisibleAssetsResponse.Item(nodeId, null, null, null, fallbackStatus);
        }

        Map<String, String> roleToUrl = new LinkedHashMap<>();
        String status = "placeholder";
        for (AssetRow asset : assets) {
            roleToUrl.putIfAbsent(asset.assetRole(), asset.assetUrl());
            status = asset.statusCode();
        }

        return new VisibleAssetsResponse.Item(
                nodeId,
                roleToUrl.get("thumbnail"),
                roleToUrl.get("poster"),
                roleToUrl.get("preview"),
                status
        );
    }

    private CanvasSnapshotResponse buildLightSnapshot(WorkflowSeed workflow) {
        CanvasSnapshotResponse parsedBindingSnapshot = parseSnapshot(workflow.bindingSnapshotJson());
        if (parsedBindingSnapshot != null) {
            return parsedBindingSnapshot;
        }

        String workflowTitle = defaultString(workflow.title(), "Workflow");
        String summaryTitle = workflow.summary() == null || workflow.summary().isBlank()
                ? "Preview Output"
                : workflow.summary();

        return new CanvasSnapshotResponse(
                new CanvasSnapshotResponse.Viewport(0, 0, 0.32),
                new CanvasSnapshotResponse.MinimapBounds(0, 0, 1600, 960),
                List.of(
                        new CanvasSnapshotResponse.NodeShell(
                                "workflow-source",
                                "workflow",
                                120,
                                160,
                                320,
                                140,
                                workflowTitle,
                                "placeholder"
                        ),
                        new CanvasSnapshotResponse.NodeShell(
                                "workflow-process",
                                "process",
                                580,
                                140,
                                340,
                                160,
                                "Canvas Runtime",
                                "placeholder"
                        ),
                        new CanvasSnapshotResponse.NodeShell(
                                "workflow-output",
                                "output",
                                1060,
                                180,
                                320,
                                140,
                                summaryTitle,
                                "empty"
                        )
                ),
                List.of(
                        new CanvasSnapshotResponse.Edge("edge-source-process", "workflow-source", "workflow-process"),
                        new CanvasSnapshotResponse.Edge("edge-process-output", "workflow-process", "workflow-output")
                )
        );
    }

    private CanvasSnapshotResponse parseSnapshot(String snapshotJson) {
        if (snapshotJson == null || snapshotJson.isBlank()) {
            return null;
        }

        try {
            return objectMapper.readValue(snapshotJson, CanvasSnapshotResponse.class);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize canvas payload", ex);
        }
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

    private UUID optionalViewerId() {
        CurrentUser currentUser = CurrentUserContext.currentOrNull();
        return currentUser == null ? null : currentUser.id();
    }

    private UUID parseUuid(String candidate) {
        if (candidate == null || candidate.isBlank()) {
            return null;
        }

        try {
            return UUID.fromString(candidate.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String toUuidString(Object value) {
        return value == null ? null : value.toString();
    }

    private String defaultString(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private record WorkflowSeed(
            UUID id,
            String title,
            String summary,
            boolean allowCopy,
            UUID bindingId,
            String bindingType,
            String openUrl,
            String bindingSnapshotJson
    ) {
    }

    private record ExistingCopy(
            UUID copyTaskId,
            UUID runtimeId,
            String canvasWorkflowId,
            String statusCode,
            int lightSnapshotVersion
    ) {
    }

    private record RuntimeRecord(
            UUID id,
            UUID sourceWorkflowId,
            String runtimeStatus,
            String canvasSpaceId,
            String canvasWorkflowId,
            int lightSnapshotVersion
    ) {
    }

    private record CopyTaskRecord(
            UUID id,
            String statusCode,
            int progressPercent
    ) {
    }

    private record AssetRow(
            String assetRole,
            String assetUrl,
            String statusCode
    ) {
    }
}
