package com.dramatv.community.publish.dto.response;

public record ReportResponse(
        String reportId,
        String targetType,
        String targetId,
        String reasonCode,
        String statusCode
) {
}
