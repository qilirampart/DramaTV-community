create unique index if not exists uq_feed_items_channel_item_target
    on feed_items (channel_code, item_type, target_id);
