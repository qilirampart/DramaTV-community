package com.dramatv.community.creator.controller;

import com.dramatv.community.creator.application.CreatorQueryService;
import com.dramatv.community.creator.dto.response.CreatorProfileResponse;
import com.dramatv.community.shared.response.ApiResponse;
import com.dramatv.community.shared.response.CursorPageResponse;
import com.dramatv.community.video.dto.response.VideoSummaryResponse;
import com.dramatv.community.workflow.dto.response.WorkflowSummaryResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/creators")
public class CreatorQueryController {

    private final CreatorQueryService creatorQueryService;

    public CreatorQueryController(CreatorQueryService creatorQueryService) {
        this.creatorQueryService = creatorQueryService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CreatorProfileResponse>> detail(@PathVariable String id) {
        return creatorQueryService.findCreator(id)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("CREATOR_NOT_FOUND", "creator not found")));
    }

    @GetMapping("/{id}/videos")
    public ApiResponse<CursorPageResponse<VideoSummaryResponse>> videos(
            @PathVariable String id,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "latest") String sort
    ) {
        return ApiResponse.ok(creatorQueryService.listVideos(id, cursor, sort));
    }

    @GetMapping("/{id}/workflows")
    public ApiResponse<CursorPageResponse<WorkflowSummaryResponse>> workflows(
            @PathVariable String id,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "latest") String sort
    ) {
        return ApiResponse.ok(creatorQueryService.listWorkflows(id, cursor, sort));
    }
}
