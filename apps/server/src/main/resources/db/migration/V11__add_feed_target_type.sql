alter table feed_items
    add column if not exists target_type varchar(16);

update feed_items
set target_type = case
    when target_type is not null then target_type
    when item_type is not null and item_type <> '' then item_type
    when content_kind = 'prompt' then 'prompt'
    when content_kind = 'post' then 'post'
    else 'video'
end
where target_type is null;

alter table feed_items
    alter column target_type set not null;

drop index if exists uq_feed_items_channel_item_target;

create unique index if not exists uq_feed_items_channel_target_target
    on feed_items (channel_code, target_type, target_id);

create index if not exists idx_feed_items_target_type_target_id
    on feed_items (target_type, target_id);

create index if not exists idx_feed_items_channel_content_target_rank
    on feed_items (channel_code, content_kind, target_type, status_code, rank_score desc);
