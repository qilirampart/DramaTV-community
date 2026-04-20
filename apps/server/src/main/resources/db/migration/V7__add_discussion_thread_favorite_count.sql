alter table discussion_threads
    add column if not exists favorite_count integer not null default 0;

update discussion_threads thread
set favorite_count = (
        select count(*)
        from interaction_actions action
        where action.action_type = 'favorite'
          and action.target_type = 'post'
          and action.target_id = thread.id
          and action.status_code = 'active'
    ),
    updated_at = now()
where thread.deleted_at is null;
