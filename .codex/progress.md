# 当前快照
<!-- CODEX:SNAPSHOT -->

- Added a dedicated discussion-post composer at `/discussions/new`, using the real `postDraft` bootstrap plus live discussion channel data, instead of reusing the video/workflow-oriented `/publish` page.
- Added `apps/web/src/features/discussions/discussion-markdown.module.css`, moved markdown styles out of `DiscussionComposerPage.module.css`, and upgraded `DiscussionMarkdown` to render image markdown plus `[视频：xxx](url)` and direct video links as embedded video blocks.
- Updated `apps/web/src/features/discussions/DiscussionsPage.tsx` so the hub CTA `发起讨论` now points to `/discussions/new`; updated `apps/web/src/features/discussions/DiscussionDetailPage.tsx` to render markdown body content instead of raw `pre-wrap` text; updated `apps/web/src/features/publish/actions.ts` to revalidate `/discussions/new` on post draft save/submit.
- Adjusted the discussion composer UX to fit a writing page: the new composer keeps the existing dark cinematic community style, but disables the shared floating dock on `/discussions/new` so the editor is not visually obstructed by the extra floating publish entrance.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` succeeded; `apps/web -> npm.cmd run build` succeeded and route table now includes `/discussions/new`; Docker services `dramatv-postgres:5432` and `dramatv-redis:6379` are both healthy; HTTP checks returned `200` for `/discussions` and `/discussions/new`; Playwright verified `发起讨论 -> /discussions/new`, and captured `discussion-hub-entry-desktop-check.png`, `discussion-new-page-check.png`, and `discussion-new-desktop-no-floating-publish.png` with browser console warnings/errors both `0`.
- 当前做到哪一步：讨论帖发布链路已经从通用发布页里拆出来，形成独立的社区帖子编辑页，并且讨论列表入口、详情正文渲染、草稿缓存刷新都已接通。
- 当前卡在哪里：Playwright MCP 一度因为浏览器会话被手动关闭而断开，但重新启动后已恢复；当前未再发现阻塞发帖页上线演示的代码问题。
- 下次先做什么：如果继续精修，优先收桌面端右上角 `预览 / 保存草稿 / 发布帖子` 动作组间距，并补一个更明确的媒体插入提示，让用户更快理解图文/视频 markdown 写法。

- Refined the discussion composer layout after visual review: removed the old fixed split preview column, enlarged the writing area, reduced excessive left/right whitespace, and softened the visual separation between the main editor and the right-side helper cards.
- Moved preview behavior from the old top action cluster into the editor toolbar. The page now uses a modal preview dialog instead of a permanently visible side preview, so long markdown content no longer loses editor width and the preview can grow independently with document length.
- Updated `apps/web/src/features/discussions/DiscussionComposerPage.tsx` and `apps/web/src/features/discussions/DiscussionComposerPage.module.css` only, keeping the rest of the discussion publishing flow unchanged.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` succeeded; `apps/web -> npm.cmd run build` succeeded; Playwright rechecked `http://127.0.0.1:3106/discussions/new`, confirmed the larger editor layout and modal preview behavior, and captured `discussion-new-editor-expanded.png` and `discussion-preview-dialog-check.png` with browser console warnings/errors both `0`.
- 当前做到哪一步：讨论帖发布页已经从“左右分栏挤压编辑区”的状态收口到“主编辑区优先”的状态，正文输入不会再被固定预览区长期压缩。
- 下次先做什么：如果继续精修，优先处理右侧辅助栏的信息优先级，压缩“当前板块 / 编辑格式 / 草稿状态”顶部信息块，再给工具条补一条更直白的媒体插入提示。

- Continued the discussion composer polish after layout review: widened the effective page work area so the editor column can pull further left, reducing the previous left/right whitespace imbalance on desktop.
- Further weakened the helper-column box feeling in `apps/web/src/features/discussions/DiscussionComposerPage.module.css` by softening borders, lowering card/background contrast, tightening gaps, and reducing the visual isolation between the top meta cards and the lower helper sections.
- Fine-tuned the desktop two-column ratio again so the editor column gets a little more dominance while the right helper rail remains aligned and stable.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` succeeded; `apps/web -> npm.cmd run build` succeeded; Playwright rechecked `http://127.0.0.1:3106/discussions/new` and captured `discussion-new-width-and-soft-card-check.png`; browser console warnings/errors remained `0`.
- 当前做到哪一步：发帖页现在已经从“编辑区被挤压 + 右侧组件框感太重”收口到更偏编辑器主导的版式，左右空白和右侧分块隔离感都比上一版弱。
- 下次先做什么：如果继续精修，优先把右侧最上方三块信息合并成更轻的单组信息区，再继续处理工具条和正文首屏的纵向节奏。
- 当前仓库主线已经是 `apps/web` 的 `Next.js + React + TypeScript` 前端与 `apps/server` 的 `Spring Boot` 后端，旧的 `React + Vite` 原型已归档到 `archive/legacy-react-vite-prototype`。
- 社区主站围绕 `首页 / 视频详情 / 工作流详情 / 作者主页 / 发布页` 的 `P0` 闭环推进，讨论区、画布联动、通知回流和治理能力在逐步补齐。
- 运行时 mock 主路径已清理，当前方向固定为全链路开发：前端真实请求、后端真实 JDBC / PostgreSQL 路径、画布绑定真实入库。
- 个人中心 `/me` 第一版已落地，前端已接真实后端 `/api/me/hub`，当前承接“个人信息 + 最近点赞 + 最近收藏”，并与公共作者主页 `/creators/[id]` 完成职责拆分。
- 2026-04-10 新增两张结构图：`docs/03_架构/DramaTV社区功能脑图-详细版.drawio` 与 `docs/03_架构/DramaTV社区关键联动链路图.drawio`，社区结构已从页面罗列推进到“对象 + 小功能 + 状态 + 回流”的层级。

# 当前看板
<!-- CODEX:BOARD -->

- 进行中：把脑图继续落成“对象关系表 + 页面动作清单 + API / 表结构映射”文档，作为后续联调和去占位的执行清单。
- 进行中：沿 `发布 -> 审核 -> Feed -> 详情 -> 互动 -> 作者 -> 继续发现` 主链路对齐页面、接口和状态表达。
- 进行中：`P1` 真实鉴权与当前用户体系，替换固定 demo identity，并打通 publish / interaction / `/me` / canvas 入口链路。
- 待用户提供本地资源路径后推进：`P2` 首页 `/` 与精选 `/featured` 去 demo 资源，替换为真实素材。
- 待推进：`P3` 举报、通知、个人设置/资料编辑从前端占位切到真实后端能力。
- 待推进：`P4` 评论增强，包括回复链路、举报、媒体插入与更完整的讨论能力。
- 待推进：真实上传 / 媒体资产入库、真实鉴权方案、讨论区最小后端实体、通知与消息回流。
- 风险点：讨论区与通知仍未达到和发布链路同等的真实后端完成度；作者页产品规则与部分旧文档仍有偏差，需要继续统一口径。

# 追加日志
<!-- CODEX:LOG -->

### 2026-04-20 Interaction baseline cleanup kickoff

- 本轮“互动数据归零 + 去掉前端互动假数据 + 冒烟验证”改用独立小任务板跟踪，见 `.codex/interaction-cleanup-taskboard.md`；后续在该任务板中逐项划线完成，仅保留这里的最小日志指针，避免再次对大进度文档做高风险大补丁。

### 2026-04-20 Interaction baseline cleanup done

- 已新增 `scripts/reset-local-interaction-baseline.sql` 与 `scripts/reset-local-interaction-baseline.ps1`，并通过 Docker 本地库执行成功；结果校验为 `active_interactions=0 / active_follows=0 / active_comments=0`，且 `videos/workflows/prompts/posts/creator_profiles` 的相关聚合社交计数全部为 `0`。
- 已移除 `apps/web/src/features/video-detail/VideoDetailPage.tsx` 中视频详情页的 demo comments 回退，空评论时改为真实空态提示；已移除 `apps/web/src/features/discussions/DiscussionsPage.tsx` 中讨论列表右侧热门话题的假热度 fallback 和伪造 k 值/涨幅。
- 验证完成：`apps/web -> npx.cmd tsc --noEmit` 通过；代码内已检索不到 `videoDemoComments / promptDemoComments / fallback-smoke / fallback-publish / fallback-workflow / fallback-selector` 等本轮清理目标。

### 2026-04-20 Interaction realization follow-up

- 发现提示词详情页仍复用视频互动动作，后端互动服务也尚未允许 `prompt` 作为真实目标，导致点赞、收藏、评论返回 `INTERACTION_TARGET_NOT_FOUND / COMMENT_TARGET_NOT_FOUND`；本轮改用 `.codex/interaction-realization-taskboard.md` 继续跟踪提示词与工作流互动补漏。

### 2026-04-20 YouMind prompt frontend runtime follow-up

- 恢复本地联调运行态：确认 `dramatv-postgres:5432` 与 `dramatv-redis:6379` 健康，后端 `http://127.0.0.1:18080/actuator/health` 返回 `200`，并重新以 dev 模式启动前端 `http://127.0.0.1:3106`。
- 继续收口 YouMind Prompt 导入后的前端真实链路：`/featured` 已直接读取后端 `/api/prompts?modality=all&sort=hot`，真实导入 Prompt 卡片正常展示并跳转到 `/prompts/[id]`，`/prompts/d38c33fd-7926-53af-961a-e12eb47e5846` 详情页已使用真实后端数据渲染标题、作者、提示词正文和相关推荐。
- 修正 Prompt 详情页相关推荐误跳旧视频路由的问题：`VideoMiniCardView` 新增可选 `href`，`mapVideoMiniCard()` 显式指向 `/videos/{id}`，`mapPromptMiniCard()` 显式指向 `/prompts/{id}`，`VideoDetailPage` 右侧相关推荐区改为优先使用卡片自身 `href`。
- 修正导入视频 Prompt 的媒体显示问题：新增 `isVideoAssetUrl()`，并在 `FeaturedArchivePage`、`CommunityHomePage`、`VideoDetailPage` 中识别 `mp4/webm/...` 资源；视频 Prompt 现已改为静音循环视频预览，不再把 `mp4` 当背景图导致精选页和提示词详情主视觉发黑。
- 已验证：`apps/web -> npx.cmd tsc --noEmit` 通过；Playwright 实测并截图 `tmp-featured-video-preview-fixed.png`、`tmp-prompt-detail-video-preview-fixed.png`、`tmp-home-prompt-preview-check.png`，控制台无新的 runtime error。
- 当前做到哪一步：YouMind Prompt 已从“数据已导入但前端展示不完整”推进到“精选页 / 首页 / Prompt 详情页都能基于真实后端数据显示，且视频 Prompt 有正常预览”。
- 当前剩余问题：首页里仍混有旧 smoke workflow/video 数据，内容编排还没有完全切到导入后的正式 Prompt 体系；Prompt 互动仍是只读展示，尚未接后端真实评论 / 点赞 / 收藏写入。
- 下次先做什么：优先清理首页和其余分区里的旧 smoke 数据来源，继续把 Prompt 作为一级内容接进首页编排；之后再决定是否补 Prompt 真实互动能力和视频封面 poster 生成。

- 继续按用户要求清理首页主编排：`/home` 与 `/` 现在都在服务端额外拉取真实 `/api/prompts?modality=all&sort=hot`，并把首页主要内容分区切成“真实 Prompt 为主 + workflow 继续保留占位”。
- `apps/web/src/features/home/CommunityHomePage.tsx` 已移除旧 `homeFeed` / `discussion` 对首页内容流的主编排影响；除了 workflow 占位那一栏，`为你推荐 / 精选画布 / 电视广告 / 动画 / 叙事短片 / MV / 创意` 现在都使用真实导入 Prompt 数据切片。
- `apps/web/src/features/home/HomePage.tsx` 也已同步到同一口径：landing 首页的 `精选档案` 不再混入旧 smoke 视频和图片，改为真实 Prompt + workflow 占位混排。
- 已验证：`apps/web -> npx.cmd tsc --noEmit` 通过；Playwright 截图 `tmp-home-real-prompts-only.png` 与 `tmp-landing-real-prompts-only.png` 已确认首页主编排里的旧 smoke 视频/图片消失，只剩 workflow 占位继续存在。

### 2026-04-19 backend dev-mode startup optimization

- Added `scripts/start-server-dev-18080.ps1` to avoid the previous backend development loop of stopping the app, rebuilding an executable Spring Boot jar, and restarting `java -jar`.
- The new script reuses the existing local Java 17 + Maven wrapper and `scripts/run-server-local-db.ps1`, starts the backend through `spring-boot:run`, writes logs to `server-dev-18080.out.log` and `server-dev-18080.err.log`, stops any process already listening on port `18080`, and waits for `/actuator/health`.
- Verified the new runtime path: backend now starts from `apps/server/target/classes` through Maven/Spring Boot dev mode, not from `apps/server/target/dramatv-community-server-0.1.0-SNAPSHOT.jar`.
- Practical workflow update: for local backend code changes, use `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-server-dev-18080.ps1`. This compiles changed Java classes and restarts the service without running `package` or touching the executable jar, avoiding the Windows jar-lock issue from `spring-boot:repackage`.

### 2026-04-19 current-user and logout integration

- Continued the `P1` auth consolidation pass. Confirmed the backend already exposes `/api/auth/me`, so no duplicate heavy `/api/me/hub` dependency was introduced for topbar identity.
- Extended backend current-user shape in `apps/server`: `CurrentUser`, `AuthSessionResponse`, `CurrentUserService`, and `AuthApplicationService` now include `username`, `identityProvider`, and `externalSubject` alongside `displayName`, `avatarUrl`, `roleCode`, and creator profile metadata. This preserves the future canvas-product SSO mapping boundary instead of hard-coding a local-only identity model.
- Added frontend `ApiAuthSession` and `getCurrentAuthSession()` in `apps/web/src/lib/contracts/community-api.ts` and `apps/web/src/lib/api/community-service.ts`. The helper reads the existing httpOnly session cookie server-side and calls `/api/auth/me`, returning `null` when there is no local community session.
- Added `CommunitySessionProvider` and updated `apps/web/src/app/(community)/layout.tsx` so the formal community route tree resolves the current user once server-side and shares it with client components.
- Updated `PageShell` to use the real current user by default for profile name/avatar, while preserving explicit per-page profile overrides. Logged-in users now see a compact `退出` control in the shared topbar; anonymous landing behavior remains unchanged.
- Added `logoutAction()` in `apps/web/src/features/auth/actions.ts`, reusing the existing `logoutCommunity()` backend call, deleting the httpOnly cookie, and redirecting back to `/` with `RedirectType.replace`.
- Verification passed: `apps/server -> compile` succeeded; `apps/web -> npx.cmd tsc --noEmit` succeeded; `apps/web -> npm.cmd run build` succeeded; backend was rebuilt and restarted on `http://127.0.0.1:18080`; Playwright verified `匿名 /` has no logout button and canvas links gate to login, login to `/home` shows real current user `Rina Flux` plus `退出`, clicking `退出` returns to `/`, and `/home` after logout redirects to `/login?redirectTo=%2Fhome`.
- Residual known issue: the current smoke user avatar still points to `https://cdn.dramatv.local/avatar/rina-flux.png`, which produces a browser resource error because that local CDN host is not available. This is a data/resource cleanup issue, not an auth-session regression.

### 2026-04-19 landing auth state follow-up

