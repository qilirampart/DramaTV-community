package com.dramatv.community.video.controller;

import com.dramatv.community.shared.response.ApiResponse;
import com.dramatv.community.video.application.VideoQueryService;
import com.dramatv.community.video.dto.response.VideoDetailResponse;
import com.dramatv.community.video.dto.response.VideoSummaryResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/videos")
public class VideoQueryController {

    private final VideoQueryService videoQueryService;

    public VideoQueryController(VideoQueryService videoQueryService) {
        this.videoQueryService = videoQueryService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VideoDetailResponse>> detail(@PathVariable String id) {
        return videoQueryService.findDetail(id)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("VIDEO_NOT_FOUND", "video not found")));
    }

    @GetMapping("/{id}/related")
    public ApiResponse<List<VideoSummaryResponse>> related(@PathVariable String id) {
        return ApiResponse.ok(videoQueryService.relatedVideos(id));
    }
}
