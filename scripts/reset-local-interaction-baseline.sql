begin;

-- Reset local interaction state to a clean verification baseline.
-- Keep published content records intact while clearing mutable social data.

update interaction_actions action
set status_code = 'inactive',
    updated_at = now()
where action.status_code <> 'inactive';

update follow_relations relation
set status_code = 'inactive',
    updated_at = now()
where relation.status_code <> 'inactive';

update comments comment
set status_code = 'inactive',
    reply_count = 0,
    like_count = 0,
    deleted_at = coalesce(comment.deleted_at, now()),
    updated_at = now()
where comment.status_code <> 'inactive'
   or comment.deleted_at is null
   or comment.reply_count <> 0
   or comment.like_count <> 0;

update videos video
set comment_count = (
        select count(*)
        from comments comment
        where comment.target_type = 'video'
          and comment.target_id = video.id
          and comment.status_code = 'active'
          and comment.deleted_at is null
    ),
    like_count = (
        select count(*)
        from interaction_actions action
        where action.action_type = 'like'
          and action.target_type = 'video'
          and action.target_id = video.id
          and action.status_code = 'active'
    ),
    favorite_count = (
        select count(*)
        from interaction_actions action
        where action.action_type = 'favorite'
          and action.target_type = 'video'
          and action.target_id = video.id
          and action.status_code = 'active'
    ),
    updated_at = now()
where video.deleted_at is null;

update workflows workflow
set comment_count = (
        select count(*)
        from comments comment
        where comment.target_type = 'workflow'
          and comment.target_id = workflow.id
          and comment.status_code = 'active'
          and comment.deleted_at is null
    ),
    like_count = (
        select count(*)
        from interaction_actions action
        where action.action_type = 'like'
          and action.target_type = 'workflow'
          and action.target_id = workflow.id
          and action.status_code = 'active'
    ),
    favorite_count = (
        select count(*)
        from interaction_actions action
        where action.action_type = 'favorite'
          and action.target_type = 'workflow'
          and action.target_id = workflow.id
          and action.status_code = 'active'
    ),
    updated_at = now()
where workflow.deleted_at is null;

update prompt_entries prompt
set comment_count = (
        select count(*)
        from comments comment
        where comment.target_type = 'prompt'
          and comment.target_id = prompt.id
          and comment.status_code = 'active'
          and comment.deleted_at is null
    ),
    like_count = (
        select count(*)
        from interaction_actions action
        where action.action_type = 'like'
          and action.target_type = 'prompt'
          and action.target_id = prompt.id
          and action.status_code = 'active'
    ),
    favorite_count = (
        select count(*)
        from interaction_actions action
        where action.action_type = 'favorite'
          and action.target_type = 'prompt'
          and action.target_id = prompt.id
          and action.status_code = 'active'
    ),
    updated_at = now()
where prompt.deleted_at is null;

update discussion_threads thread
set reply_count = (
        select count(*)
        from comments comment
        where comment.target_type = 'post'
          and comment.target_id = thread.id
          and comment.status_code = 'active'
          and comment.deleted_at is null
    ),
    like_count = (
        select count(*)
        from interaction_actions action
        where action.action_type = 'like'
          and action.target_type = 'post'
          and action.target_id = thread.id
          and action.status_code = 'active'
    ),
    favorite_count = (
        select count(*)
        from interaction_actions action
        where action.action_type = 'favorite'
          and action.target_type = 'post'
          and action.target_id = thread.id
          and action.status_code = 'active'
    ),
    last_activity_at = coalesce(
        (
            select max(comment.created_at)
            from comments comment
            where comment.target_type = 'post'
              and comment.target_id = thread.id
              and comment.status_code = 'active'
              and comment.deleted_at is null
        ),
        thread.published_at,
        thread.created_at
    ),
    updated_at = now()
where thread.deleted_at is null;

update creator_profiles profile
set follower_count = (
        select count(*)
        from follow_relations relation
        where relation.followee_id = profile.user_id
          and relation.status_code = 'active'
    ),
    like_received_count = (
        select count(*)
        from interaction_actions action
        where action.action_type = 'like'
          and action.status_code = 'active'
          and (
            exists(
                select 1
                from videos video
                where video.id = action.target_id
                  and action.target_type = 'video'
                  and video.author_id = profile.user_id
                  and video.deleted_at is null
            )
            or exists(
                select 1
                from workflows workflow
                where workflow.id = action.target_id
                  and action.target_type = 'workflow'
                  and workflow.author_id = profile.user_id
                  and workflow.deleted_at is null
            )
            or exists(
                select 1
                from prompt_entries prompt
                where prompt.id = action.target_id
                  and action.target_type = 'prompt'
                  and prompt.author_id = profile.user_id
                  and prompt.deleted_at is null
            )
            or exists(
                select 1
                from discussion_threads thread
                where thread.id = action.target_id
                  and action.target_type = 'post'
                  and thread.author_id = profile.user_id
                  and thread.deleted_at is null
            )
          )
    ),
    updated_at = now();

select
    'interaction-baseline-reset-complete' as status,
    (select count(*) from interaction_actions where status_code = 'active') as active_interactions,
    (select count(*) from follow_relations where status_code = 'active') as active_follows,
    (select count(*) from comments where status_code = 'active' and deleted_at is null) as active_comments,
    (select count(*) from videos where comment_count <> 0 or like_count <> 0 or favorite_count <> 0) as videos_with_nonzero_counters,
    (select count(*) from workflows where comment_count <> 0 or like_count <> 0 or favorite_count <> 0) as workflows_with_nonzero_counters,
    (select count(*) from prompt_entries where comment_count <> 0 or like_count <> 0 or favorite_count <> 0) as prompts_with_nonzero_counters,
    (select count(*) from discussion_threads where reply_count <> 0 or like_count <> 0 or favorite_count <> 0) as posts_with_nonzero_counters,
    (select count(*) from creator_profiles where follower_count <> 0 or like_received_count <> 0) as creator_profiles_with_nonzero_social_counters;

commit;
