begin;

-- Restore the local browser-smoke data back to the intended baseline.
-- This preserves the fixed baseline discussion fixtures and clears any
-- extra browser-regression interactions created by the demo viewer.

create temporary table tmp_reset_comment_ids (
    id uuid primary key
) on commit drop;

with recursive comment_tree as (
    select comment.id
    from comments comment
    where comment.author_id = '11111111-1111-1111-1111-111111111111'::uuid
      and comment.status_code = 'active'
      and comment.deleted_at is null
      and (
        (
            comment.target_type = 'video'
            and comment.target_id = '3d82413b-1036-4c1b-93dd-3a102e0b4683'::uuid
            and comment.id not in (
                '41ec18fd-e074-4138-a287-9e48aa754949'::uuid,
                '115ab7c9-88b4-4cd6-b881-f9929d0df36d'::uuid
            )
        )
        or (
            comment.target_type = 'workflow'
            and comment.target_id = 'dd715ee9-189b-4450-a4ca-fdf71fb8aafb'::uuid
            and comment.id not in (
                'a69124df-7fdc-4c09-81ea-e439dc931525'::uuid
            )
        )
      )
    union
    select child.id
    from comments child
    join comment_tree parent on child.parent_id = parent.id
    where child.status_code = 'active'
      and child.deleted_at is null
)
insert into tmp_reset_comment_ids (id)
select id
from comment_tree
on conflict (id) do nothing;

-- Reset all demo-viewer likes/favorites on the fixed smoke video/workflow
-- and on any comments that belong to those smoke targets.
update interaction_actions action
set status_code = 'inactive',
    updated_at = now()
where action.actor_id = '11111111-1111-1111-1111-111111111111'::uuid
  and (
    (
        action.action_type in ('like', 'favorite')
        and action.target_type = 'video'
        and action.target_id = '3d82413b-1036-4c1b-93dd-3a102e0b4683'::uuid
    )
    or (
        action.action_type in ('like', 'favorite')
        and action.target_type = 'workflow'
        and action.target_id = 'dd715ee9-189b-4450-a4ca-fdf71fb8aafb'::uuid
    )
    or (
        action.action_type = 'like'
        and action.target_type = 'comment'
        and action.target_id in (
            select comment.id
            from comments comment
            where (
                comment.target_type = 'video'
                and comment.target_id = '3d82413b-1036-4c1b-93dd-3a102e0b4683'::uuid
            ) or (
                comment.target_type = 'workflow'
                and comment.target_id = 'dd715ee9-189b-4450-a4ca-fdf71fb8aafb'::uuid
            )
        )
    )
  );

update follow_relations relation
set status_code = 'inactive',
    updated_at = now()
where relation.follower_id = '11111111-1111-1111-1111-111111111111'::uuid
  and relation.followee_id = '33333333-3333-3333-3333-333333333333'::uuid;

-- Hide any extra browser-regression comments while preserving the fixed
-- baseline fixtures for demo and review.
update comments comment
set status_code = 'inactive',
    deleted_at = coalesce(comment.deleted_at, now()),
    updated_at = now()
where comment.id in (select id from tmp_reset_comment_ids);

-- Recompute comment-level counters for the fixed smoke targets.
update comments comment
set reply_count = (
        select count(*)
        from comments child
        where child.parent_id = comment.id
          and child.status_code = 'active'
          and child.deleted_at is null
    ),
    like_count = (
        select count(*)
        from interaction_actions action
        where action.action_type = 'like'
          and action.target_type = 'comment'
          and action.target_id = comment.id
          and action.status_code = 'active'
    ),
    updated_at = now()
where (
    comment.target_type = 'video'
    and comment.target_id = '3d82413b-1036-4c1b-93dd-3a102e0b4683'::uuid
) or (
    comment.target_type = 'workflow'
    and comment.target_id = 'dd715ee9-189b-4450-a4ca-fdf71fb8aafb'::uuid
);

-- Recompute content counters after interaction reset.
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
where video.id = '3d82413b-1036-4c1b-93dd-3a102e0b4683'::uuid;

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
where workflow.id = 'dd715ee9-189b-4450-a4ca-fdf71fb8aafb'::uuid;

update creator_profiles profile
set follower_count = (
        select count(*)
        from follow_relations relation
        where relation.followee_id = profile.user_id
          and relation.status_code = 'active'
    ),
    updated_at = now()
where profile.user_id = '33333333-3333-3333-3333-333333333333'::uuid;

select
    'browser-smoke-reset-complete' as status,
    (select comment_count from videos where id = '3d82413b-1036-4c1b-93dd-3a102e0b4683'::uuid) as video_comment_count,
    (select like_count from videos where id = '3d82413b-1036-4c1b-93dd-3a102e0b4683'::uuid) as video_like_count,
    (select favorite_count from videos where id = '3d82413b-1036-4c1b-93dd-3a102e0b4683'::uuid) as video_favorite_count,
    (select comment_count from workflows where id = 'dd715ee9-189b-4450-a4ca-fdf71fb8aafb'::uuid) as workflow_comment_count,
    (select like_count from workflows where id = 'dd715ee9-189b-4450-a4ca-fdf71fb8aafb'::uuid) as workflow_like_count,
    (select favorite_count from workflows where id = 'dd715ee9-189b-4450-a4ca-fdf71fb8aafb'::uuid) as workflow_favorite_count,
    (select follower_count from creator_profiles where user_id = '33333333-3333-3333-3333-333333333333'::uuid) as smoke_follow_author_follower_count,
    (select count(*) from tmp_reset_comment_ids) as hidden_comment_count;

commit;
