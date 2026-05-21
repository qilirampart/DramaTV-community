package com.dramatv.community.admin.feedops;

import com.dramatv.community.admin.feedops.dto.request.AdminFeedOpsPageUpdateRequest;
import com.dramatv.community.admin.feedops.dto.response.AdminFeedOpsPageResponse;
import com.dramatv.community.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/feed-ops")
public class AdminFeedOpsController {

    private final AdminFeedOpsService adminFeedOpsService;

    public AdminFeedOpsController(AdminFeedOpsService adminFeedOpsService) {
        this.adminFeedOpsService = adminFeedOpsService;
    }

    @GetMapping("/home")
    public ApiResponse<AdminFeedOpsPageResponse> getHomeConfig() {
        return ApiResponse.ok(adminFeedOpsService.getHomeConfig());
    }

    @PutMapping("/home")
    public ApiResponse<AdminFeedOpsPageResponse> updateHomeConfig(
            @Valid @RequestBody AdminFeedOpsPageUpdateRequest request
    ) {
        return ApiResponse.ok(adminFeedOpsService.updateHomeConfig(request));
    }

    @GetMapping("/featured")
    public ApiResponse<AdminFeedOpsPageResponse> getFeaturedConfig() {
        return ApiResponse.ok(adminFeedOpsService.getFeaturedConfig());
    }

    @PutMapping("/featured")
    public ApiResponse<AdminFeedOpsPageResponse> updateFeaturedConfig(
            @Valid @RequestBody AdminFeedOpsPageUpdateRequest request
    ) {
        return ApiResponse.ok(adminFeedOpsService.updateFeaturedConfig(request));
    }

    @GetMapping("/discussions")
    public ApiResponse<AdminFeedOpsPageResponse> getDiscussionsConfig() {
        return ApiResponse.ok(adminFeedOpsService.getDiscussionsConfig());
    }

    @PutMapping("/discussions")
    public ApiResponse<AdminFeedOpsPageResponse> updateDiscussionsConfig(
            @Valid @RequestBody AdminFeedOpsPageUpdateRequest request
    ) {
        return ApiResponse.ok(adminFeedOpsService.updateDiscussionsConfig(request));
    }
}
