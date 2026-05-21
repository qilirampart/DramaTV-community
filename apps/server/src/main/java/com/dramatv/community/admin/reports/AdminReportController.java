package com.dramatv.community.admin.reports;

import com.dramatv.community.admin.reports.dto.request.AdminReportDecisionRequest;
import com.dramatv.community.admin.reports.dto.response.AdminReportActionResponse;
import com.dramatv.community.admin.reports.dto.response.AdminReportDetailResponse;
import com.dramatv.community.admin.reports.dto.response.AdminReportListResponse;
import com.dramatv.community.shared.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/reports")
public class AdminReportController {

    private final AdminReportService adminReportService;

    public AdminReportController(AdminReportService adminReportService) {
        this.adminReportService = adminReportService;
    }

    @GetMapping
    public ApiResponse<AdminReportListResponse> listReports(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) String reason
    ) {
        return ApiResponse.ok(adminReportService.listReports(q, status, targetType, reason));
    }

    @GetMapping("/{reportId}")
    public ApiResponse<AdminReportDetailResponse> getReport(@PathVariable String reportId) {
        return ApiResponse.ok(adminReportService.getReport(reportId));
    }

    @PostMapping("/{reportId}/processing")
    public ApiResponse<AdminReportActionResponse> markProcessing(
            @PathVariable String reportId,
            @RequestBody(required = false) AdminReportDecisionRequest request
    ) {
        return ApiResponse.ok(adminReportService.markProcessing(reportId, request == null ? null : request.note()));
    }

    @PostMapping("/{reportId}/close")
    public ApiResponse<AdminReportActionResponse> closeReport(
            @PathVariable String reportId,
            @RequestBody(required = false) AdminReportDecisionRequest request
    ) {
        return ApiResponse.ok(adminReportService.closeReport(reportId, request == null ? null : request.note()));
    }

    @PostMapping("/{reportId}/offline-target")
    public ApiResponse<AdminReportActionResponse> offlineTarget(
            @PathVariable String reportId,
            @RequestBody(required = false) AdminReportDecisionRequest request
    ) {
        return ApiResponse.ok(adminReportService.offlineTarget(reportId, request == null ? null : request.note()));
    }

    @PostMapping("/{reportId}/hide-comment")
    public ApiResponse<AdminReportActionResponse> hideReportedComment(
            @PathVariable String reportId,
            @RequestBody(required = false) AdminReportDecisionRequest request
    ) {
        return ApiResponse.ok(adminReportService.hideReportedComment(reportId, request == null ? null : request.note()));
    }
}
