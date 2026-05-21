package com.dramatv.community.me.application;

import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserService;
import com.dramatv.community.me.dto.request.UpdateMeProfileRequest;
import com.dramatv.community.me.dto.response.MeHubResponse;
import com.dramatv.community.me.dto.response.MeProfileResponse;
import com.dramatv.community.shared.error.ApiBusinessException;
import com.dramatv.community.shared.media.MediaAssetUrlResolver;
import com.dramatv.community.shared.request.MdcBusinessContextScope;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MeProfileApplicationService {

    private static final Logger log = LoggerFactory.getLogger(MeProfileApplicationService.class);

    private final JdbcTemplate jdbcTemplate;
    private final CurrentUserService currentUserService;
    private final MediaAssetUrlResolver mediaAssetUrlResolver;

    public MeProfileApplicationService(
            JdbcTemplate jdbcTemplate,
            CurrentUserService currentUserService,
            MediaAssetUrlResolver mediaAssetUrlResolver
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.currentUserService = currentUserService;
        this.mediaAssetUrlResolver = mediaAssetUrlResolver;
    }

    @Transactional
    public MeProfileResponse updateProfile(UpdateMeProfileRequest request) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        StoredAvatarState storedAvatarState = loadStoredAvatarState(currentUser.id());

        String displayName = normalizeDisplayName(request.displayName(), currentUser.displayName());
        String bio = normalizeOptional(request.bio(), 512);
        String headline = normalizeOptional(request.headline(), 128);
        String avatarUrl = normalizeOptional(request.avatarUrl(), 512);
        String avatarAssetId = normalizeOptional(request.avatarAssetId(), 64);
        AvatarUpdate avatarUpdate = resolveAvatarUpdate(currentUser, storedAvatarState, avatarAssetId, avatarUrl);

        jdbcTemplate.update("""
                update users
                set display_name = ?,
                    avatar_asset_id = ?,
                    avatar_url = ?,
                    bio = ?,
                    updated_at = now()
                where id = ?
                """,
                displayName,
                avatarUpdate.avatarAssetId(),
                avatarUpdate.avatarUrl(),
                bio,
                currentUser.id()
        );

        jdbcTemplate.update("""
                insert into creator_profiles (
                    user_id, headline, featured_status, created_at, updated_at
                )
                values (?, ?, 'normal', now(), now())
                on conflict (user_id) do update
                set headline = excluded.headline,
                    updated_at = now()
                """,
                currentUser.id(),
                headline
        );

        MeHubResponse.Stats stats = jdbcTemplate.query("""
                select
                    (
                        select count(*)
                        from (
                            select video.id
                            from videos video
                            where video.author_id = user_account.id
                              and video.publish_status = 'published'
                              and video.deleted_at is null
                            union all
                            select prompt.id
                            from prompt_entries prompt
                            where prompt.author_id = user_account.id
                              and prompt.publish_status = 'published'
                              and prompt.deleted_at is null
                        ) published_works
                    ) as video_count,
                    (
                        select count(*)
                        from workflows workflow
                        where workflow.author_id = user_account.id
                          and workflow.publish_status = 'published'
                          and workflow.deleted_at is null
                    ) as workflow_count,
                    (
                        select count(*)
                        from follow_relations relation
                        where relation.followee_id = user_account.id
                          and relation.status_code = 'active'
                    ) as follower_count,
                    (
                        select coalesce(sum(source.like_count), 0)
                        from (
                            select video.like_count
                            from videos video
                            where video.author_id = user_account.id
                              and video.publish_status = 'published'
                              and video.deleted_at is null
                            union all
                            select workflow.like_count
                            from workflows workflow
                            where workflow.author_id = user_account.id
                              and workflow.publish_status = 'published'
                              and workflow.deleted_at is null
                            union all
                            select prompt.like_count
                            from prompt_entries prompt
                            where prompt.author_id = user_account.id
                              and prompt.publish_status = 'published'
                              and prompt.deleted_at is null
                            union all
                            select thread.like_count
                            from discussion_threads thread
                            where thread.author_id = user_account.id
                              and thread.publish_status = 'published'
                              and thread.deleted_at is null
                        ) source
                    ) as like_received_count
                from users user_account
                where user_account.id = ?
                """,
                resultSet -> {
                    if (!resultSet.next()) {
                        return new MeHubResponse.Stats(0, 0, 0, 0);
                    }

                    return new MeHubResponse.Stats(
                            resultSet.getInt("video_count"),
                            resultSet.getInt("workflow_count"),
                            resultSet.getLong("follower_count"),
                            resultSet.getLong("like_received_count")
                    );
                },
                currentUser.id()
        );

        String avatarSource = avatarUpdate.avatarAssetId() != null
                ? "asset"
                : (avatarUrl != null && !avatarUrl.equals(currentUser.avatarUrl()) ? "url" : "existing");
        boolean avatarChanged = !Objects.equals(avatarUpdate.resolvedAvatarUrl(), currentUser.avatarUrl());
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(creatorContext(currentUser.id()))) {
            log.info(
                    "me profile update success: creatorId={} displayNameLength={} bioLength={} headlineLength={} avatarSource={} avatarChanged={}",
                    currentUser.id(),
                    displayName.length(),
                    bio == null ? 0 : bio.length(),
                    headline == null ? 0 : headline.length(),
                    avatarSource,
                    avatarChanged
            );
        }

        return new MeProfileResponse(
                currentUser.id().toString(),
                displayName,
                avatarUpdate.resolvedAvatarUrl(),
                currentUser.roleCode(),
                bio,
                headline,
                stats
        );
    }

    private StoredAvatarState loadStoredAvatarState(UUID userId) {
        StoredAvatarState state = jdbcTemplate.query("""
                select avatar_asset_id, avatar_url
                from users
                where id = ?
                """,
                resultSet -> {
                    if (!resultSet.next()) {
                        return null;
                    }

                    return new StoredAvatarState(
                            (UUID) resultSet.getObject("avatar_asset_id"),
                            resultSet.getString("avatar_url")
                    );
                },
                userId
        );

        if (state == null) {
            throw ApiBusinessException.internalError("ME_PROFILE_USER_NOT_FOUND", "current user does not exist");
        }

        return state;
    }

    private AvatarUpdate resolveAvatarUpdate(
            CurrentUser currentUser,
            StoredAvatarState storedAvatarState,
            String avatarAssetIdText,
            String avatarUrl
    ) {
        if (avatarAssetIdText != null) {
            AvatarAsset asset = loadAvatarAsset(currentUser.id(), avatarAssetIdText);
            return new AvatarUpdate(
                    asset.id(),
                    asset.objectKey(),
                    mediaAssetUrlResolver.resolve(asset.storageProvider(), asset.bucketName(), asset.objectKey())
            );
        }

        if (avatarUrl != null && !avatarUrl.equals(currentUser.avatarUrl())) {
            return new AvatarUpdate(
                    null,
                    avatarUrl,
                    mediaAssetUrlResolver.resolve(avatarUrl)
            );
        }

        return new AvatarUpdate(
                storedAvatarState.avatarAssetId(),
                storedAvatarState.avatarUrl(),
                currentUser.avatarUrl()
        );
    }

    private Map<String, String> creatorContext(UUID userId) {
        return Map.of("creatorId", userId.toString());
    }

    private AvatarAsset loadAvatarAsset(UUID currentUserId, String avatarAssetIdText) {
        UUID avatarAssetId;
        try {
            avatarAssetId = UUID.fromString(avatarAssetIdText);
        } catch (IllegalArgumentException ex) {
            throw ApiBusinessException.badRequest("ME_AVATAR_ASSET_ID_INVALID", "avatar asset id is invalid");
        }

        AvatarAsset asset = jdbcTemplate.query("""
                select id, asset_kind, asset_role, storage_provider, bucket_name, object_key, status_code, created_by
                from media_assets
                where id = ?
                """,
                resultSet -> {
                    if (!resultSet.next()) {
                        return null;
                    }

                    return new AvatarAsset(
                            (UUID) resultSet.getObject("id"),
                            resultSet.getString("asset_kind"),
                            resultSet.getString("asset_role"),
                            resultSet.getString("storage_provider"),
                            resultSet.getString("bucket_name"),
                            resultSet.getString("object_key"),
                            resultSet.getString("status_code"),
                            (UUID) resultSet.getObject("created_by")
                    );
                },
                avatarAssetId
        );

        if (asset == null) {
            throw ApiBusinessException.badRequest("ME_AVATAR_ASSET_NOT_FOUND", "avatar asset does not exist");
        }

        if (!"image".equalsIgnoreCase(asset.assetKind())) {
            throw ApiBusinessException.badRequest("ME_AVATAR_ASSET_KIND_INVALID", "avatar asset must be an image");
        }

        if (!"ready".equalsIgnoreCase(asset.statusCode())) {
            throw ApiBusinessException.conflict("ME_AVATAR_ASSET_NOT_READY", "avatar asset is not ready");
        }

        if (asset.createdBy() != null && !asset.createdBy().equals(currentUserId)) {
            throw ApiBusinessException.forbidden("ME_AVATAR_ASSET_FORBIDDEN", "avatar asset does not belong to current user");
        }

        return asset;
    }

    private String normalizeDisplayName(String value, String fallback) {
        String normalized = normalizeOptional(value, 64);
        if (normalized == null) {
            return fallback;
        }
        if (normalized.length() < 2) {
            throw ApiBusinessException.badRequest("ME_DISPLAY_NAME_INVALID", "display name is invalid");
        }
        return normalized;
    }

    private String normalizeOptional(String value, int maxLength) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        if (normalized.isEmpty()) {
            return null;
        }

        if (normalized.length() > maxLength) {
            throw ApiBusinessException.badRequest("ME_PROFILE_FIELD_TOO_LONG", "profile field is too long");
        }

        return normalized;
    }

    private record StoredAvatarState(
            UUID avatarAssetId,
            String avatarUrl
    ) {
    }

    private record AvatarAsset(
            UUID id,
            String assetKind,
            String assetRole,
            String storageProvider,
            String bucketName,
            String objectKey,
            String statusCode,
            UUID createdBy
    ) {
    }

    private record AvatarUpdate(
            UUID avatarAssetId,
            String avatarUrl,
            String resolvedAvatarUrl
    ) {
    }
}
