# MEMORY

## 2026-05-21 admin resource governance should reuse moderation actions

- For this repo, do not invent a second governance state machine just for the admin resource inventory. Reuse the existing moderation `offline / restore` actions so resource governance and public visibility stay on one shared backend contract.
- The validated admin resource inventory should cover the real frontstage resource set in one place:
  - `video_prompt`
  - `image_prompt`
  - `workflow`
  - `post`
  - `video`
- If a resource is taken down from `/resources`, the expected behavior is immediate frontstage visibility change. If the admin page changes but the community side does not, debug the shared backend visibility mapping first, not the admin UI shell.
- For prompt resources in `/resources`, surface the actual prompt body as a separate detail block instead of letting it blend into the summary. The summary can stay, but the body must be visibly labeled `提示词正文` so reviewers do not mistake it for a summary excerpt.
- For prompt resources in `/resources`, do not source the body from `prompt_text` first. Prefer `prompt_text_raw -> prompt_text -> summary`, otherwise imported prompt inventories can collapse back to the same short text shown in summaries.

## 2026-05-21 local startup ports are fixed

- For this repo, the manual local recovery order is fixed:
  - backend `18080`
  - community web `3106`
  - admin web `3206`
  - cloud mirror `3107`
- Do not start the community frontend with a bare `next dev` that may fall back to `3000` or `3001`. The standard local entry is `npm run dev:web`, and it must stay on `3106`.
- Keep `npm run dev:admin` on `3206`, `scripts/start-server-18080.ps1` on `18080`, and `npm run start:web:cloud` on `3107` so the manual startup guide and the actual runtime ports do not drift.

## 2026-04-30 comment threads capped at two visible levels

- For this repo, comment UI should follow the short-video community pattern: one root comment level plus one nested reply level only.
- Do not keep recursive comment trees in the shared frontend component. Even if the database stores deeper ancestry, the shared comment renderer should stop at two visible levels.
- When a user replies to a second-level reply, flatten the stored/displayed parent back to the root comment and preserve the actual reply target separately.
- The validated shape here is:
  - database keeps `parent_id` pointing to the root for second-level items
  - database keeps `reply_to_comment_id` for the concrete clicked reply target
  - API returns `replyTarget`
  - UI shows `回复 xxx` on second-level replies
- When deleting a root comment thread, cascade not only by `parent_id` but also by `reply_to_comment_id`, otherwise flattened second-level replies can be missed.

## 2026-04-30 comment notification semantics

- In this repo, do not mix up `comment` and `reply` notification semantics.
- The validated rule is:
  - `comment` = someone commented on content I own
  - `reply` = someone replied to a comment I authored
- A content owner should not also receive `reply` just because the reply happened under their content if the replied comment belonged to another user.
- Keep this rule real in the backend query layer instead of faking it in the bell UI. Tests should cover the two roles separately:
  - content owner receives `comment`
  - replied-comment author receives `reply`

## 2026-04-29 split progress routing for parallel tracks

- When community and admin work run in parallel, do not keep both detailed execution logs in `.codex/progress.md`.
- The stable pattern for this repo is:
  - `.codex/progress.md` = master index, cross-track snapshot, blockers, and milestone routing
  - `.codex/progress-community.md` = detailed community-line progress
  - `.codex/progress-admin.md` = detailed admin-line progress
- Do not bulk-migrate old mixed history unless there is a concrete need. Keep old entries in the master doc as archive, and only route new detailed updates into the matching track file.

## 2026-04-28 canvas copy idempotency scope

- For `copy-to-canvas`, do not enforce idempotency on a global bare `idempotency_key` when the frontend key is stable per workflow, such as `workflow-copy-${workflowId}`.
- In this repo, the safe contract is: scope existing-copy lookup and the unique constraint by at least `operator_id + source_workflow_id + idempotency_key`. Otherwise different users can be routed to the same copied canvas runtime and copy task.
- The validated fix here was:
  - backend lookup filtered on `operator_id` and `source_workflow_id`
  - database unique index moved from global `idempotency_key` to `(operator_id, source_workflow_id, idempotency_key)`
  - same-user repeat clicks stayed idempotent, while different users using the same frontend key no longer collided

## 2026-04-27 home hero video mount discipline

- For `/home` hero carousels, do not keep every slide mounted as a live `<video>` element just because the slide has a playable preview URL. Mount the active slide and, at most, the next slide that is intentionally being prewarmed; keep the rest as poster-only background layers.
- When a hero slide has both `imageUrl` and `videoUrl`, preserve the image as the base layer and also pass it through `poster` so route re-entry does not need to re-extract a visible first frame from the video path.
- The validated result in this repo was: `CommunityHomePage` hero mounted video count dropped from `3` to `2`, and a repeated `/home -> detail -> return` Playwright sweep fell from a string of repeated hero `seedance-videos/*.mp4` range requests to a single retained video request, while keeping the active-slide autoplay experience intact.

## 2026-04-28 backend home-feed test contract

- For this repo, `GET /api/feed/home` defaults to `channel=recommend` and first reads the curated `feed_items` pool, not the raw `videos` table.
- The validated testing pattern is: if an integration test expects a freshly created video/workflow/prompt to appear in the home feed, it must also seed a matching active `feed_items` row with the correct `channel_code`, `target_type`, and `content_kind`.
- The concrete pitfall already hit here was: inserting a published `video` alone did not make it show up in `/api/feed/home`; the item only appeared after also inserting `feed_items(channel_code='recommend', target_type='video', content_kind='workflow_work', status_code='active')`.

## 2026-04-26 video prompt cover backfill rule

- For `prompt_entries`, `coverUrl` only resolves when `cover_asset_id` points to an `image` media asset. Pointing `cover_asset_id` at the primary video asset will still leave `coverUrl/posterUrl` as `null`, even if `previewUrl/sourceUrl` are present.
- The validated repair path for YouMind Seedance video prompts is: create a dedicated image cover asset, prefer the upstream `thumbnail` / `thumbnailSrc` direct URL, and only fall back to extracting a local frame with `ffmpeg` when no thumbnail exists.
- When backfilling existing data, do not limit the sweep to the current frontend catalog subset. Query by the full Seedance source library so cloud/test databases with larger imported batches also get covers fixed in one pass.

## 2026-04-25 card video warm-up discipline

- On content-heavy grids like `/featured`, do not let every in-viewport video card auto-mount its `<video>` element on first paint. Keep hover preview behavior, but add a shared switch such as `loadOnViewport` so only the top priority cards prewarm in the viewport and the rest mount on hover/focus.
- The validated pattern for this repo is: first-screen featured cards prewarm only the first 6 video cards, while later cards still support hover preview. This cut the cloud-mirror `/featured` first-screen mounted video count from 15 down to 6 without removing the card hover-play affordance.
- For rotating hero carousels like `/home`, do not preload every slide equally. Keep the active slide at `preload="auto"`, warm only the next slide with `metadata`, and leave farther slides at `none` until they approach activation.
- Verification should use live browser checks, not just code review: count mounted `video` elements and inspect real media requests on `http://127.0.0.1:3107/featured` and `http://127.0.0.1:3107/home`.

## 2026-04-24 public page degrade strategy

- On public community pages, do not let secondary prompt blocks block the first screen. Keep the main `homeFeed` as the hard dependency, but wrap secondary prompt queries with a short timeout plus empty-data fallback.
- For pages like `/` and `/home`, if the main feed already contains enough real cards and hero material, remove the secondary prompt query from the route-level await entirely instead of only degrading it. Route-level “only wait for `homeFeed`” is stronger than “wait for both but one can timeout”.
- For pages like `/featured`, where the supplemental inventory is useful but not required for first paint, split the load into two layers: server-render the main grid from `homeFeed`, then fetch the larger prompt inventory after hydration through a light same-origin route.
- If a page hero or shelf originally depended on the secondary prompt API, add a fallback path from the main feed so a degraded prompt query does not bounce the UI back to old demo content.
- Verification for this class of optimization should include both build-level checks and live route checks, for example `npx tsc`, `build:web`, and direct HTTP `200` checks on `/`, `/home`, `/featured`.

## 2026-04-22 bug fix scope discipline

- Do not stop at fixing the visible page symptom. First locate the real root cause, then explicitly ask whether the same cause can appear in other pages, shared components, mappers, API adapters, or common styles.
- If the issue is systemic, prefer fixing it in the shared layer instead of patching one page at a time. Typical shared layers in this repo are API adapters, view-model mappers, `PageShell`, shared comment/card components, and global CSS.
- After a local fix, run one extra sweep for the same pattern in neighboring code paths. Example: a broken avatar on `/me` can also mean the same relative media URL bug exists in topbar session data, creator cards, comment avatars, or other pages using the same contract.
- Verification should include at least one direct fix check and one adjacent-path check, so the result is not "this page works" but "this class of bug has been contained."

## 2026-04-28 route transition overlay discipline

- Shared route-transition overlays must settle when the route leaves the origin page, not only when it exactly reaches the originally requested target. Auth middleware, login redirects, canonical URL rewrites, and other route guards can legitimately land on a different internal URL first.
- For this repo, the stable pattern is: record both `originHref` and `pendingHref`, dismiss the overlay once `routeKey !== originHref`, preserve a short minimum transition duration for polish, and also keep a hard timeout fallback so a failed `router.push` cannot leave the app stuck behind the loading layer forever.
- Verification should include both unauthenticated guarded-entry cases like `/login?redirectTo=...` and normal logged-in top-nav hops such as `/home -> /featured -> /discussions`.

## 2026-04-19 patch discipline

