create table if not exists discussion_channels (
    id uuid primary key default gen_random_uuid(),
    slug varchar(64) not null,
    title varchar(64) not null,
    description_text text,
    sort_order integer not null default 0,
    status_code varchar(32) not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists uk_discussion_channels_slug on discussion_channels (slug);
create index if not exists idx_discussion_channels_status_sort on discussion_channels (status_code, sort_order asc);

create table if not exists discussion_threads (
    id uuid primary key default gen_random_uuid(),
    slug varchar(128) not null,
    channel_id uuid not null references discussion_channels(id),
    author_id uuid not null references users(id),
    title varchar(160) not null,
    content_text text not null,
    excerpt_text varchar(280),
    tag_names text[] not null default '{}',
    binding_target_type varchar(16),
    binding_target_id uuid,
    publish_status varchar(32) not null,
    reply_count integer not null default 0,
    published_at timestamptz,
    last_activity_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

create unique index if not exists uk_discussion_threads_slug on discussion_threads (slug);
create index if not exists idx_discussion_threads_channel_publish on discussion_threads (channel_id, publish_status, last_activity_at desc);
create index if not exists idx_discussion_threads_author_id on discussion_threads (author_id);
create index if not exists idx_discussion_threads_publish_status on discussion_threads (publish_status);
create index if not exists idx_discussion_threads_binding on discussion_threads (binding_target_type, binding_target_id);
create index if not exists idx_discussion_threads_tag_names_gin on discussion_threads using gin (tag_names);

insert into discussion_channels (slug, title, description_text, sort_order, status_code, created_at, updated_at)
values
    ('prompt-lab', '提示词拆解', '围绕镜头语言、风格控制、主体动作和失败案例拆解经验。', 10, 'active', now(), now()),
    ('video-production', '视频制作经验', '围绕一致性、时长、转场、稳定性和成片复盘展开讨论。', 20, 'active', now(), now()),
    ('canvas-workflows', '画布工作流经验', '围绕节点整理、复制说明、素材占位和 fork 经验持续沉淀。', 30, 'active', now(), now())
on conflict (slug) do update
set title = excluded.title,
    description_text = excluded.description_text,
    sort_order = excluded.sort_order,
    status_code = excluded.status_code,
    updated_at = now();
