package com.dramatv.community.interaction.controller;

import com.dramatv.community.interaction.application.InteractionApplicationService;
import com.dramatv.community.interaction.dto.request.FollowRequest;
import com.dramatv.community.interaction.dto.request.TargetActionRequest;
import com.dramatv.community.interaction.dto.response.ActionStateResponse;
import com.dramatv.community.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/interactions")
public class InteractionController {

    private final InteractionApplicationService interactionApplicationService;

    public InteractionController(InteractionApplicationService interactionApplicationService) {
        this.interactionApplicationService = interactionApplicationService;
    }

    @PostMapping("/like")
    public ResponseEntity<ApiResponse<ActionStateResponse>> like(@Valid @RequestBody TargetActionRequest request) {
        return buildResponse(() -> interactionApplicationService.like(request, true));
    }

    @DeleteMapping("/like")
    public ResponseEntity<ApiResponse<ActionStateResponse>> unlike(@Valid @RequestBody TargetActionRequest request) {
        return buildResponse(() -> interactionApplicationService.like(request, false));
    }

    @PostMapping("/favorite")
    public ResponseEntity<ApiResponse<ActionStateResponse>> favorite(@Valid @RequestBody TargetActionRequest request) {
        return buildResponse(() -> interactionApplicationService.favorite(request, true));
    }

    @DeleteMapping("/favorite")
    public ResponseEntity<ApiResponse<ActionStateResponse>> unfavorite(@Valid @RequestBody TargetActionRequest request) {
        return buildResponse(() -> interactionApplicationService.favorite(request, false));
    }

    @PostMapping("/follow")
    public ResponseEntity<ApiResponse<ActionStateResponse>> follow(@Valid @RequestBody FollowRequest request) {
        return buildResponse(() -> interactionApplicationService.follow(request, true));
    }

    @DeleteMapping("/follow/{followeeId}")
    public ResponseEntity<ApiResponse<ActionStateResponse>> unfollow(@PathVariable String followeeId) {
        return buildResponse(() -> interactionApplicationService.follow(new FollowRequest(followeeId), false));
    }

    private ResponseEntity<ApiResponse<ActionStateResponse>> buildResponse(ActionSupplier supplier) {
        return ResponseEntity.ok(ApiResponse.ok(supplier.get()));
    }

    @FunctionalInterface
    private interface ActionSupplier {
        ActionStateResponse get();
    }
}
