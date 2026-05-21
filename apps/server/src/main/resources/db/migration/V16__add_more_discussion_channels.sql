insert into discussion_channels (slug, title, description_text, sort_order, status_code, created_at, updated_at)
values
    ('official-events', '官方活动', '承接社区活动征集、主题挑战、评选通知和运营公告。', 40, 'active', now(), now()),
    ('casual-lounge', '闲聊茶水间', '承接轻量交流、随手提问、灵感碎片和非正式讨论。', 50, 'active', now(), now())
on conflict (slug) do update
set title = excluded.title,
    description_text = excluded.description_text,
    sort_order = excluded.sort_order,
    status_code = excluded.status_code,
    updated_at = now();
