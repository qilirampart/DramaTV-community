package com.dramatv.community.interaction.controller;

import com.dramatv.community.interaction.application.InteractionApplicationService;
import com.dramatv.community.interaction.dto.request.CreateCommentRequest;
import com.dramatv.community.interaction.dto.response.CommentResponse;
import com.dramatv.community.shared.response.ApiResponse;
import com.dramatv.community.shared.response.CursorPageResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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
}
