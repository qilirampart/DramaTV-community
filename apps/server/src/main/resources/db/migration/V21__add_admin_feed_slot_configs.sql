create table if not exists admin_feed_slot_configs (
    page_key varchar(32) not null,
    slot_key varchar(64) not null,
    status_code varchar(32) not null default 'draft',
    items_json jsonb not null default '[]'::jsonb,
    updated_by uuid references users(id),
    published_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (page_key, slot_key),
    constraint chk_admin_feed_slot_configs_page_key
        check (page_key in ('home', 'featured', 'discussions')),
    constraint chk_admin_feed_slot_configs_status_code
        check (status_code in ('draft', 'published'))
);

create index if not exists idx_admin_feed_slot_configs_updated_by
    on admin_feed_slot_configs(updated_by);

create index if not exists idx_admin_feed_slot_configs_page_status
    on admin_feed_slot_configs(page_key, status_code, updated_at desc);
