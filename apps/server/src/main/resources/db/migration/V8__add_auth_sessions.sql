alter table users
    add column if not exists password_hash varchar(255);

alter table users
    add column if not exists identity_provider varchar(32) not null default 'local';

alter table users
    add column if not exists external_subject varchar(128);

create unique index if not exists uk_users_identity_provider_subject
    on users (identity_provider, external_subject)
    where external_subject is not null;

create table if not exists auth_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id),
    token_hash varchar(128) not null,
    status_code varchar(32) not null,
    issued_at timestamptz not null default now(),
    expires_at timestamptz not null,
    revoked_at timestamptz,
    last_seen_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists uk_auth_sessions_token_hash on auth_sessions (token_hash);
create index if not exists idx_auth_sessions_user_id_status on auth_sessions (user_id, status_code);
create index if not exists idx_auth_sessions_expires_at on auth_sessions (expires_at);
