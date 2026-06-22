alter table admin_feed_slot_configs
    drop constraint if exists chk_admin_feed_slot_configs_page_key;

alter table admin_feed_slot_configs
    add constraint chk_admin_feed_slot_configs_page_key
        check (page_key in ('home', 'featured', 'landing', 'discussions'));