- Fixed the misleading "login state lost after returning to /" behavior in the formal `apps/web` app. The real issue was not cookie loss: the landing page `/` had been hard-coding login-first links even after authentication, so returning from the canvas route made the homepage still behave like an anonymous page.
- Updated `apps/web/src/app/(community)/page.tsx` to read `hasCommunitySession()` server-side and pass auth state into `apps/web/src/features/home/HomePage.tsx`. The landing page now switches its CTA, archive card, profile, and floating-entry links between real targets and `/login?redirectTo=...` based on the actual current session.
- Added a server-side logged-in fallback on `apps/web/src/app/(community)/login/page.tsx`, so visiting `/login?redirectTo=...` while already authenticated now redirects straight to the target page instead of showing the login form again.
- Changed `apps/web/src/app/(community)/login/actions.ts` to redirect with `RedirectType.replace`, so successful login no longer leaves the login page in browser history. Browser back from canvas now returns to `/` directly instead of landing on a dead login step in the middle.
- Added in-page recovery navigation for canvas runtime and backend-unavailable states: `apps/web/src/features/canvas-runtime/CanvasRuntimePage.tsx` now shows `返回社区` and `查看来源工作流`, and `apps/web/src/components/shared/CommunityBackendUnavailableState.tsx` now exposes `返回社区 / 回到首页`, so users are not forced to rely on the browser back button when the canvas entry lands on a placeholder or error state.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` succeeded; `apps/web -> npm.cmd run build` succeeded; Playwright verified the full chain `匿名访问 / -> 点击画布入口 -> /login?redirectTo=%2Fcanvas -> 登录 -> /canvas -> 浏览器回退 -> /` and confirmed that the landing page canvas link becomes `/canvas` after login, and that visiting `/login?redirectTo=%2Ffeatured` while already authenticated now lands directly on `/featured` without rendering the login form.

### 2026-04-19 canvas entry auth guard fix

- Fixed the user-visible auth gap for the left-side canvas entry in the formal `apps/web` app. The root cause was that the running backend process was still effectively allowing anonymous requests through an old demo-user fallback, so `/canvas` did not return `401` and the frontend never reached the previous auth-error redirect branch.
- Added a small server-side auth guard at `apps/web/src/lib/auth/community-auth.ts`, based on the existing httpOnly `dramatv_access_token` cookie. This keeps the current local login flow compatible with future canvas-product SSO replacement, because the guard only checks whether a community session token exists and does not hard-code any local-only identity model.
- Applied the new guard before backend data loading on `/canvas`, `/canvas/[runtimeId]`, `/publish`, `/discussions/new`, and `/me`, so unauthenticated access is now redirected immediately to `/login?redirectTo=...` even if the backend runtime has not yet been rebuilt to remove the old fallback behavior.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` succeeded; `apps/web -> npm.cmd run build` succeeded; direct HTTP header checks against `http://127.0.0.1:3106/canvas`, `/publish`, `/discussions/new`, and `/me` now all return `307 Temporary Redirect` to the expected `/login?redirectTo=...` routes.

### 2026-04-19 featured prompt catalog cleanup

- Updated the formal featured archive in `apps/web` so old simulated prompt cards are no longer used on `/featured`. The page now keeps simulated `WORKFLOW` cards only, while prompt entries come from the imported local catalogs in `apps/web/public/seedance-data.json` and `apps/web/public/nano-banana-data.json`.
- Re-grouped imported prompt content to match the agreed product buckets: imported Seedance video prompts now surface under the `short` filter, and imported Nano Banana image prompts now surface under the `tool` bucket with the visible filter label changed from `工具` to `图片`.
- Added a local imported prompt bridge for the formal detail route: `/videos/[id]` now recognizes imported prompt ids and renders them through the normal `VideoDetailPage` instead of falling through to backend 404 behavior.
- Extended `VideoDetailPageView` with optional `promptText` and `media.kind`, then updated `VideoDetailPage.tsx` so imported prompt detail pages use real prompt text, image prompts no longer show the video playback toggle, and imported prompt pages are treated as read-only showcase pages instead of attempting like/favorite/comment writes against backend ids that do not exist.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` succeeded; `apps/web -> npm.cmd run build` succeeded.

### 2026-04-19 unauthenticated landing access rule tighten

- Tightened the unauthenticated access boundary to match the latest product rule: anonymous users may browse only the landing page `/`, while `/home`, `/featured`, `/discussions`, `/publish`, `/me`, `/canvas`, and other community routes now redirect to `/login?redirectTo=...`.
- Switched the Next.js 16 request gate from the deprecated `middleware.ts` convention to the current `proxy.ts` convention at `apps/web/src/proxy.ts`, because the app is already on Next.js `16.2.2` and the old middleware convention is only a compatibility path.
- Updated the landing page interaction behavior in `apps/web/src/components/shared/PageShell.tsx` and `apps/web/src/features/home/HomePage.tsx`: the landing page still allows scrolling and browsing, but top navigation, archive cards, featured CTA, personal entry, floating canvas entry, and floating publish entry all route unauthenticated users to `/login` first, preserving the intended post-login target through `redirectTo`.
- Updated `apps/web/src/features/login/LoginPage.tsx` so the login page itself no longer encourages unauthenticated users to continue into `/home`, `/featured`, or `/discussions`; the fallback browse buttons now return to `/`.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` succeeded; `apps/web -> npm.cmd run build` succeeded and the build output now explicitly includes `ƒ Proxy (Middleware)`; direct HTTP checks confirmed `/` returns `200` while `/home`, `/featured`, `/discussions`, `/canvas`, and `/me` all return `307 Temporary Redirect` to `/login?redirectTo=...`; Playwright verified that landing-page clickable content now resolves to login-first URLs.

### 2026-04-19 auth/login follow-up

- Finished the protected-route auth redirect pass on the formal `apps/web` stack: `/discussions/new`, `/me`, `/canvas`, and `/canvas/[runtimeId]` now redirect unauthenticated access to `/login?redirectTo=...`, matching the existing `/publish` handling.
- Rebuilt the `/login` frontend from the previous minimal dev form into a full community-style page in `apps/web/src/features/login/LoginPage.tsx` and `apps/web/src/features/login/LoginPage.module.css`, keeping the existing dark cinematic language while clearly stating that the current local login is only a bridge to the future canvas-product identity provider.
- Hardened the login redirect behavior in `apps/web/src/app/(community)/login/actions.ts` so post-login navigation only accepts safe internal paths, instead of blindly trusting any `redirectTo` query value.
- Fixed a formal-build blocker discovered during verification: `apps/web/src/lib/api/community-service.ts` uses `next/headers`, so client components can no longer import it directly. Moved the client-side upload flow in `apps/web/src/features/publish/PublishPage.tsx` and `apps/web/src/features/discussions/DiscussionComposerPage.tsx` to the existing server action layer via the new `uploadAssetAction(...)` in `apps/web/src/features/publish/actions.ts`, preserving httpOnly auth cookies and restoring clean Next.js production builds.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` succeeded and `apps/web -> npm.cmd run build` succeeded; the built route table now includes `/login`, `/me`, `/canvas`, `/canvas/[runtimeId]`, `/publish`, and `/discussions/new` without the previous Turbopack server-only import failure.

### 2026-04-19

- 前端复刻阶段到达一个节点，后续执行重点切回正式主线 `apps/web + apps/server` 的后端能力补齐。
- 明确后续四项任务：`P1` 真实鉴权与当前用户体系，`P2` 首页与精选去 demo 资源，`P3` 举报/通知/个人设置编辑，`P4` 评论能力增强。
- `P2` 当前故意不启动，等待用户后续提供本地资源路径后再接入。
- 为了修复近期 `.codex/progress.md` 多次补丁失败的问题，已补充稳定 ASCII 锚点 `<!-- CODEX:SNAPSHOT -->`、`<!-- CODEX:BOARD -->`、`<!-- CODEX:LOG -->`，后续进度更新改为围绕锚点做小补丁，不再依赖容易受终端编码影响的中文原文匹配。
- 开始推进 `P1` 第一刀：后端已新增 `V8__add_auth_sessions.sql`，给 `users` 补充 `password_hash / identity_provider / external_subject`，并新增 `auth_sessions` 会话表，为后续接入画布侧登录保留外部身份映射边界。
- 后端已新增 `CurrentUserFilter / CurrentUserService / CurrentUserContext`，`/api/auth/login` 改为真实本地 session token 写入 `auth_sessions`，`/api/auth/logout` 改为真实 revoke，会话读取统一走 `Authorization: Bearer ...`。
- 业务链路已开始从固定 demo identity 迁移到当前用户：`PublishDraftPersistenceService`、`InteractionJdbcPersistenceService`、`UploadApplicationService`、`MeQueryService`、`CanvasApplicationService` 已改为通过 `CurrentUserService` 取用户，不再在这些服务里直接依赖 `DemoCommunityIdentity`。
- 为避免在画布登录尚未对接、前端登录页尚未补齐时把现有社区页面全部打断，当前保留了 `dramatv.auth.local-dev-fallback-enabled=true` 的开发态 fallback；它仍走统一 `CurrentUserService`，后续接画布登录时可直接关闭，不需要再回改发布/互动/个人中心业务层。
- 已验证：`apps/server -> powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过。
- 继续推进 `P1` 第二小步：`CommunityCatalogJdbcQueryService` 与 `DiscussionQueryService` 的 viewer 状态读取已不再固定绑定 demo viewer，未登录时详情页/讨论页的点赞、收藏、关注态会自然回落为 `false`。
- 前端已补最小开发态登录入口：新增 `/login` 路由、`loginAction` 和 `LoginPage`，`community-service.ts` 现已统一通过 httpOnly cookie 读取 token，并自动把 `Authorization: Bearer ...` 带到后端请求头，后续接画布登录时只需要替换 token 来源。
- 已验证：`apps/web -> npx.cmd tsc --noEmit` 通过；`apps/server -> powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 再次通过。

### 2026-04-08

- 根据最新一轮产品反馈继续收口 `apps/web` 的页面分层，把首页维持为“作品主流 + 方法侧栏”，避免作品卡与关联工作流卡在首页重复抢同级大位。
- 重写 `apps/web/src/features/publish/PublishPage.tsx`、`apps/web/src/features/video-detail/VideoDetailPage.tsx`、`apps/web/src/features/workflow-detail/WorkflowDetailPage.tsx` 与 `apps/web/src/features/creator/CreatorPage.tsx`，让发布页、视频详情页、工作流详情页、创作者页形成不同的信息结构和视觉语气。
- 修正 `apps/web/src/components/publish/PublishFormSection.tsx` 默认文案，并在 `apps/web/src/app/globals.css` 补齐页面变体、评论区、方法侧栏、发布模式卡片、放映页侧栏、画布板等样式；整体压低圆角密度，减少玻璃态样式疲劳。
- 交互表达继续保持诚实：只有关联工作流已公开时才显示“查看创作过程”，未公开时只展示状态说明，不伪装成可用入口。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过，`npm.cmd run build` 通过；Playwright 已实测首页、发布页、视频详情页、工作流详情页的页面层级差异。
- 当前做到：首页、发布台、放映页、方法页已经不再像同一个页面壳子的不同文案版。
- 当前卡点：本地 smoke 数据里仍有英文标题与 `cdn.dramatv.local` 头像资源噪音；创作者页仍需再做一次单独 smoke 与数据清理。
- 下次先做：继续清理本地 smoke 数据与失效头像资源，再细化首页主内容流密度，并补一轮移动端下发布台 / 放映页 / 方法页的版式校正。

- 根据最新一轮首页导航反馈继续收口 `apps/web/src/components/shared/PageShell.tsx`、`apps/web/src/features/home/HomePage.tsx` 与 `apps/web/src/app/globals.css`：删除首页侧栏里的“创作者 / 发布”入口，保留“首页 / 讨论区 / 内容流”，顶栏右侧改成个人头像入口，并补上工作流空状态说明，避免无效跳转和假能力。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 与 `npm.cmd run build` 均通过。
- 当前做到：首页导航、顶栏人格入口和方法侧栏的语义已更偏社区浏览。
- 当前卡点：右上角头像仍是前端占位，首页推荐创作者仍由现有静态数据驱动；若要做成全站统一入口，仍需补真实当前用户数据源。
- 下次先做：待这一轮首页效果确认后，再决定是否把同一套头像入口扩到详情页 / 讨论页，并继续细修移动端和间距层级。

- 根据新反馈继续给首页做减法：重写 `apps/web/src/features/home/HomePage.tsx`，删掉侧栏策略说明、创作者侧栏、讨论描述、重复标签和大段首屏说明，首页收成“极简导航 + 一条样片 + 作品流 + 创作过程 / 讨论侧栏”。
- 同步调整 `apps/web/src/app/globals.css`：压低首页字号、段落长度、视频区高度和侧栏卡片密度，让首页从“信息堆叠”变成“先扫一眼就能找到主线”。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 与 `npm.cmd run build` 再次通过。
- 当前做到：首页文案和说明性信息已明显减半，创作者入口主要回收到卡片头像和顶栏头像，不再在首页重复出现多个说明块。
- 当前卡点：这一轮主要解决的是“乱”和“重”，还没有继续压视觉装饰层；如仍嫌重，下一轮应继续削弱背景光效、边框层次和 Hero 存在感。
- 下次先做：待简化版确认后，再决定是否继续走更极简方向，例如缩小首屏样片、收窄侧栏、继续减少顶部品牌信息。

- 继续收口 `/discussions`：重写 `apps/web/src/features/discussions/DiscussionsPage.tsx`，删掉 Hero 侧栏、接口占位区和大段说明，把页面改成“轻首屏 + 频道入口 + 最新讨论列表”。
- 同步调整 `apps/web/src/app/globals.css`：新增更轻的讨论区 Hero、频道块和帖子行样式，并补上响应式与 hover / focus 状态。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 与 `npm.cmd run build` 再次通过。
- 当前做到：讨论区首页的信息层级已明显简化，主要保留频道入口和帖子列表，阅读路径更直接。
- 当前卡点：讨论详情页 `/discussions/[slug]` 仍保持上一版较重的信息结构；如下一轮继续做减法，需要连详情页一起收。
- 下次先做：待讨论区首页确认后，再决定是否继续压缩讨论详情页与顶部品牌区的信息量。

- 继续收口作者页：重写 `apps/web/src/components/shared/CreatorHeader.tsx` 与 `apps/web/src/features/creator/CreatorPage.tsx`，把头部从大面积展示板改成更轻的资料条，并把“作品 / 工作流”双栏改成单列混合内容流。
- 同步调整 `apps/web/src/app/globals.css`：压低作者头部尺寸，新增更轻的资料条样式，并新增单列 `creator-stream-grid`，避免只有少量内容时仍显得像两大分区。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 与 `npm.cmd run build` 再次通过。
- 当前做到：作者页更像创作者主页，视频与工作流已合并到同一条内容流里。
- 当前卡点：卡片本身仍保留较完整信息量；如仍嫌重，下一轮应该继续削减卡片内说明和元信息。
- 下次先做：待作者页确认后，再决定是否继续压缩视频卡 / 工作流卡的信息密度，或者转去处理讨论详情页。

- 根据最新反馈继续修正作者页规则：`apps/web/src/features/creator/CreatorPage.tsx` 不再混排 `WorkflowCard`，只保留 `VideoCard`；工作流只作为视频卡里的“查看创作过程”附属入口，不再作为独立卡片出现。
- 同步调整 `apps/web/src/app/globals.css`：把作者头部和内容区再压小一档，并把 `creator-stream-grid` 改成与首页一致的双列卡片尺寸。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 与 `npm.cmd run build` 再次通过。
- 当前做到：作者页已对齐“首页卡片大小 + 只展示作品卡”的方向，工作流不再作为独立卡片出现。
- 当前卡点：如果后续数据里出现“作者有工作流但没有视频”，当前作者页会按规则不展示独立工作流卡；这符合当前要求，但若产品规则再变更需要继续调整。
- 下次先做：如仍觉得作者页重，优先继续缩 `VideoCard` 的文案和元信息，而不是再把工作流独立拉出来。

- 继续根据最新反馈压缩作者页卡片：重写 `apps/web/src/components/cards/VideoCard.tsx`，去掉媒体区里重复出现的“查看创作过程”按钮，只保留正文底部的一个入口。
- 同步调整 `apps/web/src/app/globals.css`：把作者页 `creator-stream-grid` 改成固定较小卡宽，媒体区高度压到更接近原来的一半，并收紧作者信息、标题、摘要和底部操作区。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 与 `npm.cmd run build` 再次通过。
- 当前做到：作者页视频卡已明显缩小，空白媒体占位被压下去，流程入口只剩一个，工作流继续只作为视频附属关系存在。
- 当前卡点：如用户仍觉得大，下一轮就不能只缩卡片比例，而要继续减少卡片内部层级，例如弱化顶部统计和底部状态 pill。
- 下次先做：待尺寸确认后，再决定是否继续把作者页卡片收成更接近信息流列表，而不是封面型卡片。

- 已实际验证外部参考页 `https://youmind.com/zh-CN/seedance-2-0-prompts?utm_source=nav`：页面卡片为 Cloudflare Stream iframe 视频卡，“查看详情”弹层里可拿到完整提示词，视频也可通过 `manifest/video.mpd + ffmpeg -c copy` 下载为本地 `mp4`。
- 已落地一条本地样例到 `tmp/youmind-samples`：包含 `seedance-2-romance.mp4` 与对应的 `seedance-2-romance-prompt.txt`，可作为后续批量采集和前端静态联调样本。
- 新增 `docs/02_研究/YouMind Seedance界面复刻与30条样本采集方案.md`，整理了 30 条样本采集方法、目录规范、数据结构、前端复刻边界、验收标准和可直接复制的执行提示。
- 当前做到：项目已具备一套可复用的外部样本采集路径和前端复刻交接文档。
- 当前卡点：30 条样本尚未批量入库；若真的开始批量抓取，需要先决定是继续放在 `tmp` 做实验，还是直接按正式目录写入 `apps/web/public/external-samples/youmind-seedance`。
- 下次先做：如继续推进，优先批量采集 30 条样本并生成 `manifest.json`，再用这批静态数据做独立的 YouMind 风格参考页。

