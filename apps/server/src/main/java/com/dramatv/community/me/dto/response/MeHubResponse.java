package com.dramatv.community.me.dto.response;

import com.dramatv.community.discussion.dto.response.DiscussionHomeResponse;
import com.dramatv.community.publish.dto.response.DraftLifecycleResponse;
import com.dramatv.community.video.dto.response.VideoSummaryResponse;
import com.dramatv.community.workflow.dto.response.WorkflowSummaryResponse;
import java.util.List;

public record MeHubResponse(
        Profile profile,
        List<InteractionItem> likedItems,
        List<InteractionItem> favoritedItems,
        List<DraftItem> draftItems,
        PublishedContent publishedContent
) {
    public record Profile(
            String id,
            String displayName,
            String avatarUrl,
            String roleCode,
            String bio,
            String headline,
            Stats stats
    ) {
    }

    public record Stats(
            int videoCount,
            int workflowCount,
            long followerCount,
            long likeReceivedCount
    ) {
    }

    public record InteractionItem(
            String itemType,
            String targetId,
            String title,
            String summary,
            String coverUrl,
            String href,
            String workflowTitle,
            String channelTitle,
            String actedAt,
            Author author
    ) {
    }

    public record Author(
            String id,
            String displayName,
            String avatarUrl
    ) {
    }

    public record DraftItem(
            String draftType,
            String draftId,
            String targetId,
            String title,
            String summary,
            String coverUrl,
            String statusCode,
            String currentStep,
            DraftLifecycleResponse lifecycle,
            String updatedAt,
            String continueHref,
            boolean editable
    ) {
    }

    public record PublishedContent(
            List<VideoSummaryResponse> videos,
            List<WorkflowSummaryResponse> workflows,
            List<DiscussionHomeResponse.ThreadCard> posts
    ) {
    }
}
