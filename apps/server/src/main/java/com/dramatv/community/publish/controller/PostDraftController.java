package com.dramatv.community.publish.controller;

import com.dramatv.community.publish.application.PostDraftApplicationService;
import com.dramatv.community.publish.dto.request.SubmitDraftRequest;
import com.dramatv.community.publish.dto.request.UpsertPostDraftRequest;
import com.dramatv.community.publish.dto.response.PostDraftResponse;
import com.dramatv.community.publish.dto.response.PostDraftSubmitResponse;
import com.dramatv.community.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/post-drafts")
public class PostDraftController {

    private final PostDraftApplicationService postDraftApplicationService;

    public PostDraftController(PostDraftApplicationService postDraftApplicationService) {
        this.postDraftApplicationService = postDraftApplicationService;
    }

    @PostMapping
    public ApiResponse<PostDraftResponse> createDraft() {
        return ApiResponse.ok(postDraftApplicationService.createDraft());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PostDraftResponse>> getDraft(@PathVariable String id) {
        return postDraftApplicationService.findDraft(id)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("POST_DRAFT_NOT_FOUND", "post draft not found")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PostDraftResponse>> updateDraft(
            @PathVariable String id,
            @RequestBody UpsertPostDraftRequest request
    ) {
        return postDraftApplicationService.updateDraft(id, request)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("POST_DRAFT_NOT_FOUND", "post draft not found")));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<PostDraftSubmitResponse>> submitDraft(
            @PathVariable String id,
            @Valid @RequestBody SubmitDraftRequest request
    ) {
        return postDraftApplicationService.submitDraft(id, request)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("POST_DRAFT_NOT_FOUND", "post draft not found")));
    }
}
