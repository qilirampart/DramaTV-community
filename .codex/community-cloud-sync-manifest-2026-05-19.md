# 社区测试环境云同步清单

更新时间：2026-05-19

## 1. 这份清单解决什么问题

当前工作区不是“只有一两个待同步文件”，而是：

- `apps/web` 有大量社区前台改动
- `apps/server` 有大量社区后端与共享治理改动
- `apps/admin` 正在并行开发
- `scripts / docs / .codex / artifacts / .next / logs` 里混有大量本地工具、台账、构建产物和临时文件

因此后续不能再用“看起来改了很多，整包一起上云”的方式处理。

这份清单只做一件事：

- 把“哪些要进入云上运行态”
- “哪些只需要留在本地仓库”
- “哪些绝对不能带上云”

明确分开。

## 2. 当前工作区现状

按已跟踪变更粗分：

- `apps/server`：66 个已跟踪改动
- `apps/web`：70 个已跟踪改动
- `scripts`：4 个已跟踪改动 + 大量新增脚本
- `apps/admin`：整套目录新增/并行开发中

现实含义：

- 现在的脏工作区已经不适合“直接部署当前目录”
- 后续必须按“同步批次”切

## 3. 云同步分层原则

后续统一分四层看：

### A. 必须进入云上运行态

这类变更会直接影响公网/测试环境用户访问结果。

- `apps/server` 运行时代码
- `apps/server/src/main/resources/db/migration/*`
- `apps/web` 社区前台运行时代码
- `apps/admin` 后台前端运行时代码

### B. 建议进仓库，但不需要部署到云服务

这类变更很重要，但不属于云上运行时。

- 验证脚本
- 部署脚本
- smoke / readiness / 回填 / 导入 / 清理脚本
- 共享台账
- 设计与实施文档

### C. 本地开发辅助文件，不需要同步

- `.codex/*.md`
- `docs/*`
- `README.md`
- `memory/MEMORY.md`

### D. 明确禁止带上云的本地产物

- `apps/web/.next-*`
- `.logs/`
- `artifacts/`
- `.codex/*.log`
- `.codex/*.err.log`
- 临时导出文件、HTML 快照、测试中间产物

## 4. 下一次真正需要上云的内容

按“会影响云上实际行为”的角度，下一次云同步应只关注下面三包。

### S1. 社区后端运行态包

这是优先级最高的一包。

#### 需要同步的内容

- `apps/server/src/main/java/com/dramatv/community/shared/request/**`
  - `traceId / requestId / bizContext / clientIp` 相关链路
- `apps/server/src/main/java/com/dramatv/community/shared/error/**`
  - 统一错误码、错误响应、错误日志兜底
- `apps/server/src/main/java/com/dramatv/community/shared/security/**`
  - 敏感信息脱敏、限频、安全边界
- `apps/server/src/main/java/com/dramatv/community/publish/**`
  - 发布页 bootstrap
  - 草稿生命周期
  - 上传与媒体任务
  - 媒体处理与回调
- `apps/server/src/main/java/com/dramatv/community/interaction/**`
  - 评论
  - 评论治理
  - 评论目标设置
- `apps/server/src/main/java/com/dramatv/community/me/**`
  - 个人中心
  - 通知
  - 资料编辑
- `apps/server/src/main/java/com/dramatv/community/admin/**`
  - 举报
  - 审核
  - 评论治理
  - 用户治理
  - feed-ops
  - 媒体任务治理
  - 审计日志
- `apps/server/src/main/java/com/dramatv/community/feed/**`
  - 首页 / 精选运营编排相关返回结构
- `apps/server/src/main/java/com/dramatv/community/prompt/**`
- `apps/server/src/main/java/com/dramatv/community/discussion/**`
- `apps/server/src/main/java/com/dramatv/community/creator/**`
- `apps/server/src/main/java/com/dramatv/community/canvas/**`
- `apps/server/src/main/resources/application.yml`
- `apps/server/src/main/resources/logback-spring.xml`
- `apps/server/src/main/resources/db/migration/V10__*` 到 `V22__*`

#### 这包带来的真实能力

- 举报、审核、恢复、下线等治理链路更完整
- 评论治理动作能真实影响前台展示
- 发布 / 上传 / 媒体任务 / 回调链路更稳定
- `requestId / traceId / bizContext` 排障能力变强
- 安全与脱敏边界更完整

#### 这包的依赖关系

- 先于社区前台同步
- 先于后台管理前端同步
- 必须带数据库迁移一起考虑

### S2. 社区前台运行态包

这是第二包，依赖 `S1`。

#### 需要同步的内容

- `apps/web/src/app/(community)/**`
- `apps/web/src/features/home/**`
- `apps/web/src/features/featured/**`
- `apps/web/src/features/discussions/**`
- `apps/web/src/features/publish/**`
- `apps/web/src/features/me/**`
- `apps/web/src/features/creator/**`
- `apps/web/src/features/video-detail/**`
- `apps/web/src/features/workflow-detail/**`
- `apps/web/src/components/comments/**`
- `apps/web/src/components/report/**`
- `apps/web/src/components/shared/**`
  - `NotificationBell`
  - `ContextBackLink`
  - `CommunityRouteTransitionProvider`
  - `RouteVideoLoading`
  - `useInteractiveVideoPreview`
