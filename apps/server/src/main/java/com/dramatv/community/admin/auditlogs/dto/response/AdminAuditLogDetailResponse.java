package com.dramatv.community.admin.auditlogs.dto.response;

public record AdminAuditLogDetailResponse(
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
        int responseStatus,
        String metadataText
) {
}