- Avoid large `apply_patch` payloads. Split code changes by file and concern, keep each patch small, and verify after meaningful chunks to prevent repeated long-patch failures or encoding damage.

## 2026-04-19 progress doc hygiene

### `.codex/progress.md` 只能按 UTF-8 安全方式读写，不能把 PowerShell 默认显示结果直接当成文件损坏
- 场景：Windows PowerShell 默认输出编码和终端显示经常不稳定，同一个 UTF-8 文档可能在 `Get-Content` 或普通控制台输出里显示乱码，但文件字节本身并没有坏。
- 结论：处理 `.codex/progress.md` 时，优先用 UTF-8 明确读取方式复核，例如 `Get-Content -Encoding utf8`、Node `fs.readFileSync(..., 'utf8')`，或直接在编辑器里检查；不要因为 PowerShell 里看到乱码就立刻做“转码修复”。
- 证据：`2026-04-19` 对 `.codex/progress.md` 的排查里，Node 按 UTF-8 读取时中文正文正常，说明主要问题是 PowerShell 显示链路，不是文件整体损坏。
- 适用范围：`.codex/progress.md`、`memory/MEMORY.md`、中文方案文档、任何在 Windows 本地终端里查看的 UTF-8 Markdown。

### 改进度文档时只做小补丁，优先 `apply_patch`，并且写后立刻复核结构锚点
- 场景：进度文档体积持续增长，长补丁或整段重写更容易引发补丁失败、上下文错位，或者在编码判断不清时把问题扩大。
- 结论：更新 `.codex/progress.md` 时遵守三条规则：一是只做小范围增量修改；二是优先用 `apply_patch` 而不是 shell 追加写入；三是写完后立刻复核 `CODEX:SNAPSHOT`、`CODEX:BOARD`、`CODEX:LOG` 三个锚点仍然存在，再确认日志仍是 append-only。
- 证据：`2026-04-19` 这轮排查里，shell 方式向 `.codex/progress.md` 追加内容曾失败；同时该文件结构锚点依然可被准确检出，说明后续最稳妥的方式是围绕锚点做小补丁维护。
- 适用范围：所有进度快照更新、看板状态调整、追加日志记录，以及后续任何需要修改大型 Markdown 状态文档的场景。

### PowerShell 读中文文档时优先 `-NoProfile` 和显式 UTF-8，避免把环境噪音误判成文件损坏
- 场景：本地 PowerShell profile 会因执行策略报错，普通 `Get-Content` 也可能把正常 UTF-8 中文显示成 mojibake。
- 结论：读取中文文档、进度文档和规则文档时，优先使用 `login=false` 或 `powershell -NoProfile`，并设置 `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` 与 `Get-Content -Encoding UTF8`；是否真正损坏要看文件字节或 UTF-8 读取结果，不看默认终端显示。
- 证据：`2026-04-20` `AGENTS.md` 在普通输出里显示乱码，但文件头字节为正常 UTF-8，说明问题是终端显示链路和 profile 噪音，不是文档内容损坏。
- 适用范围：`AGENTS.md`、`.codex/progress.md`、`memory/MEMORY.md`、`docs/**/*.md`、任何中文路径下的 Markdown。

### Draw.io MCP 调用必须串行，产图优先落 `.drawio` 文件再验证
- 场景：Draw.io MCP 背后依赖同一个浏览器和图模型会话，并发调用 `list_layers`、`list_paged_model`、导入、导出等操作容易互相等待，最终表现为超时或会话假死。
- 结论：不要用 `multi_tool_use.parallel` 包裹 Draw.io MCP 调用；大图优先直接生成或更新 `docs/03_架构/*.drawio` XML，再用单个 MCP 调用或 XML 解析做验证。
- 证据：`2026-04-20` 排查 Draw.io MCP 超时后，改用项目 wrapper `scripts/drawio-mcp-stdio-wrapper.mjs` 并串行调用，`get_active_layer/list_paged_model` 类基础操作恢复可用。
- 适用范围：架构脑图、页面联动图、Draw.io 导入导出、后续任何 MCP 画图任务。

## 2026-04-07 前端视觉改版补记

### 如果组件结构已经改了但 `globals.css` 没跟上，用户体感上几乎等于“没改”
- 场景：这轮首页和卡片结构里已经提前写入了 `brand-subtitle`、`topbar-cta`、`card-media`、`card-cover-overlay`、`card-kicker` 这类新类名，但全局样式还停留在旧骨架状态。
- 结论：前端视觉重构不能只改 JSX 结构；只要新的全局类没有一起补齐，用户打开页面看到的仍然会像旧版，甚至会误判为“design.md 根本没用上”。
- 证据：`2026-04-07` 这轮重新补完 `apps/web/src/app/globals.css` 之后，首页和视频详情页的变化才真正肉眼可见，说明之前的问题不是方向错了，而是样式收口没有落地。
- 适用范围：后续所有页面改版、组件换壳、卡片系统升级、导航与详情页视觉调整。

### 做前端视觉改版时，先抓“导航 + 首屏 + 卡片”三块最容易形成整体气质
- 场景：社区首页信息很多，如果逐块零散改，很容易做了不少代码却还是看不出整体变化。
- 结论：优先改顶栏、首页 Hero、资源卡片这三块，能最快建立新的站点气质；等这三块立住后，工作流详情、作者主页、发布页会自然继承新的基底，不会继续停在“零碎优化”的状态。
- 证据：`2026-04-07` 这轮把悬浮导航、首页双栏 Hero、视频/工作流卡片和视频详情媒体区同时改掉后，即便还没逐页精修所有页面，首页和详情页已经明显脱离旧骨架感。
- 适用范围：DramaTV 后续核心五页的视觉统一、设计系统第一次落地、需要快速给团队展示“页面确实变了”的场景。

### `DESIGN.md` 是否真正用上，不能靠口头判断，最好用浏览器截图直接验收
- 场景：设计文档可能已经写得很完整，但如果没有浏览器层面的实际打开与截图，很容易继续停留在“代码改了但不确定用户是不是能感知到”的阶段。
- 结论：每轮明显的视觉改版后，至少要打开首页和一个详情页做浏览器级验收；比起只看 `build` 通过，更能判断这轮是否真的把设计语言落到了界面上。
- 证据：`2026-04-07` 这轮在 `build` 通过后，又用 Playwright 实测了 `http://127.0.0.1:3100/` 首页和视频详情页，截图里已经能直接看到 serif 标题、金色 CTA、悬浮导航和新版媒体卡片层次。
- 适用范围：前端美化阶段、给老板或同事同步页面进展、判断是否可以进入下一轮细化。

### 社区首页第一屏必须先露出真实内容和功能入口，不能让大样片或宣言文案独占视线
- 场景：AI 视频社区首页如果把第一屏做成“品牌宣言 + 大视频样片”，用户会先把它理解成入口页、活动页或官网，而不是内容社区。
- 结论：首页第一屏至少要同时出现真实内容对象、讨论入口或工作流入口中的一部分；样片和氛围可以保留，但必须退居为内容承接层，不能压过社区主线。
- 证据：`2026-04-07` 这轮把首页改成“左侧说明 + 中间样片 + 右侧社区速览”后，首屏已经能直接看到今日作品、今日工作流和讨论热点，且 `home-feed` 区标题在首屏底部已经可见，整体观感比之前更像社区首页。
- 适用范围：DramaTV 首页后续所有改版、活动入口设计、PGC 主线阶段的信息架构判断。

## 2026-04-07 真实联调验收补记

### 当前阶段的功能验收必须显式走 `real` 模式，`mock` 不能再当完成标准
- 场景：`apps/web` 同时保留了 `real / mock` 两套数据路径，迁移期很容易因为图方便继续拿 `mock` 页面表现当作联调完成。
- 结论：当前社区主线的评论、点赞、收藏、关注、发布联调，验收时必须明确使用 `DRAMATV_DATA_MODE=real` 和 `DRAMATV_API_BASE_URL=http://127.0.0.1:18080`；`mock` 只用于纯 UI 预览、组件演示或后端暂时不可用时的隔离开发，不再作为“功能已完成”的依据。
- 证据：`2026-04-07` 这轮回归里，`apps/web/.env.local` 已显式指向 `real -> 18080`，并且 Playwright 在视频页、工作流页、作者页完成的评论、点赞、收藏、关注动作都已被真实接口查回。
- 适用范围：后续所有社区主链功能、浏览器端 smoke 验收、给他人演示“已经联调完成”的判断口径。

### 对采用 Next.js server action 的真实联调，最好用“浏览器操作 + 后端 API 二次核对”双重验收
- 场景：前端按钮通过 server action 提交时，浏览器网络面板常常只会看到对当前页面的 `POST`，很难单靠浏览器请求列表证明数据已经真正写进后端。
- 结论：这类页面在 smoke 回归时，先用浏览器真实点击确认页面状态回刷，再直接请求 `18080` 的业务接口核对 `likeCount`、`favoriteCount`、`commentCount`、`viewerActions` 或 `followerCount`，这是当前阶段最稳的验收方式。
- 证据：`2026-04-07` 视频详情页新增评论、作品点赞/收藏、评论点赞，以及作者页关注切换，都是先在 Playwright 中看到页面文案和计数变化，再通过 `/api/videos/{id}`、`/api/workflows/{id}`、`/api/comments`、`/api/creators/{id}` 确认真实返回值已同步变化。
- 适用范围：`apps/web` 的 server action 页面、真实后端联调、定位“页面变了但不确定是否真写库”的场景。

