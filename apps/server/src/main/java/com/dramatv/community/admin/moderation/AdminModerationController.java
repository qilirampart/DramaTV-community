package com.dramatv.community.admin.moderation;

import com.dramatv.community.admin.moderation.dto.request.AdminModerationDecisionRequest;
import com.dramatv.community.admin.moderation.dto.response.AdminModerationActionResponse;
import com.dramatv.community.admin.moderation.dto.response.AdminModerationItemDetailResponse;
import com.dramatv.community.admin.moderation.dto.response.AdminModerationListResponse;
import com.dramatv.community.shared.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/moderation/items")
public class AdminModerationController {

    private final AdminModerationService adminModerationService;

    public AdminModerationController(AdminModerationService adminModerationService) {
        this.adminModerationService = adminModerationService;
    }

    @GetMapping
    public ApiResponse<AdminModerationListResponse> listItems(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) String status
    ) {
        return ApiResponse.ok(adminModerationService.listItems(q, targetType, status));
    }

    @GetMapping("/{targetType}/{targetId}")
    public ApiResponse<AdminModerationItemDetailResponse> getItem(
            @PathVariable String targetType,
            @PathVariable String targetId
    ) {
        return ApiResponse.ok(adminModerationService.getItem(targetType, targetId));
    }

    @PostMapping("/{targetType}/{targetId}/approve")
    public ApiResponse<AdminModerationActionResponse> approve(
            @PathVariable String targetType,
            @PathVariable String targetId,
            @RequestBody(required = false) AdminModerationDecisionRequest request
    ) {
        return ApiResponse.ok(adminModerationService.approve(targetType, targetId, request == null ? null : request.note()));
    }

    @PostMapping("/{targetType}/{targetId}/reject")
    public ApiResponse<AdminModerationActionResponse> reject(
            @PathVariable String targetType,
            @PathVariable String targetId,
            @RequestBody(required = false) AdminModerationDecisionRequest request
    ) {
        return ApiResponse.ok(adminModerationService.reject(targetType, targetId, request == null ? null : request.note()));
    }

    @PostMapping("/{targetType}/{targetId}/offline")
    public ApiResponse<AdminModerationActionResponse> offline(
            @PathVariable String targetType,
            @PathVariable String targetId,
            @RequestBody(required = false) AdminModerationDecisionRequest request
    ) {
        return ApiResponse.ok(adminModerationService.offline(targetType, targetId, request == null ? null : request.note()));
    }

    @PostMapping("/{targetType}/{targetId}/restore")
    public ApiResponse<AdminModerationActionResponse> restore(
            @PathVariable String targetType,
            @PathVariable String targetId,
            @RequestBody(required = false) AdminModerationDecisionRequest request
    ) {
        return ApiResponse.ok(adminModerationService.restore(targetType, targetId, request == null ? null : request.note()));
    }
}
