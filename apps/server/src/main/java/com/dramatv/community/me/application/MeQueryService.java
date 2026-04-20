package com.dramatv.community.me.application;

import com.dramatv.community.me.dto.response.MeHubResponse;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserService;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class MeQueryService {

    private static final int MAX_SECTION_ITEMS = 12;

    private final JdbcTemplate jdbcTemplate;
    private final CurrentUserService currentUserService;

    public MeQueryService(JdbcTemplate jdbcTemplate, CurrentUserService currentUserService) {
        this.jdbcTemplate = jdbcTemplate;
        this.currentUserService = currentUserService;
    }

    public MeHubResponse loadHub() {
        CurrentUser currentUser = currentUserService.requireCurrentUser();

        return new MeHubResponse(
                loadProfile(currentUser),
                loadRecentInteractionItems(currentUser.id(), "like"),
                loadRecentInteractionItems(currentUser.id(), "favorite")
        );
    }

    private MeHubResponse.Profile loadProfile(CurrentUser currentUser) {
        Optional<MeHubResponse.Profile> profile = jdbcTemplate.query("""
                select
                    user_account.id,
                    user_account.display_name,
                    user_account.avatar_url,
                    user_account.role_code,
                    user_account.bio,
                    creator_profile.headline,
                    coalesce(creator_profile.video_count, 0) as video_count,
                    coalesce(creator_profile.workflow_count, 0) as workflow_count,
                    coalesce(creator_profile.follower_count, 0) as follower_count
                from users user_account
                left join creator_profiles creator_profile on creator_profile.user_id = user_account.id
                where user_account.id = ?
                """,
                resultSet -> resultSet.next() ? Optional.of(mapProfile(resultSet)) : Optional.empty(),
                currentUser.id()
        );

        return profile.orElseGet(() -> new MeHubResponse.Profile(
                currentUser.id().toString(),
                currentUser.displayName(),
                currentUser.avatarUrl(),
                currentUser.roleCode(),
                currentUser.bio(),
                currentUser.headline(),
                new MeHubResponse.Stats(0, 0, 0)
        ));
    }

    private MeHubResponse.Profile mapProfile(ResultSet resultSet) throws SQLException {
        return new MeHubResponse.Profile(
                resultSet.getObject("id").toString(),
                resultSet.getString("display_name"),
                resultSet.getString("avatar_url"),
                resultSet.getString("role_code"),
                resultSet.getString("bio"),
                resultSet.getString("headline"),
                new MeHubResponse.Stats(
                        resultSet.getInt("video_count"),
                        resultSet.getInt("workflow_count"),
                        resultSet.getLong("follower_count")
                )
        );
    }

    private List<MeHubResponse.InteractionItem> loadRecentInteractionItems(UUID actorId, String actionType) {
        List<SortableInteractionItem> items = new ArrayList<>();
        items.addAll(loadVideoInteractionItems(actorId, actionType));
        items.addAll(loadWorkflowInteractionItems(actorId, actionType));
        items.addAll(loadPostInteractionItems(actorId, actionType));

        items.sort(Comparator.comparing(
                SortableInteractionItem::actedAt,
                Comparator.nullsLast(Comparator.reverseOrder())
        ));

        return items.stream()
                .limit(MAX_SECTION_ITEMS)
                .map(SortableInteractionItem::item)
                .toList();
    }

    private List<SortableInteractionItem> loadVideoInteractionItems(UUID actorId, String actionType) {
        return jdbcTemplate.query("""
                select
                    action.updated_at as acted_at,
                    video.id as target_id,
                    video.title,
                    video.summary,
                    cover.object_key as cover_url,
                    workflow.title as workflow_title,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    author.avatar_url as author_avatar_url
                from interaction_actions action
                join videos video on video.id = action.target_id
                    and video.publish_status = 'published'
                    and video.deleted_at is null
                join users author on author.id = video.author_id
                left join media_assets cover on cover.id = video.cover_asset_id
                left join workflows workflow on workflow.id = video.workflow_id
                    and workflow.publish_status = 'published'
                    and workflow.deleted_at is null
                where action.actor_id = ?
                  and action.action_type = ?
                  and action.target_type = 'video'
                  and action.status_code = 'active'
                order by action.updated_at desc
                limit 24
                """,
                (resultSet, rowNum) -> {
                    OffsetDateTime actedAt = resultSet.getObject("acted_at", OffsetDateTime.class);
                    String workflowTitle = nullableText(resultSet, "workflow_title");
                    String summary = nullableText(resultSet, "summary");

                    if (summary == null && workflowTitle != null) {
                        summary = "已关联工作流：" + workflowTitle;
                    }

                    return new SortableInteractionItem(
                            actedAt,
                            new MeHubResponse.InteractionItem(
                                    "video",
                                    resultSet.getObject("target_id").toString(),
                                    resultSet.getString("title"),
                                    summary,
                                    resultSet.getString("cover_url"),
                                    "/videos/" + resultSet.getObject("target_id"),
                                    workflowTitle,
                                    null,
                                    toIsoString(actedAt),
                                    new MeHubResponse.Author(
                                            resultSet.getObject("author_id").toString(),
                                            resultSet.getString("author_display_name"),
                                            resultSet.getString("author_avatar_url")
                                    )
                            )
                    );
                },
                actorId,
                actionType
        );
    }

    private List<SortableInteractionItem> loadWorkflowInteractionItems(UUID actorId, String actionType) {
        return jdbcTemplate.query("""
                select
                    action.updated_at as acted_at,
                    workflow.id as target_id,
                    workflow.title,
                    workflow.summary,
                    workflow.scenario_text,
                    cover.object_key as cover_url,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    author.avatar_url as author_avatar_url
                from interaction_actions action
                join workflows workflow on workflow.id = action.target_id
                    and workflow.publish_status = 'published'
                    and workflow.deleted_at is null
                join users author on author.id = workflow.author_id
                left join media_assets cover on cover.id = workflow.cover_asset_id
                where action.actor_id = ?
                  and action.action_type = ?
                  and action.target_type = 'workflow'
                  and action.status_code = 'active'
                order by action.updated_at desc
                limit 24
                """,
                (resultSet, rowNum) -> {
                    OffsetDateTime actedAt = resultSet.getObject("acted_at", OffsetDateTime.class);
                    String summary = nullableText(resultSet, "summary");

                    if (summary == null) {
                        summary = nullableText(resultSet, "scenario_text");
                    }

                    return new SortableInteractionItem(
                            actedAt,
                            new MeHubResponse.InteractionItem(
                                    "workflow",
                                    resultSet.getObject("target_id").toString(),
                                    resultSet.getString("title"),
                                    summary,
                                    resultSet.getString("cover_url"),
                                    "/workflows/" + resultSet.getObject("target_id"),
                                    null,
                                    null,
                                    toIsoString(actedAt),
                                    new MeHubResponse.Author(
                                            resultSet.getObject("author_id").toString(),
                                            resultSet.getString("author_display_name"),
                                            resultSet.getString("author_avatar_url")
                                    )
                            )
                    );
                },
                actorId,
                actionType
        );
    }

    private List<SortableInteractionItem> loadPostInteractionItems(UUID actorId, String actionType) {
        return jdbcTemplate.query("""
                select
                    action.updated_at as acted_at,
                    thread.id as target_id,
                    thread.slug,
                    thread.title,
                    thread.excerpt_text,
                    channel.title as channel_title,
                    author.id as author_id,
                    author.display_name as author_display_name,
                    author.avatar_url as author_avatar_url
                from interaction_actions action
                join discussion_threads thread on thread.id = action.target_id
                    and thread.publish_status = 'published'
                    and thread.deleted_at is null
                join discussion_channels channel on channel.id = thread.channel_id
                join users author on author.id = thread.author_id
                where action.actor_id = ?
                  and action.action_type = ?
                  and action.target_type = 'post'
                  and action.status_code = 'active'
                order by action.updated_at desc
                limit 24
                """,
                (resultSet, rowNum) -> {
                    OffsetDateTime actedAt = resultSet.getObject("acted_at", OffsetDateTime.class);
                    String slug = resultSet.getString("slug");

                    return new SortableInteractionItem(
                            actedAt,
                            new MeHubResponse.InteractionItem(
                                    "post",
                                    resultSet.getObject("target_id").toString(),
                                    resultSet.getString("title"),
                                    nullableText(resultSet, "excerpt_text"),
                                    null,
                                    "/discussions/" + slug,
                                    null,
                                    resultSet.getString("channel_title"),
                                    toIsoString(actedAt),
                                    new MeHubResponse.Author(
                                            resultSet.getObject("author_id").toString(),
                                            resultSet.getString("author_display_name"),
                                            resultSet.getString("author_avatar_url")
                                    )
                            )
                    );
                },
                actorId,
                actionType
        );
    }

    private String nullableText(ResultSet resultSet, String columnName) throws SQLException {
        String value = resultSet.getString(columnName);
        return value == null || value.isBlank() ? null : value;
    }

    private String toIsoString(OffsetDateTime value) {
        return value == null ? null : value.toString();
    }

    private record SortableInteractionItem(
            OffsetDateTime actedAt,
            MeHubResponse.InteractionItem item
    ) {
    }
}
