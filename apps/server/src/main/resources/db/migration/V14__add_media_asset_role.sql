alter table media_assets
    add column if not exists asset_role varchar(32);

update media_assets
set asset_role = case
    when asset_role is not null and btrim(asset_role) <> '' then asset_role
    when asset_kind in ('cover', 'poster', 'preview', 'source', 'avatar', 'attachment') then asset_kind
    when lower(coalesce(object_key, '')) like '%/avatar/%' then 'avatar'
    when lower(coalesce(object_key, '')) like '%/cover/%' then 'cover'
    when lower(coalesce(object_key, '')) like '%/poster/%' then 'poster'
    when lower(coalesce(object_key, '')) like '%/preview/%' then 'preview'
    when lower(coalesce(object_key, '')) like '%/attachment/%' then 'attachment'
    else 'source'
end
where asset_role is null or btrim(asset_role) = '';

alter table media_assets
    alter column asset_role set default 'source';

update media_assets
set asset_role = 'source'
where asset_role is null or btrim(asset_role) = '';

alter table media_assets
    alter column asset_role set not null;

create index if not exists idx_media_assets_asset_role on media_assets (asset_role);