### 真实 smoke 回归结束后，优先把可撤销交互恢复，只允许少量不可逆评论残留
- 场景：浏览器端回归需要真实点击点赞、收藏、关注、评论点赞这类可逆动作，如果不在验证完成后撤销，后续演示和二次回归的基础数据会越来越脏。
- 结论：每次真实 smoke 结束后，应立即把点赞、收藏、关注、评论点赞这类可逆状态回退到初始值；对当前没有删除入口的评论，只保留最少量的 smoke 留痕，并尽快补数据重置入口。
- 证据：`2026-04-07` 这轮回归结束后，视频与工作流的 `likeCount` / `favoriteCount`、评论 `viewerActions.liked`、作者 `followerCount` 都已通过浏览器撤销并再次由 `18080` 接口核对回落到 `0/false`，最终只剩 1 条视频 smoke 评论和 1 条工作流 smoke 评论。
- 适用范围：本地回归环境、联调演示环境、后续继续使用固定 smoke 内容做浏览器验收的场景。

### 本地真实联调环境最好固定一个“可恢复的 smoke 基线”，并提供一键重置脚本
- 场景：真实前后端一旦开始联调，评论、点赞、收藏、关注这些数据会不断把本地 PostgreSQL 污染掉；如果没有固定基线，后面的 Playwright 回归和演示都会越来越难判断“当前是不是正常状态”。
- 结论：应尽快固定一组 smoke 内容和保留数据，然后提供一个一键重置脚本，把“新增 smoke 评论 + Demo 身份在 smoke 内容上的点赞/收藏/关注/评论点赞”统一恢复到基线；脚本最好直接通过 Docker 进入本地 PostgreSQL 容器执行，避免依赖本机额外安装 `psql`。
- 证据：`2026-04-07` 新增的 `scripts/reset-local-browser-smoke-state.sql` 与 `scripts/reset-local-browser-smoke-state.ps1` 已能把环境恢复到“视频评论数 2、工作流评论数 1、点赞/收藏/粉丝数全为 0”的固定状态；首次执行隐藏了 2 条新增 smoke 评论，二次执行 `hidden_comment_count = 0`，确认已具备幂等行为。
- 适用范围：本地 Docker 开发环境、Playwright 浏览器回归、继续沿用 `Browser video smoke 20260407` / `Browser workflow smoke 20260407` 作为固定演示数据的阶段。

## 2026-04-07 发布链路补记

### 社区公开查询一定要显式过滤 `publish_status = published`，公开统计也只能统计已发布内容
- 场景：发布链路已经把草稿提交后的对象提前写入 `videos` / `workflows`，但这些对象在审核通过前并不应该出现在首页、详情页、作者页和公开统计里。
- 结论：`Video` / `Workflow` 的公开详情、作者公开视频/工作流列表、关联内容、首页 feed 查询，必须统一加上 `publish_status = 'published'`；同时 `creator_profiles.video_count/workflow_count` 和 `workflows.video_bind_count` 也只能按已发布内容回刷，否则审核中的内容会提前泄露到社区界面。
- 证据：`2026-04-07` 在接通 `audit-callback` 前，公开读接口可以直接读到 `in_review` 内容；补齐查询过滤和计数规则后，验证结果变成“提交审核后公开不可见，审核通过后才进入详情页、作者页和首页”。
- 适用范围：所有面向游客或普通登录用户的社区读接口、作者主页统计、工作流被引用数统计。

### `feed_items.rank_score numeric(12,4)` 不能直接存原始 Unix 秒时间戳
- 场景：审核通过时需要给 `feed_items` 写一个按发布时间排序的分值。
- 结论：不要直接把 `publishedAt.toEpochSecond()` 写进 `numeric(12,4)`；这个字段最大只能容纳小于 `10^8` 的绝对值。更稳的做法是先缩放，例如把秒时间戳左移两位后再写入。
- 证据：`2026-04-07` 首次接 `audit-callback` 时，`feed_items.rank_score` 因为写入原始秒级时间戳触发 `numeric field overflow`；改为缩放后的分值后审核通过链路恢复正常。
- 适用范围：首页投放池排序分、热门分、任何要写进 `feed_items.rank_score` 的临时排序策略。

### 离线环境下如果 Flyway 迁移文件改名或删号后出现旧文件残留，先手动清理 `target` 再重打包
- 场景：本地网络受限，`mvn clean` 可能因为无法下载 `maven-clean-plugin` 而失败，但 `target` 目录里的旧迁移文件仍会被重复打进新 jar。
- 结论：如果已经确认源码里的迁移文件版本正确，但启动日志仍然报“旧迁移文件也在 jar 里”，优先手动删除 `apps/server/target`，再重新执行 `package`；不要先怀疑 Flyway 自身或数据库状态。
- 证据：`2026-04-07` 新增 feed 索引迁移时，`V3` 改成 `V4` 后源码已正确，但旧 `V3` 仍残留在打包产物里，导致后端继续报版本冲突；手动清理 `target` 后重新打包，问题立即消失。
- 适用范围：Flyway 迁移文件重命名、离线/代理不稳定环境、Maven 无法顺利执行 `clean` 的本地联调阶段。

### Spring Boot 应用入口放在 `bootstrap` 子包时，要显式补 `@EntityScan` 和 `@EnableJpaRepositories`
- 场景：应用主类位于 `com.dramatv.community.bootstrap`，而实体、仓库和业务模块分散在 `com.dramatv.community.*` 其他子包。
- 结论：不要默认依赖 Spring Boot 从主类包向下的自动扫描；如果主类不在公共根包，应该显式加上 `@EntityScan(basePackages = "com.dramatv.community")` 和 `@EnableJpaRepositories(basePackages = "com.dramatv.community")`，否则 JPA 实体和 repository 很容易在本地联调时漏扫。
- 证据：`2026-04-07` 在把 `publish_drafts` 持久化接入 PostgreSQL 时，补齐这两个注解后，发布草稿实体和仓库才被正确装配并完成真实落库。
- 适用范围：后端模块拆包、应用入口不在统一根包、JPA 新模块首次接入时。

### 发布页这类“既要真实写库、又要兼容 mock”的页面，优先用 server action 承接保存动作
- 场景：`apps/web` 既要优先请求 Spring Boot，又要在后端不可用时自动回退到 mock，同时浏览器端不应该依赖私有的 `DRAMATV_API_BASE_URL`。
- 结论：把保存和提交封装到 server action，再由 server action 调用统一 service 层，是当前阶段最稳的做法；这样既能沿用后端优先 + mock fallback，也不会把环境变量和接口细节散落到客户端组件里。
- 证据：`2026-04-07` 发布页已通过 `actions.ts + community-service.ts` 打通视频草稿和工作流草稿的保存、提交审核链路，且 `npm.cmd run build` 与 `npx.cmd tsc --noEmit` 均通过。
- 适用范围：发布页、需要真实落库的表单页、后续评论提交和互动操作。

### 本地联调时默认先怀疑 `8080` 端口冲突，必要时直接切 `18080`
- 场景：本机同时存在旧前端原型、Vite 服务或其他本地服务，后端按默认 `8080` 启动时可能冲突。
- 结论：如果 `8080` 被占用，不要先怀疑数据库或后端代码；优先检查本机占用进程，并在需要快速验证时直接用 `-Dserver.port=18080` 启动后端。
- 证据：`2026-04-07` 发布草稿真实联调时，后端通过 `18080` 成功完成视频草稿和工作流草稿的创建、更新、查询与数据库验证。
- 适用范围：本地后端联调、pgAdmin 对照验证、Playwright 或前后端并行启动阶段。

### 进入全链路阶段后，前端不要再默认保留隐式 mock fallback
- 场景：社区主线已经开始做真实数据库、真实草稿保存和真实提交流程，这时继续让前端“后端失败自动回退 mock”会掩盖真实问题。
- 结论：进入全链路阶段后，前端数据模式应该改成显式 `real / mock`；默认使用 `real`，后端不可用时直接展示明确错误态，只在明确做 UI 预览时才手动切到 `mock`。
- 证据：`2026-04-07` 已把 `apps/web` 改成默认 `DRAMATV_DATA_MODE=real`，社区页面在 `real` 模式下不再自动回退假数据，构建检查仍然通过。
- 适用范围：发布页、首页、详情页、作者页、画布运行态页，以及后续评论、互动、复制工作流等真实业务链路。

### 前端展示层先统一做 `normalizeText` / `normalizeAssetUrl`，能显著减少空值和假资源引发的噪音请求
- 场景：真实后端和历史数据里会出现 `null`、`undefined`、空字符串，甚至指向 `cdn.dramatv.local` 这类本地占位资源的字段；如果页面直接使用，会在浏览器里产生 `/null`、无效图片、无效视频与额外报错。
- 结论：展示层应统一在进入组件前做文本与资源地址归一化，把空值和已知占位 host 过滤掉，再交给卡片、详情页和作者页渲染，而不是在每个组件里零散判断。
- 证据：`2026-04-07` 在 `apps/web/src/lib/presentation.ts` 增加归一化方法后，首页、详情页、作者页和发布页里的 `/null`、`cdn.dramatv.local` 等噪音请求已经消失，Playwright 控制台和网络检查也恢复干净。
- 适用范围：封面图、头像、视频资源、摘要文案、标签文案、后续评论和互动列表。

