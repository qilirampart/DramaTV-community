drop index if exists uk_canvas_copy_tasks_idempotency_key;

create unique index if not exists uk_canvas_copy_tasks_operator_workflow_idempotency_key
    on canvas_copy_tasks (operator_id, source_workflow_id, idempotency_key)
    where idempotency_key is not null;
