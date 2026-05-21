package com.dramatv.community.publish.dto.response;

import java.util.List;

public record PostDraftResponse(
        String draftId,
        String targetId,
        String title,
        String channelSlug,
        String content,
        List<String> tagNames,
        String bindingTargetType,
        String bindingTargetId,
        String statusCode,
        DraftLifecycleResponse lifecycle
) {
}
