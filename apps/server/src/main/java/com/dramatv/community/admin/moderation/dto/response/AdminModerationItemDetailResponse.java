package com.dramatv.community.admin.moderation.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record AdminModerationItemDetailResponse(
        String targetType,
        String targetId,
        String title,
        String authorId,
        String authorDisplayName,
        List<String> tagNames,
        OffsetDateTime submittedAt,
        String statusCode,
        String riskLevel,
        String reviewerId,
        String reviewerDisplayName,
        String summaryText,
        String contentText,
        Media media,
        List<String> modelTags,
        List<RiskSignal> riskSignals
) {
    public record RiskSignal(
            String label,
            String tone,
            String detail
    ) {
    }

    public record Media(
            String coverUrl,
            String posterUrl,
            String previewUrl,
            String sourceUrl
    ) {
    }
}
