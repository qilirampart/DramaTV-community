package com.dramatv.community.canvas.controller;

import com.dramatv.community.canvas.application.CanvasApplicationService;
import com.dramatv.community.canvas.dto.request.CopyToCanvasRequest;
import com.dramatv.community.canvas.dto.request.VisibleAssetsRequest;
import com.dramatv.community.canvas.dto.response.CanvasCopyTaskResponse;
import com.dramatv.community.canvas.dto.response.CanvasLinkResponse;
import com.dramatv.community.canvas.dto.response.CanvasRuntimeResponse;
import com.dramatv.community.canvas.dto.response.CanvasSnapshotResponse;
import com.dramatv.community.canvas.dto.response.CopyToCanvasResponse;
import com.dramatv.community.canvas.dto.response.VisibleAssetsResponse;
import com.dramatv.community.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class CanvasController {

    private final CanvasApplicationService canvasApplicationService;

    public CanvasController(CanvasApplicationService canvasApplicationService) {
        this.canvasApplicationService = canvasApplicationService;
    }

    @GetMapping("/workflows/{id}/canvas-link")
    public ResponseEntity<ApiResponse<CanvasLinkResponse>> canvasLink(@PathVariable String id) {
        return canvasApplicationService.findCanvasLink(id)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("CANVAS_BINDING_NOT_AVAILABLE", "canvas binding not available")));
    }

    @PostMapping("/workflows/{id}/copy-to-canvas")
    public ResponseEntity<ApiResponse<CopyToCanvasResponse>> copyToCanvas(
            @PathVariable String id,
            @Valid @RequestBody CopyToCanvasRequest request
    ) {
        return canvasApplicationService.copyToCanvas(id, request)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("WORKFLOW_NOT_FOUND", "workflow not found")));
    }

    @GetMapping("/canvas-runtimes/{id}")
    public ResponseEntity<ApiResponse<CanvasRuntimeResponse>> runtime(@PathVariable String id) {
        return canvasApplicationService.findRuntime(id)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("CANVAS_RUNTIME_NOT_FOUND", "canvas runtime not found")));
    }

    @GetMapping("/canvas-runtimes/{id}/snapshot")
    public ResponseEntity<ApiResponse<CanvasSnapshotResponse>> snapshot(
            @PathVariable String id,
            @RequestParam(defaultValue = "light") String mode
    ) {
        return canvasApplicationService.findSnapshot(id, mode)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("CANVAS_RUNTIME_NOT_FOUND", "canvas runtime not found")));
    }

    @PostMapping("/canvas-runtimes/{id}/visible-assets")
    public ResponseEntity<ApiResponse<VisibleAssetsResponse>> visibleAssets(
            @PathVariable String id,
            @Valid @RequestBody VisibleAssetsRequest request
    ) {
        return canvasApplicationService.visibleAssets(id, request)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("CANVAS_RUNTIME_NOT_FOUND", "canvas runtime not found")));
    }

    @GetMapping("/canvas-copy-tasks/{id}")
    public ResponseEntity<ApiResponse<CanvasCopyTaskResponse>> copyTask(@PathVariable String id) {
        return canvasApplicationService.findCopyTask(id)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("CANVAS_COPY_TASK_NOT_FOUND", "canvas copy task not found")));
    }
}
