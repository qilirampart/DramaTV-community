package com.dramatv.community.workflow.controller;

import com.dramatv.community.shared.response.ApiResponse;
import com.dramatv.community.video.dto.response.VideoSummaryResponse;
import com.dramatv.community.workflow.application.WorkflowQueryService;
import com.dramatv.community.workflow.dto.response.WorkflowDetailResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workflows")
public class WorkflowQueryController {

    private final WorkflowQueryService workflowQueryService;

    public WorkflowQueryController(WorkflowQueryService workflowQueryService) {
        this.workflowQueryService = workflowQueryService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkflowDetailResponse>> detail(@PathVariable String id) {
        return workflowQueryService.findDetail(id)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("WORKFLOW_NOT_FOUND", "workflow not found")));
    }

    @GetMapping("/{id}/related-videos")
    public ApiResponse<List<VideoSummaryResponse>> relatedVideos(@PathVariable String id) {
        return ApiResponse.ok(workflowQueryService.relatedVideos(id));
    }
}
