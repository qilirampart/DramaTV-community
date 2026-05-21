create table if not exists admin_operation_logs (
    id uuid primary key,
    operator_id uuid references users (id) on delete set null,
    operator_username varchar(120) not null,
    operator_display_name varchar(120) not null,
    operator_role_code varchar(32) not null,
    module_code varchar(64) not null,
    module_label varchar(64) not null,
    action_code varchar(64) not null,
    action_label varchar(64) not null,
    target_type varchar(64),
    target_id varchar(128),
    target_title varchar(255),
    risk_level varchar(16) not null default 'normal',
    result_status varchar(16) not null,
    note_text text,
    request_path varchar(255) not null,
    request_method varchar(16) not null,
    response_status integer not null,
    request_id varchar(128),
    trace_id varchar(128),
    metadata_text text,
    created_at timestamptz not null default now()
);

create index if not exists idx_admin_operation_logs_created_at
    on admin_operation_logs (created_at desc, id desc);

create index if not exists idx_admin_operation_logs_operator
    on admin_operation_logs (operator_id, created_at desc);

create index if not exists idx_admin_operation_logs_module
    on admin_operation_logs (module_code, created_at desc);

create index if not exists idx_admin_operation_logs_result
    on admin_operation_logs (result_status, created_at desc);
