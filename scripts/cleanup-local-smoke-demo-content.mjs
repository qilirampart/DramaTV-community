import fs from "node:fs";
import path from "node:path";

import { projectRoot, resolveLocalPostgresConfig, runLocalPsqlQuery } from "./lib/local-postgres.mjs";

const CREATOR_USER_ID = "11111111-1111-1111-1111-111111111111";
const SECONDARY_CREATOR_USER_ID = "33333333-3333-3333-3333-333333333333";

const KEEP_VIDEO_IDS = [
  "3d82413b-1036-4c1b-93dd-3a102e0b4683",
  "22968e91-49c1-4ae4-8b61-05f4a74a5aad",
];

const DELETE_VIDEO_IDS = [
  "7af93b9e-9a88-465e-bd5c-c918fb967c6a",
  "270197ec-770b-4ff1-9a6f-13ea643c4db2",
  "50312c65-ec55-4503-9295-9763be379285",
  "99fac764-9d0c-463e-b5dd-e4a626e2a85c",
  "a594d23d-a75a-4b6e-8f0c-a6b34ca6258f",
  "b704bba6-42ae-48c9-872d-87648bc1ee19",
  "4d4cb2d2-1e6f-41ef-ac92-a6517964b7af",
  "9d88cddf-d4e7-445d-87a0-77a379195fc5",
];

const KEEP_WORKFLOW_IDS = [
  "dd715ee9-189b-4450-a4ca-fdf71fb8aafb",
  "0c81983d-a087-4791-b9b3-64746732e74f",
];

const DELETE_WORKFLOW_IDS = [
  "6e83cce2-6627-488e-adfc-309a277da966",
  "e41c9b1e-ba5d-401d-84aa-75a190f5596b",
  "b3f4cff8-2373-47df-883d-3a9fc74a86e4",
  "1bf231c8-a929-4191-b071-9dfbacb20fbd",
  "ceb313a8-222e-41bc-b749-0f6a78cbc7fe",
  "ccfd6f04-10b3-4695-acf0-7b4d408808af",
  "46690be7-bd63-481e-a6ed-1135dc0a93b0",
  "80d1e521-cac6-4244-b92f-70c2de6393fc",
  "fec4ca1b-a1f5-4920-aac2-05ffe7d30e3c",
];

const KEEP_THREAD_IDS = ["98b8a9e5-61b1-4bf9-94fd-2ed845de886a"];

const DELETE_THREAD_IDS = [
  "4f36eed8-37dd-4ddc-965c-07b46b60cb5c",
  "0c4e028a-e10e-42d0-9ea7-5a3feaa433c0",
  "b7868830-768e-4c51-9d69-08a70a538010",
  "601d94b7-5e60-41dd-99d5-6cc1f7b5d68b",
  "5d02e4ce-f9fc-4aa5-9019-ca5a7e23017b",
  "0c1a3487-1063-4fd1-abf6-328e41c7be00",
  "d7229128-8a5e-4c90-98f7-637438c25170",
];

const DELETE_PROMPT_IDS = [
  "ccce76cd-1ad8-45d6-a100-bb1d75934311",
  "266afb4e-4a81-4b9e-8bf3-2beaf1353f87",
];

const KEEP_COMMENT_IDS = [
  "41ec18fd-e074-4138-a287-9e48aa754949",
  "115ab7c9-88b4-4cd6-b881-f9929d0df36d",
  "a69124df-7fdc-4c09-81ea-e439dc931525",
  "692da21c-9e50-4d7d-97ed-62968a4e64d6",
];

const EXPLICIT_DIRTY_USER_IDS = [
  "bc25a7b7-c0c6-4761-999c-a132d15cb780",
  "32876b17-67c5-4ddb-a2bf-a88442f72e35",
  "e585e384-fcc9-401e-abbe-375322b9a452",
  "5dac06ba-0790-4cae-9ab1-8f621cee442c",
  "1c4fd545-3034-4c74-ad95-5cad2199c695",
  "63f35512-6c1d-4f41-b684-5ddccd95cd6a",
  "494bd17e-3532-4f96-aa65-4fadcb30d3b1",
  "26bc3973-de39-4b45-9d74-02e59c911ea8",
];

