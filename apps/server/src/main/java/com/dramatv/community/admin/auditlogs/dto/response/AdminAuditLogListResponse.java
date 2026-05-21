package com.dramatv.community.admin.auditlogs.dto.response;

import java.util.List;

public record AdminAuditLogListResponse(
        Summary summary,
        List<Item> items
) {

    public record Summary(
            long totalLogs,
            long sensitiveLogs,
            long reviewLogs,
            long publishLogs
    ) {
    }

    public record Item(
            String id,
            String occurredAt,
            String operatorId,
            String operatorUsername,
            String operatorDisplayName,
            String operatorRoleCode,
            String moduleCode,
            String moduleLabel,
            String actionCode,
            String actionLabel,
            String targetType,
            String targetId,
            String targetTitle,
            String resultStatus,
            String riskLevel,
            String noteText,
            String requestId,
            String traceId,
            String requestPath,
            String requestMethod,
            int responseStatus
    ) {
    }
}
