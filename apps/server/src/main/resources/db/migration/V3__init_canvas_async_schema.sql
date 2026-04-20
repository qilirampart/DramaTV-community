create table if not exists canvas_bindings (
    id uuid primary key default gen_random_uuid(),
    workflow_id uuid not null references workflows(id),
    binding_type varchar(16) not null,
    canvas_space_id varchar(128),
    canvas_workflow_id varchar(128),
    open_url text,
    copy_url text,
    binding_status varchar(32) not null,
    snapshot_json jsonb,
    last_synced_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists uk_canvas_bindings_workflow_id on canvas_bindings (workflow_id);
create index if not exists idx_canvas_bindings_binding_status on canvas_bindings (binding_status);

create table if not exists canvas_workflow_runtimes (
    id uuid primary key default gen_random_uuid(),
    source_workflow_id uuid references workflows(id),
    source_binding_id uuid references canvas_bindings(id),
    owner_id uuid not null references users(id),
    canvas_space_id varchar(128) not null,
    canvas_workflow_id varchar(128) not null,
    runtime_status varchar(32) not null,
    light_snapshot_json jsonb not null,
    full_snapshot_json jsonb,
    light_snapshot_version integer not null default 1,
    graph_checksum varchar(128),
    visible_node_count integer not null default 0,
    last_opened_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists uk_canvas_workflow_runtimes_canvas_workflow_id
    on canvas_workflow_runtimes (canvas_workflow_id);
create index if not exists idx_canvas_workflow_runtimes_owner_id_created_at
    on canvas_workflow_runtimes (owner_id, created_at desc);
create index if not exists idx_canvas_workflow_runtimes_source_workflow_id
    on canvas_workflow_runtimes (source_workflow_id);
create index if not exists idx_canvas_workflow_runtimes_runtime_status
    on canvas_workflow_runtimes (runtime_status);

create table if not exists canvas_runtime_assets (
    id uuid primary key default gen_random_uuid(),
    runtime_id uuid not null references canvas_workflow_runtimes(id),
    node_id varchar(64) not null,
    asset_role varchar(32) not null,
    media_asset_id uuid references media_assets(id),
    asset_url text,
    load_priority smallint not null default 5,
    status_code varchar(32) not null,
    width integer,
    height integer,
    duration_ms integer,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_canvas_runtime_assets_runtime_id_node_id
    on canvas_runtime_assets (runtime_id, node_id);
create index if not exists idx_canvas_runtime_assets_runtime_id_priority_status
    on canvas_runtime_assets (runtime_id, load_priority, status_code);
create index if not exists idx_canvas_runtime_assets_media_asset_id
    on canvas_runtime_assets (media_asset_id);

create table if not exists canvas_copy_tasks (
    id uuid primary key default gen_random_uuid(),
    source_workflow_id uuid not null references workflows(id),
    source_binding_id uuid references canvas_bindings(id),
    target_runtime_id uuid references canvas_workflow_runtimes(id),
    operator_id uuid not null references users(id),
    target_space_id varchar(128) not null,
    idempotency_key varchar(128),
    copy_mode varchar(32) not null,
    status_code varchar(32) not null,
    progress_percent smallint not null default 0,
    error_code varchar(64),
    error_message text,
    result_json jsonb,
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists uk_canvas_copy_tasks_idempotency_key
    on canvas_copy_tasks (idempotency_key) where idempotency_key is not null;
create index if not exists idx_canvas_copy_tasks_operator_id_created_at
    on canvas_copy_tasks (operator_id, created_at desc);
create index if not exists idx_canvas_copy_tasks_source_workflow_id_status_code
    on canvas_copy_tasks (source_workflow_id, status_code);
create index if not exists idx_canvas_copy_tasks_target_space_id_status_code
    on canvas_copy_tasks (target_space_id, status_code);

create table if not exists async_task_records (
    id uuid primary key default gen_random_uuid(),
    task_type varchar(32) not null,
    target_type varchar(16) not null,
    target_id uuid not null,
    queue_name varchar(64) not null,
    priority_level smallint not null default 5,
    status_code varchar(32) not null,
    payload_json jsonb not null,
    result_json jsonb,
    retry_count integer not null default 0,
    max_retry_count integer not null default 3,
    error_message text,
    scheduled_at timestamptz,
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_async_task_records_target_type_target_id
    on async_task_records (target_type, target_id);
create index if not exists idx_async_task_records_task_type_status_code
    on async_task_records (task_type, status_code);
create index if not exists idx_async_task_records_queue_name_status_code
    on async_task_records (queue_name, status_code);

create table if not exists task_callback_logs (
    id uuid primary key default gen_random_uuid(),
    task_id uuid references async_task_records(id),
    callback_type varchar(32) not null,
    source_name varchar(64) not null,
    request_id varchar(128),
    verify_status varchar(32) not null,
    process_status varchar(32) not null,
    raw_payload_json jsonb not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_task_callback_logs_task_id on task_callback_logs (task_id);
create index if not exists idx_task_callback_logs_callback_type on task_callback_logs (callback_type);
create index if not exists idx_task_callback_logs_created_at on task_callback_logs (created_at desc);
