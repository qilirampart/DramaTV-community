create index if not exists idx_prompt_entries_hot_public
    on prompt_entries (
        like_count desc,
        favorite_count desc,
        (coalesce(published_at, updated_at)) desc
    )
    where publish_status = 'published'
      and deleted_at is null;

create index if not exists idx_prompt_entries_modality_hot_public
    on prompt_entries (
        modality,
        like_count desc,
        favorite_count desc,
        (coalesce(published_at, updated_at)) desc
    )
    where publish_status = 'published'
      and deleted_at is null;

create index if not exists idx_discussion_threads_activity_public
    on discussion_threads (
        (coalesce(last_activity_at, published_at, updated_at)) desc
    )
    where publish_status = 'published'
      and deleted_at is null;

create index if not exists idx_discussion_threads_channel_activity_public
    on discussion_threads (
        channel_id,
        (coalesce(last_activity_at, published_at, updated_at)) desc
    )
    where publish_status = 'published'
      and deleted_at is null;