- 根据最新详情页反馈，重写 `apps/web/src/features/video-detail/VideoDetailPage.tsx`：把视频详情页从“首页壳子 + 右侧展板”收成更直接的作品详情结构，保留视频、标题、标签、作者、创作过程、点赞 / 收藏、评论和相关推荐，但减少重复动作和重复信息块。
- 同步调整 `apps/web/src/app/globals.css`：压缩 `video-detail` 顶部头部尺寸，缩小页面宽度与右栏比例，把 2x2 大统计卡改成更轻的统计条，把作者区与关注动作合并，把创作过程卡改成更轻的单行信息块，同时压低评论区和相关推荐区的标题与留白。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 与 `npm.cmd run build` 均通过，这轮重构没有破坏路由或构建。
- 当前做到：视频详情页已明显从“展板式页面”回收到“内容式详情页”，信息主线更聚焦在作品本身。
- 当前卡点：这一轮还没有继续动工作流详情页和讨论详情页；如果接下来仍觉得详情页体系不统一，下一步要按同样逻辑继续收这两页。
- 下次先做：待这版视频详情页方向确认后，再继续把工作流详情页和讨论详情页按同样的减法逻辑统一掉。

### 2026-04-09

### 2026-04-15
- Home page style reset completed on formal `apps/web` mainline. `PageShell` now has a dedicated `home` header with floating cinematic navigation, and `HomePage` no longer uses the old three-column control-panel layout.
- The new homepage structure is: cinematic hero, lead-story spotlight card, filmstrip shelf, curated content panels, creator radar, and compact launch-pad actions. Data source stayed on the existing `HomePageView` contract; no backend/API change was made.
- Verification passed on `2026-04-15`: `apps/web -> npm.cmd run build` succeeded, `http://127.0.0.1:3106/` returned `200`, and Playwright screenshot review confirmed the homepage now tracks the `mindloop-_-cinematic-archive (1)` direction much more closely.
- Discussion hub replica pass completed on formal route `/discussions`. The page now uses the cinematic floating topbar, three-column community layout, topic cards, thread stream, trending rail, and contributor rail aligned to the `3111` reference direction.
- Discussion page data still uses the current backend where available: channels and featured threads come from `getDiscussionHome`, and thread author avatars/names are filled from `getDiscussionThread` per slug so the list is not purely fake placeholder content.
- Verification passed on `2026-04-15`: `apps/web -> npm.cmd run build` succeeded again, Playwright screenshot check on `http://127.0.0.1:3106/discussions` matched the new layout, and console errors were cleaned after filtering blocked avatar hosts.
- Topbar refinement completed on `2026-04-15`: the shared `home` shell now uses a full-width sticky header flush to the top edge instead of the previous rounded floating capsule, and the content area is constrained separately through `page-shell-home-content`.
- Typography refinement completed on `2026-04-15`: the `Drama TV` wordmark, nav sizing, and utility button proportions were tightened to better track the `3111` reference. Verified visually on both `/` and `/discussions`, including scroll-state checks with no top gap.
- Second refinement pass completed on `2026-04-15`: homepage and discussion typography were compressed another step down, including the shared topbar, hero titles, card titles, and sidebar/thread copy so the page reads closer to the tighter `3111` density.
- Top-edge artifact mitigation completed on `2026-04-15`: the top chrome was darkened and the topbar background was made more opaque to avoid the “top gap / bright seam” impression when the page is scrolled to `0`. Verified again on `/` and `/discussions` with fresh screenshots after `apps/web -> npm.cmd run build`.
- Discussion copy cleanup completed on `2026-04-15`: added a front-end presentation layer for smoke/test discussion titles, excerpts, and topic tags so long English slug-like strings now render as shorter Chinese display labels on `/discussions`, and homepage discussion cards reuse the same title cleanup.
- Discussion density refinement completed on `2026-04-15`: reduced the discussion-page type scale another step and added line clamping for topic cards, thread titles, excerpts, and trend labels so long titles no longer dominate the layout. Verified with `apps/web -> npm.cmd run build` and fresh Playwright screenshots.

- Recovery-guide alignment check completed: do not assume the visual migration is already recognized. The formal mainline is still `apps/web` (`Next.js + React + TypeScript`) + `apps/server` (`Spring Boot`); the old `React + Vite` work remains archive/reference only.
- Route/code/runtime mismatch confirmed for `/me`: source contains `/api/me/hub` in `apps/server/src/main/java/com/dramatv/community/me/controller/MeController.java`, frontend `/me` consumes it from `apps/web/src/app/(community)/me/page.tsx` through `apps/web/src/lib/api/community-service.ts`, but the always-on local `18080` runtime still returns `500` with `No static resource api/me/hub`.
- Runtime mismatch evidence tightened: `logs/server/error.log` and `server-18080.out.log` repeatedly record `No static resource api/me/hub`; current local `java` process start time is `2026-04-14 10:07:28`; `MeController.java` last write time is `2026-04-14 12:21:55`; `apps/server/target/classes/com/dramatv/community/me/controller/MeController.class` last write time is `2026-04-14 12:28:56`; `apps/server/target/dramatv-community-server-0.1.0-SNAPSHOT.jar` last write time is `2026-04-12 14:22:12`, and the packaged jar currently contains `Count=0` matches for `MeController.class`. Current judgment: local `18080` is running a stale backend build/process, not the latest source.
- Creator page discrepancy confirmed: route still fetches workflows in `apps/web/src/app/(community)/creators/[id]/page.tsx`, mapper/view-model still preserve `workflows` in `apps/web/src/lib/mappers/community.ts` and `apps/web/src/lib/contracts/view-models.ts`, but `apps/web/src/features/creator/CreatorPage.tsx` renders only the `videos` section. This does not satisfy the documented creator-page split of `作品 + 工作流`.
- Home page discrepancy confirmed: `apps/web/src/features/home/HomePage.tsx` still builds and renders `standaloneWorkflowShelf` / `#workflow-shelf` from `feedItems` + `hotWorkflows`. Copy already frames workflow as a linked method entry, but implementation still keeps a semi-independent workflow shelf structure.
- Current status: this round stayed in inspection mode only. No fix was applied. The next highest-value step is either `1)` restart/run the current formal backend build and re-check `GET /api/me/hub` + `/me`, or `2)` continue pure audit mode and write a runtime visual-gap checklist for `/`, `/videos/[id]`, `/creators/[id]`, `/me`.
- Follow-up runtime action completed: the stale always-on backend process `PID 11976` was confirmed alive on `18080`, then stopped manually before restart. A fresh package was built at `2026-04-15 13:36:50`, and the rebuilt jar now contains `BOOT-INF/classes/com/dramatv/community/me/controller/MeController.class`.
- Local backend was restarted cleanly on `18080`; the new running Java process is `PID 14716`, started at `2026-04-15 13:37:09`. Verification passed: `GET http://127.0.0.1:18080/actuator/health` -> `200 {"status":"UP"}` and `GET http://127.0.0.1:18080/api/me/hub` -> `200` with real hub payload and requestId `2a657d98-3d1e-48dd-a661-0645975e71cd`.
- Frontend follow-up verification also passed after backend restart: `GET http://127.0.0.1:3106/me` -> `200`, no backend-unavailable fallback markers, and page HTML now contains `Rina Flux`, liked-section content, and favorited-section content. Current judgment: `/me` is now restored in local runtime; the earlier failure was a stale-process issue, not a missing-code issue.

- 补做一轮项目现状核对：按 `AGENTS.md` 的会话恢复入口重新对照文档与代码，确认当前主线工程已不是“React + Vite 原型”，而是 `apps/web` 的 `Next.js + React + TypeScript` 前端与 `apps/server` 的 `Spring Boot` 后端；旧原型已归档到 `archive/legacy-react-vite-prototype`。
- 已验证：根目录执行 `npm.cmd run build:web` 可以完整通过，当前社区主站路由包含首页、视频详情、工作流详情、作者页、发布页、讨论区、画布页和 seedance 参考页。
- 代码 / 文档偏差补记：
- `AGENTS.md` 里“现有代码仍是 React + Vite 原型”的表述已落后于仓库现状，应以代码为准。
- `docs/03_架构/候选技术栈分析.md` 仍写 `Tailwind CSS`，但 `apps/web/package.json` 当前没有 Tailwind 依赖，正式前端实际使用的是自定义全局 CSS。
- 文档要求作者主页同时展示“作品 + 工作流”，但当前 `apps/web/src/features/creator/CreatorPage.tsx` 已按最新产品规则改成只展示视频卡，工作流只作为视频附属入口存在。
- 文档里的鉴权设定比代码更完整；当时后端 `SecurityConfig` 仍是 `permitAll`，`AuthApplicationService` 还是基于 mock catalog 的 demo 登录态。
- 文档里的画布联动设计比代码更靠前；当时数据库与迁移已为 runtime / copy task 预留表结构，但 `CanvasApplicationService` 仍是内存态 stub。
- 当前做到：项目已经处于“社区主路径部分真实打通、账号与画布仍是演示态”的阶段，不宜再简单判断成纯页面原型。
- 当前卡点：后端没有本地 Maven 可执行命令，这一轮没有补做 `apps/server` 的即时编译验证；另外讨论区仍主要是前端静态占位，不属于已打通的真实后端主链路。
- 下次先做：如果继续推进，应优先统一文档口径，然后补作者页规则说明、真实鉴权方案和讨论区 / 画布的阶段边界，避免后续继续按过时文档判断项目阶段。

- 按“先统一文档，再逐步去 mock”继续收口：删除前端未引用的 `apps/web/src/lib/mock/community-api.ts` 和后端未引用的 `apps/server/src/main/java/com/dramatv/community/shared/mock/MockCommunityCatalog.java`，并把 `application.yml` 里的 `mock` profile 配置整体移除；`local-db` 现在是唯一保留的日常运行路径。
- 调整 `apps/server/src/main/java/com/dramatv/community/shared/persistence/CommunityCatalogJdbcQueryService.java`：工作流详情查询现在会真实关联 `canvas_bindings`，把 `binding_type / open_url / canCopy` 回写到 `WorkflowDetailResponse.canvasBinding`，不再返回空的画布联动信息。
- 调整 `apps/server/src/main/java/com/dramatv/community/interaction/persistence/InteractionJdbcPersistenceService.java`、`apps/server/src/main/java/com/dramatv/community/publish/persistence/PublishDraftPersistenceService.java`、`apps/server/src/main/java/com/dramatv/community/publish/persistence/PublishedContentPersistenceService.java`、`apps/server/src/main/java/com/dramatv/community/publish/persistence/PublishModerationPersistenceService.java` 与 `apps/server/src/main/java/com/dramatv/community/shared/persistence/CommunityCatalogJdbcQueryService.java`：移除 `@Profile("!mock")`，这些真实持久化服务不再挂在“非 mock 才启用”的条件上。
- 调整 `apps/web/src/features/devtools/local-smoke/shared.ts` 与相关文档：开发工具页环境类型收成 `real`，`apps/server/README.md`、`docs/04_实施设计/后端本地数据库启动与建表验证.md`、`docs/04_实施设计/页面与接口对接规划.md` 也同步明确“当前仓库不再保留运行时 mock 分支”。
- 已验证：根目录执行 `npm.cmd run build:web` 通过；执行 `powershell -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过，说明这轮“去 mock + 接真实画布绑定”没有破坏前后端编译。
- 纠正上一条记录里已过时的两点：`AuthApplicationService` 已不再依赖 `MockCommunityCatalog`，只是当前仍保留本地开发态 demo session；`CanvasApplicationService` 也已切到 JDBC + PostgreSQL 路径，不再是内存 stub。
- 当前做到：文档口径已经对齐到“`apps/web` + `apps/server` 全链路开发、无 runtime mock fallback”，首页 / 详情 / 作者 / 发布 / 画布主链路的正式代码也已全部站到真实后端和真实数据库路径上。
- 当前卡点：鉴权仍是本地开发态 demo session，不是真实账号体系；媒体上传资产、审核视角查询、讨论区真实帖子实体仍未进入同等完成度。
- 下次先做：沿着全链路继续推进时，优先顺序建议是 `真实上传 / 媒体资产入库 -> 真实鉴权方案 -> 讨论区最小后端实体`，而不是再回头恢复任何 mock 分支。

### 2026-04-10

#### 2026-04-10 续

- 落地后端日志切分与滚动：新增 `apps/server/src/main/resources/logback-spring.xml`，固定日志目录 `logs/server`，区分 `application.log`、`error.log`、`access.log`，并统一在日志 pattern 中输出 `requestId`；`application.yml` 新增 `dramatv.logging.dir` 与 `com.dramatv.community.access` 日志级别。
- 新增 `apps/server/src/main/java/com/dramatv/community/shared/request/AccessLogFilter.java`，记录 `method/path/status/durationMs/remoteIp`，默认跳过 `/actuator/health` 和 `/actuator/info`；`RequestIdFilter` 增加顺序，确保 `requestId` 先进入 MDC 再写 access log。
- 前端错误态补齐 `requestId` 展示：重写 `CommunityBackendUnavailableState` 以及社区首页、视频详情、工作流详情、作者页、画布页、发布页、smoke 页等路由错误页，在后端不可用时直接展示 `Request ID`。
- 前端 server action 补齐 `requestId`：重写 `apps/web/src/features/publish/actions.ts` 与 `apps/web/src/features/devtools/local-smoke/actions.ts`，失败文案统一通过 `appendCommunityRequestId(...)` 追加 `Request ID`。
- 修正 `apps/web/src/lib/api/community-service.ts`：补充 `getCommunityErrorRequestId` / `appendCommunityRequestId`，失败响应解析统一回收后端 `requestId`；同时清掉导致 TS 语法错误的坏字符串，恢复前端编译。
- 验证通过：`apps/web` 执行 `npx.cmd tsc --noEmit` 通过；`apps/server` 执行 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过。
- 未完成项：`apps/web/src/features/community-interactions/actions.ts` 里互动类 server action 还没有统一把 `requestId` 拼进错误提示；当前页面级错误态和发布/smoke 链路已补齐，下轮优先补这一块。

- 对照参考脑图 `C:\Users\psk13\Documents\xwechat_files\wxid_s7fuv84r25qm22_5dbc\msg\file\2026-04\Map1(1).pdf` 重新梳理社区结构，确认原来的社区脑图主要缺的不是“再多几个页面”，而是缺少对象级字段、状态流转、权限边界、资源分层、通知回流、数据反馈和跨内容对象联动。
- 新增 `docs/03_架构/DramaTV社区功能脑图-详细版.drawio`，把社区拆成“内容对象体系 / 首页与发现 / 提示词库 / 作品社区 / 工作流与画布 / 讨论区 / 创作者与发布 / 互动与治理 / 关键联动关系”九个分支，并补到可执行的小功能级别。
- 新增 `docs/03_架构/DramaTV社区关键联动链路图.drawio`，单独把 `Prompt -> Workflow -> Copy To Canvas -> Runtime -> Publish -> Review -> Feed -> Video Detail -> Interaction -> Creator -> Continue Discovery` 的主链路，以及 `Discussion ↔ Content Object`、`Notification -> Creator Workspace -> Re-publish`、`Data Feedback -> Feed Ranking` 的回流路径画出来，避免后续页面和接口拆分各自为政。
- 已验证：`docs/03_架构/DramaTV社区功能脑图-详细版.drawio` 与 `docs/03_架构/DramaTV社区关键联动链路图.drawio` 均能通过本地 XML 解析。
- 当前做到：社区脑图已经从“页面罗列”推进到“对象 + 小功能 + 状态 + 回流”的层级，可以直接作为下一步拆 API、表结构、页面模块和联调顺序的基础图。
- 当前卡点：详细脑图和联动链路图已经足够指导第一轮实现，但如果继续往“研发可执行清单”推进，还需要再把每个对象下的最小接口、状态字段和前后端 owner 拆成单独文档。
- 下次先做：优先把这两张图继续落成一份“社区对象关系表 + 页面动作清单 + API / 表结构映射”文档，然后按链路从发布、详情、讨论、通知四段往代码里逐段对齐。
- 修复 `scripts/start-server-18080.ps1`：去掉依赖 `Invoke-WmiMethod` 的进程创建方式，改为 `Start-Process`；新增可执行 Spring Boot jar 检查与自动重打包；启动确认从固定 2 秒改为最长 45 秒轮询 `http://127.0.0.1:18080/actuator/health`，避免“服务其实能起来，但脚本先误报失败”。
- 修复 `scripts/start-web-3100.ps1`：不再是前台阻塞脚本，改成真正的后台启动脚本；默认用 `start` 模式稳定启动，并支持 `-Mode dev`；若缺少 `.next/BUILD_ID` 会自动先执行 `npm run build`；启动确认改为轮询 `http://127.0.0.1:3100/`，并统一输出日志路径。
- 已验证：在本机真实环境下完成一轮前后端冷启动验证，`scripts/start-server-18080.ps1` 能从零拉起后端并让 `actuator/health` 返回 `{"status":"UP"}`，`scripts/start-web-3100.ps1` 能从零拉起前端并让 `http://127.0.0.1:3100/` 返回 `200`。

