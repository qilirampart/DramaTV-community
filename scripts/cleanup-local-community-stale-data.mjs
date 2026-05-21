import fs from "node:fs";
import path from "node:path";

import { projectRoot, resolveLocalPostgresConfig, runLocalPsqlQuery } from "./lib/local-postgres.mjs";

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      parsed[key] = next;
      index += 1;
      continue;
    }

    parsed[key] = "true";
  }

  return parsed;
}

function readEnvFileValue(filePath, key) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(new RegExp(`^\\s*${key}=(.*)$`));
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

function resolveLocalMediaRoot() {
  const serverEnvFile = path.join(projectRoot, "apps", "server", ".env");
  const serverEnvExampleFile = path.join(projectRoot, "apps", "server", ".env.example");
  const configured =
    process.env.DRAMATV_MEDIA_LOCAL_DIR ??
    readEnvFileValue(serverEnvFile, "DRAMATV_MEDIA_LOCAL_DIR") ??
    readEnvFileValue(serverEnvExampleFile, "DRAMATV_MEDIA_LOCAL_DIR") ??
    "tmp/media";

  return path.resolve(projectRoot, configured);
}

function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlUuidList(values) {
  return values.map((value) => sqlLiteral(value)).join(", ");
}

async function queryLines(config, sql) {
  const output = await runLocalPsqlQuery(config, `\\pset pager off\n${sql}`);
  if (!output) {
    return [];
  }
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function queryJsonRows(config, sql) {
  const lines = await queryLines(config, sql);
  return lines.map((line) => JSON.parse(line));
}

function collectFilesRecursively(rootDir) {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const files = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function toObjectKey(mediaRoot, filePath) {
  return path.relative(mediaRoot, filePath).split(path.sep).join("/");
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function removeEmptyDirectories(rootDir, boundaryDir = rootDir) {
  if (!fs.existsSync(rootDir)) {
    return;
  }

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      removeEmptyDirectories(fullPath, boundaryDir);
    }
  }

  if (path.resolve(rootDir) === path.resolve(boundaryDir)) {
    return;
  }

  if (fs.readdirSync(rootDir).length === 0) {
    fs.rmdirSync(rootDir);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apply = args.apply === "true";
  const outputPath = args.output ?? "";
  const pendingUploadHours = Number(args["pending-upload-hours"] ?? 72);
  const terminalTaskDays = Number(args["terminal-task-days"] ?? 14);
  const orphanCallbackDays = Number(args["orphan-callback-days"] ?? terminalTaskDays);
  const orphanFileHours = Number(args["orphan-file-hours"] ?? pendingUploadHours);

  const config = resolveLocalPostgresConfig();
  const mediaRoot = resolveLocalMediaRoot();
  const now = new Date();

  const pendingUploadAssets = await queryJsonRows(
    config,
    `
    select json_build_object(
      'id', id,
      'assetKind', asset_kind,
      'assetRole', asset_role,
      'objectKey', object_key,
      'statusCode', status_code,
      'createdAt', created_at,
      'updatedAt', updated_at,
      'ageHours', round((extract(epoch from now() - coalesce(updated_at, created_at)) / 3600.0)::numeric, 1)
    )::text
    from media_assets
    where storage_provider = 'local_fs'
      and status_code = 'pending_upload'
      and coalesce(updated_at, created_at) < now() - interval '${pendingUploadHours} hours'
    order by coalesce(updated_at, created_at) asc
    `,
  );

  const terminalTasks = await queryJsonRows(
    config,
    `
    select json_build_object(
      'id', task.id,
      'taskType', task.task_type,
      'targetType', task.target_type,
      'targetId', task.target_id,
      'queueName', task.queue_name,
      'statusCode', task.status_code,
      'createdAt', task.created_at,
      'finishedAt', task.finished_at,
      'ageDays', round((extract(epoch from now() - coalesce(task.finished_at, task.updated_at, task.created_at)) / 86400.0)::numeric, 1),
      'callbackLogCount', (
        select count(*)
        from task_callback_logs log
        where log.task_id = task.id
      )
    )::text
    from async_task_records task
    where task.status_code in ('succeeded', 'failed', 'cancelled', 'dead', 'expired')
      and coalesce(task.finished_at, task.updated_at, task.created_at) < now() - interval '${terminalTaskDays} days'
    order by coalesce(task.finished_at, task.updated_at, task.created_at) asc
    `,
  );

  const orphanCallbackLogs = await queryJsonRows(
    config,
    `
    select json_build_object(
      'id', log.id,
      'taskId', log.task_id,
      'callbackType', log.callback_type,
      'sourceName', log.source_name,
      'verifyStatus', log.verify_status,
      'processStatus', log.process_status,
      'createdAt', log.created_at,
      'ageDays', round((extract(epoch from now() - log.created_at) / 86400.0)::numeric, 1)
    )::text
    from task_callback_logs log
    where (log.task_id is null or not exists (
            select 1
            from async_task_records task
            where task.id = log.task_id
          ))
      and log.created_at < now() - interval '${orphanCallbackDays} days'
    order by log.created_at asc
    `,
  );

  const referencedObjectKeys = new Set(
    await queryLines(
      config,
      `
      select object_key
      from media_assets
      where storage_provider = 'local_fs'
        and object_key is not null
        and btrim(object_key) <> ''
      `,
    ),
  );

  const orphanFiles = collectFilesRecursively(mediaRoot)
    .map((filePath) => {
      const stat = fs.statSync(filePath);
      const ageHours = (now.getTime() - stat.mtimeMs) / (1000 * 60 * 60);
      return {
        filePath,
        objectKey: toObjectKey(mediaRoot, filePath),
        sizeBytes: stat.size,
        modifiedAt: new Date(stat.mtimeMs).toISOString(),
        ageHours: round(ageHours),
      };
    })
    .filter((item) => item.ageHours >= orphanFileHours && !referencedObjectKeys.has(item.objectKey))
    .sort((left, right) => left.filePath.localeCompare(right.filePath));

  const summary = {
    generatedAt: now.toISOString(),
    apply,
    projectRoot,
    mediaRoot,
    database: {
      containerName: config.containerName,
      database: config.database,
      username: config.username,
    },
    thresholds: {
      pendingUploadHours,
      terminalTaskDays,
      orphanCallbackDays,
      orphanFileHours,
    },
    candidates: {
      pendingUploadAssets,
      terminalTasks,
      orphanCallbackLogs,
      orphanFiles,
    },
    counts: {
      pendingUploadAssets: pendingUploadAssets.length,
      terminalTasks: terminalTasks.length,
      orphanCallbackLogs: orphanCallbackLogs.length,
      orphanFiles: orphanFiles.length,
    },
    applied: {
      deletedPendingUploadAssets: 0,
      deletedTerminalTaskRecords: 0,
      deletedTaskCallbackLogs: 0,
      deletedOrphanFiles: 0,
    },
  };

  if (apply) {
    const terminalTaskIds = terminalTasks.map((item) => item.id);
    const pendingUploadAssetIds = pendingUploadAssets.map((item) => item.id);
    const terminalTaskCallbackLogCount = terminalTasks.reduce(
      (total, item) => total + Number(item.callbackLogCount ?? 0),
      0,
    );
    const orphanCallbackLogIds = orphanCallbackLogs.map((item) => item.id);

    for (const asset of pendingUploadAssets) {
      const targetPath = path.resolve(mediaRoot, asset.objectKey.split("/").join(path.sep));
      if (targetPath.startsWith(mediaRoot) && fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
        fs.unlinkSync(targetPath);
      }
    }

    for (const file of orphanFiles) {
      if (fs.existsSync(file.filePath) && fs.statSync(file.filePath).isFile()) {
        fs.unlinkSync(file.filePath);
      }
    }

    if (pendingUploadAssetIds.length > 0) {
      await runLocalPsqlQuery(
        config,
        `
        delete from media_assets
        where id in (${sqlUuidList(pendingUploadAssetIds)});
        `,
      );
    }

    if (terminalTaskIds.length > 0) {
      await runLocalPsqlQuery(
        config,
        `
        delete from task_callback_logs
        where task_id in (${sqlUuidList(terminalTaskIds)});

        delete from async_task_records
        where id in (${sqlUuidList(terminalTaskIds)});
        `,
      );
    }

    if (orphanCallbackLogIds.length > 0) {
      await runLocalPsqlQuery(
        config,
        `
        delete from task_callback_logs
        where id in (${sqlUuidList(orphanCallbackLogIds)});
        `,
      );
    }

    removeEmptyDirectories(mediaRoot, mediaRoot);

    summary.applied = {
      deletedPendingUploadAssets: pendingUploadAssetIds.length,
      deletedTerminalTaskRecords: terminalTaskIds.length,
      deletedTaskCallbackLogs: terminalTaskCallbackLogCount + orphanCallbackLogIds.length,
      deletedOrphanFiles: orphanFiles.length,
    };
  }

  const outputText = JSON.stringify(summary, null, 2);
  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, outputText, "utf8");
  }

  console.log(outputText);
}

await main();