### 新发布内容中文正常而旧内容显示 `????` 时，优先判断为历史库数据损坏，不要先怀疑当前前端编码链路
- 场景：页面中文化完成后，个别旧工作流或旧视频详情里仍显示 `????`，容易误以为是前端编码或 SSR 渲染又坏了。
- 结论：如果新提交并审核通过的内容显示正常，而只有历史已发布内容异常，应优先排查旧 seed、旧数据库文本和历史导入链路；不要反复重改当前前端文案层。
- 证据：`2026-04-07` 通过真实发布链路新建并审核通过的视频草稿、工作流草稿后，详情页中文显示正常；只有旧工作流 `ceb313a8-222e-41bc-b749-0f6a78cbc7fe` 等历史内容仍保留 `????`，结论是旧库数据已损坏。
- 适用范围：页面中文检查、回归测试、后续补种子数据和历史数据清洗。

### 用 PowerShell 读源码时如果看到乱码，先用 `-Encoding utf8` 或页面实际渲染结果复核，不要直接判定文件被写坏
- 场景：Windows PowerShell 默认输出编码不稳定，同一个 UTF-8 文件在 `Get-Content` 下可能显示乱码，但 `rg`、构建结果和浏览器页面是正常的。
- 结论：遇到这种情况先改用 `Get-Content -Encoding utf8`、`rg` 或直接看页面渲染；只有多种渠道都异常时，再判断源码内容真的损坏。
- 证据：`2026-04-07` `apps/web/src/lib/presentation.ts` 在普通 `Get-Content` 下显示乱码，但改用 `-Encoding utf8` 后中文正常，且 `tsc`、`build`、Playwright 页面回归都通过。
- 适用范围：Windows 本地开发、Codex CLI 输出排查、文案和编码问题定位。

### 排查中文编码问题时，优先用 UTF-8 文件 `--data-binary` 直传后端，不要先用终端内联中文构造请求
- 场景：PowerShell here-string、内联 Node 脚本、部分自动化输入链路在 Windows 下可能先被终端编码污染，导致后端看起来像“保存中文失败”。
- 结论：如果要验证后端 JSON 接口本身能不能正确处理中文，先把请求体写成 UTF-8 文件，再用 `curl --data-binary @file.json` 发送；这样能把终端编码干扰排除掉。
- 证据：`2026-04-07` 直接在终端里构造中文请求时，草稿标题和摘要会落成 `????` 或 mojibake；改成 `tmp/*.json` UTF-8 文件直传后，`/api/video-drafts/{id}` 与 `/api/workflow-drafts/{id}` 返回中文完全正常。
- 适用范围：本地接口联调、编码问题排查、批量导入或脚本化测试。

### PowerShell 直接查看接口 JSON 时可能把正确 UTF-8 响应显示成 mojibake，要用浏览器页面或 UTF-8 文件链路交叉验证
- 场景：数据库里明明是正常中文，浏览器页面也显示正常，但 `Invoke-RestMethod` 或终端 JSON 输出仍可能出现 `ç¨æµ...` 这类乱码。
- 结论：不要只依据 PowerShell 的接口输出判断“后端返回坏了”；至少要再看一次浏览器真实页面或用别的 UTF-8 友好工具交叉验证。
- 证据：`2026-04-07` `Browser video smoke 20260407` 和 `Browser workflow smoke 20260407` 在 PostgreSQL 查询与 Playwright 页面里都是正常中文，但 PowerShell 直接打印接口 JSON 时仍会显示 mojibake。
- 适用范围：Windows 本地 API 联调、回归测试、排查数据库与接口是否真的坏数据。

### 本地社区联调如果出现明显异常的 `review gate` 测试内容，优先用定向清理脚本收口，而不是手工在页面里逐条修
- 场景：联调用例会在本地数据库里留下带 `review gate` 命名的测试视频、工作流、草稿与 feed 记录，坏数据一旦公开会持续干扰首页、详情页和关联推荐。
- 结论：优先写成只匹配明确目标 ID 的 SQL 清理脚本，集中修复关联关系、隐藏坏公开记录并同步回刷计数；不要靠手工点页面逐个修状态。
- 证据：`2026-04-07` 新增并执行 `scripts/repair-local-community-test-data.sql` 后，本地公开内容收敛为一条正常视频和一条正常工作流，坏工作流公开页恢复 `404`，视频详情也重新挂回正确工作流。
- 适用范围：本地 smoke 数据维护、回归前清场、多人共用同一套开发数据库时的测试数据治理。

## 2026-04-07 新验证

### Spring Boot 本地持久化开发优先走 `mock` 默认档 + `local-db` 显式切换
- 场景：后端接口骨架阶段与真实数据库落库阶段并行推进。
- 结论：`application.yml` 保留通用 datasource / flyway 配置，默认 profile 固定为 `mock`；只有在显式启用 `local-db` 时才连接 `PostgreSQL + Redis` 并执行 `Flyway`。这样既不阻塞骨架开发，又能把持久化联调入口固定下来。
- 证据：`2026-04-07` 已用 `scripts/run-server-local-db.ps1` 启动成功，`http://127.0.0.1:8080/actuator/health` 返回正常，`dramatv` 库中已出现 `flyway_schema_history` 在内的 19 张表。
- 适用范围：后端本地调试、数据库迁移验证、第一阶段真实落库联调。

### Maven 本地仓库优先放到项目内 `.tools/m2/repository`
- 场景：本地工具链可用，但用户目录 `.m2` 可能因为沙箱、权限或环境差异导致构建失败。
- 结论：`scripts/use-local-java17-maven.ps1` 应默认把 `maven.repo.local` 指向工作区内的 `.tools/m2/repository`，避免把构建成功依赖在用户目录状态上。
- 证据：`2026-04-07` 修改后，后端已成功下载依赖并完成 `apps/server` 的 `package` 构建。
- 适用范围：本机开发、沙箱环境、多人协作时统一 Maven 缓存路径。

## 已验证有效的方法

### P0 先打通社区主线，再补互动和画布增强

- 场景：第一阶段产品优先级收束。
- 结论：`P0` 必须先打通首页、视频详情、工作流详情、作者主页、发布页这条社区主线；`复制到画布` 和 `runtime 渐进加载` 归为 `P2` 二级增强。
- 证据：已与用户确认方向，并已同步到 `AGENTS.md`、总览文档、优先级文档和当前页面实现。
- 适用范围：产品排期、页面优先级、API 规划、技术实现顺序。

### 正式技术栈固定为 Next.js + Spring Boot + PostgreSQL

- 场景：技术栈选型与后续开发收口。
- 结论：社区正式工程固定为 `Next.js + Spring Boot + PostgreSQL + Redis + Python Worker/FastAPI`；根目录 `React + Vite` 原型保留为参考，不再作为主线扩展。
- 证据：技术栈分析、总览文档、后端 `pom.xml`、前端 `apps/web` 工程和数据库迁移都已围绕这条主线展开。
- 适用范围：新功能开发、模块划分、基础设施准备、协作分工。

### 正式前端迁移时，优先用“后端优先 + mock fallback”

- 场景：从原型过渡到 `Next.js + Spring Boot` 的中间阶段。
- 结论：页面数据入口应统一收敛到一层 service，优先请求真实后端，失败时自动回退本地 mock，而不是让页面直接依赖 mock 数据。
- 证据：`apps/web` 已按此方式接通首页、详情页、作者页、发布页、canvas 页，并在 `npm.cmd run build` 下保持稳定通过。
- 适用范围：前端迁移期、多人并行开发、后端未随时可用的阶段。

### 当前机器上，优先用 Docker Compose 起 PostgreSQL + Redis

- 场景：本地已经有 `Docker`，但没有 `psql`、`redis-cli`，同时数据库客户端已被卸载。
- 结论：对于 DramaTV 这条主线，优先补数据库服务本身，不先恢复 `DataGrip` 或 `Navicat`；直接用 `Docker Compose` 起 `PostgreSQL + Redis` 更省事，也更贴近仓库配置。
- 证据：当前仓库已补齐 `infra/local/docker-compose.yml`、`infra/local/.env.example`、`apps/server/.env.example` 和 `docs/04_实施设计/本地开发环境准备.md`，且 compose 配置已通过 `docker compose ... config` 校验。
- 适用范围：新机器初始化、本地环境恢复、多人协作时统一数据库与缓存启动方式。

### 当前机器网络异常时，优先检查 Clash Verge 代理

- 场景：拉镜像、安装依赖、访问网页、调用外部 API 时出现超时、连接失败、代理报错等网络问题。
- 结论：默认先假设当前机器开着 `Clash Verge` 代理；排查网络问题时，先检查系统代理、虚拟网卡模式和本地代理端口，再判断是不是目标服务本身故障。
- 证据：用户于 `2026-04-07` 提供截图确认 `Clash Verge` 的系统代理和虚拟网卡模式处于开启状态，界面显示本地端口为 `7897`。
- 适用范围：联网命令、`docker` 拉镜像、包管理器安装、浏览器访问、外部服务联调。

## 已确认会重复出现的问题

- 机器环境和项目目标不一致时，最容易在数据库选型和后端启动上绕远路。
- 前端原型阶段如果没有统一数据入口，后面迁移到正式后端时会重复返工。
- 工作流复制与画布联动容易让讨论跑偏，必须持续回到社区主线闭环。

## 本地工具使用补充

### pgAdmin 保存本地连接后，后续通常不会再弹密码框

- 场景：在 `pgAdmin` 中手动注册本地 PostgreSQL 服务器，且已打开 `Save password?`。
- 结论：如果服务器保存成功，后续展开 `DramaTV Local PG` 时通常不会再次弹出密码框，这说明密码已经被当前 pgAdmin 会话保存。
- 证据：用户于 `2026-04-07` 手动完成 `pgAdmin` 连接配置后，左侧已正常展开 `DramaTV Local PG -> 数据库`，且没有再次出现密码弹窗。
- 适用范围：本机 pgAdmin 连接确认、数据库可视化管理、后续查看库表结构。

