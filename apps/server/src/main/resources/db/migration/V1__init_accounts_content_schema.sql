create extension if not exists pgcrypto;

create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    email varchar(128),
    phone varchar(32),
    username varchar(64) not null,
    display_name varchar(64) not null,
    avatar_url text,
    bio varchar(512),
    role_code varchar(32) not null,
    status_code varchar(32) not null,
    last_login_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

create unique index if not exists uk_users_email on users (email) where email is not null;
create unique index if not exists uk_users_phone on users (phone) where phone is not null;
create unique index if not exists uk_users_username on users (username);
create index if not exists idx_users_role_code on users (role_code);
create index if not exists idx_users_status_code on users (status_code);

create table if not exists creator_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id),
    headline varchar(128),
    website_url text,
    location_text varchar(64),
    video_count integer not null default 0,
    workflow_count integer not null default 0,
    follower_count integer not null default 0,
    like_received_count integer not null default 0,
    featured_status varchar(32) not null default 'normal',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists uk_creator_profiles_user_id on creator_profiles (user_id);
create index if not exists idx_creator_profiles_featured_status on creator_profiles (featured_status);

create table if not exists media_assets (
    id uuid primary key default gen_random_uuid(),
    asset_kind varchar(32) not null,
    biz_type varchar(32),
    biz_id uuid,
    storage_provider varchar(32) not null,
    bucket_name varchar(128) not null,
    object_key varchar(512) not null,
    file_name varchar(256),
    mime_type varchar(128),
    size_bytes bigint,
    width integer,
    height integer,
    duration_ms integer,
    checksum varchar(128),
    status_code varchar(32) not null,
    is_public boolean not null default false,
    created_by uuid references users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_media_assets_biz_type_biz_id on media_assets (biz_type, biz_id);
create index if not exists idx_media_assets_asset_kind on media_assets (asset_kind);
create index if not exists idx_media_assets_status_code on media_assets (status_code);
create index if not exists idx_media_assets_checksum on media_assets (checksum);

create table if not exists workflows (
    id uuid primary key default gen_random_uuid(),
    author_id uuid not null references users(id),
    title varchar(128) not null,
    summary text,
    scenario_text varchar(256),
    tag_names text[] not null default '{}',
    visibility varchar(16) not null,
    publish_status varchar(32) not null,
    allow_copy boolean not null default false,
    allow_fork boolean not null default false,
    cover_asset_id uuid references media_assets(id),
    example_asset_id uuid references media_assets(id),
    video_bind_count integer not null default 0,
    comment_count integer not null default 0,
    like_count integer not null default 0,
    favorite_count integer not null default 0,
    published_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

create index if not exists idx_workflows_author_id on workflows (author_id);
create index if not exists idx_workflows_publish_status on workflows (publish_status);
create index if not exists idx_workflows_visibility on workflows (visibility);
create index if not exists idx_workflows_allow_copy on workflows (allow_copy);
create index if not exists idx_workflows_published_at on workflows (published_at desc);
create index if not exists idx_workflows_tag_names_gin on workflows using gin (tag_names);

create table if not exists videos (
    id uuid primary key default gen_random_uuid(),
    author_id uuid not null references users(id),
    workflow_id uuid references workflows(id),
    title varchar(128) not null,
    summary text,
    category_code varchar(32),
    tag_names text[] not null default '{}',
    visibility varchar(16) not null,
    publish_status varchar(32) not null,
    cover_asset_id uuid references media_assets(id),
    poster_asset_id uuid references media_assets(id),
    preview_asset_id uuid references media_assets(id),
    source_asset_id uuid references media_assets(id),
    duration_ms integer,
    comment_count integer not null default 0,
    like_count integer not null default 0,
    favorite_count integer not null default 0,
    play_count integer not null default 0,
    published_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

create index if not exists idx_videos_author_id on videos (author_id);
create index if not exists idx_videos_workflow_id on videos (workflow_id);
create index if not exists idx_videos_publish_status on videos (publish_status);
create index if not exists idx_videos_visibility on videos (visibility);
create index if not exists idx_videos_published_at on videos (published_at desc);
create index if not exists idx_videos_tag_names_gin on videos using gin (tag_names);

create table if not exists feed_items (
    id uuid primary key default gen_random_uuid(),
    channel_code varchar(32) not null,
    item_type varchar(16) not null,
    target_id uuid not null,
    rank_score numeric(12,4) not null default 0,
    status_code varchar(32) not null,
    published_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_feed_items_channel_code_rank_score on feed_items (channel_code, status_code, rank_score desc);
create index if not exists idx_feed_items_item_type_target_id on feed_items (item_type, target_id);
create index if not exists idx_feed_items_status_code on feed_items (status_code);
