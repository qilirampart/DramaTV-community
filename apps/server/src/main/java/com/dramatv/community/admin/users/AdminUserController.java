package com.dramatv.community.admin.users;

import com.dramatv.community.admin.users.dto.request.AdminUserCreateRequest;
import com.dramatv.community.admin.users.dto.request.AdminUserGovernanceUpdateRequest;
import com.dramatv.community.admin.users.dto.response.AdminUserCreateResponse;
import com.dramatv.community.admin.users.dto.response.AdminUserDetailResponse;
import com.dramatv.community.admin.users.dto.response.AdminUserGovernanceUpdateResponse;
import com.dramatv.community.admin.users.dto.response.AdminUserListResponse;
import com.dramatv.community.admin.users.dto.response.AdminUserPasswordResetResponse;
import com.dramatv.community.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserQueryService adminUserQueryService;
    private final AdminUserGovernanceService adminUserGovernanceService;

    public AdminUserController(
            AdminUserQueryService adminUserQueryService,
            AdminUserGovernanceService adminUserGovernanceService
    ) {
        this.adminUserQueryService = adminUserQueryService;
        this.adminUserGovernanceService = adminUserGovernanceService;
    }

    @GetMapping
    public ApiResponse<AdminUserListResponse> listUsers(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "15") Integer pageSize
    ) {
        return ApiResponse.ok(adminUserQueryService.listUsers(q, page, pageSize));
    }

    @PostMapping
    public ApiResponse<AdminUserCreateResponse> createUser(
            @Valid @RequestBody AdminUserCreateRequest request
    ) {
        return ApiResponse.ok(adminUserGovernanceService.createUser(request));
    }

    @GetMapping("/{userId}")
    public ApiResponse<AdminUserDetailResponse> getUserDetail(
            @PathVariable String userId
    ) {
        return ApiResponse.ok(adminUserGovernanceService.getUserDetail(userId));
    }

    @PutMapping("/{userId}/governance")
    public ApiResponse<AdminUserGovernanceUpdateResponse> updateGovernance(
            @PathVariable String userId,
            @Valid @RequestBody AdminUserGovernanceUpdateRequest request
    ) {
        return ApiResponse.ok(adminUserGovernanceService.updateGovernance(userId, request));
    }

    @PostMapping("/{userId}/password/reset")
    public ApiResponse<AdminUserPasswordResetResponse> resetPassword(
            @PathVariable String userId
    ) {
        return ApiResponse.ok(adminUserGovernanceService.resetPassword(userId));
    }
}
