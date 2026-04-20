package com.dramatv.community.publish.dto.response;

import java.util.List;

public record VideoDraftSubmitResponse(
        String videoId,
        String publishStatus,
        List<String> taskIds,
        String submitMode
) {
}
