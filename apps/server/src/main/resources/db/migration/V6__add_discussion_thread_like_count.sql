alter table discussion_threads
    add column if not exists like_count integer not null default 0;

update discussion_threads thread
set like_count = (
        select count(*)
        from interaction_actions action
        where action.action_type = 'like'
          and action.target_type = 'post'
          and action.target_id = thread.id
          and action.status_code = 'active'
    ),
    updated_at = now()
where thread.deleted_at is null;
