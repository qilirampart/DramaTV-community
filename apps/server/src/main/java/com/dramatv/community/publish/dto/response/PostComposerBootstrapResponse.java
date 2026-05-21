package com.dramatv.community.publish.dto.response;

import com.dramatv.community.discussion.dto.response.DiscussionHomeResponse;
import java.util.List;

public record PostComposerBootstrapResponse(
        CurrentUser currentUser,
        PostDraftResponse postDraft,
        List<DiscussionHomeResponse.Channel> channels
) {
    public record CurrentUser(
            String id,
            String displayName,
            String roleCode
    ) {
    }
}
