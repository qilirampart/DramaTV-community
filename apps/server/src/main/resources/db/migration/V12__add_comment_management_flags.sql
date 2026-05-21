alter table videos
    add column if not exists comments_enabled boolean not null default true;

alter table workflows
    add column if not exists comments_enabled boolean not null default true;

alter table prompt_entries
    add column if not exists comments_enabled boolean not null default true;

alter table discussion_threads
    add column if not exists comments_enabled boolean not null default true;