const DIRTY_USER_PATTERNS = [
  /^qa-smoke-/i,
  /^(media-path-smoke|avatar-smoke|hidden-delete-smoke|comment-governance-smoke|comment-governance-debug|comment-debug)(?:-|$)/i,
  /^creator-0422-b$/i,
];

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

function sqlTextArray(values) {
  return `ARRAY[${values.map((value) => sqlLiteral(value)).join(", ")}]::text[]`;
}

function sqlUuidList(values) {
  return values.map((value) => `${sqlLiteral(value)}::uuid`).join(", ");
}

function sqlUuidCondition(column, values) {
  if (values.length === 0) {
    return "false";
  }

  return `${column} in (${sqlUuidList(values)})`;
}

function sqlTempUuidTable(name, values) {
  const lines = [`create temporary table ${name} (id uuid primary key) on commit drop;`];
  if (values.length > 0) {
    lines.push(`insert into ${name} (id) values ${values.map((value) => `(${sqlLiteral(value)}::uuid)`).join(", ")};`);
  }
  return lines.join("\n");
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

function toObjectKey(mediaRoot, filePath) {
  return path.relative(mediaRoot, filePath).split(path.sep).join("/");
}

async function loadDirtyUsers(config) {
  const rows = await queryJsonRows(
    config,
    `
    select json_build_object(
      'id', id,
      'username', username,
      'displayName', display_name
    )::text
    from users
    where deleted_at is null
    order by created_at asc
    `,
  );

  return rows.filter((row) => {
    if (row.id === CREATOR_USER_ID || row.id === SECONDARY_CREATOR_USER_ID) {
      return false;
    }
    if (EXPLICIT_DIRTY_USER_IDS.includes(row.id)) {
      return true;
    }

    const username = String(row.username ?? "");
    return DIRTY_USER_PATTERNS.some((pattern) => pattern.test(username));
  });
}

async function loadCounts(config) {
  const rows = await queryJsonRows(
    config,
    `
    select json_build_object(
      'users', (select count(*) from users),
      'videos', (select count(*) from videos),
      'workflows', (select count(*) from workflows),
      'promptEntries', (select count(*) from prompt_entries),
      'discussionThreads', (select count(*) from discussion_threads),
      'comments', (select count(*) from comments),
      'interactionActions', (select count(*) from interaction_actions),
      'followRelations', (select count(*) from follow_relations),
      'publishDrafts', (select count(*) from publish_drafts),
      'auditRecords', (select count(*) from audit_records),
      'feedItems', (select count(*) from feed_items),
      'mediaAssets', (select count(*) from media_assets),
      'authSessions', (select count(*) from auth_sessions),
      'asyncTaskRecords', (select count(*) from async_task_records),
      'taskCallbackLogs', (select count(*) from task_callback_logs)
    )::text
    `,
  );

  return rows[0] ?? {};
}

function buildCleanupSql(dirtyUserIds) {
  const deleteVideoIds = DELETE_VIDEO_IDS;
  const deleteWorkflowIds = DELETE_WORKFLOW_IDS;
  const deleteThreadIds = DELETE_THREAD_IDS;
  const deletePromptIds = DELETE_PROMPT_IDS;
  const deleteTargetIds = [...deleteVideoIds, ...deleteWorkflowIds, ...deleteThreadIds, ...deletePromptIds];
  const retainedTargetIds = [...KEEP_VIDEO_IDS, ...KEEP_WORKFLOW_IDS, ...KEEP_THREAD_IDS];

  return `
begin;

${sqlTempUuidTable("tmp_dirty_users", dirtyUserIds)}
${sqlTempUuidTable("tmp_delete_videos", deleteVideoIds)}
${sqlTempUuidTable("tmp_delete_workflows", deleteWorkflowIds)}
${sqlTempUuidTable("tmp_delete_threads", deleteThreadIds)}
${sqlTempUuidTable("tmp_delete_prompts", deletePromptIds)}
${sqlTempUuidTable("tmp_delete_targets", deleteTargetIds)}
${sqlTempUuidTable("tmp_retained_targets", retainedTargetIds)}
${sqlTempUuidTable("tmp_keep_comments", KEEP_COMMENT_IDS)}

update users
set avatar_asset_id = null,
    updated_at = now()
where id in (select id from tmp_dirty_users);

update users
set username = 'kai-ridge',
    display_name = 'Kai Ridge',
    bio = '专注于动作镜头、分镜节奏和流程整理的社区创作者。',
    status_code = 'active',
    deleted_at = null,
    updated_at = now()
where id = ${sqlLiteral(SECONDARY_CREATOR_USER_ID)}::uuid;

update creator_profiles
set headline = '动作镜头与流程整理',
    location_text = 'Shanghai',
    website_url = null,
    updated_at = now()
where user_id = ${sqlLiteral(SECONDARY_CREATOR_USER_ID)}::uuid;

update videos
set title = '雨夜追逐短片',
    summary = '用于展示夜景追逐、路面反光和节奏切换的写实动作样片。',
    tag_names = ${sqlTextArray(["动作", "夜景", "城市"])},
    publish_status = 'published',
    deleted_at = null,
    comments_enabled = true,
    updated_at = now()
where id = ${sqlLiteral(KEEP_VIDEO_IDS[0])}::uuid;

update videos
set title = '悬浮列车穿城',
    summary = '用于展示高速穿行、建筑尺度和空间纵深的城市科幻镜头样片。',
    tag_names = ${sqlTextArray(["科幻", "城市", "速度感"])},
    publish_status = 'published',
    deleted_at = null,
    comments_enabled = true,
    updated_at = now()
where id = ${sqlLiteral(KEEP_VIDEO_IDS[1])}::uuid;

update workflows
set title = '写实追逐工作流',
    summary = '适合夜景道路、人物追逐和动作节奏测试的基础工作流。',
    scenario_text = '优先用于城市夜景、道路反光和中近景切换的首版生成。',
    tag_names = ${sqlTextArray(["动作", "夜景", "追逐"])},
    publish_status = 'published',
    deleted_at = null,
    comments_enabled = true,
    updated_at = now()
where id = ${sqlLiteral(KEEP_WORKFLOW_IDS[0])}::uuid;

update workflows
set title = '都市穿行工作流',
    summary = '适合高楼群、轨道交通和穿行速度感镜头的基础工作流。',
    scenario_text = '优先用于城市航拍、穿城移动和空间纵深场景测试。',
    tag_names = ${sqlTextArray(["城市", "科幻", "移动镜头"])},
    publish_status = 'published',
    deleted_at = null,
    comments_enabled = true,
    updated_at = now()
where id = ${sqlLiteral(KEEP_WORKFLOW_IDS[1])}::uuid;

update discussion_threads
set slug = 'weekly-creator-thread',
    title = '本周创作交流：你最近在试什么镜头？',
    excerpt_text = '欢迎聊聊你最近在测试的题材、镜头语言，或者准备绑定到工作流里的做法。',
    content_text = ${sqlLiteral(`## 本周话题

欢迎分享：
- 最近在测试的题材或镜头
- 你最常用的提示词结构
- 想绑定到工作流里的工作流方法

也可以直接贴一段简短经验，我们会继续把社区能力补齐。`)},
    tag_names = ${sqlTextArray(["创作交流", "社区开场"])},
    binding_target_type = null,
    binding_target_id = null,
    publish_status = 'published',
    deleted_at = null,
    comments_enabled = true,
    updated_at = now()
where id = ${sqlLiteral(KEEP_THREAD_IDS[0])}::uuid;

update media_assets
set created_by = ${sqlLiteral(CREATOR_USER_ID)}::uuid,
    updated_at = now()
where created_by in (select id from tmp_dirty_users);

delete from report_tickets
where reporter_id in (select id from tmp_dirty_users)
   or assignee_id in (select id from tmp_dirty_users)
   or target_id in (select id from tmp_delete_targets);

delete from task_callback_logs
where task_id is null
   or task_id in (
        select id
        from async_task_records
        where target_id in (select id from tmp_delete_targets)
   );

delete from async_task_records
where target_id in (select id from tmp_delete_targets);

delete from canvas_runtime_assets
where runtime_id in (
    select id
    from canvas_workflow_runtimes
    where source_workflow_id in (select id from tmp_delete_workflows)
       or owner_id in (select id from tmp_dirty_users)
);

delete from canvas_copy_tasks
where source_workflow_id in (select id from tmp_delete_workflows)
   or operator_id in (select id from tmp_dirty_users);

delete from canvas_workflow_runtimes
where source_workflow_id in (select id from tmp_delete_workflows)
   or owner_id in (select id from tmp_dirty_users);

delete from canvas_bindings
where workflow_id in (select id from tmp_delete_workflows);

delete from auth_sessions
where user_id in (select id from tmp_dirty_users);

delete from audit_records;

delete from publish_drafts
where author_id = ${sqlLiteral(CREATOR_USER_ID)}::uuid
   or author_id in (select id from tmp_dirty_users);

delete from feed_items
where target_id in (select id from tmp_delete_targets);

delete from prompt_example_links
where prompt_id in (select id from tmp_delete_prompts);

delete from interaction_actions;

delete from follow_relations;

delete from comments
where author_id in (select id from tmp_dirty_users);

delete from comments
where target_id in (select id from tmp_delete_targets);

delete from comments
where target_type = 'prompt';

delete from comments
where target_id in (select id from tmp_retained_targets)
  and id not in (select id from tmp_keep_comments);

update comments
set target_type = 'video',
    target_id = ${sqlLiteral(KEEP_VIDEO_IDS[0])}::uuid,
    author_id = ${sqlLiteral(CREATOR_USER_ID)}::uuid,
    parent_id = null,
    root_id = null,
    content_text = '这段雨夜追逐的节奏很稳，适合做城市动作样片。',
    status_code = 'active',
    deleted_at = null,
    updated_at = now()
where id = ${sqlLiteral("41ec18fd-e074-4138-a287-9e48aa754949")}::uuid;

update comments
set target_type = 'video',
    target_id = ${sqlLiteral(KEEP_VIDEO_IDS[0])}::uuid,
    author_id = ${sqlLiteral(CREATOR_USER_ID)}::uuid,
    parent_id = ${sqlLiteral("41ec18fd-e074-4138-a287-9e48aa754949")}::uuid,
    root_id = ${sqlLiteral("41ec18fd-e074-4138-a287-9e48aa754949")}::uuid,
    content_text = '如果再加一点路面反光，速度感会更完整。',
    status_code = 'active',
    deleted_at = null,
    updated_at = now()
where id = ${sqlLiteral("115ab7c9-88b4-4cd6-b881-f9929d0df36d")}::uuid;

update comments
set target_type = 'workflow',
    target_id = ${sqlLiteral(KEEP_WORKFLOW_IDS[0])}::uuid,
    author_id = ${sqlLiteral(CREATOR_USER_ID)}::uuid,
    parent_id = null,
    root_id = null,
    content_text = '这个工作流适合先跑首版节奏，再回头补细节。',
    status_code = 'active',
    deleted_at = null,
    updated_at = now()
where id = ${sqlLiteral("a69124df-7fdc-4c09-81ea-e439dc931525")}::uuid;

update comments
set target_type = 'post',
    target_id = ${sqlLiteral(KEEP_THREAD_IDS[0])}::uuid,
    author_id = ${sqlLiteral(CREATOR_USER_ID)}::uuid,
    parent_id = null,
    root_id = null,
    content_text = '我最近在补城市夜景和追逐段落，欢迎一起交流。',
    status_code = 'active',
    deleted_at = null,
    updated_at = now()
where id = ${sqlLiteral("692da21c-9e50-4d7d-97ed-62968a4e64d6")}::uuid;

delete from discussion_threads
where id in (select id from tmp_delete_threads);

delete from videos
where id in (select id from tmp_delete_videos);

delete from workflows
where id in (select id from tmp_delete_workflows);

delete from prompt_entries
where id in (select id from tmp_delete_prompts);

delete from creator_profiles
where user_id in (select id from tmp_dirty_users);

delete from users
where id in (select id from tmp_dirty_users);

update comments comment
set reply_count = (
        select count(*)
        from comments child
        where child.parent_id = comment.id
          and child.status_code = 'active'
          and child.deleted_at is null
    ),
    like_count = 0,
    updated_at = now();

update videos video
set comment_count = (
        select count(*)
        from comments comment
        where comment.target_type = 'video'
          and comment.target_id = video.id
          and comment.status_code = 'active'
          and comment.deleted_at is null
    ),
    like_count = 0,
    favorite_count = 0,
    updated_at = now();

update workflows workflow
set video_bind_count = (
        select count(*)
        from videos video
        where video.workflow_id = workflow.id
          and video.publish_status = 'published'
          and video.deleted_at is null
    ),
    comment_count = (
        select count(*)
        from comments comment
        where comment.target_type = 'workflow'
          and comment.target_id = workflow.id
          and comment.status_code = 'active'
          and comment.deleted_at is null
    ),
    like_count = 0,
    favorite_count = 0,
    updated_at = now();

update prompt_entries prompt
set example_count = (
        select count(*)
        from prompt_example_links link
        where link.prompt_id = prompt.id
    ),
    comment_count = (
        select count(*)
        from comments comment
        where comment.target_type = 'prompt'
          and comment.target_id = prompt.id
          and comment.status_code = 'active'
          and comment.deleted_at is null
    ),
    like_count = 0,
    favorite_count = 0,
    updated_at = now();

update discussion_threads thread
set reply_count = (
        select count(*)
        from comments comment
        where comment.target_type = 'post'
          and comment.target_id = thread.id
          and comment.status_code = 'active'
          and comment.deleted_at is null
    ),
    like_count = 0,
    favorite_count = 0,
    last_activity_at = greatest(
        coalesce(thread.published_at, thread.created_at),
        coalesce((
            select max(comment.created_at)
            from comments comment
            where comment.target_type = 'post'
              and comment.target_id = thread.id
              and comment.status_code = 'active'
              and comment.deleted_at is null
        ), coalesce(thread.published_at, thread.created_at))
    ),
    updated_at = now();

update creator_profiles profile
set video_count = (
        select count(*)
        from videos video
        where video.author_id = profile.user_id
          and video.publish_status = 'published'
          and video.deleted_at is null
    ),
    workflow_count = (
        select count(*)
        from workflows workflow
        where workflow.author_id = profile.user_id
          and workflow.publish_status = 'published'
          and workflow.deleted_at is null
    ),
    follower_count = (
        select count(*)
        from follow_relations relation
        where relation.followee_id = profile.user_id
          and relation.status_code = 'active'
    ),
    like_received_count = 0,
    updated_at = now();

commit;
`;
}

function buildOrphanAssetSql() {
  return `
  select json_build_object(
    'id', asset.id,
    'storageProvider', asset.storage_provider,
    'objectKey', asset.object_key,
    'fileName', asset.file_name
  )::text
  from media_assets asset
  where not exists (
          select 1
          from users "user"
          where "user".avatar_asset_id = asset.id
        )
    and not exists (
          select 1
          from videos video
          where asset.id in (
            video.cover_asset_id,
            video.poster_asset_id,
            video.preview_asset_id,
            video.source_asset_id
          )
        )
    and not exists (
          select 1
          from workflows workflow
          where asset.id in (
            workflow.cover_asset_id,
            workflow.example_asset_id
          )
        )
    and not exists (
          select 1
          from prompt_entries prompt
          where asset.id in (
            prompt.cover_asset_id,
            prompt.primary_example_asset_id
          )
        )
    and not exists (
          select 1
          from prompt_example_links link
          where link.media_asset_id = asset.id
        )
    and not exists (
          select 1
          from canvas_runtime_assets runtime_asset
          where runtime_asset.media_asset_id = asset.id
        )
  order by asset.created_at asc
  `;
}

function filePathForAsset(mediaRoot, asset) {
  if (asset.storageProvider !== "local_fs") {
    return null;
  }
  if (!asset.objectKey || typeof asset.objectKey !== "string") {
    return null;
  }

  const fullPath = path.resolve(mediaRoot, asset.objectKey.split("/").join(path.sep));
  if (!fullPath.startsWith(mediaRoot)) {
    return null;
  }
  return fullPath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apply = args.apply === "true";
  const outputPath = args.output ?? "";

  const config = resolveLocalPostgresConfig();
  const mediaRoot = resolveLocalMediaRoot();
  const dirtyUsers = await loadDirtyUsers(config);
  const dirtyUserIds = dirtyUsers.map((user) => user.id);
  const countsBefore = await loadCounts(config);

  const summary = {
    generatedAt: new Date().toISOString(),
    apply,
    mediaRoot,
    database: {
      containerName: config.containerName,
      database: config.database,
      username: config.username,
    },
    dirtyUsers,
    deleteCandidates: {
      videos: DELETE_VIDEO_IDS,
      workflows: DELETE_WORKFLOW_IDS,
      prompts: DELETE_PROMPT_IDS,
      threads: DELETE_THREAD_IDS,
    },
    retainedIds: {
      users: [CREATOR_USER_ID, SECONDARY_CREATOR_USER_ID],
      videos: KEEP_VIDEO_IDS,
      workflows: KEEP_WORKFLOW_IDS,
      threads: KEEP_THREAD_IDS,
      comments: KEEP_COMMENT_IDS,
    },
    countsBefore,
    countsAfter: null,
    orphanAssets: [],
    applied: {
      deletedDirtyUsers: 0,
      deletedVideos: 0,
      deletedWorkflows: 0,
      deletedPrompts: 0,
      deletedThreads: 0,
      deletedOrphanAssets: 0,
      deletedLocalFiles: 0,
    },
  };

  if (apply) {
    await runLocalPsqlQuery(config, buildCleanupSql(dirtyUserIds));

    const orphanAssets = await queryJsonRows(config, buildOrphanAssetSql());
    summary.orphanAssets = orphanAssets;

    if (orphanAssets.length > 0) {
      await runLocalPsqlQuery(
        config,
        `
        delete from media_assets
        where id in (${sqlUuidList(orphanAssets.map((asset) => asset.id))});
        `,
      );
    }

    const deletedFiles = [];
    const allFiles = new Set(collectFilesRecursively(mediaRoot).map((filePath) => toObjectKey(mediaRoot, filePath)));

    for (const asset of orphanAssets) {
      const targetPath = filePathForAsset(mediaRoot, asset);
      if (!targetPath || !asset.objectKey || !allFiles.has(asset.objectKey)) {
        continue;
      }
      if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
        fs.unlinkSync(targetPath);
        deletedFiles.push(targetPath);
      }
    }

    removeEmptyDirectories(mediaRoot, mediaRoot);

    summary.applied = {
      deletedDirtyUsers: dirtyUserIds.length,
      deletedVideos: DELETE_VIDEO_IDS.length,
      deletedWorkflows: DELETE_WORKFLOW_IDS.length,
      deletedPrompts: DELETE_PROMPT_IDS.length,
      deletedThreads: DELETE_THREAD_IDS.length,
      deletedOrphanAssets: orphanAssets.length,
      deletedLocalFiles: deletedFiles.length,
    };
    summary.deletedFiles = deletedFiles;
    summary.countsAfter = await loadCounts(config);
  } else {
    summary.orphanAssets = await queryJsonRows(config, buildOrphanAssetSql());
  }

  const outputText = JSON.stringify(summary, null, 2);
  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, outputText, "utf8");
  }

  console.log(outputText);
}

await main();
