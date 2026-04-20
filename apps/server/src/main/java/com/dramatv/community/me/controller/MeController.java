package com.dramatv.community.me.controller;

import com.dramatv.community.me.application.MeQueryService;
import com.dramatv.community.me.dto.response.MeHubResponse;
import com.dramatv.community.shared.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final MeQueryService meQueryService;

    public MeController(MeQueryService meQueryService) {
        this.meQueryService = meQueryService;
    }

    @GetMapping("/hub")
    public ApiResponse<MeHubResponse> hub() {
        return ApiResponse.ok(meQueryService.loadHub());
    }
}
