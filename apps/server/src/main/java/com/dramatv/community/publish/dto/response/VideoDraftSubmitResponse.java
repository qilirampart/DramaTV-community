package com.dramatv.community.publish.dto.response;

import java.util.List;

public record VideoDraftSubmitResponse(
        String videoId,
        String draftStatus,
        String contentStatus,
        String publishStatus,
        DraftLifecycleResponse lifecycle,
        List<String> taskIds,
        String submitMode
) {
}
