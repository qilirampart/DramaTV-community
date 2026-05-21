alter table feed_items
    add column if not exists content_kind varchar(32);

update feed_items
set content_kind = case
    when item_type = 'prompt' then 'prompt'
    when item_type = 'post' then 'post'
    else 'workflow_work'
end
where content_kind is null;

alter table feed_items
    alter column content_kind set default 'workflow_work';

alter table feed_items
    alter column content_kind set not null;

create index if not exists idx_feed_items_channel_content_kind_rank
    on feed_items (channel_code, content_kind, status_code, rank_score desc);

create index if not exists idx_feed_items_content_kind_target_id
    on feed_items (content_kind, target_id);
