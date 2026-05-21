package com.dramatv.community.me.controller;

import com.dramatv.community.me.application.MeQueryService;
import com.dramatv.community.me.application.MeProfileApplicationService;
import com.dramatv.community.me.dto.request.UpdateMeProfileRequest;
import com.dramatv.community.me.dto.response.MeHubResponse;
import com.dramatv.community.me.dto.response.MeNotificationsResponse;
import com.dramatv.community.me.dto.response.MeProfileResponse;
import com.dramatv.community.shared.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final MeQueryService meQueryService;
    private final MeProfileApplicationService meProfileApplicationService;

    public MeController(
            MeQueryService meQueryService,
            MeProfileApplicationService meProfileApplicationService
    ) {
        this.meQueryService = meQueryService;
        this.meProfileApplicationService = meProfileApplicationService;
    }

    @GetMapping("/hub")
    public ApiResponse<MeHubResponse> hub() {
        return ApiResponse.ok(meQueryService.loadHub());
    }

    @GetMapping("/notifications/recent")
    public ApiResponse<MeNotificationsResponse> recentNotifications() {
        return ApiResponse.ok(meQueryService.loadRecentNotifications());
    }

    @PutMapping("/profile")
    public ApiResponse<MeProfileResponse> updateProfile(@RequestBody UpdateMeProfileRequest request) {
        return ApiResponse.ok(meProfileApplicationService.updateProfile(request));
    }
}
