package com.dramatv.community.publish.controller;

import com.dramatv.community.publish.application.WorkflowDraftApplicationService;
import com.dramatv.community.publish.dto.request.SubmitDraftRequest;
import com.dramatv.community.publish.dto.request.UpsertWorkflowDraftRequest;
import com.dramatv.community.publish.dto.response.WorkflowDraftResponse;
import com.dramatv.community.publish.dto.response.WorkflowDraftSubmitResponse;
import com.dramatv.community.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workflow-drafts")
public class WorkflowDraftController {

    private final WorkflowDraftApplicationService workflowDraftApplicationService;

    public WorkflowDraftController(WorkflowDraftApplicationService workflowDraftApplicationService) {
        this.workflowDraftApplicationService = workflowDraftApplicationService;
    }

    @PostMapping
    public ApiResponse<WorkflowDraftResponse> createDraft() {
        return ApiResponse.ok(workflowDraftApplicationService.createDraft());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkflowDraftResponse>> getDraft(@PathVariable String id) {
        return workflowDraftApplicationService.findDraft(id)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("WORKFLOW_DRAFT_NOT_FOUND", "workflow draft not found")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkflowDraftResponse>> updateDraft(
            @PathVariable String id,
            @RequestBody UpsertWorkflowDraftRequest request
    ) {
        return workflowDraftApplicationService.updateDraft(id, request)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("WORKFLOW_DRAFT_NOT_FOUND", "workflow draft not found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDraft(@PathVariable String id) {
        if (workflowDraftApplicationService.deleteDraft(id)) {
            return ResponseEntity.ok(ApiResponse.ok(null));
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.failure("WORKFLOW_DRAFT_NOT_FOUND", "workflow draft not found"));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<WorkflowDraftSubmitResponse>> submitDraft(
            @PathVariable String id,
            @Valid @RequestBody SubmitDraftRequest request
    ) {
        return workflowDraftApplicationService.submitDraft(id, request)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("WORKFLOW_DRAFT_NOT_FOUND", "workflow draft not found")));
    }
}
