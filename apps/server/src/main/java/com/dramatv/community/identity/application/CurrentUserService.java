package com.dramatv.community.identity.application;

import com.dramatv.community.shared.error.ApiBusinessException;
import com.dramatv.community.shared.media.MediaAssetUrlResolver;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final JdbcTemplate jdbcTemplate;
    private final MediaAssetUrlResolver mediaAssetUrlResolver;

    public CurrentUserService(
            JdbcTemplate jdbcTemplate,
            MediaAssetUrlResolver mediaAssetUrlResolver
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.mediaAssetUrlResolver = mediaAssetUrlResolver;
    }

    public Optional<CurrentUser> findByAccessToken(String accessToken) {
        String tokenHash = AuthTokenSupport.sha256(accessToken);

        return jdbcTemplate.query("""
                select
                    user_account.id,
                    user_account.username,
                    user_account.display_name,
                    coalesce(avatar_asset.object_key, user_account.avatar_url) as avatar_url,
                    avatar_asset.storage_provider as avatar_storage_provider,
                    avatar_asset.bucket_name as avatar_bucket_name,
                    user_account.bio,
                    user_account.role_code,
                    user_account.identity_provider,
                    user_account.external_subject,
                    creator_profile.headline
                from auth_sessions session
                join users user_account on user_account.id = session.user_id
                left join creator_profiles creator_profile on creator_profile.user_id = user_account.id
                left join media_assets avatar_asset on avatar_asset.id = user_account.avatar_asset_id
                where session.token_hash = ?
                  and session.status_code = 'active'
                  and session.expires_at > now()
                  and session.revoked_at is null
                  and user_account.status_code = 'active'
                  and user_account.deleted_at is null
                """,
                resultSet -> {
                    if (!resultSet.next()) {
                        return Optional.empty();
                    }

                    jdbcTemplate.update(
                            """
                                    update auth_sessions
                                    set last_seen_at = now(),
                                        expires_at = greatest(expires_at, now()) + interval '7200 seconds',
                                        updated_at = now()
                                    where token_hash = ?
                                    """,
                            tokenHash
                    );

                    return Optional.of(new CurrentUser(
                            (UUID) resultSet.getObject("id"),
                            resultSet.getString("username"),
                            resultSet.getString("display_name"),
                            mediaAssetUrlResolver.resolve(
                                    resultSet.getString("avatar_storage_provider"),
                                    resultSet.getString("avatar_bucket_name"),
                                    resultSet.getString("avatar_url")
                            ),
                            resultSet.getString("bio"),
                            resultSet.getString("headline"),
                            resultSet.getString("role_code"),
                            resultSet.getString("identity_provider"),
                            resultSet.getString("external_subject")
                    ));
                },
                tokenHash
        );
    }

    public CurrentUser requireCurrentUser() {
        CurrentUser currentUser = CurrentUserContext.currentOrNull();
        if (currentUser != null) {
            return currentUser;
        }
        throw new ApiBusinessException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "login is required");
    }
}
