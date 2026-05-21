import { resolveLocalPostgresConfig, runLocalPsqlQuery } from "./lib/local-postgres.mjs";

const SAMPLE_LIMIT = Number(process.env.DRAMATV_MEDIA_NORMALIZE_SAMPLE_LIMIT || "5");

function buildPreviewSql(sampleLimit) {
  return `
with classified as (
    select
        id::text as id,
        asset_kind,
        storage_provider,
        bucket_name,
        object_key,
        file_name,
        status_code,
        created_at,
        updated_at,
        case
            when storage_provider = 'local-public'
             and bucket_name = 'apps-web-public'
             and object_key like '/%' then 'local_public_root_path'
            when storage_provider = 'local_fs'
             and bucket_name = 'dramatv-local-media'
             and object_key ~* '^https?://[^/]+/media/' then 'local_fs_absolute_url'
            else null
        end as normalization_rule,
        case
            when object_key is null or btrim(object_key) = '' then 'blank'
            when object_key ~* '^(https?://|data:|blob:)' then 'absolute_url'
            when object_key like '/%' then 'root_path'
            else 'relative_key'
        end as key_style
    from media_assets
),
summary as (
    select json_build_object(
        'localPublicRootPathCandidates', count(*) filter (where normalization_rule = 'local_public_root_path'),
        'localFsAbsoluteUrlCandidates', count(*) filter (where normalization_rule = 'local_fs_absolute_url'),
        'unmatchedLegacyRows', count(*) filter (
            where key_style in ('absolute_url', 'root_path', 'blank')
              and normalization_rule is null
        )
    ) as payload
    from classified
),
sample_rows as (
    select
        coalesce(normalization_rule, 'unmatched_legacy') as sample_group,
        coalesce(
            json_agg(
                json_build_object(
                    'id', id,
                    'assetKind', asset_kind,
                    'storageProvider', storage_provider,
                    'bucketName', bucket_name,
                    'fileName', file_name,
                    'statusCode', status_code,
                    'objectKey', object_key,
                    'updatedAt', updated_at
                )
                order by updated_at desc nulls last, created_at desc nulls last, id desc
            ),
            '[]'::json
        ) as payload
    from (
        select *,
               row_number() over (
                   partition by coalesce(normalization_rule, 'unmatched_legacy')
                   order by updated_at desc nulls last, created_at desc nulls last, id desc
               ) as rn
        from classified
        where normalization_rule is not null
           or key_style in ('absolute_url', 'root_path', 'blank')
    ) ranked
    where rn <= ${sampleLimit}
    group by coalesce(normalization_rule, 'unmatched_legacy')
)
select json_build_object(
    'summary', (select payload from summary),
    'samples', coalesce((select json_object_agg(sample_group, payload) from sample_rows), '{}'::json)
)::text;
`.trim();
}

function buildApplySql() {
  return `
begin;

with updated_local_public as (
    update media_assets
    set object_key = regexp_replace(object_key, '^/+', '')
    where storage_provider = 'local-public'
      and bucket_name = 'apps-web-public'
      and object_key like '/%'
    returning id
),
updated_local_fs as (
    update media_assets
    set object_key = regexp_replace(object_key, '^https?://[^/]+/media/', '')
    where storage_provider = 'local_fs'
      and bucket_name = 'dramatv-local-media'
      and object_key ~* '^https?://[^/]+/media/'
    returning id
)
select json_build_object(
    'updatedLocalPublicRootPathCount', (select count(*) from updated_local_public),
    'updatedLocalFsAbsoluteUrlCount', (select count(*) from updated_local_fs)
)::text;

commit;
`.trim();
}

function formatSummary(summary) {
  return [
    `local-public root-path candidates: ${summary.localPublicRootPathCandidates}`,
    `local_fs absolute-url candidates: ${summary.localFsAbsoluteUrlCandidates}`,
    `unmatched legacy rows: ${summary.unmatchedLegacyRows}`,
  ].join("\n");
}

function formatSamples(samplesByGroup) {
  const groupOrder = [
    "local_public_root_path",
    "local_fs_absolute_url",
    "unmatched_legacy",
  ];
  const sections = [];

  for (const group of groupOrder) {
    const samples = samplesByGroup[group];
    if (!Array.isArray(samples) || samples.length === 0) {
      continue;
    }

    sections.push(`[${group}]`);
    for (const sample of samples) {
      sections.push(
        `- ${sample.id} | ${sample.assetKind} | ${sample.storageProvider}/${sample.bucketName} | ${sample.objectKey}`,
      );
    }
  }

  return sections.join("\n");
}

async function main() {
  const config = resolveLocalPostgresConfig();
  const effectiveSampleLimit = Number.isFinite(SAMPLE_LIMIT) && SAMPLE_LIMIT > 0 ? SAMPLE_LIMIT : 5;
  const applyMode = process.argv.includes("--apply");

  if (!applyMode) {
    const previewRaw = await runLocalPsqlQuery(config, buildPreviewSql(effectiveSampleLimit));
    const preview = JSON.parse(previewRaw);

    if (process.argv.includes("--json")) {
      process.stdout.write(`${JSON.stringify(preview, null, 2)}\n`);
      return;
    }

    const report = [
      "Media asset key normalization preview",
      `Container: ${config.containerName}`,
      `Database: ${config.database}`,
      "",
      formatSummary(preview.summary),
      "",
      `Sample rows (up to ${effectiveSampleLimit} per group)`,
      formatSamples(preview.samples),
      "",
      "Run with --apply to execute the normalization.",
    ].join("\n");

    process.stdout.write(`${report}\n`);
    return;
  }

  const appliedRaw = await runLocalPsqlQuery(config, buildApplySql());
  const applied = JSON.parse(appliedRaw);

  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(applied, null, 2)}\n`);
    return;
  }

  const report = [
    "Media asset key normalization applied",
    `Container: ${config.containerName}`,
    `Database: ${config.database}`,
    "",
    `Updated local-public root-path rows: ${applied.updatedLocalPublicRootPathCount}`,
    `Updated local_fs absolute-url rows: ${applied.updatedLocalFsAbsoluteUrlCount}`,
  ].join("\n");

  process.stdout.write(`${report}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.stack ?? String(error)}\n`);
  process.exit(1);
});
