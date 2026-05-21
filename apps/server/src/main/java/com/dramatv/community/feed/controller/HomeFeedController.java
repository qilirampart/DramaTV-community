package com.dramatv.community.feed.controller;

import com.dramatv.community.feed.dto.response.FeaturedArchiveResponse;
import com.dramatv.community.feed.application.HomeFeedQueryService;
import com.dramatv.community.feed.dto.response.HomeFeedResponse;
import com.dramatv.community.shared.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feed")
public class HomeFeedController {

    private final HomeFeedQueryService homeFeedQueryService;

    public HomeFeedController(HomeFeedQueryService homeFeedQueryService) {
        this.homeFeedQueryService = homeFeedQueryService;
    }

    @GetMapping("/home")
    public ResponseEntity<ApiResponse<HomeFeedResponse>> home(
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "recommend") String channel
    ) {
        return ResponseEntity.ok(ApiResponse.ok(homeFeedQueryService.loadHomeFeed(cursor, channel)));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<FeaturedArchiveResponse>> featured() {
        return ResponseEntity.ok(ApiResponse.ok(homeFeedQueryService.loadFeaturedArchive()));
    }
}
