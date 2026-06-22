package com.dramatv.community.admin.resources.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record AdminResourceDetailResponse(
        String targetType,
        String targetId,
        String title,
        String authorId,
        String authorDisplayName,
        List<String> tagNames,
        OffsetDateTime publishedAt,
        OffsetDateTime reviewedAt,
        String publishStatusCode,
        String governanceStatusCode,
        String latestAuditStatusCode,
        String riskLevel,
        String reviewerId,
        String reviewerDisplayName,
        String summaryText,
        String contentText,
        String channelTitle,
        String bindingTargetType,
        String bindingTargetId,
        String promptModality,
        Media media,
        List<String> modelTags,
        List<RiskSignal> riskSignals
) {
    public record Media(
            String coverUrl,
            String posterUrl,
            String previewUrl,
            String sourceUrl
    ) {
    }

    public record RiskSignal(
            String label,
            String tone,
            String detail
    ) {
    }
}
