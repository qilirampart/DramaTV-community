package com.dramatv.community.admin.dashboard;

import com.dramatv.community.admin.dashboard.dto.response.AdminDashboardOverviewResponse;
import com.dramatv.community.shared.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardOverviewController {

    private final AdminDashboardOverviewService adminDashboardOverviewService;

    public AdminDashboardOverviewController(AdminDashboardOverviewService adminDashboardOverviewService) {
        this.adminDashboardOverviewService = adminDashboardOverviewService;
    }

    @GetMapping("/overview")
    public ApiResponse<AdminDashboardOverviewResponse> getOverview() {
        return ApiResponse.ok(adminDashboardOverviewService.getOverview());
    }
}
