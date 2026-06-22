package com.dramatv.community.admin.feedops;

import com.dramatv.community.admin.feedops.dto.request.AdminFeedOpsPageUpdateRequest;
import com.dramatv.community.admin.feedops.dto.response.AdminFeedOpsCandidateListResponse;
import com.dramatv.community.admin.feedops.dto.response.AdminFeedOpsPageResponse;
import com.dramatv.community.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.RequestParam;
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

    @GetMapping("/home/candidates")
    public ApiResponse<AdminFeedOpsCandidateListResponse> getHomeCandidates(
            @RequestParam("slotKey") String slotKey,
            @RequestParam(value = "q", required = false) String keyword,
            @RequestParam(value = "promptFilter", required = false) String promptFilter,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize
    ) {
        return ApiResponse.ok(adminFeedOpsService.getHomeCandidates(slotKey, keyword, promptFilter, page, pageSize));
    }

    @PutMapping("/home")
    public ApiResponse<AdminFeedOpsPageResponse> updateHomeConfig(
            @Valid @RequestBody AdminFeedOpsPageUpdateRequest request
    ) {
        return ApiResponse.ok(adminFeedOpsService.updateHomeConfig(request));
    }

    @GetMapping("/featured")
    public ApiResponse<AdminFeedOpsPageResponse> getFeaturedConfig(
            @RequestParam(value = "sort", required = false) String sort
    ) {
        return ApiResponse.ok(adminFeedOpsService.getFeaturedConfig(sort));
    }

    @GetMapping("/featured/candidates")
    public ApiResponse<AdminFeedOpsCandidateListResponse> getFeaturedCandidates(
            @RequestParam("slotKey") String slotKey,
            @RequestParam(value = "q", required = false) String keyword,
            @RequestParam(value = "promptFilter", required = false) String promptFilter,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize
    ) {
        return ApiResponse.ok(adminFeedOpsService.getFeaturedCandidates(slotKey, keyword, promptFilter, page, pageSize));
    }

    @PutMapping("/featured")
    public ApiResponse<AdminFeedOpsPageResponse> updateFeaturedConfig(
            @RequestParam(value = "sort", required = false) String sort,
            @Valid @RequestBody AdminFeedOpsPageUpdateRequest request
    ) {
        return ApiResponse.ok(adminFeedOpsService.updateFeaturedConfig(request, sort));
    }

    @GetMapping("/landing")
    public ApiResponse<AdminFeedOpsPageResponse> getLandingConfig() {
        return ApiResponse.ok(adminFeedOpsService.getLandingConfig());
    }

    @GetMapping("/landing/candidates")
    public ApiResponse<AdminFeedOpsCandidateListResponse> getLandingCandidates(
            @RequestParam("slotKey") String slotKey,
            @RequestParam(value = "q", required = false) String keyword,
            @RequestParam(value = "promptFilter", required = false) String promptFilter,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize
    ) {
        return ApiResponse.ok(adminFeedOpsService.getLandingCandidates(slotKey, keyword, promptFilter, page, pageSize));
    }

    @PutMapping("/landing")
    public ApiResponse<AdminFeedOpsPageResponse> updateLandingConfig(
            @Valid @RequestBody AdminFeedOpsPageUpdateRequest request
    ) {
        return ApiResponse.ok(adminFeedOpsService.updateLandingConfig(request));
    }

    @GetMapping("/discussions")
    public ApiResponse<AdminFeedOpsPageResponse> getDiscussionsConfig() {
        return ApiResponse.ok(adminFeedOpsService.getDiscussionsConfig());
    }

    @GetMapping("/discussions/candidates")
    public ApiResponse<AdminFeedOpsCandidateListResponse> getDiscussionCandidates(
            @RequestParam("slotKey") String slotKey,
            @RequestParam(value = "q", required = false) String keyword,
            @RequestParam(value = "promptFilter", required = false) String promptFilter,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize
    ) {
        return ApiResponse.ok(adminFeedOpsService.getDiscussionCandidates(slotKey, keyword, promptFilter, page, pageSize));
    }

    @PutMapping("/discussions")
    public ApiResponse<AdminFeedOpsPageResponse> updateDiscussionsConfig(
            @Valid @RequestBody AdminFeedOpsPageUpdateRequest request
    ) {
        return ApiResponse.ok(adminFeedOpsService.updateDiscussionsConfig(request));
    }
}
