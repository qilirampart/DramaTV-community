create table if not exists prompt_entries (
    id uuid primary key default gen_random_uuid(),
    author_id uuid not null references users(id),
    title varchar(160) not null,
    summary text,
    modality varchar(16) not null,
    prompt_text text not null,
    prompt_text_zh text,
    prompt_text_en text,
    prompt_text_raw text,
    model_name varchar(64),
    source_platform varchar(32),
    source_campaign varchar(64),
    source_item_id varchar(128),
    source_url text,
    visibility varchar(16) not null default 'public',
    publish_status varchar(32) not null default 'published',
    cover_asset_id uuid references media_assets(id),
    primary_example_asset_id uuid references media_assets(id),
    tag_names text[] not null default '{}',
    example_count integer not null default 0,
    comment_count integer not null default 0,
    like_count integer not null default 0,
    favorite_count integer not null default 0,
    published_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

create index if not exists idx_prompt_entries_author_id on prompt_entries (author_id);
create index if not exists idx_prompt_entries_modality on prompt_entries (modality);
create index if not exists idx_prompt_entries_publish_status on prompt_entries (publish_status);
create index if not exists idx_prompt_entries_visibility on prompt_entries (visibility);
create index if not exists idx_prompt_entries_published_at on prompt_entries (published_at desc);
create index if not exists idx_prompt_entries_source_platform_campaign
    on prompt_entries (source_platform, source_campaign);
create index if not exists idx_prompt_entries_source_item_id on prompt_entries (source_item_id);
create index if not exists idx_prompt_entries_tag_names_gin on prompt_entries using gin (tag_names);

create table if not exists prompt_example_links (
    id uuid primary key default gen_random_uuid(),
    prompt_id uuid not null references prompt_entries(id),
    media_asset_id uuid not null references media_assets(id),
    role_code varchar(32) not null default 'example',
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

create unique index if not exists uk_prompt_example_links_prompt_asset
    on prompt_example_links (prompt_id, media_asset_id);
create index if not exists idx_prompt_example_links_prompt_sort
    on prompt_example_links (prompt_id, sort_order asc, created_at asc);
