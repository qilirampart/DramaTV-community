package com.dramatv.community.interaction.controller;

import com.dramatv.community.interaction.application.InteractionApplicationService;
import com.dramatv.community.interaction.dto.request.CommentTargetSettingsRequest;
import com.dramatv.community.interaction.dto.request.CreateCommentRequest;
import com.dramatv.community.interaction.dto.response.ActionStateResponse;
import com.dramatv.community.interaction.dto.response.CommentResponse;
import com.dramatv.community.interaction.dto.response.CommentTargetSettingsResponse;
import com.dramatv.community.shared.response.ApiResponse;
import com.dramatv.community.shared.response.CursorPageResponse;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final InteractionApplicationService interactionApplicationService;

    public CommentController(InteractionApplicationService interactionApplicationService) {
        this.interactionApplicationService = interactionApplicationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<CursorPageResponse<CommentResponse>>> list(
            @RequestParam String targetType,
            @RequestParam String targetId,
            @RequestParam(required = false) String cursor
    ) {
        return ResponseEntity.ok(ApiResponse.ok(interactionApplicationService.listComments(targetType, targetId, cursor)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponse>> create(@Valid @RequestBody CreateCommentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(interactionApplicationService.createComment(request)));
    }

    @PutMapping("/target-settings")
    public ResponseEntity<ApiResponse<CommentTargetSettingsResponse>> updateTargetSettings(
            @Valid @RequestBody CommentTargetSettingsRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(interactionApplicationService.updateCommentTargetSettings(request)));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponse<ActionStateResponse>> delete(@PathVariable String commentId) {
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.ok(interactionApplicationService.deleteComment(commentId)));
    }
}
