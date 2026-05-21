alter table comments
    add column if not exists reply_to_comment_id uuid references comments(id);

create index if not exists idx_comments_reply_to_comment_id
    on comments (reply_to_comment_id);
