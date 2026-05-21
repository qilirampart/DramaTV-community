package com.dramatv.community.me.dto.response;

import java.util.List;

public record MeNotificationsResponse(
        List<NotificationItem> items
) {
    public record NotificationItem(
            String id,
            String actionType,
            String actedAt,
            String excerpt,
            String replyToActorName,
            String commentId,
            Actor actor,
            Target target
    ) {
    }

    public record Actor(
            String id,
            String displayName,
            String avatarUrl
    ) {
    }

    public record Target(
            String id,
            String type,
            String title,
            String href
    ) {
    }
}