- 结合团队关于 DramaTV 画布开发和上线问题的讨论，已把“全链路排障能力必须前置”正式补入项目规范：`AGENTS.md` 新增 `可观测性与链路追踪规则 / 错误码与日志规则 / Bug 反馈与复现信息规则` 三节，明确 `requestId` 贯穿、关键业务 ID 打点、第三方错误统一映射、日志固定落盘与敏感信息脱敏。
- 同步把两条高频经验沉淀到 `memory/MEMORY.md`：一是进入全链路阶段后必须先补 `requestId + 错误码 + 日志`，二是上传 / 画布 / 审核等跨系统链路不能直接把第三方原始错误透给前端。
- 当前做到：项目级开发规范已经从“页面、模块、数据结构”进一步补到“排障、日志、错误处理、Bug 反馈字段”。
- 当前卡点：规范已经收口，但代码层尚未完全落实到前端主动传 `X-Request-Id`、后端统一异常映射、结构化日志落盘这几个点。
- 下次先做：按新增规范反推代码整改顺序，优先补前端 `X-Request-Id`、后端统一异常映射和上传 / 画布链路的安全错误返回。

- 按新增规范开始反推代码整改：前端 `apps/web/src/lib/api/community-service.ts` 已统一为真实后端请求自动附带 `X-Request-Id`；后端 `RequestIdFilter` 已把 `requestId` 同步写入 `MDC`，给后续日志检索留出统一键。
- 新增后端公共异常层：`apps/server/src/main/java/com/dramatv/community/shared/error/ApiBusinessException.java` 与 `apps/server/src/main/java/com/dramatv/community/shared/error/ApiExceptionHandler.java` 已落地，统一收口业务异常、参数校验异常、请求体错误和兜底 500，并在日志中补记 `status / code / requestId / method / path`。
- 已开始回收控制器里的手写异常返回：`HomeFeedController`、`UploadController`、`CommentController`、`InteractionController` 改为走统一异常出口；`HomeFeedQueryService`、`UploadApplicationService`、`CanvasApplicationService` 也已改为使用带错误码的业务异常，补上 `FEED_CHANNEL_INVALID`、`UPLOAD_FILE_TOO_LARGE`、`UPLOAD_MIME_NOT_ALLOWED`、`WORKFLOW_ID_INVALID`、`CANVAS_COPY_MODE_INVALID`、`CANVAS_COPY_FORBIDDEN` 等安全返回。
- 前端交互层已补上新增画布复制错误码的人话提示，避免画布复制失败时只落到通用错误文案。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过；根目录执行 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过。
- 当前做到：`requestId` 透传、统一异常出口、上传/画布链路安全错误返回已经从规范落到第一版代码。
- 当前卡点：前端还没有把 `requestId` 明确展示到失败态 UI；后端日志尚未补到固定滚动文件与 access/error 分流；上传策略本身仍是本地占位实现，不是真实对象存储签发。
- 下次先做：继续把前端错误态补上 `requestId` 暴露入口，并把后端日志配置和上传链路真实化往前推进。

- 收尾前端 `requestId` 改造：清理 `apps/web/src/lib/api/community-service.ts` 里上轮为规避乱码留下的临时注释死代码，保留统一的 `getCommunityErrorRequestId` / `appendCommunityRequestId` / `requestBackend(Command)` 错误透传逻辑；`apps/web/src/features/community-interactions/actions.ts` 已统一通过 `appendCommunityRequestId(...)` 给评论、点赞、收藏、关注、复制工作流等交互失败态补齐 `Request ID`。
- 已验证：`apps/web` 下执行 `npx.cmd tsc --noEmit` 通过；`apps/web` 下执行 `npm.cmd run build` 通过；根目录执行 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过。
- 当前做到：后端日志切分与滚动、后端统一异常出口、前端页面失败态、发布链路、smoke 工具页、互动 server action 的 `requestId` 展示和透传已经收口到同一套实现。
- 当前卡点：上传链路仍是本地占位实现，不是真实对象存储签发；讨论区还是前端结构先行，尚未达到和发布/详情链路同等级的真实后端完成度；作者页与讨论区的产品规则还需要再对齐到最新脑图和联动链路。
- 下次先做：在不回退到 mock 的前提下，基于当前已完成能力与待完成能力输出一版“页面闭环 / 数据对象 / 交互链路 / 画布联动边界”的现状分析和下一步拆解。

- 按新的发布范围开始收口发布中心：`apps/web/src/features/publish/PublishPage.tsx` 已从“作品 + 创作过程 / 只上传视频 / 单独发布工作流”三模式，改成 `视频发布 / 帖子发布` 两个入口；视频发布里新增“附带工作流”开关，工作流不再作为当前发布中心第一入口，帖子发布则明确标注为“下一步接入”，不再伪装成已可提交能力。
- 同步调整前端发布页口径：`apps/web/src/lib/contracts/view-models.ts` 中 `PublishPageView.activeTab` 已改成 `video | post`；当前 mapper 仍默认落到 `video`，后续帖子后端接入后可直接切到真实 tab。
- 这轮还顺手补了一处实际可用性：附带工作流在提交后如果已经拿到目标内容 ID，发布页会优先把该 ID 回填到视频的 `workflowId` 绑定输入，减少“先发视频附带工作流”场景下手工抄 ID 的摩擦。
- 已验证：`apps/web` 下执行 `npx.cmd tsc --noEmit` 通过；`apps/web` 下执行 `npm.cmd run build` 通过；本地访问 `http://127.0.0.1:3100/publish` 返回 `200`。
- 当前做到：发布中心的产品表达已经收口到“视频发布是当前真链路，帖子发布是下一条真链路，工作流是视频附带块”，和最新任务拆分一致。
- 当前卡点：帖子实体、帖子草稿、讨论频道、帖子详情与回复接口还没有进入后端；视频上传仍是资源 ID 手填，不是真实上传闭环。
- 下次先做：优先进入帖子后端第一刀，补 `post` 草稿类型、帖子主表/频道表和最小读写接口，再把发布页里的帖子入口从“任务位”推进到可提交表单。

- 继续完成帖子后端第一刀收口：`apps/server` 已补齐 `discussion_channels` / `discussion_threads` 迁移、`PublishDraftType.POST`、`/api/post-drafts`、`/api/discussions/home`、`/api/discussions/threads/{slug}`，并把评论链路扩到 `targetType=post`；`InteractionJdbcPersistenceService` 已支持 `post` 评论目标校验、帖子回复计数与 `last_activity_at` 同步。
- 去掉发布草稿应用层里的内存 fallback：`VideoDraftApplicationService`、`WorkflowDraftApplicationService`、`PostDraftApplicationService` 不再走 `ConcurrentMap + ObjectProvider` 的 mock 分支，统一强制走 `PublishDraftPersistenceService` 的真实数据库路径，符合当前“全链路开发、不再用 mock 数据”的要求。
- 修正帖子入库持久化：`PublishedContentPersistenceService` 已补齐帖子发布所需 import 与 `discussion_threads` upsert 逻辑，帖子支持频道归属、标签、绑定已发布 `video/workflow`、slug 生成与摘要落库。
- 已验证：`apps/server` 执行 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过；随后执行 `... package` 通过。
- 已做最小接口烟测：在单命令内拉起最新 jar 后，真实打通 `POST /api/post-drafts -> PUT /api/post-drafts/{id} -> POST /api/post-drafts/{id}/submit -> GET /api/discussions/home -> GET /api/discussions/threads/{slug} -> POST /api/comments(targetType=post) -> GET /api/comments?targetType=post&targetId=...`，结果通过。一次实际联调样例返回：`draftId=834be661-7397-43cb-98a0-9d19bc91b107`，`targetId=b7868830-768e-4c51-9d69-08a70a538010`，`discussionSlug=post-publish-smoke-test-b7868830`，评论列表 `commentCount=1`；整条链路都有真实 `requestId`。
- 当前卡点：`scripts/start-server-18080.ps1` 现阶段仍优先启动已存在 jar，日常联调前需要先重新 `package` 才能保证拿到最新后端代码；另外 `docs/04_实施设计/第一阶段 API 清单.md` 与部分页面契约文档还没同步帖子链路新接口。
- 下次先做：把 `/discussions` 前端从 pending route 接回真实后端；然后继续做帖子发布表单接真接口，再补文档里的帖子 API / 页面数据契约，最后再决定是否进入帖子互动增强（点赞/收藏/审核）或视频真实上传闭环。

- Continued the post/discussion frontend finish-up: `apps/web/src/features/publish/PublishPage.tsx` now exposes a real `post draft` form instead of a placeholder block, covering `channelSlug / title / content / tagNames / bindingTargetType / bindingTargetId`, while keeping `video publish + optional attached workflow` as the P0 main path.
- Rewrote `apps/web/src/lib/mappers/community.ts` to close the discussion binding type gap and keep `/discussions` + `/discussions/[slug]` on the real backend path; also rewrote `apps/web/src/features/publish/actions.ts` to add `savePostDraftAction` and `submitPostDraftAction`.
- Cleaned the most visible garbled frontend copy in `apps/web/src/lib/presentation.ts` and `apps/web/src/components/publish/PublishFormSection.tsx` so status labels in the publish flow are readable again.
- Verification passed: `apps/web` -> `npx.cmd tsc --noEmit`; `apps/web` -> `npm.cmd run build`.
- Documentation sync: added `docs/04_实施设计/帖子发布与讨论区真实链路补充.md` to capture the live `post-drafts` / `discussions` / `comments(targetType=post)` chain and the page contract delta.
- Current state: frontend now has a real end-to-end path for `video publish (optional workflow)` plus `post publish`, and the discussion list/detail pages are both backed by the live Spring Boot APIs.
- Current gap: post submit still returns `targetId` but not a directly navigable `slug`, so the publish page cannot yet jump straight to the newly created thread detail route.
- Next: 1) add slug or query-by-target for post submit success, 2) merge the delta doc back into the two main design docs, 3) continue with post interaction enhancements or real upload flow.
- Continued the next small step for post publish: backend `POST /api/post-drafts/{id}/submit` now returns both `targetId` and `slug`, so frontend no longer has to stop at an opaque thread ID after submit.
- Updated `apps/server/src/main/java/com/dramatv/community/publish/application/PostDraftApplicationService.java` and `apps/server/src/main/java/com/dramatv/community/publish/dto/response/PostDraftSubmitResponse.java`; frontend `apps/web/src/features/publish/actions.ts`, `apps/web/src/features/publish/PublishPage.tsx`, `apps/web/src/lib/api/community-service.ts`, and `apps/web/src/lib/contracts/community-api.ts` now consume the slug and expose an `Open Published Thread` entry after success.
- Verification passed again: root -> `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile`; `apps/web` -> `npx.cmd tsc --noEmit`; `apps/web` -> `npm.cmd run build`.
- Current state: the post publish flow now closes at `submit -> receive slug -> open discussion thread`, so the publish page can hand users back into the live discussion route immediately.
- Next: keep splitting by smallest unit, with the best next cuts being `discussion channel filtering`, `post interaction enhancement`, or `upload flow real asset path`.
- Continued the next small slice for discussion thread like. Backend `InteractionJdbcPersistenceService` now accepts `targetType=post` for likes, validates published `discussion_threads`, and syncs aggregate counts back into the thread row.
- Added `apps/server/src/main/resources/db/migration/V6__add_discussion_thread_like_count.sql` so `discussion_threads` gains a real `like_count` column with a safe backfill from `interaction_actions`.
- Extended `DiscussionQueryService` and `DiscussionThreadDetailResponse` so `GET /api/discussions/threads/{slug}` now returns real thread like stats plus `viewerActions.liked`.
- Updated frontend contracts, adapter, mapper, and `apps/web/src/features/discussions/DiscussionDetailPage.tsx` to expose a real `Like Post` toggle on the live discussion detail route.
- Added `toggleDiscussionLikeAction` in `apps/web/src/features/discussions/actions.ts`, so the live path is now `open thread -> like post -> refresh detail -> show updated count/state`.
- Verification passed: `apps/web` -> `npx.cmd tsc --noEmit`; `apps/web` -> `npm.cmd run build`; root -> `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile`.
- Current state: discussion threads now have real publish, thread read, comments, comment like, channel filtering, homepage entry, and thread like on the formal `apps/web + apps/server` stack.
- Next: keep the same small-slice rhythm and choose one of `discussion thread favorite/collection`, `discussion publish/edit polish`, or `video real upload/media asset path` as the next full-chain cut.
- Runtime smoke also passed after packaging the new jar with Flyway `V6`: started a temporary local server on `127.0.0.1:18081`, fetched `post-publish-smoke-test-b7868830`, executed `POST /api/interactions/like` with `targetType=post`, confirmed `likeCount 0 -> 1` and `viewerActions.liked false -> true`, then executed `DELETE /api/interactions/like` and confirmed the state returned to `0 / false`.
- Smoke requestIds captured on the live path: `smoke-discussion-like-before`, `smoke-discussion-like-after-like`, `smoke-discussion-like-after-unlike`.

