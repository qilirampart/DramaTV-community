package com.dramatv.community.publish.dto.response;

import java.util.List;

public record PostDraftSubmitResponse(
        String targetId,
        String slug,
        String publishStatus,
        List<String> taskIds,
        String submitMode
) {
}
