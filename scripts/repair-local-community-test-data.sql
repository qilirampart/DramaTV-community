begin;

-- Re-link the good browser smoke video to the good browser smoke workflow.
update publish_drafts
set payload_json = jsonb_set(
        payload_json,
        '{workflowId}',
        to_jsonb('dd715ee9-189b-4450-a4ca-fdf71fb8aafb'::text),
        true
    ),
    updated_at = now()
where id = 'bc75b5f5-a1c6-42fa-ae3b-f72ce2974e80'::uuid;

update videos
set workflow_id = 'dd715ee9-189b-4450-a4ca-fdf71fb8aafb'::uuid,
    updated_at = now()
where id = '3d82413b-1036-4c1b-93dd-3a102e0b4683'::uuid;

-- Hide broken review-gate fixtures from the public community surface.
update publish_drafts
set status_code = 'rejected',
    updated_at = now()
where id in (
    '988c6f10-e342-4db5-8737-7679e3367771'::uuid,
    '855e2767-badc-480b-b069-055ef409113d'::uuid,
    'aae0b43e-610c-447f-9cf0-ccd034ccb03f'::uuid,
    'd8a57b4b-be29-4b7a-ad62-1521d94e5bab'::uuid
);

update videos
set publish_status = 'rejected',
    published_at = null,
    updated_at = now()
where id = '50312c65-ec55-4503-9295-9763be379285'::uuid;

update workflows
set publish_status = 'rejected',
    published_at = null,
    updated_at = now()
where id in (
    'ceb313a8-222e-41bc-b749-0f6a78cbc7fe'::uuid,
    '1bf231c8-a929-4191-b071-9dfbacb20fbd'::uuid,
    'b3f4cff8-2373-47df-883d-3a9fc74a86e4'::uuid
);

update feed_items
set status_code = 'inactive',
    updated_at = now()
where target_id in (
    '50312c65-ec55-4503-9295-9763be379285'::uuid,
    'ceb313a8-222e-41bc-b749-0f6a78cbc7fe'::uuid
);

-- Recompute creator and workflow counters after the cleanup.
update workflows workflow
set video_bind_count = (
        select count(*)
        from videos video
        where video.workflow_id = workflow.id
          and video.publish_status = 'published'
          and video.deleted_at is null
    ),
    updated_at = now();

update creator_profiles profile
set video_count = (
        select count(*)
        from videos video
        where video.author_id = profile.user_id
          and video.publish_status = 'published'
          and video.deleted_at is null
    ),
    workflow_count = (
        select count(*)
        from workflows workflow
        where workflow.author_id = profile.user_id
          and workflow.publish_status = 'published'
          and workflow.deleted_at is null
    ),
    updated_at = now();

commit;