- Continued the next small slice for real source video upload on the formal `apps/web + apps/server` stack. Backend `UploadApplicationService` no longer returns fake `uploads.dramatv.local` URLs: `POST /api/uploads/video-policy` and `POST /api/uploads/image-policy` now create real `media_assets` rows with UUID `assetId`, backend-local upload URLs, and pending upload status.
- Added `PUT /api/uploads/assets/{assetId}/binary` in `UploadController`, plus `MediaResourceConfig` and `dramatv.media.local-dir`, so uploaded files are written to local disk under `tmp/media/**`, published at `/media/**`, and returned back through real `publicUrl` values that can be used by the catalog query layer.
- Tightened publish validation in `PublishedContentPersistenceService`: video submit now requires a ready `sourceAssetId`, and media asset binding resolves only `media_assets.status_code = 'ready'` instead of any existing row.
- Updated frontend contracts and API client in `apps/web/src/lib/contracts/community-api.ts` and `apps/web/src/lib/api/community-service.ts` to support `createUploadPolicy` + `uploadBinaryAsset`.
- Updated `apps/web/src/features/publish/PublishPage.tsx` so video publish now uses a real file input for source video upload, auto-fills and auto-saves `sourceAssetId` after successful upload, and disables `Submit Video` until a real uploaded source asset is ready. `sourceAssetId` is no longer treated as a free-typed field in the main path.
- Verification passed: root -> `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile`; root -> `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests package`; `apps/web` -> `npx.cmd tsc --noEmit`; `apps/web` -> `npm.cmd run build`.
- Runtime verification status: temporary server startup on `127.0.0.1:18081` succeeded, logs confirmed Flyway `V6` and `/media/**` local resource mapping. Direct upload smoke from the current runner remains unstable because the local loopback request path does not reliably complete in this execution environment, so the code path is compiled and packaged but still needs one manual/local browser verification pass for `policy -> binary upload -> sourceAssetId auto-fill`.
- Next: 1) run one browser-side/manual verification on `/publish` to confirm the new real upload UI and generated `sourceAssetId`, 2) then continue the next smallest slice, likely `discussion favorite/collection` or `cover image upload`.

- 继续按最小切片补齐讨论区：`GET /api/discussions/home` 现已支持可选 `channel` 查询参数，后端 `DiscussionController` / `DiscussionQueryService` 会基于频道 slug 过滤 `featuredThreads`，不再只有全量讨论流。
- 前端讨论页已接上这条真实筛选链路：`apps/web/src/app/(community)/discussions/page.tsx` 读取 `searchParams.channel`，`apps/web/src/lib/api/community-service.ts` 将其透传给后端；`apps/web/src/features/discussions/DiscussionsPage.tsx` 已把频道卡片改成真实筛选入口，并补了当前选中态、清除筛选入口和空结果提示。
- 同步补了样式层收口：`apps/web/src/app/globals.css` 为讨论频道卡片增加 hover / focus / active 态，避免频道筛选只是“参数能传”，页面却没有可识别反馈。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过；`apps/web` 下 `npm.cmd run build` 通过；根目录 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过。
- 当前做到：`/discussions?channel=...` 已成为真实后端筛选链路，讨论区首页从“全量列表页”推进到“频道入口 + 频道过滤 + 线程详情”闭环。
- 当前卡点：频道筛选只作用于讨论页线程流，首页或其他入口还没有带频道上下文跳转；讨论贴本身还缺点赞/收藏等互动增强；媒体上传仍未进入真实对象存储链路。
- 下次先做：建议继续拆成更小一步，优先做“帖子互动增强”里的第一刀，例如先把讨论贴点赞打通，或者先把 `/discussions` 的频道筛选同步到首页讨论入口。

- 继续清掉首页里的静态讨论数据：`apps/web/src/app/(community)/page.tsx` 现在会同时读取 `getHomeFeed()` 和 `getDiscussionHome()`；`apps/web/src/lib/mappers/community.ts` 与 `apps/web/src/lib/contracts/view-models.ts` 已把首页讨论频道与讨论高亮纳入 `HomePageView`。
- `apps/web/src/features/home/HomePage.tsx` 已重写首页右侧讨论入口，不再使用硬编码 `discussionHighlights`；现在展示的讨论卡片来自真实后端线程，频道 chip 会跳到 `/discussions?channel=...`，讨论卡片会跳到真实帖子详情页。
- 这轮顺手把首页该文件里最明显的一段乱码文案替换成了可读的 ASCII 文案，避免继续在脏文件上叠补丁。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过；`apps/web` 下 `npm.cmd run build` 通过。
- 当前做到：首页已经从“作品主流 + 静态讨论入口”推进到“作品主流 + 真实讨论入口 + 频道上下文跳转”，首页这块不再伪装讨论数据已接通。
- 当前卡点：首页 hero 仍使用本地预置视频资源；讨论贴主体还缺点赞/收藏等互动能力；上传链路仍未进入真实对象存储签发。
- 下次先做：继续按最小切片推进，优先补“讨论贴点赞”这一刀，让帖子详情从“可评论”推进到“可互动”。

- 继续完成发布页上传链路的下一小刀：`apps/web/src/features/publish/PublishPage.tsx` 已把 `video cover` 和 `workflow cover` 都切到真实文件上传 UI，封面上传成功后会自动回填并保存 `coverAssetId`，不再把封面 ID 当作主路径里的手填字段。
- 同时收口了这次未验证 patch 遗留的问题：工作流封面区不再把 `type="file"`、`value` 和错误的 `videoForm.coverAssetId` 混在一起；发布页标签解析已改用正常的逗号/换行拆分逻辑，避免脏字符继续污染 tags。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过；`apps/web` 下 `npm.cmd run build` 通过。
- 当前做到：发布页主路径已经形成 `source video upload -> sourceAssetId auto-fill/save -> optional video/workflow cover upload -> coverAssetId auto-fill/save -> submit gating` 的真实前端链路，源视频和封面都不再依赖 mock 输入。
- 当前卡点：这轮只完成了代码与构建收口，浏览器侧还需要做一次手动验证，确认 `/publish` 上视频封面和工作流封面的 `policy -> binary upload -> draft save` 都能稳定跑通。
- 下次先做：1) 先做一次本地浏览器手动验证并记录结果；2) 验证通过后继续下一个最小切片，优先可选 `discussion favorite/collection` 或发布页文案/状态细化。

- 继续把发布页上传链路跑到浏览器实测。先定位到一个前端运行态问题：`scripts/start-web-3100.ps1` 之前只设置了 `DRAMATV_API_BASE_URL`，没有给浏览器侧上传代码注入 `NEXT_PUBLIC_DRAMATV_API_BASE_URL`，导致 `/publish` 页能 SSR 出草稿，但浏览器里点击上传时 `createUploadPolicy` 直接在前端本地失败。
- 已更新 `scripts/start-web-3100.ps1`：现在会同时设置 `DRAMATV_API_BASE_URL` 和 `NEXT_PUBLIC_DRAMATV_API_BASE_URL`，并写入 `.next/dramatv-build-env.json`；`start` 模式下如果生产构建缺失、build env stamp 缺失或 public API base 变化，会自动重建；旧日志文件被占用时只警告，不再因为删日志失败把启动流程卡死。
- 浏览器实测继续暴露出第二个运行态问题：修完 public env 后，`POST /api/uploads/video-policy` 仍被 CORS 预检拦截，Chrome 报错为 `No 'Access-Control-Allow-Origin' header is present on the requested resource`，对应真实 requestId 为 `web-3ed0d966-0586-4f26-b991-283bff7b48cd`。
- 已更新 `apps/server/src/main/java/com/dramatv/community/shared/config/CorsConfig.java`，将本地开发跨域策略改为 `allowedOriginPatterns(\"http://localhost:*\", \"http://127.0.0.1:*\")`，不再把本地联调端口写死在 `3000 / 5173` 两组值上。
- 已验证：重新打包 `apps/server` jar，重启后端 `18080`，并用修好的启动脚本启动全新前端实例 `http://127.0.0.1:3102`；随后通过 Playwright 在 `/publish` 上完成真实浏览器上传验证，链路全部返回 `200`。
- 本次浏览器实测通过的关键链路与结果：
- `POST /api/uploads/video-policy` -> `200`，requestId `web-66191920-cb68-43ae-8d6f-018e189eacd8`
- `PUT /api/uploads/assets/10d4b4c2-c6f2-4a92-8143-3bfd2be3cf5e/binary` -> `200`，页面成功回填 `Source Asset ID = 10d4b4c2-c6f2-4a92-8143-3bfd2be3cf5e`，`Submit Video` 由禁用变为可点击
- `POST /api/uploads/image-policy` + `PUT /api/uploads/assets/427f8f53-4447-4ff4-bda2-61627eb6d84d/binary` -> `200`，页面成功回填 `Cover Asset ID = 427f8f53-4447-4ff4-bda2-61627eb6d84d`
- `POST /api/uploads/image-policy` + `PUT /api/uploads/assets/3d3676df-770c-47de-90b9-a798eb604015/binary` -> `200`，页面成功回填 `Workflow Cover Asset ID = 3d3676df-770c-47de-90b9-a798eb604015`
- 当前做到：发布页的 `source video upload + video cover upload + workflow cover upload` 已经在真实浏览器、真实前后端、真实本地文件落盘链路上验证通过；这条链路不再停留在“代码已写/构建已过”的阶段。
- 当前卡点：视频提交和工作流提交本身虽然仍有现成链路，但这轮没有继续往“提审成功后前台详情可读”做浏览器 smoke；本地前端实例目前依赖启动脚本固定注入的 API base，后续如果换端口或环境还要继续统一脚本入口。
- 下次先做：1) 补一轮 `Submit Video` / `Submit Workflow` 浏览器 smoke，把上传后的提交流转也实测掉；2) 然后继续下一个最小功能切片，优先可选 `discussion favorite/collection` 或发布页状态/错误信息细化。

