alter table users
    add column if not exists avatar_asset_id uuid references media_assets(id);

create index if not exists idx_users_avatar_asset_id on users (avatar_asset_id);