- `apps/web/src/lib/api/**`
- `apps/web/src/lib/routes/**`
- `apps/web/src/lib/taxonomy/**`
- `apps/web/src/lib/contracts/**`
- `apps/web/src/lib/mappers/**`
- `apps/web/src/app/api/**`
- `apps/web/public/favicon.png`
- `apps/web/next.config.ts`
- `apps/web/package.json`

#### 这包带来的真实能力

- 评论 / 通知 / 举报 / 返回定位 / 路由加载体验更完整
- 详情页与治理后的真实展示更一致
- 前台错误展示更统一，不直接暴露底层路径
- 社区页面整体状态消费更贴近最新后端契约

#### 明确不属于这包的内容

- `apps/web/.next-cloud-3107/`
- `apps/web/.next-deploy-public/`
- `apps/web/.next-dev-3106/`

这些都是本地产物，不能部署。

### S3. 后台管理前端运行态包

这是第三包，是否立刻上云要看你当前是否要让云上也可用后台。

#### 需要同步的内容

- `apps/admin/**`

#### 这包带来的真实能力

- `/reports`
- `/moderation`
- `/comments`
- `/users`
- `/taxonomy`
- `/feed-ops/*`
- `/media-tasks`
- `/audit-logs`

这些页面的真实管理能力和 smoke 保护。

#### 当前建议

- 如果当前重点还是社区前台测试环境，`S3` 可以晚于 `S1/S2`
- 如果近期要让后台也进入云验收，`S3` 就要和 `S1` 一起规划

## 5. 不需要上云部署，但建议纳入仓库管理的内容

这些文件不应进云服务运行时，但建议继续保留在仓库：

### 验证与部署脚本

- `scripts/run-backend-integration-suite.ps1`
- `scripts/check-test-runtime-readiness.mjs`
- `scripts/check-local-runtime-readiness.mjs`
- `scripts/deploy-test-backend.ps1`
- `scripts/deploy-test-web.ps1`
- `scripts/smoke-web-routes.mjs`
- `scripts/smoke-admin-routes.mjs`
- `scripts/run-local-auth-session-regression.mjs`
- `scripts/run-local-community-api-smoke.mjs`
- `scripts/run-local-notification-regression.mjs`
- `scripts/run-local-stability-suite.ps1`

### 数据治理与修复脚本

- `scripts/backfill-historical-moderation-audits.mjs`
- `scripts/deduplicate-cloud-community-prompts.mjs`
- `scripts/backfill-youmind-video-prompt-covers.mjs`
- `scripts/backfill-youmind-prompt-source-metadata.mjs`
- `scripts/reassign-cloud-seeded-prompts-to-community.mjs`
- `scripts/import-youmind-assets-via-api.mjs`
- `scripts/run-cloud-import-stage.mjs`

### 共享台账与实施记录

- `.codex/progress-community.md`
- `.codex/progress-admin.md`
- `.codex/community-admin-shared-sync.md`
- `.codex/shared-regression-taskboard-2026-05-18.md`
- `.codex/dramatv-optimization-taskboard-2026-05-18.md`

这些应该进仓库，方便团队协作，但不属于云服务部署内容。

## 6. 本次不要带上云的内容

### 明确排除

- `.codex/*.log`
- `.codex/*.err.log`
- `artifacts/**`
- `.logs/**`
- `apps/web/.next*`
- 各类测试导出 HTML / 临时 xlsx / 快照文件

### 原因

- 这些文件不会增强云服务能力
- 只会污染部署包
- 有些还会误导“我是不是把旧构建一起带上去了”

## 7. 推荐的同步顺序

下一次同步不要一口气全做，推荐按这个顺序：

1. `S1 社区后端运行态包`
   - 含数据库迁移
   - 先做后端验证与部署
2. `S2 社区前台运行态包`
   - 对齐最新后端契约
3. `S3 后台管理前端运行态包`
   - 仅在要做云端后台验收时再上

## 8. 每一包同步前必须做的检查

### S1 前

- `npm run backend-test:core`
- `npm run backend-test:admin`
- `npm run backend-test:logging`

### S2 前

- `npm run typecheck:web`
- `npm run build:web`
- `npm run smoke:web`

### S3 前

- `npm run typecheck:admin`
- `npm run build:admin`
- `npm run smoke:admin`

### 真正发云前

- `npm run deploy:verify:pre`

### 云上更新后

- `npm run readiness:test`

## 9. 当前结论

当前工作区确实乱，但不是“什么都不能用”，而是：

- 运行时代码、验证脚本、治理脚本、文档、产物混在一起了

所以后续的正确动作不是“少改”，而是：

- 明确按 `S1 / S2 / S3` 切同步批次
- 非运行时文件不跟着部署
- 本地产物明确排除

一句话结论：

- 下次真正上云，优先同步 `apps/server`
- 其次同步 `apps/web`
- `apps/admin` 视云端后台验收需求决定是否跟进
- `scripts / docs / .codex` 主要进仓库，不进云运行态