- 继续把上传后的提交流转跑到浏览器实测。在 `http://127.0.0.1:3102/publish` 上完成一轮真实 smoke：先提交附带工作流，再提交视频，确认 `workflow` 和 `video` 都从 `Draft` 进入 `In Review`，并各自拿到真实 `targetId`。
- 这轮真实结果：
- `workflow` 提交后，状态变为 `In Review`，`targetId = ccfd6f04-10b3-4695-acf0-7b4d408808af`，并自动回写到视频表单里的 `Workflow ID`
- `video` 提交后，状态变为 `In Review`，`targetId = 99fac764-9d0c-463e-b5dd-e4a626e2a85c`
- 两个提交按钮在提交后都进入禁用态，说明发布页的最小提交流转已经从“可上传”推进到了“可提交并锁定”
- 顺手补了一个前端收口：`apps/web/src/features/publish/PublishPage.tsx` 现在会在 `videoDraft.targetId` / `workflowDraft.targetId` 出现时提供详情页跳转入口，初版文案为 `Open Published Video` / `Open Published Workflow`
- 随后的浏览器验证又暴露出一个真实语义问题：`in_review` 状态虽然已有 `targetId`，但 `/videos/{id}` 与 `/workflows/{id}` 详情路由仍按 `publish_status = 'published'` 过滤，所以提审后立即打开会得到 `404`，这两个入口会误导用户
- 已完成修正：发布页现在只会在 `statusCode === 'published'` 时展示 `Open Published Video` / `Open Published Workflow`；若当前是 `in_review` 且已有目标 ID，则改为显示明确状态提示，不再伪装成已可访问详情
- 已验证这个语义修正：在 `http://127.0.0.1:3104/publish` 上重新走最小 smoke，视频与工作流均进入 `In Review`，页面不再出现详情链接，转而显示：
- `Video review target created. The public detail link will appear after the video is published.`
- `Workflow review target created. The public detail link will appear after the workflow is published.`
- 同次 smoke 的真实目标 ID：
- `video targetId = 22968e91-49c1-4ae4-8b61-05f4a74a5aad`
- `workflow targetId = 0c81983d-a087-4791-b9b3-64746732e74f`
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过；`apps/web` 下 `npm.cmd run build` 通过；浏览器端在 `3102` / `3104` 两个新实例上完成真实 smoke。
- 当前做到：发布页视频主链路已经具备 `source upload -> optional workflow upload -> workflow submit -> video submit -> correct in_review state messaging` 的真实闭环，并且不再把不可访问的审核中内容伪装成可打开详情。
- 当前卡点：视频/工作流在 `in_review` 后仍没有“审核结果回流到 published”的本地演示链路，所以发布页还无法在本地自然进入“出现详情链接”的最终展示态；这一块需要接内部审核回调或给本地一个明确的审核通过入口。
- 下次先做：1) 补一个本地可控的“审核通过/发布完成”演示链路，让 `in_review -> published` 能闭环；2) 或切回社区互动面，继续做 `discussion favorite/collection` 这类下一刀全链路能力。
- 继续把本地发布闭环补到 `published`，但按产品边界不把“审核通过”做成用户端功能。新增 [scripts/invoke-local-audit-callback.ps1](/E:/点众/DramaTV社区搭建/scripts/invoke-local-audit-callback.ps1)，脚本直接复用现有 `/api/internal/audit-callback`，默认把 `video|workflow` 目标推进到 `approved/published`，也支持传自定义 `statusCode` 做内部联调。
- 本地实测通过一条工作流回调链路：`powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/invoke-local-audit-callback.ps1 -TargetType workflow -TargetId 0c81983d-a087-4791-b9b3-64746732e74f` 返回 `statusCode = approved`，随后 `GET /api/workflows/0c81983d-a087-4791-b9b3-64746732e74f` 可读，`GET /api/feed/home` 也已出现该工作流卡片。
- 本地实测通过一条视频回调链路：`powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/invoke-local-audit-callback.ps1 -TargetType video -TargetId 22968e91-49c1-4ae4-8b61-05f4a74a5aad` 返回 `statusCode = approved`，随后 `GET /api/videos/22968e91-49c1-4ae4-8b61-05f4a74a5aad` 可读，且关联工作流 `0c81983d-a087-4791-b9b3-64746732e74f` 的 `videoBindCount = 1`、`relatedVideos` 已包含该视频。
- 当前做到哪一步：正式主链路现在已经具备 `draft -> in_review -> internal audit callback -> published -> detail/feed visible` 的本地演示闭环，审核入口保持在内部脚本层，不暴露到 `/publish` 用户页。
- 下次先做什么：1) 如果要继续提效内部联调，再考虑把这条内部脚本接进 `/dev/smoke` 开发工具页；2) 用户侧功能继续按最小切片回到 `discussion favorite/collection` 或其他未完成的后端真链路。
- 继续按最小切片补讨论区互动，这一刀只做帖子收藏，不扩散到列表页。后端新增 `apps/server/src/main/resources/db/migration/V7__add_discussion_thread_favorite_count.sql`，为 `discussion_threads` 增加真实 `favorite_count` 聚合列并从 `interaction_actions(action_type='favorite', target_type='post')` 回填已有数据。
- 后端同时补齐帖子收藏真链路：`InteractionJdbcPersistenceService` 现在允许 `targetType=post` 走 `/api/interactions/favorite`，并把聚合数同步回 `discussion_threads.favorite_count`；`DiscussionQueryService` 与 `DiscussionThreadDetailResponse` 也已返回 `stats.favoriteCount` 和 `viewerActions.favorited`。
- 前端同步接通帖子详情收藏：`apps/web/src/lib/contracts/community-api.ts`、`apps/web/src/lib/contracts/view-models.ts`、`apps/web/src/lib/api/community-service.ts`、`apps/web/src/lib/mappers/community.ts` 已扩展帖子详情契约；`apps/web/src/features/discussions/actions.ts` 新增 `toggleDiscussionFavoriteAction`；`apps/web/src/features/discussions/DiscussionDetailPage.tsx` 已显示收藏统计并提供 `Favorite Post / Remove Favorite` 交互按钮。
- 静态验证通过：根目录 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过；`apps/web` 下 `npx.cmd tsc --noEmit` 与 `npm.cmd run build` 通过。
- 真实接口 smoke 通过：用临时 `18082` 进程在同一个 PowerShell 命令里拉起新 jar、打请求、再自动停进程，针对线程 `post-publish-smoke-test-b7868830 / b7868830-768e-4c51-9d69-08a70a538010` 验证 `favorite` 前后状态完整回流。实测结果为 `favoriteCount 0 -> 1 -> 0`、`viewerActions.favorited false -> true -> false`；请求 `requestId` 分别为 `b74e414c-85f2-49a3-a7cd-47657a2386e9` 和 `81f7fc61-aa4a-40f9-ba91-e3a34a67d589`。
- 运行态补记：本次一度因为 `18080` 正在运行导致可执行 jar 被锁，`package` 无法 repackage；在当前执行环境里，临时后端 smoke 用“同一命令内启动临时进程 -> 轮询健康检查 -> 打请求 -> finally 里停进程”的方式比常驻后台启动更稳。
- 当前做到哪一步：讨论详情页现在已经具备真实 `评论 + 评论点赞 + 帖子点赞 + 帖子收藏` 闭环，收藏不再只是视频/工作流能力。
- 下次先做什么：优先继续同一条最小切片路线，补 `discussion collection/favorite` 之外的下一刀，例如讨论列表/首页的收藏态透出，或转去做发布/详情链路里仍未完成的用户侧互动能力。
- 继续把同一条能力往上游透出，这一刀只做“讨论列表 / 首页侧栏显示帖子收藏态”，不增加新的列表交互。后端 `DiscussionHomeResponse` 与 `DiscussionQueryService.loadFeaturedThreads(...)` 已补 `favoriteCount` 和 `viewerActions.favorited`，这样 `/api/discussions/home` 返回的线程卡片数据不再只有回复数。
- 前端同步扩展 `ApiDiscussionHomeResponse`、`DiscussionThreadCardView` 和 `mapDiscussionHubPageView(...)`，讨论卡片现在具备 `favoriteCountLabel` 与 `viewerFavorited`；`apps/web/src/features/discussions/DiscussionsPage.tsx` 与 `apps/web/src/features/home/HomePage.tsx` 已把这两个字段透出到列表 UI。
- 静态验证再次通过：根目录 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过；`apps/web` 下 `npx.cmd tsc --noEmit` 与 `npm.cmd run build` 通过。
- 真实接口 smoke 这次改用 `spring-boot:run` 临时进程完成，因为当前环境下可执行 jar 偶发 `NoClassDefFoundError` 类加载异常。针对 `GET /api/discussions/home?channel=video-production` 的目标线程 `b7868830-768e-4c51-9d69-08a70a538010`，实测收藏态会随帖子收藏动作同步回流：`favoriteCount 0 -> 1 -> 0`、`viewerActions.favorited false -> true -> false`；请求 `requestId` 分别为 `98b68688-4f2e-4905-aded-d031aab3b01b` 与 `fe8ad928-4ca2-404c-9f29-a7b57c164930`。
- 当前做到哪一步：讨论详情页、讨论列表页和首页右侧讨论入口现在都能读取真实帖子收藏态，用户即使不进入详情页，也能看到哪些讨论帖已经被当前账号收藏。
- 下次先做什么：继续按最小切片补“列表可操作”能力时，可以优先做讨论列表卡片上的点赞/收藏快捷动作；如果想回主发布链路，就转去补发布后内容管理或更多详情页互动。
- 继续把讨论区列表卡片快操作补到“点赞”这一刀：后端 `DiscussionHomeResponse` / `DiscussionQueryService` 已补 `likeCount` 与 `viewerActions.liked`，前端 `DiscussionThreadQuickFavoriteCard` 现在支持 `Like` / `Favorite` 双快操作，首页侧卡与讨论列表共用同一套真实卡片状态。
- 已验证：`apps/server` compile、`apps/web` 下 `npx.cmd tsc --noEmit` 通过；真实接口 `POST /api/interactions/like`、`DELETE /api/interactions/like`、`GET /api/discussions/home?channel=video-production` 连通，requestId 分别为 `quick-like-post-smoke-20260412-5`、`quick-like-post-smoke-20260412-6`、`quick-like-post-smoke-20260412-7`。
- 浏览器实测：在 `http://127.0.0.1:3106/discussions` 与首页 `/` 上，线程 `b7868830-768e-4c51-9d69-08a70a538010` 的点赞状态完成 `0 -> 1 -> 0` 回流，同时 `Like -> Unlike -> Like` 与首页侧卡 `Liked` 状态同步。
- 继续回到发布页可用性这条线，不再让帖子绑定强依赖手填 `bindingTargetId`。`getPublishBootstrap()` 现已额外拉取当前作者已发布的 `videos/workflows`，`PublishPageView` 增加 `postBindingCandidates`，帖子表单新增真实 `Published Target` 选择器，并在选择时自动回填 `bindingTargetId`，仍保留手填兜底。
- 浏览器实测：`http://127.0.0.1:3106/publish` 的帖子发布表单现在可以直接选择 `Review state fix workflow · Copyable workflow` 作为绑定目标，不再手填 ID；提交后草稿 `651e1c30-4942-442f-89ff-ee552f75db13` 进入 `Published`，生成线程 `5d02e4ce-f9fc-4aa5-9019-ca5a7e23017b` / slug `post-publish-selector-smoke-20260412-workflow-option`。
- 真实联动验证：从发布页打开 `/discussions/post-publish-selector-smoke-20260412-workflow-option` 后，详情页正确显示 `Bound workflow: Review state fix workflow`，并可继续跳转到 `/workflows/0c81983d-a087-4791-b9b3-64746732e74f`；`GET /api/discussions/home?channel=video-production` 的 requestId `3134004b-b9c7-4cdb-8122-7200301b94b6` 已返回新线程位于首位，首页侧栏也已读到该帖子。
- 当前做到哪一步：两种发布主线现在都具备真实用户侧闭环。视频发布链路已到 `draft -> in_review -> internal audit callback -> published`；帖子发布链路已到 `draft -> published -> discussion detail visible -> bound workflow/video jump`。
- 下次先做什么：优先继续补发布页的“绑定对象可读性”，比如给已选目标增加摘要/跳转预览；如果切回讨论区，则补列表快操作的成功提示与 requestId 透出。
- 继续沿着同一条发布页主线补“已选绑定对象的可读性”，不新增后端接口。前端 `PublishBindingTargetOptionView` 现已补 `summary` 与 `href`，发布页选择已发布视频/工作流后，会直接显示目标标题、摘要文案、辅助标签、目标 ID 与跳转入口，而不再只是下拉框里的一条文本。
- 代码收口：`mapPublishVideoBindingTarget(...)` 与 `mapPublishWorkflowBindingTarget(...)` 已把真实 `summary` / 详情链接映射进发布页视图；`PublishPage.tsx` 新增 `Selected Target` 预览卡和 `Manual Target` 降级提示；`globals.css` 补了预览卡样式，仍复用发布页现有视觉语言。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过。
- 浏览器实测：在 `http://127.0.0.1:3106/publish` 切到 `Post Publish` 后，选择 `Binding Type = workflow`、`Published Target = Review state fix workflow - Copyable workflow`，页面会立即出现 `Selected Target` 预览块，并提供 `Open Selected Workflow` 跳转；点击后已成功进入 `/workflows/0c81983d-a087-4791-b9b3-64746732e74f`。
- 当前做到哪一步：帖子发布页现在已经从“能绑定”推进到“能看懂自己绑定了什么”。当前用户侧闭环为 `选择真实已发布目标 -> 页面内看到预览 -> 可直接打开确认 -> 再提交帖子`。
- 下次先做什么：优先补“同页内刚发布的视频/工作流自动进入帖子绑定候选列表”，这样用户在一次会话里完成内容发布后，不刷新页面也能立刻发绑定讨论贴；如果暂时不做这个，再补列表快操作成功提示与 requestId 透出。
- 2026-04-12 产品口径修正：帖子不是视频/工作流的绑定外壳，而是独立内容类型；只有视频与工作流做绑定展示。已把用户端帖子绑定能力从前台撤回，先不删除后端保留字段，避免打断已跑通的真实链路兼容性。
- 前端收口：`apps/web/src/features/publish/PublishPage.tsx` 已移除帖子表单里的 `Binding Type / Published Target / Binding Target ID / Selected Target / Manual Target`；帖子提交 payload 不再发送 `bindingTargetType`、`bindingTargetId`；发布页顶部与模式卡文案已改为“帖子独立发布”。
- 讨论区收口：`apps/web/src/features/discussions/DiscussionDetailPage.tsx` 不再展示 `Author And Binding / Open Bound Content / Bound target`；`apps/web/src/features/discussions/DiscussionThreadQuickFavoriteCard.tsx` 不再在列表卡片上展示帖子绑定 chip。
- 数据装配收口：`apps/web/src/lib/contracts/community-api.ts`、`apps/web/src/lib/contracts/view-models.ts`、`apps/web/src/lib/api/community-service.ts`、`apps/web/src/lib/mappers/community.ts` 已去掉发布页对 `postBindingCandidates` 的依赖，`getPublishBootstrap()` 不再额外拉取创作者已发布视频/工作流给帖子表单使用。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过。
- 浏览器实测：在 `http://127.0.0.1:3106/publish` 切到 `Post Publish` 后，表单不再出现任何绑定入口；随后发布独立帖子 `standalone-post-smoke-20260412-151127`，草稿 `694ac9c0-7be2-4fd7-b06a-487686e38114` 进入 `Published`，目标线程 `0c1a3487-1063-4fd1-abf6-328e41c7be00`，slug 为 `/discussions/standalone-post-smoke-20260412-151127`。
- 浏览器实测补充：打开 `/discussions/standalone-post-smoke-20260412-151127` 后，详情页仅保留独立帖子语义，右侧显示 `Author Snapshot` 和 “This thread is an independent discussion post.”，不再出现任何绑定对象跳转入口。
- 当前做到哪一步：视频发布链路保持“可选绑定工作流”，帖子发布链路已回到“独立帖子”；用户侧产品语义已与最新口径一致。
- 下次先做什么：继续按最小切片推进后端未完善能力，优先梳理“视频发布并绑定工作流”的后续详情联动与列表透出，不再在帖子侧继续扩展绑定能力。
- 同轮顺手修复：Playwright 新会话检查时发现 `DiscussionThreadQuickFavoriteCard` 在缺少计数字段的线程上会因为 `undefined.toLocaleString()` 触发前端报错。已在 `apps/web/src/lib/mappers/community.ts` 为 discussion list/home 卡片补 `likeCount/favoriteCount` 默认值和 viewerActions 兜底，并在 `apps/web/src/features/discussions/DiscussionThreadQuickFavoriteCard.tsx` 增加 `safeCount(...)` 防守式处理。
- 已验证补充：再次执行 `apps/web` 下 `npx.cmd tsc --noEmit` 通过；重新打开 `http://127.0.0.1:3106/discussions` 后 Playwright 控制台 `error` 为 `0`，讨论列表卡片正常渲染。

### 2026-04-14

- 新增 `docs/01_总览/当前社区界面清单与页面跳转关系分析.md`，基于 `apps/web/src/app` 真实路由、`features/*` 真实页面组件和页面内实际跳转代码，整理当前已有界面、页面跳转关系、已成立闭环与缺口界面，不再用产品假设替代代码现状。
- 同步补充 `docs/README.md`，把这份页面分析文档纳入文档结构、推荐阅读顺序和当前主线文档表，后续补界面或补跳转关系时可直接从这里进入。
- 这轮文档分析确认了 4 个关键缺口：作者主页已有 `workflows` 数据但 UI 未展示；首页缺少稳定创作入口；工作流缺少独立发现页；视频/工作流详情与讨论广场之间缺少清晰互转入口。
- 当前做到哪一步：已经把“现在有哪几个界面、界面之间怎么跳、还缺哪些界面”沉淀成可直接给产品和研发共用的总览文档。
- 当前卡点：这次只完成了分析和文档沉淀，还没继续把缺口转成实施清单或直接落代码，尤其作者页工作流区和工作流发现页仍停留在结论层。
- 下次先做什么：优先把这份文档继续下钻成“缺口界面优先级与实施拆解”，或者直接按第一优先级开始补作者页工作流区 / 首页创作入口 / 详情页讨论入口。

- 产品口径修正：工作流不再按独立内容线规划，继续固定为“和视频绑定展示”的附属关系；已同步修改 `docs/01_总览/当前社区界面清单与页面跳转关系分析.md` 与 `memory/MEMORY.md`，移除“工作流独立发现页 / 作者页独立工作流区”这类错误方向。
- 同轮补充新的缺口页面：个人中心页已明确加入产品分析与项目记忆，当前最低要求是承接“个人信息 + 我的点赞 + 我的收藏”，后续再视阶段追加“我的发布 / 我的草稿 / 我的关注”。
- 继续收口页面分析文档：已把个人中心页进一步融合进 `docs/01_总览/当前社区界面清单与页面跳转关系分析.md` 的全局关系图、页面跳转拆解、闭环分析和优先级章节，同时把作者主页重新定义为“对外创作者主页”，避免和个人中心混同。

- 个人中心第一版已从文档位推进到真实全链路实现。后端新增 `apps/server/src/main/java/com/dramatv/community/me/controller/MeController.java`、`apps/server/src/main/java/com/dramatv/community/me/application/MeQueryService.java` 与 `apps/server/src/main/java/com/dramatv/community/me/dto/response/MeHubResponse.java`，提供真实接口 `GET /api/me/hub`，返回当前用户 profile、最近点赞列表、最近收藏列表。
- 前端新增 `apps/web/src/app/(community)/me/page.tsx` 与 `apps/web/src/features/me/PersonalCenterPage.tsx`，并同步更新 `apps/web/src/lib/contracts/community-api.ts`、`apps/web/src/lib/contracts/view-models.ts`、`apps/web/src/lib/api/community-service.ts`、`apps/web/src/lib/mappers/community.ts`，让 `/me` 页面直接消费真实后端数据，不再是规划位或 mock 容器。
- 全局入口同步收口：`apps/web/src/components/shared/PageShell.tsx` 已把顶栏头像默认承接到 `/me`；`apps/web/src/features/home/HomePage.tsx` 已取消把头像跳到推荐作者，首页和其他主线页面现在统一进入个人中心。
- 页面分析文档已继续修正到与代码一致：`docs/01_总览/当前社区界面清单与页面跳转关系分析.md` 不再把首页头像写成跳作者页，也不再把 `/me` 写成建议页，而是明确记录当前已上线的真实承接关系与下一步缺口。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过，`npm.cmd run build` 通过；`apps/server` 下 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过。
- 运行态补记：临时在 `127.0.0.1:18082` 拉起新后端进程后，`GET /api/me/hub` 已返回 `200 OK`，示例数据里 `profile.displayName = Rina Flux`，`likedItems = []`，`favoritedItems = []`。当前常驻的 `18080` 旧进程如果还没重启，会继续出现 `/api/me/hub` 不存在的旧行为，这不是代码问题，而是本地进程版本没更新。
- 当前做到哪一步：个人中心已经从“文档要求”推进到“真实页面 + 真实接口 + 全局入口”第一版闭环，作者主页和个人中心的产品分工已真正落到代码。
- 下次先做什么：优先继续补 `首页创作入口`、`视频/工作流详情 -> 讨论入口`，或者沿 `/me` 这条线继续补 `我的关注 / 我的发布 / 我的草稿`。

