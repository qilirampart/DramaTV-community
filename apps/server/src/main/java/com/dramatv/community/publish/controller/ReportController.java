package com.dramatv.community.publish.controller;

import com.dramatv.community.publish.application.ReportApplicationService;
import com.dramatv.community.publish.dto.request.CreateReportRequest;
import com.dramatv.community.publish.dto.response.ReportResponse;
import com.dramatv.community.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportApplicationService reportApplicationService;

    public ReportController(ReportApplicationService reportApplicationService) {
        this.reportApplicationService = reportApplicationService;
    }

    @PostMapping
    public ApiResponse<ReportResponse> create(@Valid @RequestBody CreateReportRequest request) {
        return ApiResponse.ok(reportApplicationService.createReport(request));
    }
}
