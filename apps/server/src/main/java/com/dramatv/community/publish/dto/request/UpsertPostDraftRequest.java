package com.dramatv.community.publish.dto.request;

import java.util.List;

public record UpsertPostDraftRequest(
        String title,
        String channelSlug,
        String content,
        List<String> tagNames,
        String bindingTargetType,
        String bindingTargetId
) {
}