- 对照 `docs/02_研究/YouMind资源抓取与复刻对接总结.md` 继续核实外部提示词页现状，确认之前两个页面都还停留在“预览态”：`/seedance` 仍直接读 `seedance-samples.ts` 的 12 条静态样本，`/nano-banana` 虽已读 `public/nano-banana-data.json`，但同步脚本只下发了 10 条精选。
- 已收口 `apps/web/src/app/(community)/seedance/page.tsx` 与 `apps/web/src/features/seedance-replica/SeedanceReplicaPage.tsx`：`/seedance` 现已改成和 `/nano-banana` 一样从 `public/seedance-data.json` 读取数据，页面统计、下载文件名、搜索占位和底部提示都改为读取真实同步结果，不再写死 `1511 / 前10条 / 加载更多中` 这种旧预览文案。
- 重写 `docs/02_研究/sync-seedance-assets.js`：数据源不再依赖旧的 extracted top10 文件，而是直接聚合 `docs/02_研究/youmind-video-assets/youmind-seedance-library*` 各批次库，按 `featured + 发布时间` 排序后生成 `apps/web/public/seedance-data.json`；本地已同步的视频继续走 `/seedance-videos/*`，其余条目先回退到真实外部视频地址，避免一次性把大量视频全量拷进前端仓库。
- 同步扩大 `docs/02_研究/sync-nano-banana-assets.js` 的输出规模，`apps/web/public/nano-banana-data.json` 已从 10 条扩到 30 条，`/nano-banana` 当前展示仍是精选样本页，但不再是最初那组 10 条超小样本。
- 已验证：执行 `node .\\sync-seedance-assets.js` 后生成 `apps/web/public/seedance-data.json`，当前统计为 `totalLibraryItems = 1452`、`renderedItems = 30`；执行 `node .\\sync-nano-banana-assets.js` 后，`apps/web/public/nano-banana-data.json` 当前统计为 `totalLibraryItems = 3282`、`renderedItems = 30`。
- 已验证补充：`apps/web` 下 `npx.cmd tsc --noEmit` 通过，`npm.cmd run build` 通过。
- 当前做到哪一步：两个 YouMind 提示词页都已经从“旧静态预览页”推进到“读取最新同步产物的可用参考页”，虽然仍是精选样本展示，不是整库全量渲染，但页面接法和数据来源已经对齐到当前研究资产。
- 下次先做什么：1) 再决定是否把 `/seedance` 与 `/nano-banana` 继续从“30 条精选”扩大到更大的分批展示；2) 如果用户更关注视觉一致性，再对照 `nano-banana-replica-preview` 做一轮 UI 版本比对与收口。

- 继续收口 `Nano Banana` 的 UI 版本：已将 `docs/02_研究/nano-banana-replica-preview` 的最新预览稿版式正式迁到 [apps/web/src/features/nano-banana-replica/NanoBananaReplicaPage.tsx](/E:/点众/DramaTV社区搭建/apps/web/src/features/nano-banana-replica/NanoBananaReplicaPage.tsx) 和 [apps/web/src/features/nano-banana-replica/NanoBananaReplicaPage.module.css](/E:/点众/DramaTV社区搭建/apps/web/src/features/nano-banana-replica/NanoBananaReplicaPage.module.css)，同时保留 `apps/web/public/nano-banana-data.json` 这条正式数据入口。
- 本轮 UI 合并点：分类改回预览稿里的 `全部 / 精选 / 需要参考图 / 单图案例 / 长提示词 / 最新`，卡片改为单主图 + 深色 prompt 卡 + 底部 CTA，详情层改为预览稿结构，不再沿用之前那套多图网格详情 UI。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过，`npm.cmd run build` 通过；Playwright 实测 `http://127.0.0.1:3106/nano-banana` 已显示新页头文案“正式页现在直接读取社区同步产物，同时沿用最新预览稿的界面结构”，说明运行态也已切到新 UI。
- 当前做到哪一步：`/nano-banana` 现在已经是“最新 UI + 当前正式数据接法”的合并版，不再是旧正式页 UI，也不再是预览目录里那份只吃 10 条数据的静态稿。
- 下次先做什么：如果继续推进同一块，优先把 `nano-banana-replica-preview` 里还没迁入的细节整理成 checklist，然后按同样方法继续收 `Seedance` 的 UI 版本。

### 2026-04-15

- 新增 `docs/03_架构/前端技术栈取舍：继续使用 Next.js 而不切换 React + Vite.md`，把“新版前端是否应从 `Next.js` 切到 `React + Vite`”的分析正式沉淀成架构决策文档。
- 文档结论已固定为：当前阶段不切换正式前端技术栈，继续以 `apps/web` 作为唯一正式前端主线；同事的 `mindloop-_-cinematic-archive (1)` 只作为视觉母版和动效参考，不作为生产运行架构直接继承。
- 文档依据已明确写回：当前代码已经实际依赖 `app router`、服务端页面、`notFound()`、`use server`、`revalidatePath`、统一社区 API 服务层等能力；如果切到 `React + Vite`，本质上不是“换脚手架”，而是重做路由、数据获取、交互刷新和应用边界。
- 同步更新 `docs/README.md`，把这份前端技术栈取舍文档纳入 `03_架构` 目录结构、推荐阅读顺序和当前主线文档表，后续涉及 UI v2 重构、是否保留双前端、是否切 SPA 时都以这份文档为统一入口。
- 当前做到哪一步：已经把“为什么不建议切栈”和“同事 Vite 原型应该如何正确使用”都固化为可复用文档，后续不需要在会话里重复口头解释同一轮技术栈判断。
- 下次先做什么：继续按这个结论推进新版前端，直接在 `apps/web` 内落地视觉重构切片，优先从首页或详情页开始抽取 cinematic 视觉语言并对接现有真实后端。

- 首页 UI v2 第一刀已落地到 `apps/web/src/features/home/HomePage.tsx`：不改后端接口、不改路由，只重写首页结构，把页面从“侧栏 + 简单流列表”升级成“主舞台 + 创作入口 + 作品流 + 工作流入口 + 创作者雷达 + 讨论频道”的正式首页。
- 这轮首页重构继续严格使用真实数据源：直接消费 `feedItems`、`hotWorkflows`、`featuredCreators`、`discussionChannels`、`discussionHighlights`，不再使用 `homeHeroPrefillVideo` 之类的预填充素材作为首页主舞台。
- 首页新版已明确固化当前产品口径：视频仍是主内容；工作流继续作为视频后的方法入口展示；帖子继续走独立讨论区；`/nano-banana` 与 `/seedance` 继续作为独立资源页保留在首页入口层。
- 已验证：`apps/web` 下执行 `npx.cmd tsc --noEmit` 通过，`npm.cmd run build` 通过，说明这轮首页重构未破坏现有正式前端主线。
- 当前做到哪一步：新版视觉重构已经从“技术栈判断和文档阶段”进入“真实页面落地阶段”，首页现在是第一块已经正式改造完成的页面切片。
- 当前卡点：本轮只完成了首页，尚未把同样的 cinematic 语言继续迁到视频详情页、作者页、个人中心页和发布页；运行态视觉只做了构建级验证，未追加一轮稳定的浏览器快照验收。
- 下次先做什么：沿同一套视觉语言继续推 `视频详情页` 或 `作者页`，优先把“作品 -> 工作流 -> 作者 -> 讨论”的主链路页面外观统一掉。

- 视频详情页 UI v2 已落到 `apps/web/src/features/video-detail/VideoDetailPage.tsx` 与 `apps/web/src/app/globals.css`：不改接口层、不改 server action，只把页面从“播放器 + 右侧信息栏”改成“左侧作品信息 / 中部放映区 / 右侧作者与工作流联动卡”的放映页结构。
- 这轮视频详情页继续对齐当前产品口径：视频仍是主内容；工作流只作为与视频绑定的创作过程入口出现；作者主页、评论区、更多作品被压进同一条继续浏览路径，避免再把工作流渲染成独立内容线。
- 页面内已保留并重新安放真实交互：点赞、收藏、关注作者、发表评论、评论点赞都继续走现有 `community-interactions/actions.ts`；播放资源仍优先真实视频地址，缺失时才回退到明确标识的本地演示样片。
- 已验证：`apps/web` 下再次执行 `npx.cmd tsc --noEmit` 通过，`npm.cmd run build` 通过；同时本地 `http://127.0.0.1:18080/actuator/health` 与 `http://127.0.0.1:3106/` 均返回 `200`，说明前后端和前端 dev 服务仍在线。
- 当前做到哪一步：首页之后，主链路里的视频详情页也已经切到新视觉骨架，首页 -> 视频详情这一段视觉语言已开始统一。
- 当前卡点：本轮运行态浏览器快照未完成，不是页面挂了，而是 Playwright MCP 会话被现有浏览器实例锁住，暂时拿不到新的页面快照。
- 下次先做什么：优先继续收 `作者页` 或 `个人中心页`，把“首页 -> 视频详情 -> 作者 / 个人中心”这段链路的视觉统一完；如需要浏览器级验收，先处理 Playwright 浏览器锁占用问题再补快照。

- 用户最新反馈已明确修正判断：虽然最近几轮做过首页与视频详情页的结构和样式改写，但“实际没有看到一点视觉效果的迁移”。因此不能再把当前状态描述成“视觉迁移已成功”，后续必须先回到运行态对照与设计差距分析。
- 新增 `docs/01_总览/新会话快速恢复指南.md`，专门给下一个聊天恢复上下文使用。文档里已经写清：
  - 当前正式工程主线是什么
  - 最近真实做了什么
  - 哪些事情不能乐观化
  - 新会话第一优先级应该是什么
  - 应该按什么顺序读文档和代码
- 同步更新 `docs/README.md`，把这份恢复文档纳入 `01_总览`、推荐阅读顺序和当前主线文档表，避免后续新会话漏读。
- 当前做到哪一步：项目已经有一份可以直接交给新聊天的恢复入口，不需要再靠长上下文口头回忆。
- 下次先做什么：新聊天里先按恢复文档执行，优先输出“当前运行态页面与参考前端的视觉迁移差距清单”，再决定首页和视频详情页下一轮具体改法。

### 2026-04-17

- 继续按参考前端做运行态核对，当前本地前端以 `apps/web` 运行在 `http://127.0.0.1:3106`。
- 已确认 `apps/web/src/features/workflow-detail/WorkflowDetailPage.tsx` 的新版工作流详情样式已实际挂到 `/workflows/[id]`，不再是旧版信息页；Playwright 实测 `/workflows/0c81983d-a087-4791-b9b3-64746732e74f` 与 `/workflows/dd715ee9-189b-4450-a4ca-fdf71fb8aafb` 均已显示新版布局。
- 已确认首页精选流与作者页的资源角标逻辑已对齐详情页资源模式：有绑定工作流的视频卡现在显示 `WORKFLOW`，不再出现“卡片写 PROMPT、点进详情却是工作流模式”的错位。
- Playwright 实测通过的当前关键链路：
- 首页 `http://127.0.0.1:3106/`
- 作者页 `http://127.0.0.1:3106/creators/11111111-1111-1111-1111-111111111111`
- 视频详情 `http://127.0.0.1:3106/videos/22968e91-49c1-4ae4-8b61-05f4a74a5aad`
- 视频详情 `http://127.0.0.1:3106/videos/3d82413b-1036-4c1b-93dd-3a102e0b4683`
- 工作流详情 `http://127.0.0.1:3106/workflows/0c81983d-a087-4791-b9b3-64746732e74f`
- 工作流详情 `http://127.0.0.1:3106/workflows/dd715ee9-189b-4450-a4ca-fdf71fb8aafb`
- 当前做到哪一步：`超能社区 / 精选 / 视频详情 / 工作流详情 / 作者页` 这条前端复刻主链路已经在运行态对齐到新版页面壳子，最近一轮用户指出的“详情页还是旧风格、资源标识不匹配”问题已在本地运行态核实为已修正。
- 下次先做什么：如果用户刷新后仍觉得不够像参考稿，就不要再查路由是否挂错，而是直接进入逐区块视觉微调，优先收标题字号、卡片比例、评论区密度和作者页卡片信息层级。

- 根据最新口径继续收口 `apps/web/src/features/workflow-detail/WorkflowDetailPage.tsx` 与 `apps/web/src/features/workflow-detail/WorkflowDetailPage.module.css`：工作流详情首屏不再使用单独的“流程网络图 + 状态卡”结构，而是统一回到和视频详情页同一套骨架，左侧保留视频区样式的填充位，右侧压成 `WORKFLOW badge + 标题 + 摘要 + 核心内容面板 + 三个互动按钮`。
- 同步把工作流动作收口到更轻的入口区：顶部只保留 `查看工作流` 位置，`复制到我的空间` 下沉到右下角工作流入口卡里，避免破坏与视频详情页统一的首屏信息层级。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过；Playwright 已实测 `http://127.0.0.1:3106/workflows/0c81983d-a087-4791-b9b3-64746732e74f`，当前页面已显示左侧统一填充区和右侧统一信息区。
- 当前做到哪一步：工作流详情页现在已经和视频详情页共用同一首屏排版逻辑；没有独立视频预览时，会保留统一的媒体展示区占位，不再回退到另一套页面结构。
- 下次先做什么：如果用户继续收细节，就直接在这版上调字号、左侧占位文案、右下角工作流入口卡和评论区密度，不再回头改页面骨架。

- 新增提示词详情页前端预览能力：在 [apps/web/src/app/(community)/videos/[id]/page.tsx](/E:/点众/DramaTV社区搭建/apps/web/src/app/(community)/videos/[id]/page.tsx) 中支持保留前端专用预览 id `prompt-preview`，并新增 [prompt-detail-demo.ts](/E:/点众/DramaTV社区搭建/apps/web/src/lib/prefill/prompt-detail-demo.ts) 提供稳定的 `PROMPT` 资源假数据，避免当前后端还没有真实 prompt 卡时无法验收页面。
- 同步重写 [VideoDetailPage.tsx](/E:/点众/DramaTV社区搭建/apps/web/src/features/video-detail/VideoDetailPage.tsx) 的 `prompt` 模式：右侧现在是正式的可复制提示词面板，文案改为中文结构化提示词；评论标题、占位文案、右下角操作卡都按“提示词详情页”语义单独处理，不再沿用工作流/视频详情的默认文案。
- 样式补充落到 [VideoDetailPage.module.css](/E:/点众/DramaTV社区搭建/apps/web/src/features/video-detail/VideoDetailPage.module.css)：新增 `promptPanelPrompt`、预览提示文案、提示词操作卡按钮组和移动端收口样式。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过；Playwright 已实测 `http://127.0.0.1:3106/videos/prompt-preview`，当前页面已显示 `PROMPT` 角标、右侧结构化提示词面板、底部“一键复制提示词”操作卡。
- 当前做到哪一步：现在已经有一个可直接访问的“提示词详情页”前端样式预览地址，不需要等后端先产出真实 prompt 数据再做视觉验收。
- 下次先做什么：如果用户认可这版结构，就继续把精选页/作者页里的 prompt 资源入口补出来，让卡片可以直接跳到真实 prompt 详情路由，而不是只保留预览页。

- 已继续把提示词详情页接回首页精选流：在 [prompt-detail-demo.ts](/E:/点众/DramaTV社区搭建/apps/web/src/lib/prefill/prompt-detail-demo.ts) 新增首页卡片元数据，在 [HomePage.tsx](/E:/点众/DramaTV社区搭建/apps/web/src/features/home/HomePage.tsx) 的 `buildCuratedItems(...)` 中注入 `PROMPT` 入口卡，当前 `/` 的“全部”页已能直接看到并点击进入 `/videos/prompt-preview`。
- 这轮顺手修正了卡位优先级：提示词入口最初因为演示热度被排到首页 Hero 位置，现在已压回普通卡位，不再抢首页现有主内容位。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过；Playwright 已实测首页出现 `PROMPT 月下双人对峙提示词` 卡片，点击后可正常进入标准提示词详情页 `http://127.0.0.1:3106/videos/prompt-preview`。
- 当前做到哪一步：提示词详情页现在不只是孤立预览页，而是已经具备从首页“全部”页进入的标准入口。
- 下次先做什么：如果继续推进，就把作者页和后续真实 prompt 数据也接到同一套路由，不再只依赖前端预览卡。
- Continued workflow detail page alignment polish: `apps/web/src/features/workflow-detail/WorkflowDetailPage.tsx` now uses `相关推荐` for the lower-right recommendation header, and `apps/web/src/features/workflow-detail/WorkflowDetailPage.module.css` now matches the standard video detail rhythm with `recommendRail gap: 22px` and `recommendHeader min-height: 31px`.
- Visual verification passed in Playwright: `/workflows/dd715ee9-189b-4450-a4ca-fdf71fb8aafb` now aligns the lower-right header with the left comment count, and measured `相关推荐` vs `1 条评论` top offset is `delta=0` against the standard `/videos/22968e91-49c1-4ae4-8b61-05f4a74a5aad` layout.
- Continued `/me` personal homepage replication: rewrote `apps/web/src/features/me/PersonalCenterPage.tsx` into a creator-style personal profile page with hero header, back link, edit/settings actions, tab bar (`作品 / 讨论 / 收藏`) and a four-column card gallery, with dedicated styles in `apps/web/src/features/me/PersonalCenterPage.module.css`.
- Updated `apps/web/src/app/(community)/me/page.tsx` to fetch the current user's published creator videos and workflows via `getCreatorVideos/getCreatorWorkflows`, so the `作品` tab now uses live published content instead of only the old `点赞/收藏` hub data.
- Verification passed: `apps/web` -> `npx.cmd tsc --noEmit`; Playwright checked `http://127.0.0.1:3106/me` and confirmed the new profile layout is live.