## 待后续沉淀的重点

- 卡片信息密度控制
- 视频封面、预览、原视频的加载策略
- 评论区性能与折叠策略
- 视频与工作流的绑定展示方式
- 移动端社区布局可读性
## 2026-04-07 互动链路补记

### Windows 本地如果同时出现中文路径和 `Path/PATH` 冲突，不要再用硬编码脚本或 `Start-Process` 拉后端常驻
- 场景：项目工作区位于中文路径下，而当前 PowerShell 环境里又存在重复的 `Path/PATH` 键；这时硬编码绝对路径脚本容易直接变成乱码，`Start-Process` 也会在启动前就抛出环境变量冲突。
- 结论：本地 `18080` 常驻启动优先改成“脚本内动态解析工作区路径 + `Win32_Process` 后台创建进程 + 固定日志文件”这条路线，不要再依赖写死工作区路径的脚本，也不要再把 `Start-Process` 当成默认方案。
- 证据：`2026-04-07` 原版 `scripts/start-server-18080.ps1` 因中文路径 mojibake 直接失效，`Start-Process` 又稳定报 `Path/PATH` 重复键；改成 `Win32_Process` 后，`local-db` 的 Spring Boot jar 已能稳定常驻在 `http://127.0.0.1:18080`。
- 适用范围：Windows 本地后端常驻启动、Codex CLI/桌面端联调、中文路径项目目录。

### 关注链路联调时，先确认目标作者不是当前 Demo 登录人
- 场景：当前真实后端默认仍用 Demo 身份 `11111111-1111-1111-1111-111111111111` 作为互动执行者，而公开 smoke 内容也可能刚好由这个作者发布。
- 结论：验证 `POST /api/interactions/follow` 时，先确认 `followeeId` 不是 Demo 作者本人；如果命中了自己，接口返回 `FOLLOW_SELF_FORBIDDEN` 是正常业务规则，不应误判成接口故障。
- 证据：`2026-04-07` 直接对公开 smoke 作者发起关注时返回 `FOLLOW_SELF_FORBIDDEN`；补入本地 smoke 作者 `33333333-3333-3333-3333-333333333333` 后，关注与取消关注都能正确回刷 `creator_profiles.follower_count` 和 `viewerActions.followed`。
- 适用范围：关注接口联调、作者页 viewerActions 回归、后续接前端关注按钮时的测试用例选择。

### 评论与互动回归最好同时做“激活”和“撤销”两段，不要只测单向成功
- 场景：点赞、收藏、关注、评论点赞这类动作如果只验证 `POST` 成功，很容易遗漏 `DELETE` 后计数不回落、`viewerActions` 不复位之类的状态错误。
- 结论：基础互动 smoke 至少要覆盖一次“创建/激活 -> 详情页和列表回刷 -> 取消/撤销 -> 计数与 viewerActions 回落”的完整闭环；评论则至少覆盖一次“根评论 -> 回复 -> replyCount 回刷”。
- 证据：`2026-04-07` 视频点赞/收藏、工作流点赞/收藏、评论点赞、作者关注都已验证 `POST` 后状态变为激活，`DELETE` 后对应 `likeCount` / `favoriteCount` / `followerCount` 与 `viewerActions` 又能同步回落；视频根评论创建后 `commentCount` 回刷为 `2`，根评论 `replyCount` 变为 `1`。
- 适用范围：评论区联调、互动接口联调、前端按钮接真实后端前的后端 smoke 验证。

### 正式工程和旧原型并存时，要尽早做物理隔离
- 场景：仓库里同时存在 `apps/web` 正式工程与根目录旧 `React + Vite` 原型，页面、资源、启动命令都容易被误认成还在并行推进。
- 结论：一旦正式工程主线确定，就应把旧原型迁到单独归档目录，并把仓库根入口命令改为默认指向正式工程，只给旧原型保留显式归档入口。
- 证据：`2026-04-07` 已将根目录原型整体迁移到 `archive/legacy-react-vite-prototype`，同时把根目录 `package.json` 收口为 `dev:web / build:web` 正式入口，用户明确希望先做这一步以避免后续页面美化阶段继续混淆。
- 适用范围：正式工程替换原型、多人协作、前端重构前的仓库整理。

### 外部设计参考仓库落地后，要先做“筛选文档”再做页面重构
- 场景：像 `awesome-design-md` 这类参考仓库一次会带来几十套设计语言，如果不先筛选，很容易在正式重构时不断摇摆，页面一会像媒体站、一会像工具站。
- 结论：先把外部参考保存到项目内独立目录，再额外写一份“哪些适合首页、详情页、工作流页、发布页，哪些不适合”的项目筛选文档，能显著减少后续风格漂移。
- 证据：`2026-04-07` 已把 `awesome-design-md` 保存到 `docs/98_外部参考/awesome-design-md`，并同步产出 `docs/02_研究/前端视觉参考与改版方向.md`，把 `RunwayML / Pinterest / Linear / Spotify` 与 DramaTV 的五个核心页面结构一一对应。
- 适用范围：前端视觉重构、设计语言收敛、AI 辅助生成页面前的准备阶段。

### 正式开始前端重构前，先写项目自己的 `DESIGN.md`
- 场景：参考方向已经很多，但如果没有一份项目内的统一设计规则，真正改页面时还是会在“像 Runway 一点”还是“像工具后台一点”之间反复摇摆。
- 结论：在开始改 `globals.css` 和页面组件之前，先把项目自己的 `DESIGN.md` 写出来，明确视觉气质、配色、字体、组件规则和页面目标，后续所有前端改造都以它为锚点。
- 证据：`2026-04-07` 已新增根目录 `DESIGN.md`，明确 DramaTV 的基调是“深夜放映厅 + 创作者工作台”，并固定了首页、视频详情页、工作流详情页、创作者主页、发布页各自的视觉目标与禁区。
- 适用范围：前端视觉重构、多轮 AI 辅助页面生成、多人协作时统一审美方向。

### 页面重构前，先把“优秀案例借鉴 + 五页结构规划”画成图
- 场景：只写文字规则时，团队很容易理解成“有设计方向了”，但一到真正改页面又会重新争论首页像官网、工作流页像附件页还是发布页像后台表单。
- 结论：在开始前端实现前，先把优秀案例借鉴点和五个核心页面结构画成一张页面规划图，能明显减少后续页面层面的跑偏。
- 证据：`2026-04-07` 已新增 `docs/03_架构/社区页面规划图.drawio` 和配套说明文档，把 `Runway / TapTap / LiblibAI / RunningHub / Pinterest` 与 DramaTV 的首页、视频详情页、工作流详情页、作者主页、发布页逐一对应。
- 适用范围：页面信息架构收敛、视觉重构前对齐、多人讨论页面结构时统一语境。

## 2026-04-07 讨论层分层经验

### 对象评论和独立讨论帖必须分层，不能用一个系统同时承担两种语义
- 场景：项目同时需要“视频 / 工作流对象评论”和“提示词经验 / 制作经验 / 工作流经验”的横向讨论，如果把两者都塞进同一个评论系统，页面很快会既不像对象页，也不像论坛页。
- 结论：对象评论继续挂在视频详情页和工作流详情页；独立讨论层单独走 `/discussions` 与 `/discussions/[slug]`，先做前端骨架和接口预留，后续再补真实帖子实体与接口。
- 证据：`2026-04-07` 已在 `apps/web` 主线补入讨论区导航、首页讨论入口、讨论区首页和讨论帖详情骨架，同时明确页面状态为 `已接真实后端 / 前端占位 / 接口预留`，避免把未来能力伪装成已完成。
- 适用范围：社区产品信息架构、讨论系统设计、后续帖子与对象绑定能力落地。

### 预填充视频进入正式工程前，先做“稳定短文件名 + manifest”再使用
- 场景：归档原型里的视频素材文件名通常直接带长提示词、特殊空格和大量中文标点，如果直接拿这些文件名做正式前端 URL、seed 路径或脚本输入，后续很容易在浏览器、命令行和数据库里出现引用混乱。
- 结论：这类视频素材进入正式工程时，先复制到正式目录，再统一改成稳定短文件名，同时补一份 `manifest.json` 记录原文件名映射和建议用途。
- 证据：`2026-04-07` 已把 `archive/legacy-react-vite-prototype/public/prefill-videos` 收口到 `apps/web/public/prefill-videos`，并补了 `manifest.json`；其中带特殊空格的 `jimeng-2026-03-21-9949...mp4` 如果直接硬写路径就会失败，而通过“正式目录 + 短文件名”后续引用就稳定很多。
- 适用范围：本地视频素材整理、正式前端资源接入、seed 资源目录维护。

### 首页大视频资源可以少量自动播放，但列表区不要整排自动播
- 场景：有了一批本地预填充视频之后，首页最容易走偏成“为了展示素材把整排卡片都自动播放”，这会直接拉高带宽和页面负担，也会破坏社区浏览节奏。
- 结论：首页可以只给 Hero 或单个精选位自动播放一条样片；列表区和样片区改成手动播放或点击后播放，继续遵守“列表默认不全量自动播放”的媒体规则。
- 证据：`2026-04-07` 正式首页已改成“Hero 一条精选样片自动播放 + 样片区手动播放”，同时视频详情页单独补了真实 `<video>` 播放层。
- 适用范围：首页媒体策略、前端视频播放层设计、后续首页改版与专题页设计。

