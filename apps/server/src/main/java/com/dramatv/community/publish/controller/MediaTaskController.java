package com.dramatv.community.publish.controller;

import com.dramatv.community.publish.application.MediaTaskApplicationService;
import com.dramatv.community.publish.dto.response.MediaTaskResponse;
import com.dramatv.community.shared.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/media-tasks")
public class MediaTaskController {

    private final MediaTaskApplicationService mediaTaskApplicationService;

    public MediaTaskController(MediaTaskApplicationService mediaTaskApplicationService) {
        this.mediaTaskApplicationService = mediaTaskApplicationService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MediaTaskResponse>> detail(@PathVariable String id) {
        return mediaTaskApplicationService.findOwnedTask(id)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("MEDIA_TASK_NOT_FOUND", "media task not found")));
    }

    @PostMapping("/{id}/retry")
    public ResponseEntity<ApiResponse<MediaTaskResponse>> retry(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(mediaTaskApplicationService.retryOwnedTask(id)));
    }
}
