package com.dramatv.community.publish.controller;

import com.dramatv.community.publish.application.VideoDraftApplicationService;
import com.dramatv.community.publish.dto.request.SubmitDraftRequest;
import com.dramatv.community.publish.dto.request.UpsertVideoDraftRequest;
import com.dramatv.community.publish.dto.response.VideoDraftResponse;
import com.dramatv.community.publish.dto.response.VideoDraftSubmitResponse;
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
@RequestMapping("/api/video-drafts")
public class VideoDraftController {

    private final VideoDraftApplicationService videoDraftApplicationService;

    public VideoDraftController(VideoDraftApplicationService videoDraftApplicationService) {
        this.videoDraftApplicationService = videoDraftApplicationService;
    }

    @PostMapping
    public ApiResponse<VideoDraftResponse> createDraft() {
        return ApiResponse.ok(videoDraftApplicationService.createDraft());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VideoDraftResponse>> getDraft(@PathVariable String id) {
        return videoDraftApplicationService.findDraft(id)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("VIDEO_DRAFT_NOT_FOUND", "video draft not found")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VideoDraftResponse>> updateDraft(
            @PathVariable String id,
            @RequestBody UpsertVideoDraftRequest request
    ) {
        return videoDraftApplicationService.updateDraft(id, request)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("VIDEO_DRAFT_NOT_FOUND", "video draft not found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDraft(@PathVariable String id) {
        if (videoDraftApplicationService.deleteDraft(id)) {
            return ResponseEntity.ok(ApiResponse.ok(null));
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.failure("VIDEO_DRAFT_NOT_FOUND", "video draft not found"));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<VideoDraftSubmitResponse>> submitDraft(
            @PathVariable String id,
            @Valid @RequestBody SubmitDraftRequest request
    ) {
        return videoDraftApplicationService.submitDraft(id, request)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("VIDEO_DRAFT_NOT_FOUND", "video draft not found")));
    }
}
