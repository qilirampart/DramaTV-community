import { resolveLocalPostgresConfig, runLocalPsqlQuery } from "./lib/local-postgres.mjs";

const SAMPLE_LIMIT = Number(process.env.DRAMATV_MEDIA_AUDIT_SAMPLE_LIMIT || "5");

function buildAuditSql(sampleLimit) {
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
            when object_key is null or btrim(object_key) = '' then 'blank'
            when object_key ~* '^(https?://|data:|blob:)' then 'absolute_url'
            when object_key like '/%' then 'root_path'
            else 'relative_key'
        end as key_style
    from media_assets
),
summary as (
    select json_build_object(
        'totalAssets', count(*),
        'normalizedStyleAssets', count(*) filter (where key_style = 'relative_key'),
        'legacyStyleAssets', count(*) filter (where key_style in ('absolute_url', 'root_path', 'blank'))
    ) as payload
    from classified
),
style_counts as (
    select coalesce(
        json_agg(
            json_build_object(
                'keyStyle', key_style,
                'count', total
            )
            order by
                case key_style
                    when 'relative_key' then 0
                    when 'root_path' then 1
                    when 'absolute_url' then 2
                    else 3
                end
        ),
        '[]'::json
    ) as payload
    from (
        select key_style, count(*) as total
        from classified
        group by key_style
    ) counts
),
provider_counts as (
    select coalesce(
        json_agg(
            json_build_object(
                'storageProvider', storage_provider,
                'bucketName', bucket_name,
                'keyStyle', key_style,
                'count', total
            )
            order by storage_provider, bucket_name, key_style
        ),
        '[]'::json
    ) as payload
    from (
        select
            storage_provider,
            bucket_name,
            key_style,
            count(*) as total
        from classified
        group by storage_provider, bucket_name, key_style
    ) counts
),
sample_rows as (
    select
        key_style,
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
                   partition by key_style
                   order by updated_at desc nulls last, created_at desc nulls last, id desc
               ) as rn
        from classified
    ) ranked
    where rn <= ${sampleLimit}
    group by key_style
)
select json_build_object(
    'summary', (select payload from summary),
    'styles', (select payload from style_counts),
    'providers', (select payload from provider_counts),
    'samples', coalesce((select json_object_agg(key_style, payload) from sample_rows), '{}'::json)
)::text;
`.trim();
}

function formatSummary(summary) {
  return [
    `Total assets: ${summary.totalAssets}`,
    `Normalized-style assets: ${summary.normalizedStyleAssets}`,
    `Legacy-style assets: ${summary.legacyStyleAssets}`,
  ].join("\n");
}

function formatStyleCounts(styles) {
  return styles
    .map((entry) => `- ${entry.keyStyle}: ${entry.count}`)
    .join("\n");
}

function formatProviderCounts(providers) {
  return providers
    .map(
      (entry) =>
        `- ${entry.storageProvider} / ${entry.bucketName} / ${entry.keyStyle}: ${entry.count}`,
    )
    .join("\n");
}

function formatSamples(samplesByStyle) {
  const styleOrder = ["relative_key", "root_path", "absolute_url", "blank"];
  const sections = [];

  for (const style of styleOrder) {
    const samples = samplesByStyle[style];
    if (!Array.isArray(samples) || samples.length === 0) {
      continue;
    }

    sections.push(`[${style}]`);
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
  const sql = buildAuditSql(Number.isFinite(SAMPLE_LIMIT) && SAMPLE_LIMIT > 0 ? SAMPLE_LIMIT : 5);
  const raw = await runLocalPsqlQuery(config, sql);
  const payload = JSON.parse(raw);

  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  const report = [
    "Media asset key audit",
    `Container: ${config.containerName}`,
    `Database: ${config.database}`,
    "",
    formatSummary(payload.summary),
    "",
    "By key style",
    formatStyleCounts(payload.styles),
    "",
    "By storage provider and bucket",
    formatProviderCounts(payload.providers),
    "",
    `Sample rows (up to ${Number.isFinite(SAMPLE_LIMIT) && SAMPLE_LIMIT > 0 ? SAMPLE_LIMIT : 5} per style)`,
    formatSamples(payload.samples),
  ].join("\n");

  process.stdout.write(`${report}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.stack ?? String(error)}\n`);
  process.exit(1);
});
