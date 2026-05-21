package com.dramatv.community.admin.reports.dto.response;

public record AdminReportActionResponse(
        String action,
        String reportId,
        String statusCode
) {
}
