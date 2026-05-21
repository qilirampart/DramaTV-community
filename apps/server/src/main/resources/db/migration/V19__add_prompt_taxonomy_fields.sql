alter table if exists prompt_entries
    add column if not exists model_category varchar(64),
    add column if not exists content_category varchar(64),
    add column if not exists composition_category varchar(64);