### 视频详情页在真实播放地址缺失时，可以用“明确标识的本地预填充样片”承接版面
- 场景：当前真实后端链路已经打通，但很多内容还没有稳定返回可播放 `sourceUrl / previewUrl`；如果详情页只有一张背景图，很难继续推进视频播放层和页面排版。
- 结论：可以在详情页里优先把 `<video>` 播放层做出来；当真实播放地址缺失时，用明确标注为“本地预填充样片”的 fallback 承接版面，但不能伪装成真实内容资源。
- 证据：`2026-04-07` 已在 `VideoDetailPage` 中加入“真实地址优先，否则退到本地预填充样片”的逻辑，并在界面上明确标出当前是 `真实视频资源` 还是 `本地预填充样片`。
- 适用范围：视频详情页改版、真实媒体地址尚未完整接通的阶段、前端播放层先行落地。

## 2026-04-10 全链路排障规范补记

### 全链路阶段先补 `requestId`、错误码映射和稳定日志，再继续堆功能
- 场景：社区项目已经进入前端真实请求、后端真实 JDBC / PostgreSQL、发布与画布联动逐步接通的阶段；如果还停留在“出问题靠截图和口头描述”，排障成本会迅速失控。
- 结论：进入全链路开发后，必须把 `requestId` 贯穿、关键业务 ID 打点、统一错误码映射、稳定日志落盘一起建设；这些不是“以后再补的运维项”，而是当前开发效率的基础设施。
- 证据：本仓库后端已存在 `RequestIdFilter` 这类链路追踪基础，但前端尚未把 `X-Request-Id` 作为固定请求约束，异常映射与日志规范也还未收口到统一规则中。
- 适用范围：发布、上传、评论、审核、画布联动、异步任务回查、前后端联调。

### 跨上传 / 画布 / 审核链路，不能把第三方原始错误直接暴露给前端
- 场景：上传 token、对象存储、画布 runtime、审核回调这类链路天然跨系统；一旦直接抛原始异常，前端看到的是难以行动的技术噪音，后端日志里又容易泄露敏感信息。
- 结论：第三方或跨系统错误必须先映射成内部业务错误码，再返回“安全文案 + 错误码 + requestId”；日志里也不能直接打印 token、签名 URL、超大 prompt 或第三方原始响应体。
- 证据：当前仓库里仍存在用业务文案直接抛异常的服务实现，说明如果不提前收紧规范，后续上传和画布联动会继续沿用粗放错误处理方式。
- 适用范围：文件上传、画布复制、运行时打开、审核回调、第三方媒体服务、对象存储集成。
- 2026-04-12 验证了一条对这个项目更合适的联调规则：审核回调属于内部链路，不放到用户端发布页。要做本地 `in_review -> published` 演示时，优先复用现有 `/api/internal/audit-callback`，通过内部脚本或 devtools 触发，再去验证详情页、Feed 和工作流绑定计数是否同步。
- 2026-04-12 在当前 Codex 执行环境里，后端真链路 smoke 更稳的做法是：同一条 PowerShell 命令内临时启动 Spring Boot 进程、轮询健康检查、完成接口请求、最后在 `finally` 里停进程。直接后台常驻启动容易遇到 jar 文件锁或子进程生命周期不稳定的问题。
- 2026-04-12 在当前本地环境里，可执行 Spring Boot jar 偶发 `NoClassDefFoundError` 类加载异常，而 `spring-boot:run` 做一次性 smoke 更稳定。遇到 jar 重打包成功但临时进程启动异常时，优先切回 `spring-boot:run` 验证接口行为，不要被 jar 运行态噪音卡住功能联调。
- 2026-04-12 当前本地联调最稳定的启动路径是：前端用非沙箱 `npm.cmd run dev -- --hostname 127.0.0.1 --port 3106`，后端用非沙箱直接运行 `apps/server/target/dramatv-community-server-0.1.0-SNAPSHOT.jar`。`spring-boot:run` 在这个环境里容易短暂可用后被带停，重新 `package` 前要先停掉占用中的旧 jar。
- 2026-04-12 讨论区卡片层的快操作如果要落地到真实链路，首页和讨论列表必须共用同一份讨论卡片视图模型，至少同步 `likeCount`、`favoriteCount`、`viewerActions.liked`、`viewerActions.favorited`，否则首页侧卡与列表页会出现状态不同步。
### 帖子绑定目标不要要求创作者手填 `targetId`，优先直接提供当前作者已发布内容候选
- 场景：帖子发布已经接入真实后端后，如果还要求创作者手填 `bindingTargetId`，就等于把“内容联动”卡在内部 ID 认知上，真实可用性会明显下降。
- 结论：发布页优先直接拉当前作者已发布的 `videos/workflows` 作为 `Published Target` 候选，选择后自动回填 `bindingTargetId`；同时保留手填兜底，避免候选列表为空时把链路做死。
- 证据：`2026-04-12` 已在 `PublishPage` 上用真实 `creator videos/workflows` 做出帖子绑定选择器，并通过浏览器把 `Review state fix workflow` 直接绑定到新帖子 `post-publish-selector-smoke-20260412-workflow-option`，全程未手填目标 ID。
- 适用范围：帖子发布、作品/流程联动、作者内容管理、后续“从已发布内容发起讨论”之类的发布入口。

### 帖子发布验收不能只看“提交成功”，要连着核对详情页、绑定跳转和讨论入口回流
- 场景：讨论贴是社区横向内容，发布成功后如果只停留在 `/publish` 页提示成功，很容易漏掉 slug 生成、绑定渲染、讨论 hub 列表回流这些真正影响用户可见面的环节。
- 结论：帖子发布 smoke 至少要串起来验证 `publish success -> discussion detail visible -> bound content jump -> /api/discussions/home featuredThreads visible -> homepage discussion shelf visible`。
- 证据：`2026-04-12` 这轮 selector smoke 中，新线程 `5d02e4ce-f9fc-4aa5-9019-ca5a7e23017b` 已在详情页显示 `Bound workflow: Review state fix workflow`，`/api/discussions/home?channel=video-production` requestId `3134004b-b9c7-4cdb-8122-7200301b94b6` 也已返回它位于首位，首页侧栏同步可见。
- 适用范围：帖子发布、内容绑定验收、讨论区联动回归、后续自动化 smoke 设计。
### 发布页里的绑定候选不能停在下拉框，选中后要立刻给目标预览和跳转
- 场景：帖子发布已经支持从真实候选里选绑定对象后，如果界面只剩一个下拉选项和一个 ID 输入框，创作者仍然很难确认自己到底绑到了哪个对象，尤其当标题相近或需要反复切换时更容易误绑。
- 结论：在发布页选择 `Published Target` 后，页面内要立刻展示目标标题、摘要/默认说明、辅助标签、目标 ID 和直接跳转入口；如果是手填 ID 且当前候选里还解析不到，也要明确告诉用户“可以提交，但暂时无法预览”。
- 证据：`2026-04-12` 已在 `PublishPage` 上为帖子绑定目标补出 `Selected Target` 预览卡，并通过浏览器实测从发布页直接跳到 `/workflows/0c81983d-a087-4791-b9b3-64746732e74f`；手填模式下则显示 `Manual Target` 降级提示，不再伪装成已解析对象。
- 适用范围：帖子发布、后续“从作品发起讨论”入口、工作流绑定、任何需要从已发布对象里做二次引用的表单。
### 帖子保持独立内容，先收口用户端语义，再决定是否清理后端兼容字段
- 场景：社区里同时有“视频与工作流绑定展示”和“帖子/讨论区独立交流”两条线，如果帖子前台也暴露绑定选择、绑定跳转、绑定摘要，用户会把帖子误解成对象附属物，而不是独立讨论空间。
- 结论：用户端只保留“视频可选绑定工作流”这条主线；帖子发布页、帖子详情页、帖子列表卡片都不要展示绑定对象。若后端还保留历史字段，先隐藏/停用前台入口，等产品边界稳定后再决定是否删库删接口。
- 证据：`2026-04-12` 已在 `PublishPage`、`DiscussionDetailPage`、`DiscussionThreadQuickFavoriteCard` 上撤掉帖子绑定 UI，并通过浏览器真实发布帖子 `standalone-post-smoke-20260412-151127` 验证 `/publish -> /discussions/[slug]` 全链路仍可用。
- 适用范围：帖子发布、讨论区详情、讨论区列表卡片、后续帖子产品设计与接口收口。

## 2026-04-14 产品口径补记

### 工作流继续作为视频附属关系展示，不做独立内容展示页方向
- 场景：前期分析文档里一度把“工作流独立发现页”“作者页独立工作流区”列成缺口，但用户已明确纠正产品方向。
- 结论：当前产品口径应固定为“视频与工作流绑定展示”；工作流可以有详情页、可以从视频跳入、可以保留复制到画布入口，但不作为独立内容线去做单独发现页、作者页独立展示区或一级分发页。
- 证据：`2026-04-14` 用户明确要求“工作流一定是和视频一起的，不需要单独展示，不要再强调”。
- 适用范围：产品分析、页面规划、作者页设计、首页信息架构、后续文档与实现优先级判断。

