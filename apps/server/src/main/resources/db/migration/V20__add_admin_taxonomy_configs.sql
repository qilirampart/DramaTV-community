create table if not exists admin_taxonomy_configs (
    section_key varchar(64) not null,
    category_value varchar(128) not null,
    status_code varchar(32) not null default 'enabled',
    sort_order integer not null default 1000,
    exposure_flags text[] not null default '{}',
    note_text text,
    updated_by uuid references users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (section_key, category_value),
    constraint chk_admin_taxonomy_configs_section_key
        check (section_key in ('image-model', 'video-model', 'content-category', 'composition-category')),
    constraint chk_admin_taxonomy_configs_status_code
        check (status_code in ('enabled', 'disabled'))
);

create index if not exists idx_admin_taxonomy_configs_updated_by
    on admin_taxonomy_configs(updated_by);
