package com.dramatv.community.creator.dto.response;

public record CreatorProfileResponse(
        String id,
        String displayName,
        String avatarUrl,
        String bio,
        String headline,
        Stats stats,
        ViewerActions viewerActions
) {
    public record Stats(
            int videoCount,
            int workflowCount,
            long followerCount
    ) {
    }

    public record ViewerActions(
            boolean followed
    ) {
    }
}