### 个人中心页是当前应补的新页面，至少承接个人信息、点赞和收藏
- 场景：当前已有作者主页、发布页、详情页、讨论页，但登录用户还没有一个统一查看自己信息和互动沉淀的入口。
- 结论：后续页面规划里应补一个“个人中心页”，至少包含个人信息、我的点赞、我的收藏；是否继续扩展“我的发布 / 我的草稿 / 我的关注”可以按阶段追加。
- 证据：`2026-04-14` 用户明确提出“现在还需要补充一个个人中心页面，里面有一些个人信息和点赞和收藏的一些内容”。
- 适用范围：产品分析文档、页面优先级排序、导航设计、后续前端与后端接口规划。
### Playwright MCP reports `Transport closed`: kill stale MCP chains, then restart Codex so config reloads
- Scenario: `mcp__playwright__browser_*` calls return `Transport closed` even after killing the visible `@playwright/mcp` process. This means the Codex session's MCP stdio transport is already closed, not merely that the target page or browser tab was closed.
- Conclusion: Process cleanup can remove stale `cmd -> npx -> playwright-mcp -> node` chains, but it cannot revive the already-closed MCP transport handle inside the current Codex chat. Check command lines with `Get-CimInstance Win32_Process`, kill only the Playwright MCP chain, then reopen/resume Codex so the MCP manager reloads.
- Preventive fix: configure Playwright MCP with `--isolated` in `C:\Users\psk13\.codex\config.toml` so it uses an in-memory browser profile instead of reusing stale `ms-playwright\mcp-chrome*` profile directories.
- Evidence: On 2026-04-21, stale Playwright MCP process chains from 16:48 and 20:39 were killed and no active `SingletonLock` / `DevToolsActivePort` files were found, but the current chat still returned `Transport closed`. Updating config to `args = ['/c', 'npx', '-y', '@playwright/mcp@latest', '--isolated']` will only take effect after a new/resumed Codex session.

## 2026-04-22 popover clipping check

- If a button click changes `aria-expanded` and the accessibility snapshot can already see the `dialog/menu/popover`, but the page still looks like "nothing happened", check ancestor `overflow: hidden` and clipping before re-debugging the API or click handler.
- The 2026-04-22 notification bell issue came from shared header clipping: `.topbar` defaulted to `overflow: hidden` while `NotificationBell` positioned its panel absolutely below the trigger. A scoped override on `.topbar.topbar-home { overflow: visible; }` fixed `/home`, `/featured`, and `/discussions` without needing a portal rewrite.

## 2026-04-22 backend live verification discipline

### 后端新增接口后，先验证“在线进程是否真是新版”，再怀疑 SQL 或业务代码
- 场景：源码里已经加了新 controller / service / DTO，SQL 单独在 PostgreSQL 里也能跑通，但本地接口仍然返回 `500`。
- 结论：这种情况先检查当前 `18080` 端口是不是还挂着旧的 Spring Boot 进程。新增后端接口后，不能只看 `compile` 通过，必须用提权方式重启 `scripts/start-server-dev-18080.ps1`，然后立刻验证 `/actuator/health` 和目标接口一次。
- 证据：`2026-04-22` 的 `/api/me/notifications/recent` 起初返回 `500`，根日志真实异常是 `NoResourceFoundException: No static resource api/me/notifications/recent`，说明请求根本没命中新接口映射，而不是通知 SQL 出错。重启新版后端后，同一路径立即恢复为 `200`。
- 适用范围：所有后端 controller、新增路由、响应 DTO 变更、评论/互动/个人中心接口联调。
## 2026-04-23 API smoke encoding for Chinese content

- When testing Chinese request bodies from Windows PowerShell, do not trust a plain object plus `ConvertTo-Json` path unless the received payload is inspected. In the comment moderation smoke, Chinese text was stored as `???`, which made keyword checks look broken even though the backend rule was correct.
- For API smoke tests that must assert Chinese keywords, send an ASCII JSON body with `\uXXXX` escapes and `Content-Type: application/json; charset=utf-8`, then verify through the API response/list before judging the moderation result.

## 2026-04-23 media asset OSS-readiness audit

- Before discussing OSS migration readiness, do not infer from a few visible pages. First run `node scripts/audit-media-asset-keys.mjs` against the local Postgres container and check whether `media_assets.object_key` is still mixed with absolute URLs, root paths, or blanks.
- If normalization is needed, preview with `node scripts/normalize-media-asset-keys.mjs` before applying `--apply`. The current safe auto-fix rules only cover two local legacy patterns: `local-public` root-path keys and `local_fs` absolute `/media/...` URLs.
- A repository is materially closer to OSS/CDN cutover once business content stores `assetId` or stable `/media/{objectKey}` paths and the audit reports `legacy-style assets = 0`. Treat that audit result as the ground truth, not ad hoc UI inspection.

## 2026-04-24 backend integration test isolation

- For `apps/server` HTTP integration tests, do not depend on seed/demo content such as “any published video” when asserting counters or interaction deltas. Create the author and target content inside the test, then clean it through the shared `it-*` user cleanup path.
- The concrete failure on `InteractionApiIntegrationTest` was a useful reminder: once the test switched to “self-created owner + self-created published video”, the suite stopped being polluted by local interaction history and became stable again.

## 2026-04-24 local startup verification

- Local startup scripts should not stop at “port is listening”. After backend or web starts, run the lightweight readiness check against real HTTP/TCP dependencies before treating the environment as usable.
- The current validated entry is `node scripts/check-local-runtime-readiness.mjs`: backend scope checks `actuator + PostgreSQL + Redis + core APIs + auth`, and full scope adds frontend root, protected-route redirect, and authenticated `/me` rendering. `start-server-dev-18080.ps1` and `start-web-3100.ps1` now default to this post-start verification unless `-SkipReadinessCheck` is explicitly passed.
- When the same `apps/web` workspace already has a live `next dev` instance (for example on `3106`), Next.js will refuse to launch a second `dev` server from that directory even on another port. Use `start-web-3100.ps1 -Mode start -Port <temp-port>` for alternate-port readiness verification instead of trying to run two `dev` instances side by side.

## 2026-04-24 upload proxy over server action

- For media uploads in `apps/web`, do not send large `File` objects through Next `server action` `FormData` when a stable raw-binary path exists. Even with `serverActions.bodySizeLimit`, larger video uploads can still fail at the Next multipart parsing layer with errors like `Unexpected end of form` before the request reaches the Spring backend.
- Prefer a two-step same-origin proxy path instead: small JSON request to obtain the upload policy, then raw `PUT` binary upload through Next route handlers that add the backend `Authorization` header from the httpOnly community cookie. This avoids exposing the token to the browser and avoids fragile multipart parsing in the web tier.
- When fixing one upload entry, sweep all sibling file-upload entries in the repo. On 2026-04-24 the same fix class was applied to publish prompt/workflow uploads, discussion media insertion, and `/me` avatar upload so the issue would not reappear on a neighboring page.

## 2026-04-24 PowerShell deployment script encoding

- For `.ps1` files that must run on Windows PowerShell 5, prefer ASCII-only source. Do not hardcode Chinese file names, Chinese section labels, or full-width punctuation directly in script source when a stable ASCII alternative exists.
- When a script needs data from a Chinese-named file, auto-discover the file by ASCII content signatures first, or accept an explicit absolute path. This is safer than embedding the localized path in source code.
- Use `Get-Content -Encoding UTF8` explicitly, but do not assume terminal rendering proves the file was parsed correctly. Verify by matching stable ASCII tokens such as hostnames, bucket names, ports, and IPv4 lines.
- Remember the CRLF trap: regex patterns that anchor full lines should usually allow trailing whitespace, for example `^\s*...\s*$`, otherwise Windows line endings can break parsing.
- If a PowerShell script needs to execute remote code over SSH, avoid fragile nested shell quoting. Prefer simple remote commands or a heredoc-based `python3 -` probe over stacked `bash -lc` quoting.

## 2026-04-25 PowerShell JSON artifact encoding

- On Windows PowerShell 5, redirecting Node JSON output with `>` can leave the artifact in a BOM-prefixed encoding that later breaks `JSON.parse(...)` reads from Node.
- For JSON artifacts that need to be machine-read in follow-up steps, prefer letting Node write the file itself, or normalize the file to plain UTF-8 without BOM immediately after capture.

## 2026-04-24 cloud connectivity verification order

- When ops updates the test resource file for ECS/RDS/Redis, re-run the connectivity probe from ECS first. The authoritative question is whether `ECS -> RDS/Redis` is open, not whether the developer laptop can reach those endpoints.
- For this project's current cloud setup, laptop DNS for private database and Redis endpoints can still resolve to `198.18.x.x` placeholders and fail TCP tests even after ops has correctly opened the ECS path. Do not treat local `Test-NetConnection` failures as proof that the cloud resources are still unusable.
- The reliable ready state is: `scripts/check-test-env-connectivity.ps1` returns `OK` for the declared database port and Redis from inside ECS. Once that passes, backend deployment can continue even if the laptop still cannot direct-connect the private instances.

## 2026-04-24 ECS deployment script pitfalls

- In PowerShell, do not build SCP-style remote destinations as `"root@$script:ServerHost:$remotePath"`. The scope-qualified variable plus the following colon can collapse the host interpolation and make `pscp` treat the destination as a local path. Use `"root@$($script:ServerHost):$remotePath"` instead.
- When generating `systemd` `EnvironmentFile` content from Windows PowerShell for a Linux server, prefer ASCII or UTF-8 without BOM. A BOM on the first line can make the first environment variable disappear on Linux. In this project it caused `DRAMATV_SERVER_PORT=18080` to be ignored and the service silently fell back to `8080`.
- If `pscp` must upload artifacts from a repository under a Chinese local path, stage the binary into an ASCII temp directory first. The current validated approach is to copy the JAR into `%TEMP%\\dramatv-community-deploy\\dramatv-community-server.jar` before upload.

## 2026-04-24 PostgreSQL cloud migration hardening

