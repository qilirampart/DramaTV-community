package com.dramatv.community.discussion.controller;

import com.dramatv.community.discussion.application.DiscussionQueryService;
import com.dramatv.community.discussion.dto.response.DiscussionHomeResponse;
import com.dramatv.community.discussion.dto.response.DiscussionThreadDetailResponse;
import com.dramatv.community.shared.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/discussions")
public class DiscussionController {

    private final DiscussionQueryService discussionQueryService;

    public DiscussionController(DiscussionQueryService discussionQueryService) {
        this.discussionQueryService = discussionQueryService;
    }

    @GetMapping("/home")
    public ApiResponse<DiscussionHomeResponse> home(@RequestParam(required = false) String channel) {
        return ApiResponse.ok(discussionQueryService.loadHome(channel));
    }

    @GetMapping("/threads/{slug}")
    public ResponseEntity<ApiResponse<DiscussionThreadDetailResponse>> thread(@PathVariable String slug) {
        return discussionQueryService.findThread(slug)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("DISCUSSION_THREAD_NOT_FOUND", "discussion thread not found")));
    }
}
