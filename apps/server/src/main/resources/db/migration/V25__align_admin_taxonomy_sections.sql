insert into admin_taxonomy_configs (
    section_key,
    category_value,
    status_code,
    sort_order,
    exposure_flags,
    note_text,
    updated_by,
    created_at,
    updated_at
)
select
    'image-content-category',
    category_value,
    status_code,
    sort_order,
    exposure_flags,
    note_text,
    updated_by,
    created_at,
    updated_at
from admin_taxonomy_configs
where section_key = 'content-category'
on conflict (section_key, category_value) do nothing;

insert into admin_taxonomy_configs (
    section_key,
    category_value,
    status_code,
    sort_order,
    exposure_flags,
    note_text,
    updated_by,
    created_at,
    updated_at
)
select
    'video-content-category',
    category_value,
    status_code,
    sort_order,
    exposure_flags,
    note_text,
    updated_by,
    created_at,
    updated_at
from admin_taxonomy_configs
where section_key = 'content-category'
on conflict (section_key, category_value) do nothing;

insert into admin_taxonomy_configs (
    section_key,
    category_value,
    status_code,
    sort_order,
    exposure_flags,
    note_text,
    updated_by,
    created_at,
    updated_at
)
select
    'video-model-usage',
    category_value,
    status_code,
    sort_order,
    exposure_flags,
    note_text,
    updated_by,
    created_at,
    updated_at
from admin_taxonomy_configs
where section_key = 'composition-category'
on conflict (section_key, category_value) do nothing;

delete from admin_taxonomy_configs
where section_key in ('content-category', 'composition-category');

alter table admin_taxonomy_configs
    drop constraint if exists chk_admin_taxonomy_configs_section_key;

alter table admin_taxonomy_configs
    add constraint chk_admin_taxonomy_configs_section_key
        check (
            section_key in (
                'image-model',
                'video-model',
                'image-content-category',
                'video-content-category',
                'video-model-usage'
            )
        );