- Do not treat `pg_dump --data-only --inserts --column-inserts` output as one physical line = one SQL statement. Prompt text and other long content can contain real newlines, so statement extraction must split on `;` outside SQL string literals.
- The first data row of a dumped table can sit in the same statement chunk as pg_dump comment headers. When extracting rows from a statement chunk, search for `INSERT INTO public.<table>` anywhere in the chunk and trim from that anchor, instead of requiring the chunk to start with `INSERT`.
- For this community schema, naive data-only replay fails because of real FK cycles:
  - `users.avatar_asset_id -> media_assets.id`
  - `media_assets.created_by -> users.id`
  - `comments.parent_id/root_id -> comments.id`
- The validated import strategy is a two-phase replay:
  - import `users` without `avatar_asset_id`
  - import `media_assets` and the rest of the dependent tables
  - update `users.avatar_asset_id`
  - import `comments` without `parent_id/root_id`
  - update `comments.parent_id/root_id`
- Keep cloud overwrites explicit. After a partial failed import, use an opt-in flag such as `-ForceOverwrite` before truncating and replaying business tables into the test cloud database.

## 2026-04-25 YouMind API import username collision

- When importing YouMind content through the real login/upload/publish API path, do not reuse the old legacy importer username prefix `youmind-*` for the temporary local-login author accounts.
- The cloud database can already contain historical YouMind authors with `identity_provider = 'youmind'` and the same `username`. The simple password login flow only searches `identity_provider = 'local'`, so a reused username can miss on lookup and then fail on insert with a unique-key collision, surfacing as a `500`.
- The validated workaround is to keep the visible author `displayName` unchanged but generate API-import login usernames under a separate prefix such as `ymimport-*`.

## 2026-04-25 YouMind prompt category hierarchy

- Keep the first split as content modality: `video_prompt` and `image_prompt`. Do not collapse image and video prompts into one generic prompt bucket.
- The newly added 2026-04-24 image-prompt batches were extracted by category, so they carry a valid upper category:
  - `gpt-image-2 / comic-storyboard`
  - `nano-banana-pro / comic-storyboard`
- The business grouping for both of the batches above is the same:
  - 图片类
  - 生图提示词
  - upper category: `comic-storyboard`
  - Chinese meaning: `漫画 / 故事版`
- Older historical YouMind prompt libraries were direct pulls and currently do not have a trustworthy upper category. Until they are reclassified from source metadata, keep them only at the modality layer (`video_prompt` or `image_prompt`) instead of fabricating a larger category.
- Future import rule: apply an upper category only when the source batch itself was category-aware during extraction; otherwise preserve the raw modality-only classification.

## 2026-04-25 historical prompt metadata backfill

- When earlier cloud-imported prompts are missing `sourcePlatform / sourceCampaign / sourceItemId / sourceUrl / modelName`, do not patch by title matching or manual page lookup.
- The validated backfill path is: `state.json -> exact import key -> local research library metadata -> cloud DB update by prompt id`.
- For this repo, [`scripts/backfill-youmind-prompt-source-metadata.mjs`](E:\点众\DramaTV社区搭建\scripts\backfill-youmind-prompt-source-metadata.mjs) is now the safe path for that job. It preserves category discipline while backfilling only trusted source metadata.
## 2026-04-25 large featured inventory rendering

- Once the cloud mirror starts showing hundreds of real prompt cards, `featured` becomes visibly heavy if it renders the full inventory in one pass, especially when many cards mount video previews together.
- The validated mitigation for this repo is:
  - keep the backend fetch large enough so the page can still eventually show everything
  - but render the client grid progressively in chunks
  - append more cards only as the user scrolls near the bottom
- For the current implementation, [`FeaturedArchivePage.tsx`](E:\点众\DramaTV社区搭建\apps\web\src\features\featured\FeaturedArchivePage.tsx) uses an `IntersectionObserver` sentinel with an initial batch of `24` and a step size of `24`.
- When browser-side category behavior differs between user Edge and MCP Chrome after a resume, check stale frontend session/cache state before assuming the import or classification failed. The verified pattern here was:
  - backend data correct
  - Edge already reflected the new inventory
  - MCP Chrome needed a fresh reload or a new frontend instance

## 2026-04-28 query-tab pages must use a single source of truth

- For Next.js pages whose tabs or filters are encoded in the URL, do not keep a mirrored local tab state initialized from `useSearchParams()` and then sync it back with `router.replace(...)`.
- The unstable pattern is:
  - `const [activeTab, setActiveTab] = useState(parseTab(searchParams.get("tab")))`
  - one effect for `URL -> state`
  - another effect for `state -> router.replace(...)`
- Under rapid clicks, old route writes can land late and overwrite newer user intent, causing self-bouncing URLs or loop-like tab switching.
- The validated fix pattern in this repo is:
  - parse the active tab directly from the current URL on each render
  - tab click handlers build the next route and call `router.replace(...)` once
  - if route canonicalization is needed, isolate it from normal user tab changes and serialize in-flight route writes
- Verified pages that needed this fix class:
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
  - `apps/web/src/features/me/PersonalCenterPage.tsx`
  - `apps/web/src/features/creator/CreatorPage.tsx`

## 2026-04-30 notification SQL unions must align with the shared mapper

- If a backend notification endpoint merges multiple SQL branches with `union all` and then maps every row through one shared row-mapper, every branch must expose the full same column set, even when some fields are semantically unused in that branch.
- In this repo, `MeQueryService.loadInteractionNotifications(...)` and `loadCommentNotifications(...)` both feed `mapNotificationItem(...)`.
- The validated failure mode was:
  - `comment/reply` branches already returned `reply_to_actor_name`
  - `like/favorite` branches did not
  - once a user had both interaction notifications and comment notifications, `/api/me/notifications/recent` failed with `PSQLException: ResultSet 中找不到栏位名称 reply_to_actor_name`
  - frontend bell then looked like “no new notification” even though reply rows were already in DB
- The safe pattern here is:
  - keep the shared mapper strict
  - but force every union branch to select all required columns explicitly, using `null::text as reply_to_actor_name` or similar placeholders where needed
  - add one integration test that mixes at least two notification categories in the same response, not separate single-category tests

## 2026-05-03 auth/session shared-layer consistency

- In this repo, do not let `proxy.ts` and `community-service.ts` read different API base URL env sources. If protected-route middleware and the main server-side API adapter disagree on backend base URL resolution, login/session behavior will diverge by environment.
- The validated safe contract is:
  - both shared layers resolve `DRAMATV_API_BASE_URL || NEXT_PUBLIC_DRAMATV_API_BASE_URL`
  - invalid or revoked cookies are verified through `/api/auth/me`
  - both `401` and `403/FORBIDDEN` mean “session invalid” for frontend route guards
- Also do not rely only on `instanceof` for auth-error classification across Next.js server layers. Route handlers, proxy layers, and different build boundaries can surface the same logical error without preserving the original prototype chain.
- The validated rule here is:
  - keep `instanceof`
  - also fall back to `error.name` plus a minimal structural shape such as `path`
  - centralize `AUTH_REQUIRED` and `FORBIDDEN` classification in one shared helper
- When touching auth/session behavior in this repo, run the local scripted regression instead of only hand-clicking:
  - `node scripts/run-local-auth-session-regression.mjs`
  - or `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-local-stability-suite.ps1 -SkipFrontendBuild -SkipBrowserSmoke -SkipBackendIntegration -SkipApiSmoke`

## 2026-05-03 community auth must stay provider-ready

- In this repo, do not treat the current local password login as the auth model itself. Treat it as one concrete provider implementation.
- The validated compatibility shape is:
  - backend exposes `GET /api/auth/providers`
  - frontend login page reads provider config instead of hardcoding one permanent login mode
  - request payload carries `loginType`
  - current local provider uses `local_password`
  - legacy `password` remains temporarily accepted for backward compatibility in tests/scripts
- When company login is integrated later, prefer “add/switch provider while preserving cookie/session/guard contracts” over rewriting:
  - `/login`
  - `dramatv_access_token`
  - `/api/auth/me`
  - `requireCommunitySession(...)`
  - `proxy.ts` invalid-session redirect semantics

## 2026-05-03 publish moderation semantics for current phase

- In this repo, the current validated community product rule is:
  - publish now = visible now
  - automatic moderation is reserved but not enabled
  - manual moderation belongs to admin later
  - report/abuse workflow belongs to admin later and can escalate via warning thresholds
- Do not mix these three concepts in one field again:
  - draft workflow state
  - content visibility state
  - moderation state
- The safe contract for submit responses is:
  - `draftStatus` describes the draft lifecycle, currently `draft|submitted`
  - `contentStatus` describes visibility, currently published immediately
  - legacy `publishStatus` may be kept temporarily only as a compatibility alias, not as the source of truth for new UI logic
- For current-phase lifecycle reads:
  - default moderation after normal publish should resolve to `not_applicable`
  - do not surface `pending_review` as the default user-facing state unless moderation has actually been enabled

## 2026-05-05 YouMind image prompt incremental sync discipline

- For YouMind image prompt categories that already have an older local snapshot, do not append by page guesswork. The stable method is:
  - refresh the full current category
  - diff against the old snapshot by `id`
  - keep a separate `new-only` library for the increment
- For this repo's `gpt-image-2 / comic-storyboard` refresh, title-level dedup is not safe enough. Use `id` as the primary dedup key.
- When source network quality is unstable, the validated fetch baseline is:
  - longer request timeout
  - bounded retries with small backoff
  - preserve the full raw refresh output even if the handoff target is only the diff
- Asset handoff should preserve classification fields explicitly in manifests and item metadata:
  - `model`
  - `campaign`
  - `categories`
  - source / author attribution
