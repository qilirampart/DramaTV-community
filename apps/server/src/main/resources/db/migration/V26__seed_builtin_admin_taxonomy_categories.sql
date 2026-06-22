insert into admin_taxonomy_configs (
    section_key,
    category_value,
    status_code,
    sort_order,
    exposure_flags,
    note_text
)
values
    ('image-model', 'gpt-image-2', 'enabled', 1000, '{}'::text[], null),
    ('image-model', 'nanobanana', 'enabled', 1001, '{}'::text[], null),
    ('image-model', 'midjourney', 'enabled', 1002, '{}'::text[], null),
    ('image-model', 'other-image-model', 'enabled', 1003, '{}'::text[], null),
    ('video-model', 'seedance', 'enabled', 1000, '{}'::text[], null),
    ('video-model', 'kling', 'enabled', 1001, '{}'::text[], null),
    ('video-model', 'happyhorse', 'enabled', 1002, '{}'::text[], null),
    ('video-model', 'wan', 'enabled', 1003, '{}'::text[], null),
    ('video-model', 'other-video-model', 'enabled', 1004, '{}'::text[], null),
    ('image-content-category', 'real-person', 'enabled', 1000, '{}'::text[], null),
    ('image-content-category', 'animation', 'enabled', 1001, '{}'::text[], null),
    ('image-content-category', 'scene', 'enabled', 1002, '{}'::text[], null),
    ('image-content-category', 'prop', 'enabled', 1003, '{}'::text[], null),
    ('image-content-category', 'other', 'enabled', 1004, '{}'::text[], null),
    ('video-content-category', 'real-person', 'enabled', 1000, '{}'::text[], null),
    ('video-content-category', 'animation', 'enabled', 1001, '{}'::text[], null),
    ('video-content-category', 'other', 'enabled', 1002, '{}'::text[], null),
    ('video-model-usage', 'single-model', 'enabled', 1000, '{}'::text[], null),
    ('video-model-usage', 'multi-model', 'enabled', 1001, '{}'::text[], null)
on conflict (section_key, category_value) do nothing;
