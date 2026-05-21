package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CanvasReadApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void copyFlowIsIdempotentPerViewerAndExposesRuntimeReadApis() throws Exception {
        LoginSession author = loginAsRandomUser("canvas-read-author");
        LoginSession viewerA = loginAsRandomUser("canvas-read-viewer-a");
        LoginSession viewerB = loginAsRandomUser("canvas-read-viewer-b");

        String workflowId = createPublishedWorkflow(
                author.userId(),
                "Canvas source workflow",
                "Canvas source summary",
                "Canvas source scenario"
        );
        createActiveCanvasBinding(workflowId, "internal", "/canvas/templates/source-workflow");

        MvcResult linkResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/workflows/{id}/canvas-link", workflowId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode linkBody = readBody(linkResult);
        assertThat(linkBody.path("code").asText()).isEqualTo("OK");
        assertThat(linkBody.path("requestId").asText()).isNotBlank();
        assertThat(linkBody.at("/data/bindingType").asText()).isEqualTo("internal");
        assertThat(linkBody.at("/data/openUrl").asText()).isEqualTo("/canvas/templates/source-workflow");
        assertThat(linkBody.at("/data/allowCopy").asBoolean()).isTrue();
        assertThat(linkBody.at("/data/sourceRuntimeType").asText()).isEqualTo("community-runtime");
        assertThat(linkBody.at("/data/lightSnapshotVersion").asInt()).isEqualTo(1);

        String idempotencyKey = "workflow-copy-" + workflowId;
        JsonNode firstCopyBody = copyToCanvas(workflowId, viewerA.accessToken(), "space-community-demo", idempotencyKey);
        String viewerACopyTaskId = firstCopyBody.at("/data/copyTaskId").asText();
        String viewerARuntimeId = firstCopyBody.at("/data/targetRuntimeId").asText();
        String viewerACanvasWorkflowId = firstCopyBody.at("/data/targetCanvasWorkflowId").asText();

        assertThat(firstCopyBody.path("code").asText()).isEqualTo("OK");
        assertThat(firstCopyBody.path("requestId").asText()).isNotBlank();
        assertThat(firstCopyBody.at("/data/status").asText()).isEqualTo("runtime_ready");
        assertThat(firstCopyBody.at("/data/openUrl").asText()).isEqualTo("/canvas/" + viewerARuntimeId);
        assertThat(firstCopyBody.at("/data/lightSnapshotVersion").asInt()).isEqualTo(1);

        JsonNode repeatedCopyBody = copyToCanvas(workflowId, viewerA.accessToken(), "space-community-demo", idempotencyKey);
        assertThat(repeatedCopyBody.at("/data/copyTaskId").asText()).isEqualTo(viewerACopyTaskId);
        assertThat(repeatedCopyBody.at("/data/targetRuntimeId").asText()).isEqualTo(viewerARuntimeId);
        assertThat(repeatedCopyBody.at("/data/targetCanvasWorkflowId").asText()).isEqualTo(viewerACanvasWorkflowId);

        JsonNode secondViewerCopyBody = copyToCanvas(workflowId, viewerB.accessToken(), "space-community-demo", idempotencyKey);
        assertThat(secondViewerCopyBody.at("/data/copyTaskId").asText()).isNotEqualTo(viewerACopyTaskId);
        assertThat(secondViewerCopyBody.at("/data/targetRuntimeId").asText()).isNotEqualTo(viewerARuntimeId);
        assertThat(secondViewerCopyBody.at("/data/targetCanvasWorkflowId").asText()).isNotEqualTo(viewerACanvasWorkflowId);

        MvcResult runtimeResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/canvas-runtimes/{id}", viewerARuntimeId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode runtimeBody = readBody(runtimeResult);
        assertThat(runtimeBody.path("code").asText()).isEqualTo("OK");
        assertThat(runtimeBody.path("requestId").asText()).isNotBlank();
        assertThat(runtimeBody.at("/data/runtimeId").asText()).isEqualTo(viewerARuntimeId);
        assertThat(runtimeBody.at("/data/sourceWorkflowId").asText()).isEqualTo(workflowId);
        assertThat(runtimeBody.at("/data/runtimeStatus").asText()).isEqualTo("runtime_ready");
        assertThat(runtimeBody.at("/data/canvasSpaceId").asText()).isEqualTo("space-community-demo");
        assertThat(runtimeBody.at("/data/canvasWorkflowId").asText()).isEqualTo(viewerACanvasWorkflowId);
        assertThat(runtimeBody.at("/data/lightSnapshotVersion").asInt()).isEqualTo(1);
        assertThat(runtimeBody.at("/data/copyTask/id").asText()).isEqualTo(viewerACopyTaskId);
        assertThat(runtimeBody.at("/data/copyTask/statusCode").asText()).isEqualTo("runtime_ready");
        assertThat(runtimeBody.at("/data/copyTask/progressPercent").asInt()).isEqualTo(100);

        MvcResult snapshotResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/canvas-runtimes/{id}/snapshot", viewerARuntimeId)
                        .param("mode", "light")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode snapshotBody = readBody(snapshotResult);
        assertThat(snapshotBody.path("code").asText()).isEqualTo("OK");
        assertThat(snapshotBody.path("requestId").asText()).isNotBlank();
        assertThat(snapshotBody.at("/data/nodes").size()).isEqualTo(3);
        assertThat(snapshotBody.at("/data/edges").size()).isEqualTo(2);
        assertThat(findNodeById(snapshotBody.at("/data/nodes"), "workflow-source").path("title").asText())
                .isEqualTo("Canvas source workflow");
        assertThat(findNodeById(snapshotBody.at("/data/nodes"), "workflow-process").path("title").asText())
                .isEqualTo("Canvas Runtime");
        assertThat(findNodeById(snapshotBody.at("/data/nodes"), "workflow-output").path("title").asText())
                .isEqualTo("Canvas source summary");
        assertThat(findNodeById(snapshotBody.at("/data/nodes"), "workflow-source").path("assetState").asText())
                .isEqualTo("placeholder");
        assertThat(findNodeById(snapshotBody.at("/data/nodes"), "workflow-output").path("assetState").asText())
                .isEqualTo("empty");

        MvcResult copyTaskResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/canvas-copy-tasks/{id}", viewerACopyTaskId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode copyTaskBody = readBody(copyTaskResult);
        assertThat(copyTaskBody.path("code").asText()).isEqualTo("OK");
        assertThat(copyTaskBody.path("requestId").asText()).isNotBlank();
        assertThat(copyTaskBody.at("/data/statusCode").asText()).isEqualTo("runtime_ready");
        assertThat(copyTaskBody.at("/data/progressPercent").asInt()).isEqualTo(100);
        assertThat(copyTaskBody.at("/data/targetRuntimeId").asText()).isEqualTo(viewerARuntimeId);
        assertThat(copyTaskBody.at("/data/warnings").size()).isEqualTo(0);
        assertThat(copyTaskBody.at("/data/errorCode").isNull()).isTrue();
        assertThat(copyTaskBody.at("/data/errorMessage").isNull()).isTrue();
    }

    @Test
    void visibleAssetsRequiresLoginAndFallsBackToSnapshotStates() throws Exception {
        LoginSession author = loginAsRandomUser("canvas-assets-author");
        LoginSession viewer = loginAsRandomUser("canvas-assets-viewer");
        String workflowId = createPublishedWorkflow(
                author.userId(),
                "Canvas assets workflow",
                "Canvas assets summary",
                "Canvas assets scenario"
        );

        JsonNode copyBody = copyToCanvas(
                workflowId,
                viewer.accessToken(),
                "space-canvas-assets",
                "workflow-copy-" + workflowId
        );
        String runtimeId = copyBody.at("/data/targetRuntimeId").asText();

        MvcResult anonymousVisibleAssetsResult = mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/canvas-runtimes/{id}/visible-assets", runtimeId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VisibleAssetsPayload(
                                new ViewportPayload(0, 0, 1600, 960, 0.32),
                                List.of("workflow-source", "workflow-output"),
                                2
                        ))))
                .andExpect(status().isForbidden())
                .andReturn();

        JsonNode anonymousVisibleAssetsBody = readBody(anonymousVisibleAssetsResult);
        assertThat(anonymousVisibleAssetsBody.path("code").asText()).isEqualTo("FORBIDDEN");
        assertThat(anonymousVisibleAssetsBody.path("requestId").asText()).isNotBlank();

        MvcResult visibleAssetsResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/canvas-runtimes/{id}/visible-assets", runtimeId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new VisibleAssetsPayload(
                                        new ViewportPayload(0, 0, 1600, 960, 0.32),
                                        List.of("workflow-source", "workflow-output"),
                                        2
                                ))),
                        viewer.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode visibleAssetsBody = readBody(visibleAssetsResult);
        assertThat(visibleAssetsBody.path("code").asText()).isEqualTo("OK");
        assertThat(visibleAssetsBody.path("requestId").asText()).isNotBlank();
        assertThat(visibleAssetsBody.at("/data/items").size()).isEqualTo(2);
        assertThat(findVisibleAssetByNodeId(visibleAssetsBody.at("/data/items"), "workflow-source").path("statusCode").asText())
                .isEqualTo("placeholder");
        assertThat(findVisibleAssetByNodeId(visibleAssetsBody.at("/data/items"), "workflow-source").path("thumbnailUrl").isNull())
                .isTrue();
        assertThat(findVisibleAssetByNodeId(visibleAssetsBody.at("/data/items"), "workflow-output").path("statusCode").asText())
                .isEqualTo("empty");
        assertThat(findVisibleAssetByNodeId(visibleAssetsBody.at("/data/items"), "workflow-output").path("previewUrl").isNull())
                .isTrue();
    }

    @Test
    void canvasEndpointsRejectAnonymousWriteAndReturn404ForMissingResources() throws Exception {
        LoginSession author = loginAsRandomUser("canvas-boundary-author");
        LoginSession viewer = loginAsRandomUser("canvas-boundary-viewer");
        String workflowId = createPublishedWorkflow(author.userId(), "Canvas boundary workflow");
        String missingId = UUID.randomUUID().toString();

        MvcResult anonymousCopyResult = mockMvc.perform(MockMvcRequestBuilders.post("/api/workflows/{id}/copy-to-canvas", workflowId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CopyToCanvasPayload(
                                "space-boundary",
                                "reference_then_async_clone",
                                true,
                                "workflow-copy-" + workflowId
                        ))))
                .andExpect(status().isForbidden())
                .andReturn();

        JsonNode anonymousCopyBody = readBody(anonymousCopyResult);
        assertThat(anonymousCopyBody.path("code").asText()).isEqualTo("FORBIDDEN");
        assertThat(anonymousCopyBody.path("requestId").asText()).isNotBlank();

        MvcResult missingRuntimeResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/canvas-runtimes/{id}", missingId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode missingRuntimeBody = readBody(missingRuntimeResult);
        assertThat(missingRuntimeBody.path("code").asText()).isEqualTo("CANVAS_RUNTIME_NOT_FOUND");
        assertThat(missingRuntimeBody.path("requestId").asText()).isNotBlank();

        MvcResult missingSnapshotResult = mockMvc.perform(MockMvcRequestBuilders
                        .get("/api/canvas-runtimes/{id}/snapshot", missingId)
                        .param("mode", "light")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode missingSnapshotBody = readBody(missingSnapshotResult);
        assertThat(missingSnapshotBody.path("code").asText()).isEqualTo("CANVAS_RUNTIME_NOT_FOUND");
        assertThat(missingSnapshotBody.path("requestId").asText()).isNotBlank();

        MvcResult missingCopyTaskResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/canvas-copy-tasks/{id}", missingId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode missingCopyTaskBody = readBody(missingCopyTaskResult);
        assertThat(missingCopyTaskBody.path("code").asText()).isEqualTo("CANVAS_COPY_TASK_NOT_FOUND");
        assertThat(missingCopyTaskBody.path("requestId").asText()).isNotBlank();

        MvcResult missingWorkflowCopyResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/workflows/{id}/copy-to-canvas", missingId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new CopyToCanvasPayload(
                                        "space-boundary",
                                        "reference_then_async_clone",
                                        true,
                                        "workflow-copy-" + missingId
                                ))),
                        viewer.accessToken()))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode missingWorkflowCopyBody = readBody(missingWorkflowCopyResult);
        assertThat(missingWorkflowCopyBody.path("code").asText()).isEqualTo("WORKFLOW_NOT_FOUND");
        assertThat(missingWorkflowCopyBody.path("requestId").asText()).isNotBlank();

        MvcResult missingCanvasLinkResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/workflows/{id}/canvas-link", missingId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode missingCanvasLinkBody = readBody(missingCanvasLinkResult);
        assertThat(missingCanvasLinkBody.path("code").asText()).isEqualTo("CANVAS_BINDING_NOT_AVAILABLE");
        assertThat(missingCanvasLinkBody.path("requestId").asText()).isNotBlank();
    }

    private JsonNode copyToCanvas(
            String workflowId,
            String accessToken,
            String targetSpaceId,
            String idempotencyKey
    ) throws Exception {
        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/workflows/{id}/copy-to-canvas", workflowId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new CopyToCanvasPayload(
                                        targetSpaceId,
                                        "reference_then_async_clone",
                                        true,
                                        idempotencyKey
                                ))),
                        accessToken))
                .andExpect(status().isOk())
                .andReturn();

        return readBody(result);
    }

    private JsonNode findNodeById(JsonNode items, String id) {
        for (JsonNode item : items) {
            if (id.equals(item.path("id").asText())) {
                return item;
            }
        }
        return null;
    }

    private JsonNode findVisibleAssetByNodeId(JsonNode items, String nodeId) {
        for (JsonNode item : items) {
            if (nodeId.equals(item.path("nodeId").asText())) {
                return item;
            }
        }
        return null;
    }

    private record CopyToCanvasPayload(
            String targetSpaceId,
            String copyMode,
            boolean openAfterCopy,
            String idempotencyKey
    ) {
    }

    private record VisibleAssetsPayload(
            ViewportPayload viewport,
            List<String> nodeIds,
            Integer limit
    ) {
    }

    private record ViewportPayload(
            double x,
            double y,
            double width,
            double height,
            double zoom
    ) {
    }
}
