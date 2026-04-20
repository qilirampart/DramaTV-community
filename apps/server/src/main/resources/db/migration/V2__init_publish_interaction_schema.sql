create table if not exists publish_drafts (
    id uuid primary key default gen_random_uuid(),
    draft_type varchar(16) not null,
    author_id uuid not null references users(id),
    target_id uuid,
    title_draft varchar(128),
    payload_json jsonb not null,
    current_step varchar(32) not null,
    status_code varchar(32) not null,
    autosave_version integer not null default 1,
    submitted_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_publish_drafts_author_id on publish_drafts (author_id);
create index if not exists idx_publish_drafts_target_id on publish_drafts (target_id);
create index if not exists idx_publish_drafts_draft_type_status_code on publish_drafts (draft_type, status_code);

create table if not exists audit_records (
    id uuid primary key default gen_random_uuid(),
    target_type varchar(16) not null,
    target_id uuid not null,
    audit_type varchar(32) not null,
    status_code varchar(32) not null,
    risk_level varchar(16),
    reason_code varchar(64),
    reason_text text,
    operator_type varchar(16) not null,
    operator_id uuid references users(id),
    detail_json jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_audit_records_target_type_target_id on audit_records (target_type, target_id);
create index if not exists idx_audit_records_status_code on audit_records (status_code);
create index if not exists idx_audit_records_created_at on audit_records (created_at desc);

create table if not exists report_tickets (
    id uuid primary key default gen_random_uuid(),
    reporter_id uuid not null references users(id),
    target_type varchar(16) not null,
    target_id uuid not null,
    reason_code varchar(64) not null,
    description_text text,
    status_code varchar(32) not null,
    assignee_id uuid references users(id),
    result_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_report_tickets_target_type_target_id on report_tickets (target_type, target_id);
create index if not exists idx_report_tickets_reporter_id on report_tickets (reporter_id);
create index if not exists idx_report_tickets_status_code on report_tickets (status_code);

create table if not exists comments (
    id uuid primary key default gen_random_uuid(),
    target_type varchar(16) not null,
    target_id uuid not null,
    author_id uuid not null references users(id),
    parent_id uuid references comments(id),
    root_id uuid references comments(id),
    content_text text not null,
    status_code varchar(32) not null,
    reply_count integer not null default 0,
    like_count integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

create index if not exists idx_comments_target_type_target_id on comments (target_type, target_id, created_at asc);
create index if not exists idx_comments_author_id on comments (author_id);
create index if not exists idx_comments_root_id on comments (root_id);
create index if not exists idx_comments_parent_id on comments (parent_id);
create index if not exists idx_comments_status_code on comments (status_code);

create table if not exists interaction_actions (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid not null references users(id),
    action_type varchar(16) not null,
    target_type varchar(16) not null,
    target_id uuid not null,
    status_code varchar(16) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists uk_interaction_actions_actor_action_target
    on interaction_actions (actor_id, action_type, target_type, target_id);
create index if not exists idx_interaction_actions_target_type_target_id on interaction_actions (target_type, target_id);
create index if not exists idx_interaction_actions_actor_id on interaction_actions (actor_id);

create table if not exists follow_relations (
    id uuid primary key default gen_random_uuid(),
    follower_id uuid not null references users(id),
    followee_id uuid not null references users(id),
    status_code varchar(16) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists uk_follow_relations_follower_followee
    on follow_relations (follower_id, followee_id);
create index if not exists idx_follow_relations_followee_id on follow_relations (followee_id);
