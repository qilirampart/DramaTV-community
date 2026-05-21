package com.dramatv.community.publish.dto.response;

import java.util.List;

public record PostDraftSubmitResponse(
        String targetId,
        String slug,
        String draftStatus,
        String contentStatus,
        String publishStatus,
        DraftLifecycleResponse lifecycle,
        List<String> taskIds,
        String submitMode
) {
}