### 2026-04-18

- Continued frontend replica work after local reboot context: current priority remains front-end visual replication first, backend interface polishing later.
- Added the floating publish entry on the featured/home page in `apps/web/src/features/home/HomePage.tsx` and `apps/web/src/features/home/HomePage.module.css`; it links directly to `/publish` and follows the reference-style fixed bottom-right white plus button.
- Reworked `/publish` in `apps/web/src/features/publish/PublishPage.tsx` and `apps/web/src/features/publish/PublishPage.module.css` into the reference-style dark publish page: cancel link, archive title/type/description area, cover upload block, publish guide card, media upload tiles, core-content text area, visibility selector, save draft, and confirm publish action.
- Verification completed before service restart: `apps/web -> npx.cmd tsc --noEmit` passed, and `apps/web -> npm.cmd run build` passed with `/publish` included in the Next.js route list.
- Current runtime note: user reported the machine was rebooted and previous frontend/backend/docker services are down. Next step is to restart the local services and visually verify `http://127.0.0.1:3106/` and `http://127.0.0.1:3106/publish`.
- Runtime recovery completed after reboot: Docker Compose restarted local PostgreSQL and Redis; both containers reported healthy through `docker ps`. The reference replica target also restarted at `http://127.0.0.1:3111/`.
- Backend restart note: direct system `java` still points to Java 8, so the correct path is the project script `scripts/start-server-18080.ps1`, which uses `.tools/jdk-17`. Restarted backend on `http://127.0.0.1:18080`; `GET /actuator/health` returned `{"status":"UP"}`.
- Frontend restart note: Next.js dev server was restarted on `http://127.0.0.1:3106/` with the existing project script in non-sandbox mode. `GET /` returned `200`, and `GET /publish` returned `200` with the real publish page marker `发布新档案`; it no longer rendered the backend-unavailable fallback.
- Workflow preference update: user will handle acceptance checks; do not take excessive screenshots for routine verification. Screenshots remain appropriate when analyzing the target replica page, measuring visual layout, or diagnosing a specific mismatch.
- Continued homepage replica work on the formal `apps/web` mainline only. Rebuilt `apps/web/src/features/home/HomePage.tsx` and `apps/web/src/features/home/HomePage.module.css` from the previous multi-section “long information feed” into the reference-style homepage skeleton: full-screen cinematic hero, centered `Get Inspired with Us.` headline, glass search bar, compact archive wall, footer, and fixed publish button.
- Homepage content model remains aligned with the current community constraint: homepage archive cards now only expose `PROMPT` and `WORKFLOW` badges, and every card still routes to the matching prompt detail page or workflow detail page.
- Used the reference repo `mindloop-_-cinematic-archive (1)` as structural guidance instead of continuing blind visual guessing. The latest homepage now follows the same primary rhythm as `http://127.0.0.1:3111/`: hero first, archive wall second, footer last. Removed the previously overbuilt discussion/creator/launch multi-panel homepage layout from `/`.
- Hero polish pass completed: switched the hero background to the same cinematic atmosphere direction as the reference homepage, pulled the copy block upward, tightened typography rhythm, changed the search bar to the rounded glass style, and kept the floating white publish button in the lower-right corner.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` passed after the homepage rewrite, and Playwright rechecked `http://127.0.0.1:3106/` with the new homepage structure live. Latest visual checkpoint screenshot: `home-3106-after-home-polish.png`.
- 当前做到哪一步：首页已经从“长信息流式复刻偏差”收敛到“参考页骨架对齐”状态，当前 `3106` 运行态已是满屏头图 + 精选档案墙 + 页脚结构。
- 当前卡点：首页大骨架已经对了，但 hero 素材、个别字体细节、档案卡信息密度和顶部间距仍可能需要按用户最新验收继续微调；这轮没有继续改精选页和详情页，只收首页。
- 下次先做什么：等用户验收首页后，继续按同一视觉语言收精选页或补首页细节，不要再把首页加回多块运营分区。

- Continued homepage route split work for the new target mapping. `apps/web/src/components/shared/PageShell.tsx` now separates the two homepage semantics: `Drama TV -> /`, nav `首页 -> /home`, nav `精选 -> /seedance`, and nav `超能社区 -> /discussions`.
- Updated `apps/web/src/features/home/HomePage.tsx` so the current cinematic landing page keeps the `landing` nav state instead of pretending to be the content homepage.
- Added a new formal route at `apps/web/src/app/(community)/home/page.tsx` and a new page implementation at `apps/web/src/features/home/CommunityHomePage.tsx`.
- The new `/home` page is the first-pass content-community homepage skeleton for the route you described as “click the nav 首页 text after entering DramaTV”, while `/` remains the unauth cinematic landing page.
- `CommunityHomePage.tsx` reuses the existing real `getHomeFeed + getDiscussionHome` data path plus `homeDemoCatalog` fallback/demo resources, and builds a long-form homepage with sections for `灵感进发 / 为你推荐 / 工作流 / 讨论 / 作者 / 社区入口`. Resource badges remain constrained to `PROMPT` and `WORKFLOW`.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` succeeded; Playwright confirmed `http://127.0.0.1:3106/` still serves the cinematic landing page, and clicking the top nav `首页` now navigates to `http://127.0.0.1:3106/home` with the new content homepage layout live.
- 当前做到哪一步：你后面要继续复刻的两个“首页”现在已经拆开了，`/` 是点 `Drama TV` 回去的 landing，`/home` 才是导航 `首页` 对应的内容社区首页。
- 当前卡在哪里：新 `/home` 目前还是第一版结构对齐，只是先把路由关系和长页骨架搭出来，还没有按你最新那张“点击首页字样后进入的目标页”截图把顶部节奏、字级、分区密度和卡片阵列精修到位。
- 下次先做什么：直接在 `apps/web/src/features/home/CommunityHomePage.tsx` 上继续复刻新 `/home` 的目标页面，优先收顶部结构、`灵感进发 / 为你推荐` 分区、卡片阵列和发布按钮节奏。

- 根据用户最新指出的“精选页路由突然错了”继续回查运行态，确认根因不是页面挂了，而是我上一轮把社区内的 `精选` 导航错误改到了 `/seedance`。`/seedance` 在现有文档和代码里都只是视频提示词专题资料页，不是已经验收过的社区精选流页面。
- 对照用户提供的旧截图与 `mindloop-_-cinematic-archive (1)/src/App.tsx` 里的留存实现，恢复了正式社区精选页：新增 [apps/web/src/features/featured/FeaturedArchivePage.tsx](/E:/点众/DramaTV社区搭建/apps/web/src/features/featured/FeaturedArchivePage.tsx)、[apps/web/src/features/featured/FeaturedArchivePage.module.css](/E:/点众/DramaTV社区搭建/apps/web/src/features/featured/FeaturedArchivePage.module.css) 和 [apps/web/src/app/(community)/featured/page.tsx](/E:/点众/DramaTV社区搭建/apps/web/src/app/(community)/featured/page.tsx)。
- 当前正式路由映射已修正为：`Drama TV -> /`、导航 `首页 -> /home`、导航 `精选 -> /featured`、导航 `超能社区 -> /discussions`。`/seedance` 和 `/nano-banana` 继续保留为独立资源专题页，不再承接社区精选主导航。
- 同步收口站内精选入口和回流：`PageShell.tsx` 顶部导航、`HomePage.tsx` 的“查看全部”、`CommunityHomePage.tsx` 的“进入精选 / 查看更多”、`home-resource-catalog.ts` 的“进入精选页”卡片都已改为 `/featured`；视频详情、工作流详情、发布页的“返回列表 / 取消发布”也统一回到 `/featured`。
- 已验证：`apps/web -> npx.cmd tsc --noEmit` 通过；Playwright 实测 `http://127.0.0.1:3106/featured` 已显示社区精选页结构，顶部 `精选` 导航指向 `/featured`，从精选卡片进入 `/videos/prompt-preview-xianxia` 后“← 返回列表”已回到 `/featured`，浏览器控制台错误为 `0`。
- 当前做到哪一步：社区正式导航已经重新接回“社区精选页”，不再错误落到 `seedance` 专题页；用户指出的这条路由偏移问题已在运行态修正。
- 下次先做什么：继续按这张已恢复的精选页为基底，细收筛选条文案、卡片布局比例、右侧推荐位和字体细节，把 `/featured` 继续往你之前验收过的那版视觉上压近。

- Continued `/featured` visual polish on the formal `apps/web` route. Reworked [apps/web/src/features/featured/FeaturedArchivePage.tsx](/E:/点众/DramaTV社区搭建/apps/web/src/features/featured/FeaturedArchivePage.tsx) and [apps/web/src/features/featured/FeaturedArchivePage.module.css](/E:/点众/DramaTV社区搭建/apps/web/src/features/featured/FeaturedArchivePage.module.css) so the top filter/search/sort row now reads as one integrated control strip, the inner page body no longer looks like a boxed black frame, and the card wall now uses a lead collage plus balanced masonry columns instead of the previous hole-prone span grid.
- Added display-side text compaction on the featured page so card titles, authors, and tag strings render shorter and cleaner, reducing the noisy long-string feel while keeping the resource types constrained to `PROMPT` and `WORKFLOW`.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit`; Playwright rechecked `http://127.0.0.1:3106/featured` and captured the updated visual checkpoints `featured-current-before.png`, `featured-reference-3111.png`, `featured-after-pass-1.png`, `featured-after-pass-2.png`.
- 当前做到哪一步：精选页已经从“路由修正后的恢复版”推进到“版式收口版”，这轮重点处理了顶部栏不对、页面像整体黑框、卡片排布出现明显空缺这三处问题。
- 当前卡在哪里：整体方向已经对上，但如果继续往参考图压，还可以细收顶部控件宽度比例、卡片封面素材选择、局部留白和字体权重。
- 下次先做什么：等用户验收这版 `/featured`，再决定继续精修精选页，还是切回下一个待复刻页面；不要再改动 `精选 -> /featured` 这条已修正的正式路由映射。

- 根据用户最新纠正，四个页面新增的“画布入口”最终口径改为：放在左侧，原来的发布入口不要动，只做位置避让，不允许重合遮挡。
- 已在 [apps/web/src/components/shared/PageShell.tsx](/E:/点众/DramaTV社区搭建/apps/web/src/components/shared/PageShell.tsx) 调整共享浮动入口顺序，改成左侧 `画布入口`、右侧保留原 `发布` 卡片；文案收敛为“画布入口 / 进入联动画布”。
- 已在 [apps/web/src/app/globals.css](/E:/点众/DramaTV社区搭建/apps/web/src/app/globals.css) 收口浮动按钮样式：整体固定栏向内收，左侧画布入口改为更紧凑的小号样式，右侧发布入口维持原白色卡片视觉，桌面端与移动端都补了避让间距。
- 已验证：`apps/web -> npx.cmd tsc --noEmit` 通过；`apps/web -> npm.cmd run build` 通过；Playwright 已实测 `http://127.0.0.1:3106/`、`/home`、`/featured`、`/discussions` 四页，当前都是左侧画布入口、右侧发布入口，未出现重叠遮挡。
- 当前做到哪一步：四个主页面的浮动双入口位置已经按最新口径收正，现阶段不再需要回退到“右侧新增画布入口”的错误方案。
- 下次先做什么：如果用户继续精修，就直接在这版基础上微调左侧画布入口的尺寸、阴影、文案密度和离边距离，不再改动发布入口本身。
- 2026-04-19 后端登录与鉴权边界继续收口：`apps/server` 已把 `CurrentUserFilter` 解析出的 Bearer token 用户同步写入 Spring Security `SecurityContext`，`SecurityConfig` 改为显式区分公开读接口与受保护接口，并统一输出 JSON `401/403 + requestId`，不再返回默认 HTML 错误页。
- 2026-04-19 已验证当前安全边界：匿名访问 `/api/feed/home` 仍为 `200`；匿名访问 `/api/me/hub`、`/api/uploads/video-policy`、`/api/comments POST`、`/api/interactions/*` 均为 `401`；使用 `creator-a / dramatv-local-dev` 登录后，`/api/auth/me` 与 `/api/uploads/video-policy` 恢复 `200`。
- 2026-04-19 本地后端开发脚本补噪音处理：`scripts/start-server-dev-18080.ps1` 遇到旧日志文件被占用时不再抛出 `Remove-Item` 错误，而是提示进入 append 模式，避免反复重启时的误导性报错。
- 2026-04-19 前端路由边界第一次正式收口：新增 `apps/web/src/lib/routes/community-routes.ts` 统一定义正式社区页与内部隔离页；正式主线保留 `/`、`/home`、`/featured`、`/discussions`、`/discussions/new`、`/discussions/[slug]`、`/publish`、`/videos/[id]`、`/workflows/[id]`、`/creators/[id]`、`/canvas/[runtimeId]`、`/login`、`/me`。
- 2026-04-19 已把历史复刻/实验页迁入内部隔离区：新增 `/internal`、`/internal/seedance`、`/internal/nano-banana`、`/internal/dev/smoke`；旧的 `/seedance`、`/nano-banana`、`/dev/smoke` 现仅做跳转，不再作为正式主线页面。
- 2026-04-19 `proxy.ts` 已对 `/internal` 放行，避免内部参考页被游客登录拦截；`SeedanceReplicaPage` 内部分享和跨页跳转也已改到 `/internal/*`，不再把实验页暴露为主站流量入口。
- 2026-04-19 顶部个人入口语义修正：`PageShell` 默认不再把登录用户名字/头像指向 `/me`，而是默认跳转到当前用户自己的公开主页 `/creators/{currentUser.id}`；`/me` 继续保留为个人中心能力页。
- 2026-04-19 已验证前端整理结果：`apps/web -> npx.cmd tsc --noEmit` 通过，`apps/web -> npm.cmd run build` 通过。当前构建产物中正式主线和内部隔离页可同时存在，但内部页已从产品语义上完成分层。
- 2026-04-19 下一步主线：在现有正式工程 `apps/web + apps/server` 上设计并实现“已抓取视频+提示词 / 图片+提示词”导入链路。开始前需要用户提供本地资源路径；导入时优先保证数据模型和后续画布联动兼容，不走一次性脏导入。
- 2026-04-20 互动补漏继续收口：`prompt` 已正式纳入后端 `comments / like / favorite` 目标类型，前端提示词详情页不再借道视频互动动作；`/prompts/[id]` 现已加载真实评论并回刷真实互动状态。
- 2026-04-20 工作流详情页互动已确认走真实后端链路：实测使用 `creator-a / dramatv-local-dev` 对真实工作流 `0c81983d-a087-4791-b9b3-64746732e74f` 完成点赞、收藏、评论、评论点赞，接口返回与数据库计数一致；随后已执行 `scripts/reset-local-interaction-baseline.ps1`，视频 / 工作流 / 提示词 / 帖子互动计数全部重新归零。
- 2026-04-20 为避免用户继续点进假 workflow target，`/featured` 已改为优先展示后端真实 `hotWorkflows`，访客首页 `HomePage` 也改为优先使用真实 `view.hotWorkflows`；保留的 `workflow-preview-*` 详情页已明确降级为只读预览态，不再伪装成可写的真实互动页。
