# DramaTV 社区前台-管理后台共享联动台账

状态：`生效中`
首次建立：`2026-05-19`
适用范围：`apps/web`、`apps/admin`、`apps/server`

## 1. 这份文档解决什么问题

当前社区前台线和管理后台线已经不是彼此独立开发：

- 前台展示依赖后台治理配置
- 后台页面操作会直接改前台真实显示
- 两边共用同一套后端接口、状态语义、数据库字段

过去的问题不是“没做文档”，而是：

- 社区前台的变化记在 `progress-community.md`
- 管理后台的变化记在 `progress-admin.md`
- 共享链路的真实状态散落在两个文档里
- 结果就是一边已经改了契约，另一边还按旧理解继续做

这份文档从现在开始作为：

- `前台 + 后台共享联动的单一事实源`

注意：

- 纯前台视觉精修，不记这里
- 纯后台页面样式调整，不记这里
- 只要会影响另一边理解、开发、联调、验收，就记这里

## 2. 使用规则

两边后续都按下面的规则维护。

### 2.1 必须更新本文件的情况

出现以下任一情况，就必须更新这份文档：

- 新增或修改了前后台共用接口
- 新增或修改了前后台共用状态语义
- 新增或修改了数据库字段，且另一边会消费
- 后台页面动作会影响前台展示
- 前台页面行为依赖后台治理配置
- 修复的是一条“前台 -> 后台”或“后台 -> 前台”的共享链路问题
- 发现两边理解不一致，需要明确以哪边为准

### 2.2 不要把什么写进来

以下内容不要污染这份文档：

- 单纯文案修改
- 单纯 CSS 调整
- 单页局部视觉问题
- 与另一边完全无关的本地实验

### 2.3 每次更新的最小要求

每次新增或修改一项共享链路，至少补齐：

- 影响模块
- 当前真实口径
- 前台是否已消费
- 后台是否已消费
- 是否已做自动化验证
- 是否还有未对齐点

### 2.4 维护优先级

优先级固定如下：

1. 先更新这份共享台账
2. 再各自更新自己的 `progress-community.md` 或 `progress-admin.md`
3. 共享链路以本文件为准，单线实现细节再看各自进度

## Git 版本管理约定

这套仓库是前台 `apps/web`、后台 `apps/admin`、后端 `apps/server` 共用的同一个 Git 仓库，不是前后台两套仓库。

### 当前现状

- 本地当前只有 `main`
- 目前还没有整理出 `pre / test / dev` 这些稳定分支
- `main` 现在是实际工作分支，不是严格意义上的发布主干

### 目标分支方案

- `main`：生产主干，稳定可发布
- `pre`：预发验证分支
- `test`：测试环境联调分支
- `dev`：日常开发集成分支

### 推荐流转

- 日常开发：`feature/*` -> `dev`
- 联调提测：`dev` -> `test`
- 预发验证：`test` -> `pre`
- 最终发布：`pre` -> `main`
- 紧急修复：从 `main` 或当前发布分支切 `hotfix/*`，修完再回灌

### 共享规则

- 前台和后台的共享改动不拆成两个 Git 仓库处理
- 影响双方的改动先记共享台账，再各自补单线进度
- 发布记录要能追到分支、commit 和回滚点
- 分支名优先用 `main / pre / test / dev` 这套现代命名，不再强制叫 `master`

## 3. 当前共享链路总览

当前最核心的共享联动，不是所有功能，而是下面这些：

### S1 发布生命周期语义

- 影响范围：
  - 社区前台发布页、草稿箱、个人中心
  - 后台后续审核/治理视角
  - 后端发布状态字段与提交响应
- 当前真实口径：
  - `video / workflow / post` 提交成功后，不再伪装成 `published`
  - 当前真实语义是 `submitted`
  - 已提交草稿禁止继续 `update / delete / resubmit`
- 前台状态：
  - 已按 `lifecycle` 结构消费
  - 已显示 `submitted`
- 后台状态：
  - 后台开发必须按 `submitted / published / taken_down` 等真实状态理解，不要再按旧的“提交即 published”口径做页面逻辑
- 验证状态：
  - 已有后端集成回归
- 备注：
  - 这是共享状态语义，不是前台私有逻辑

### S2 举报提交 -> 后台工单

- 影响范围：
  - 社区前台详情页举报入口
  - 后台 `reports` 列表、详情、处理动作
  - 后端 `report_tickets`
- 当前真实口径：
  - 前台创建举报后，进入后台工单池
  - 当前工单状态语义为：
    - `pending`
    - `processing`
    - `resolved`
    - `closed`
- 前台状态：
  - 举报入口和提交流程已落地
- 后台状态：
  - `reports` 相关接口、列表、动作页已落地
- 验证状态：
  - 已补真实端到端回归
  - 已验证链路：
    - `POST /api/reports`
    - `GET /api/admin/reports`
    - `GET /api/admin/reports/{reportId}`
    - `POST /api/admin/reports/{reportId}/processing`
    - `POST /api/admin/reports/{reportId}/close`
- 当前风险：
  - 后台后续如果改状态文案或筛选枚举，必须先看这里，不要改坏前台已用语义

### S3 审核/下线动作 -> 前台可见性

- 影响范围：
  - 后台 `moderation`
  - 后台 `reports` 里的联动下线动作
  - 社区前台内容详情页、列表页可见性
- 当前真实口径：
  - 后台的 `approve / reject / offline / restore` 这类动作，最终会影响前台内容可见性与状态
  - `reports/offline-target` 本质上也会打到这条链路
- 前台状态：
  - 前台已依赖内容真实 `publish_status`
- 后台状态：
  - 后台治理入口已存在
- 验证状态：
  - 已补第一轮共享回归
  - 已通过 `AdminModerationApiIntegrationTest.moderationActionsChangePublicPromptVisibilityAcrossListAndDetail`
  - 当前已证明 `prompt` 目标在公共 `/api/prompts` 列表和 `/api/prompts/{id}` 详情上，`reject / approve / offline / restore` 会按预期隐藏或恢复
  - 已通过 `AdminModerationApiIntegrationTest.moderationActionsChangePublicWorkflowAndPostVisibilityAcrossDetails`
  - 当前已证明：
    - `workflow` 目标在公共 `/api/workflows/{id}` 详情上，`offline / restore` 会按预期隐藏或恢复
    - `post` 目标在公共 `/api/discussions/threads/{slug}` 详情上，`reject / approve` 会按预期隐藏或恢复
  - 已通过 `AdminReportApiIntegrationTest.offlineTargetHidesVideoFromPublicDetail`
  - 当前已证明 `reports/offline-target` 对 `video` 目标会让公共 `/api/videos/{id}` 详情按预期返回 `VIDEO_NOT_FOUND`
  - 2026-05-19 已补后台页面级 runtime 证据：
    - `/reports` 执行真实 `prompt` 工单 `offline-target` 后，公共 `/api/prompts/{id}` 返回 `PROMPT_NOT_FOUND`
    - `/moderation` 执行同一 `prompt` 的 `restore` 后，公共 `/api/prompts/{id}` 恢复 `200 OK`
  - 2026-05-19 已补共享层恢复池缺口：
    - 某些导入类 `prompt` 原本没有 `audit_records.publish_review`
    - 过去 `reports/offline-target` 只会把内容改成 `taken_down`，不会自动补审核记录
    - 结果是内容虽然已下线，却进不了 `/moderation` 的 `taken_down` 恢复池
    - 当前后端已改为对 `publish_review` 审核记录做 upsert
    - 即使目标内容此前没有审核记录，`offline-target` 后也能进入 `/moderation` 并执行 `restore`
  - 2026-05-19 已补 runtime 复核结论：
    - 这条修复对“修复后再次触发的 `offline-target`”立即生效
    - 但修复前已经被下线的旧内容不会自动 retroactive 回填进恢复池
    - 这类历史数据需要重放一次 `offline-target`，或走一次性修复脚本
  - 2026-05-19 已补一次性修复工具：
    - `scripts/backfill-historical-moderation-audits.mjs`
    - 当前可直接回填 `video / workflow / prompt / post` 四类历史 `taken_down` 且缺少 `publish_review` 的内容
- 当前结论：
  - `prompt` 这条公共读链路已经有“自动化保护 + 页面级 runtime 写动作证据”
  - `workflow / post` 这两条公共读链路已经补到自动化共享回归，不再只靠默认推断
  - `report-driven offline -> moderation restore` 对“无历史审核记录”的 `prompt` 也已补上共享层保障
  - 当前剩余缺口主要收窄到：
    - `workflow / post` 还没有像 `prompt` 一样补齐后台页面级 runtime 写动作证据
    - `/reports` 当前动作集虽已补齐页面级 runtime，但如果继续扩目标类型，仍要按同口径补证据

### S4 taxonomy 分类体系

- 影响范围：
  - 社区前台精选页筛选
  - 社区前台发布页标签/分类
  - 后台 taxonomy 配置页
  - 后端 `prompt_entries` 分类字段
- 当前真实口径：
  - 分类不再只靠前端猜测
  - 后端已正式提供：
    - `model_category`
    - `content_category`
    - `composition_category`
- 前台状态：
  - 已优先消费后端 taxonomy 字段
- 后台状态：
  - 已有最小真实管理闭环
- 验证状态：
  - 已有接口与页面联动基础验证
- 当前风险：
  - 后台如果改分类 key 或默认值，前台筛选和资源归类会直接受影响
- 维护要求：
  - 新增模型类、题材类、组合类时，必须先在这里补口径，再改前台和后台

### S5 feed-ops 运营编排

- 影响范围：
  - 后台：
    - `feed-ops/home`
    - `feed-ops/featured`
    - `feed-ops/discussions`
  - 前台：
    - `/home`
    - `/featured`
    - `/discussions`
- 当前真实口径：
  - 后台保存/发布的编排配置，会直接影响前台对应区域展示
  - `draft` 不应提前污染前台
  - 只有发布态配置才应该影响前台
- 前台状态：
  - 前台已对接真实接口
- 后台状态：
  - 后台管理页已具备最小真实闭环
  - `home / featured / discussions` 三页都已补显式保存成功反馈，不再只靠静默跳转
- 验证状态：
  - `home / featured / discussions` 的发布生效与 draft 隔离已有后端回归
  - 已补当前本地 runtime 真验收：
    - `discussions`：后台发布后，`/api/admin/feed-ops/discussions`、`/api/discussions/home`、前台 `/discussions` 左侧频道顺序一致
    - `home`：后台发布后，`/api/admin/feed-ops/home` 与公共 `/api/feed/home` 的 9 个首页槽位顺序一致，前台 `/home` 首屏分区随之变化
    - `featured`：后台发布后，`/api/admin/feed-ops/featured` 与公共 `/api/feed/featured` 的首项顺序一致，前台 `/featured` 默认首卡随之变化
- 当前风险：
  - 后台若只改 slot 结构、不同步前台数据契约，前台会出现“有配置但渲染错位”
  - 后续如果调整页面槽位定义，必须先更新这份台账，再分别改 `apps/admin / apps/web / apps/server`

### S6 媒体任务 / 上传 / 任务可见性

- 影响范围：
  - 社区前台上传、发布、媒体处理中状态
  - 后台 `media-tasks`
  - 后端异步任务与媒体处理状态
- 当前真实口径：
  - 上传不是“一次同步完成”
  - 存在处理中、失败、重试、回调落库、最终可见这些状态
- 前台状态：
  - 前台已经消费处理态和失败态
- 后台状态：
  - 后台已可看到任务并执行重试
  - `media-tasks` 重试动作已补显式成功反馈，不再要求操作者自己猜测是否命中后端
- 验证状态：
  - 已有后端和后台页面的最小真实闭环
  - 已补当前本地 runtime 真验收：
    - 后台 `media-tasks` 重试动作会真实触发后端状态变更，而不是前端假动作
    - 已验证失败任务重试后 `retryCount` 会递增，`retryable` 会按真实结果变化
    - `audit-logs` 可看到对应的 `retry / media_tasks / requestPath / targetId` 记录，说明后台治理动作可追踪
- 当前风险：
  - 前台如果假设“上传成功 = 内容立刻可播”，就会和后台真实任务状态冲突
  - 后续如果前台要把“处理中 / 失败 / 可重试 / 不可重试”做成更明确的用户态文案，必须继续以后台任务状态语义为准

## 4. 当前明确未对齐项

下面这些不是未知，而是已经知道还要继续收口的共享项：

### U1 审核动作到前台展示的自动回归还没补完

- 现状：
  - 已补第一轮自动化共享回归
  - 当前覆盖的是：
    - `prompt` 在公共列表与详情页上的可见性变化
    - `workflow` 在公共详情页上的可见性变化
    - `post` 在公共讨论详情页上的可见性变化
    - `reports/offline-target` 对 `video` 公共详情页的可见性变化
  - 2026-05-19 已补齐 `prompt` 目标的后台页面级 runtime：
    - `/reports offline-target`
    - `/moderation reject / approve / offline / restore`
  - 2026-05-19 已补齐 `prompt` 目标“无历史 `publish_review` 审核记录”的共享恢复保障：
    - 举报下线后会自动补审核记录
    - 目标可进入 `/moderation` 的 `taken_down` 池
    - 目标可继续执行 `restore`
  - 已补 `workflow / post` 的自动化共享回归，但剩余页面级 runtime 还没全补齐
- 风险：
  - 后台改其他目标类型或举报联动写动作时，前台仍可能被悄悄带坏

### U2 taxonomy 的“新增分类流程”还没有严格制度化

- 现状：
  - 字段和页面已有
  - 但“新增分类时先改哪边、后改哪边”还容易靠口头同步
- 风险：
  - 前台筛选、后台配置、导入脚本三边不一致

### U3 feed-ops / taxonomy / moderation 之间的共享验收口径还不统一

- 现状：
  - 共享验收口径现在应统一收口为三层同时成立：
    - 后台动作有明确成功反馈
    - 后端真实状态发生变化
    - 前台页面或公共读接口出现可观察变化
  - `feed-ops` 已经按这套口径完成当前 runtime 验收
  - `taxonomy` 已经按这套口径完成后台写入与后端读回验收
  - `media-tasks` 已经按这套口径完成“后台动作 -> 后端状态 -> 审计可追踪”验收
  - 当前剩余缺口主要是 `moderation / reports-offline-target` 这类会直接改变前台可见性的共享写动作
- 风险：
  - 如果不按同一套口径验收，仍然会反复出现“接口改了、页面没变”或“页面看似正常、真实链路未闭环”

## 4A. 当前后台已真实落地的共享能力地图

这一节不是讲原则，而是给后台开发直接看的“现状地图”，避免重复开发。

### 4A.1 管理后台前端当前真实页面

当前 `apps/admin` 已有这些真实页面：

- `/login`
- `/dashboard`
- `/users`
- `/comments`
- `/moderation`
- `/reports`
- `/taxonomy`
- `/feed-ops/home`
- `/feed-ops/featured`
- `/feed-ops/discussions`
- `/media-tasks`
- `/audit-logs`

当前后台前端开发信息：

- 项目：`apps/admin`
- 本地端口：`3206`
- 脚本：
  - `npm run dev`
  - `npm run build`
  - `npm run typecheck`
  - `npm run smoke`

结论：

- 后台前端现在不是空壳
- 后续新任务默认应该在现有页面体系上继续补，不要再并行起第二套相同页面

### 4A.2 管理后台后端当前真实 admin API 域

当前 `apps/server` 已有这些 admin API 域：

- `/api/admin/auth`
  - `login / logout / session`
- `/api/admin/dashboard/overview`
- `/api/admin/users`
  - 列表、详情、治理、密码重置
- `/api/admin/comments`
  - 列表、隐藏、恢复
- `/api/admin/moderation/items`
  - 列表、详情、`approve / reject / offline / restore`
- `/api/admin/reports`
  - 列表、详情、`processing / close / offline-target / hide-comment`
- `/api/admin/taxonomy`
  - 获取、更新、prompt 列表、bulk apply
- `/api/admin/feed-ops`
  - `home / featured / discussions` 的读取与更新
- `/api/admin/media-tasks`
  - 列表、详情、重试
- `/api/admin/audit-logs`
  - 列表、详情

结论：

- 后台当前已经有完整的 admin API 基础面
- 默认优先复用，不要把同一个治理域再重新设计一套接口

### 4A.3 后台当前不要重复造的共享能力

下面这些能力当前已经有真实基础，不应再另起一套：

- 举报工单状态流转：
  - `pending / processing / resolved / closed`
- 审核动作语义：
  - `approve / reject / offline / restore`
- taxonomy 正式字段：
  - `model_category`
  - `content_category`
  - `composition_category`
- feed-ops 三页配置面：
  - `home`
  - `featured`
  - `discussions`
- 媒体任务重试链路：
  - 已有任务列表、详情、retry
- 审计日志查询面：
  - 已有列表、详情

### 4A.4 后台开发最容易误伤前台的点

后台线后续开发时，最容易产生信息差的不是“大功能没做”，而是这些共享细节：

- 改了枚举值，但前台仍按旧值判断
- 改了字段名，但前台 mapper 没同步
- 后台页面上看着只是“文案优化”，实际把共享状态语义改了
- taxonomy 改了分类 key，但前台筛选、导入脚本、历史数据没一起跟
- feed-ops 改了 slot 结构，但前台消费层没同步
- 把“后台按钮点成功了”误当成“前台联动已经验收”

### 4A.5 后台共享改动后的最低验收要求

如果后台做的是共享项，最低不要只停留在“后台页面能点”。

至少补 1 层验证：

- 后端集成测试
- 后台页面 smoke
- 前台联动验收

推荐口径：

- 改接口或状态语义：
  - 至少跑后端集成测试
- 改后台页面操作链路：
  - 至少跑后台 `typecheck / build / smoke`
- 改会直接影响前台展示的后台动作：
  - 至少补一次前台联动验收，或者明确记录为 `implemented` 但还没 `verified`

### 4A.6 当前后台已做过真实共享验收的页面 / 动作

这一节不是列“页面存在”，而是列已经做过当前 runtime 真实验收的后台共享动作。

- `/users`
  - 已验收：
    - 账号状态治理保存
    - `active <-> pending` 可逆切换
    - 密码重置
  - 当前证明：
    - 后台页面有显式成功反馈
    - `/api/admin/users/{id}` 状态真实变化
    - 新临时密码已通过社区登录接口 `POST /api/auth/login` 验证可用
- `/taxonomy`
  - 已验收：
    - bulk apply 批量修正提示词分类
  - 当前证明：
    - 后台候选池数量变化
    - 被修正 prompt 从 `needsAttention=true` 池中移出
    - `/api/admin/taxonomy/prompts` 读回分类字段与后台提交值一致
- `/feed-ops/home`
  - 已验收：
    - 发布配置
  - 当前证明：
    - 后台状态从 `draft` 变为 `published`
    - 公共 `/api/feed/home` 顺序与后台发布结果一致
    - 前台 `/home` 首屏内容顺序发生可观察变化
- `/feed-ops/featured`
  - 已验收：
    - 发布配置
  - 当前证明：
    - 后台状态从 `draft` 变为 `published`
    - 公共 `/api/feed/featured` 首项顺序与后台发布结果一致
    - 前台 `/featured` 默认首卡发生可观察变化
- `/feed-ops/discussions`
  - 已验收：
    - 发布配置
  - 当前证明：
    - 后台状态从 `draft` 变为 `published`
    - 公共 `/api/discussions/home` 频道顺序与后台一致
    - 前台 `/discussions` 左侧频道导航发生可观察变化
- `/media-tasks`
  - 已验收：
    - retry 动作
  - 当前证明：
    - 后台页面有显式成功反馈
    - 后端 `retryCount / retryable / startedAt / finishedAt` 真实变化
    - 对应操作可在 `/audit-logs` 中追踪
- `/audit-logs`
  - 已验收：
    - 对共享治理动作的读链路追踪
  - 当前证明：
    - 已验证能读到 `media_tasks retry` 的 `actionCode / moduleCode / requestPath / targetId`
- `/dashboard`
  - 已验收：
    - 实时概览读链路
  - 当前证明：
    - 页面统计卡与 `/api/admin/dashboard/overview` 当前值一致
  - 说明：
    - 这是后台真实读链路验收，不等于共享写动作已闭环
- `/comments`
  - 已验收：
    - `hide / restore` 共享后端回归
    - `/comments` 页面级 runtime 联动验收
  - 当前证明：
    - `AdminCommentApiIntegrationTest.adminHideAndRestoreAreReflectedOnPublicCommentList` 已证明：
      - 后台 `hide` 后公共 `/api/comments` 列表隐藏该评论
      - `videoCommentCount` 会同步从 `1 -> 0`
      - 后台 `restore` 后公共 `/api/comments` 列表重新可见
      - `videoCommentCount` 会同步从 `0 -> 1`
    - 2026-05-19 已补本地浏览器级 runtime 验收：
      - 后台 `/comments` 选中真实提示词评论执行 `hide`
      - 公共 `/api/comments` 与 `/api/prompts/{id}` 立即反映为评论隐藏、讨论数 `10 -> 9`
      - 前台 `/prompts/{id}` 同路由重新进入后已同步消失该评论，不再残留旧的本地 `view` 状态
      - 随后执行 `restore` 可让前台同一路径重新回到 `讨论 10`
  - 说明：
    - 当前这条链路已经同时具备“后台动作成功反馈 + 公共读接口变化 + 前台页面可观察变化”
    - 当前前台不是实时推送模型；已打开的详情页不会因为后台动作自动热更新，但重新进入同一路径后会拿到最新治理结果
    - 还不等于所有 targetType 的评论治理都已全覆盖
- `/reports`
  - 已验收：
    - `offline-target / hide-comment` 共享后端回归
    - `/reports` 页面级 runtime `offline-target`
    - `/reports` 页面级 runtime `processing -> resolved -> closed`
    - `/reports` 页面级 runtime `hide-comment`
  - 当前证明：
    - `AdminReportApiIntegrationTest.offlineTargetHidesVideoFromPublicDetail` 已证明：
      - 举报驱动的 `offline-target` 会让公共 `/api/videos/{id}` 返回 `VIDEO_NOT_FOUND`
      - 对应 `video.publish_status` 与审核状态同步变为 `taken_down`
    - `AdminReportApiIntegrationTest.hideCommentRemovesCommentFromPublicList` 已证明：
      - 举报驱动的 `hide-comment` 会让公共 `/api/comments` 列表隐藏该评论
      - 对应举报工单状态会同步进入 `resolved`
    - 2026-05-19 已补本地浏览器级 runtime 验收：
      - 后台 `/reports` 选中真实 `prompt` 举报工单 `175db69e-5f5c-4855-99d4-e8c574d87ebc` 执行 `offline-target`
      - 后台工单状态即时变为 `已处理`，目标摘要状态即时变为 `taken_down`
      - 公共 `/api/prompts/f0eb4682-5271-47a1-a802-f4942de49daf` 立即返回 `PROMPT_NOT_FOUND`
      - 后台 `/reports` 选中真实 `prompt` 举报工单 `43ceb245-4d34-4bf5-bce7-5df6e24c7c7d` 执行 `processing -> offline-target`
      - 已确认这类“原本无 `publish_review` 审核记录”的导入类 prompt 也会被真正下线
      - 并据此暴露出“内容进不了 `/moderation` 恢复池”的共享缺口，现已在后端补成 upsert 审核记录
      - 后台 `/reports` 选中真实 QA 工单 `b5e6d25f-f076-468c-84af-57c28e3c1f43`
      - 依次执行 `标记处理中 -> 标记已处理 -> 归档关闭`
      - 后台列表与详情状态按预期经历 `处理中 -> 已处理 -> 已归档`
      - 详情时间线已连续记录 `工单状态更新为 处理中 / 已处理 / 已归档`
      - 后台 `/reports` 选中真实 `comment` 举报工单 `ff934a3b-93c3-457c-a1e6-268be5620320` 执行 `hide-comment`
      - 后台工单状态即时变为 `已处理`
      - 目标摘要状态即时从 `评论 · 状态 active` 变为 `评论 · 状态 hidden`
      - 公共 `/api/comments?targetType=post&targetId=ca27ffdc-c143-4cef-a986-f9ac87a25acd` 已验证不再返回评论 `044c864e-f364-4ab9-8fa0-65d173dc1b78`
      - 对旧工单 `43ceb245-4d34-4bf5-bce7-5df6e24c7c7d` 的 runtime 复核还确认了一个历史数据事实：
        - 该工单第一次下线发生在修复前，因此最初不会自动出现在 `/moderation`
        - 重新执行一次 `offline-target` 后，目标提示词才按新逻辑进入 `/moderation` 恢复池
  - 说明：
    - 当前 `offline-target / processing / resolve / close / hide-comment` 已全部具备页面级 runtime 证据
    - 当前 `/reports` 的剩余风险已不在“按钮有没有真写到后端”，而在于后续如果新增目标类型或新动作，仍要继续按同口径补证据
    - 同时已确认：`offline-target` 不能只改 `publish_status`，还必须保证目标能进入 `/moderation` 恢复池；这条共享要求现在已经固化到后端实现与集成测试里
    - 对于修复前已经遗留的旧数据，当前共享口径是：优先使用回填脚本，而不是继续人工一条条重放工单
- `/moderation`
  - 已验收：
    - 当前 runtime 读链路语义
    - `prompt` 目标的审核写动作共享后端回归
    - `workflow / post` 目标的审核写动作共享后端回归
    - `/moderation` 页面级 runtime `reject / approve / offline / restore`
  - 当前证明：
    - `not_required` 不再误显示为 `pending`
    - `无需审核` 项目的详情按钮已按语义禁用
    - 页面汇总指标与后端当前状态一致
    - `AdminModerationApiIntegrationTest.moderationActionsChangePublicPromptVisibilityAcrossListAndDetail` 已证明：
      - `reject` 后公共 `/api/prompts` 列表隐藏该项
      - `/api/prompts/{id}` 返回 `PROMPT_NOT_FOUND`
      - `approve / restore` 后重新可见
      - `offline` 后再次隐藏
    - `AdminModerationApiIntegrationTest.moderationActionsChangePublicWorkflowAndPostVisibilityAcrossDetails` 已证明：
      - `workflow` 的公共 `/api/workflows/{id}` 会随 `offline / restore` 隐藏或恢复
      - `post` 的公共 `/api/discussions/threads/{slug}` 会随 `reject / approve` 隐藏或恢复
    - 2026-05-19 已补本地浏览器级 runtime 验收：
      - 后台 `/moderation` 筛中真实提示词 `f0eb4682-5271-47a1-a802-f4942de49daf`
      - 已执行 `reject`
      - 后台审核状态即时变为 `已驳回`
      - 公共 `/api/prompts/{id}` 立即返回 `PROMPT_NOT_FOUND`
      - 公共 `/api/prompts` 列表同步移除该目标
      - 已执行 `approve`
      - 后台审核状态即时变回 `已通过`
      - 公共 `/api/prompts/{id}` 立即恢复 `200 OK`
      - 公共 `/api/prompts` 列表重新出现该目标
      - 已执行 `offline`
      - 后台审核状态即时变为 `已下线`
      - 公共 `/api/prompts/{id}` 再次返回 `PROMPT_NOT_FOUND`
      - 公共 `/api/prompts` 列表再次移除该目标
      - 已执行 `restore`
      - 后台审核状态即时恢复 `已通过`
      - 公共 `/api/prompts/{id}` 最终恢复 `200 OK`
      - 公共 `/api/prompts` 列表最终重新出现该目标
    - 已补“无历史审核记录”的共享保护：
      - `AdminReportApiIntegrationTest.reportDrivenOfflineTargetBackfillsModerationQueueForPromptWithoutAuditRecord`
      - 当前已明确保证：被 `/reports/offline-target` 下线的导入类 prompt，即使此前没有 `publish_review` 记录，也必须能出现在 `/moderation?status=taken_down&targetType=prompt`
      - 并且必须能继续执行 `restore`
    - 2026-05-19 已补 runtime 恢复证据：
      - 对旧工单 `43ceb245-4d34-4bf5-bce7-5df6e24c7c7d` 重新执行一次 `offline-target` 后
      - `/moderation?status=taken_down&targetType=prompt` 已真实出现目标 `d0afa607-4336-54c6-855c-cba066452f02`
      - 后台点击 `恢复` 后，公共 `/api/prompts/{id}` 已重新恢复 `200 OK`
  - 说明：
    - 这说明 `prompt` 公共可见性链路已经同时具备“自动化保护 + 页面级 runtime 写动作证据”
    - `workflow / post` 也已经补到自动化共享保护
    - 当前 `/moderation` 的剩余风险已从“其他目标类型没有回归”收窄到“其他目标类型还缺页面级 runtime 写动作证据”

### 4A.7 当前后台还不能误判为“共享闭环已完成”的项

下面这些页面或动作当前虽然已存在，但还不能默认视为已经完成共享联动验收：

- `/moderation` 的写动作
  - `approve / reject / offline / restore`
  - 当前已有：
    - `prompt` 目标类型已补“审核写动作 -> 公共列表 / 详情可见性变化”的自动化共享回归
    - `workflow / post` 目标类型已补“审核写动作 -> 公共详情可见性变化”的自动化共享回归
    - `prompt` 目标类型已补 `/moderation` 页面级 runtime `reject / approve / offline / restore`
    - `reports/offline-target` 已补 `video` 公共详情页可见性自动化共享回归
  - 当前缺口：
    - `workflow / post` 等其他目标类型还没有像 `prompt` 这样补齐页面级 runtime 写动作证据
    - `video` 在 `/moderation` 直连动作下的公共页面级 runtime 证据也还没独立补齐
- `/comments` 的后台治理动作
  - 当前已有：
    - 页面与 admin API 基础面存在
    - `hide / restore` 已补“后台动作 -> 公共 `/api/comments` 列表可见性变化”的自动化共享回归
    - `prompt` 详情页已补“后台 `/comments` 页面 runtime 动作 -> 前台详情页重新进入后可见性变化”的浏览器级验收
  - 当前缺口：
    - 还没有扩到 `workflow / post` 等其他 targetType 的评论治理自动化共享回归
- `/dashboard` 的跳转入口
  - 当前已有：
    - 读链路真实
  - 当前缺口：
    - 从 dashboard 跳转到下游治理页，不等于下游治理动作本身都已共享闭环

## 4B. 当前前台已真实消费的后台字段 / 状态

这一节和 `4A` 不同，不是说后台“有什么页面”，而是说：

- 社区前台 `apps/web` 现在已经真实依赖哪些字段和状态语义
- 后台或后端如果改这里，前台不一定立刻报错，但很可能直接出现隐性回归

一句话规则：

- 下面这些字段、枚举值、slot key、状态值，默认视为“已被前台消费中的真实契约”
- 后台不要随手改名、改值、改语义

### 4B.1 发布页 / 草稿箱 / 个人中心已真实消费的生命周期字段

前台当前真实消费位置：

- `apps/web/src/features/publish/PublishPage.tsx`
- `apps/web/src/features/publish/actions.ts`
- `apps/web/src/features/me/PersonalCenterPage.tsx`
- `apps/web/src/lib/mappers/community.ts`

当前已真实消费的字段有：

- `lifecycle.draftStatus`
  - 当前前台按 `draft / submitted` 分支展示
  - 已明确不再按“提交即 published”理解
- `lifecycle.moderationStatus`
- `lifecycle.moderationMessage`
- `lifecycle.processingStatus`
- `lifecycle.processingMessage`
- `lifecycle.editable`
- `lifecycle.submittedAt`
- `lifecycle.mediaTask`

当前已真实消费的媒体任务字段有：

- `taskId`
- `taskType`
- `targetType`
- `targetId`
- `statusCode`
- `retryCount`
- `maxRetryCount`
- `retryable`
- `errorMessage`
- `submittedAt`
- `startedAt`
- `finishedAt`

当前前台已经按这些状态做了真实分支，不只是展示原文：

- `draftStatus`
  - `draft`
  - `submitted`
- `processingStatus`
  - `queued`
  - `processing`
  - `failed`
  - `succeeded`
  - `not_requested`
  - `not_submitted`
  - `not_applicable`

提交成功回包里，前台当前真实依赖：

- `targetId`
- `draftStatus`
- `lifecycle`
- 帖子额外依赖 `slug`

现状补充：

- 视频/图片提示词提交流程会根据 `categoryCode` 与 `targetId` 跳去精选页或详情页
- 帖子提交流程会根据 `channelSlug` 与 `slug` 跳去社区列表或帖子详情
- 这意味着后台如果改提交后的状态值或回包字段，影响的不只是文案，而是跳转与页面可继续编辑逻辑

### 4B.2 taxonomy 分类字段已经被前台筛选、发布、导入逻辑共同消费

前台当前真实消费位置：

- `apps/web/src/features/featured/FeaturedArchivePage.tsx`
- `apps/web/src/features/publish/PublishPage.tsx`
- `apps/web/src/lib/taxonomy/prompt-taxonomy.ts`

当前正式分类字段：

- `taxonomy.modelCategory`
- `taxonomy.contentCategory`
- `taxonomy.compositionCategory`

发布草稿写入侧也已经真实使用：

- `modelCategory`
- `contentCategory`
- `compositionCategory`

前台当前不是把这些当显示文案，而是把它们当稳定 key：

- 图片模型类：
  - `gpt-image-2`
  - `nanobanana`
  - `midjourney`
  - `other-image-model`
- 视频模型类：
  - `seedance`
  - `kling`
  - `happyhorse`
  - `wan`
  - `other-video-model`
- 图片题材类：
  - `real-person`
  - `animation`
  - `scene`
  - `prop`
  - `other`
- 视频题材类：
  - `real-person`
  - `animation`
  - `other`
- 组合类：
  - `single-model`
  - `multi-model`

现状补充：

- 精选页已经支持“模型分类 + 题材分类”组合筛选
- 前台标签文案可以变，但这些 key 不能随意变
- 后台如果后续新增 taxonomy 项，必须同步考虑：
  - 后台配置页
  - 前台筛选页
  - 发布页选项
  - 导入脚本 / 历史数据补类

### 4B.3 评论区当前真实消费的是“结构化评论 + 评论开关语义”

前台当前真实消费位置：

- `apps/web/src/components/comments/CommentThread.tsx`
- `apps/web/src/features/community-interactions/actions.ts`
- `apps/web/src/features/discussions/actions.ts`
- `apps/web/src/lib/mappers/community.ts`

评论列表当前真实消费字段：

- `id`
- `parentId`
- `replyTarget.commentId`
- `replyTarget.author.id`
- `replyTarget.author.displayName`
- `replyTarget.author.avatarUrl`
- `author.id`
- `author.displayName`
- `author.avatarUrl`
- `content`
- `createdAt`
- `likeCount`
- `replyCount`
- `statusCode`
- `viewerActions.liked`
- `viewerActions.canDelete`
- `replies`

当前前台已经按这些语义做真实逻辑：

- `replyTarget` 用来显示“回复谁”
- `viewerActions.canDelete` 决定是否显示删除入口
- `viewerActions.liked` 决定评论点赞态
- `statusCode === hidden` 时，前台会给出“已提交但未公开展示”的安全提示

评论权限当前有两套相关字段，后台开发要特别注意：

- 详情读接口里，前台消费：
  - `commentPolicy.commentingEnabled`
  - `commentPolicy.canManageComments`
- 评论开关写接口 `/api/comments/target-settings` 回包里，前台当前消费：
  - `commentsEnabled`
  - `canManageComments`

现状补充：

- 也就是说，这条链路现在存在“读侧字段名”和“写侧返回字段名”不完全相同的现实情况
- 如果后台要统一这两个命名，必须和前台一起改，不能只改一边

### 4B.4 举报创建接口当前前台已依赖最小稳定回包

前台当前真实消费位置：

- `apps/web/src/components/report/ReportModal.tsx`
- `apps/web/src/features/community-interactions/actions.ts`
- `apps/web/src/features/discussions/actions.ts`

前台提交流程当前真实写入：

- `targetType`
- `targetId`
- `reasonCode`
- `descriptionText`

创建成功回包当前真实消费：

- `reportId`
- `targetType`
- `targetId`
- `reasonCode`
- `statusCode`

现状补充：

- 当前前台虽然只把 `statusCode` 当成功提示的一部分使用，但这已经是共享契约的一部分
- 后台如果重写举报状态流转，不要反向改坏前台创建回包

### 4B.5 通知中心当前真实消费的是“通知项结构”，红点本身是前台本地派生

前台当前真实消费位置：

- `apps/web/src/components/shared/NotificationBell.tsx`
- `apps/web/src/components/shared/CommunitySessionProvider.tsx`

通知项当前真实消费字段：

- `id`
- `actionType`
- `actedAt`
- `excerpt`
- `replyToActorName`
- `commentId`
- `actor.id`
- `actor.displayName`
- `actor.avatarUrl`
- `target.id`
- `target.type`
- `target.title`
- `target.href`

当前前台已经按这些语义做真实逻辑：

- `actionType`
  - `like`
  - `favorite`
  - `comment`
  - `reply`
- `comment` / `reply` 会拼接到 `#comment-{commentId}`
- 用户头像点击会跳作者主页，依赖 `actor.id`
- 通知目标点击会跳回对应内容，依赖 `target.href`

重要说明：

- 铃铛红点不是后端单独返回的 `unreadCount`
- 当前红点是前台根据通知 `id` + 本地 `localStorage` 记录“是否看过”推导出来的
- 这意味着后台现在最需要保证的是：
  - `id` 稳定
  - `actedAt` 合理
  - 返回顺序稳定

### 4B.6 首页 / 精选页当前真实消费固定 slot key 与媒体字段

前台当前真实消费位置：

- `apps/web/src/features/home/CommunityHomePage.tsx`
- `apps/web/src/features/featured/FeaturedArchivePage.tsx`
- `apps/web/src/lib/mappers/community.ts`

首页 layout 当前真实消费的 slot key：

- `home-hero`
- `recommended-primary`
- `recommended-secondary`
- `canvas`
- `commercial`
- `animation`
- `narrative`
- `mv`
- `creative`

精选页 pinned order 当前真实消费的 slot key：

- `featured-all`
- `featured-workflow`
- `featured-video-prompt`
- `featured-image-prompt`
- `featured-activity`

首页 / 精选页卡片当前真实消费字段：

- `contentKind`
- `promptModality`
- `itemType`
- `targetId`
- `title`
- `summary`
- `coverUrl`
- `posterUrl`
- `previewUrl`
- `sourceUrl`
- `author.id`
- `author.displayName`
- `author.avatarUrl`
- `workflow.id`
- `workflow.title`
- `stats.playCount`
- `stats.likeCount`

精选页 pinned 排序还会额外依赖：

- `targetSlug`
- `channelSlug`

现状补充：

- 前台当前已经区分：
  - `coverUrl / posterUrl / previewUrl / sourceUrl`
- 后端如果改媒体策略，不能把这几个字段重新混成一个 `url`
- slot key 改名、删除、换语义，会直接导致首页/精选页整块内容错位或回退到兜底数据

### 4B.7 社区帖子 / 讨论区当前真实消费频道与绑定关系字段

前台当前真实消费位置：

- `apps/web/src/features/discussions/DiscussionsPage.tsx`
- `apps/web/src/features/discussions/DiscussionDetailPage.tsx`
- `apps/web/src/lib/mappers/community.ts`

讨论区频道当前真实消费字段：

- `channels[].slug`
- `channels[].title`
- `channels[].description`
- `channels[].threadCount`

帖子卡片 / 详情当前真实消费字段：

- `id`
- `slug`
- `title`
- `excerpt`
- `content`
- `channel.slug`
- `channel.title`
- `channelSlug`
- `channelTitle`
- `publishedAt`
- `lastActivityAt`
- `tagNames`
- `likeCount`
- `favoriteCount`
- `replyCount`
- `viewerActions.liked`
- `viewerActions.favorited`
- `binding.targetType`
- `binding.targetId`
- `binding.targetTitle`
- `relatedThreads`

现状补充：

- 频道筛选、发帖归属、帖子详情返回路径都依赖 `slug`
- 帖子绑定视频/工作流入口已真实存在，后台如果后续做治理、推荐或排序，不要把 `binding` 当成纯展示废字段

### 4B.8 `/me` 个人中心当前真实消费的是“分组后的内容聚合结构”

前台当前真实消费位置：

- `apps/web/src/features/me/PersonalCenterPage.tsx`
- `apps/web/src/lib/mappers/community.ts`

个人中心 profile 当前真实消费字段：

- `profile.id`
- `profile.displayName`
- `profile.avatarUrl`
- `profile.roleCode`
- `profile.bio`
- `profile.headline`
- `profile.stats.videoCount`
- `profile.stats.workflowCount`
- `profile.stats.followerCount`
- `profile.stats.likeReceivedCount`

内容聚合当前真实消费结构：

- `likedItems`
- `favoritedItems`
- `draftItems`
- `publishedContent.videos`
- `publishedContent.workflows`
- `publishedContent.posts`

草稿项当前真实消费字段：

- `draftType`
- `draftId`
- `targetId`
- `title`
- `summary`
- `coverUrl`
- `statusCode`
- `currentStep`
- `lifecycle`
- `updatedAt`
- `continueHref`
- `editable`

现状补充：

- 后台做用户治理、内容下线、审核状态流转时，如果只改后台统计、不改这些聚合查询，前台 `/me` 会最先暴露出“数字和真实内容不一致”的问题

## 5. 从现在开始的协作方式

建议前后台两个 Codex 以后都按这个流程走。

### 5.1 开始做共享项之前

- 先看这份文档
- 确认这个共享项有没有已有口径
- 如果没有，就先在这份文档里补一条草案

### 5.2 做共享项时

- 谁先改了共享契约，谁先更新这里
- 另一边开始接的时候，优先看这里，不自己猜

### 5.3 做完共享项后

- 补齐：
  - 已落地到哪边
  - 还剩哪边没落地
  - 验证命令或验证页面
- 不允许只写“已完成”三个字

## 6. 建议的共享任务状态

后续新增共享项，统一只用这 4 个状态：

- `planned`
- `in_progress`
- `implemented`
- `verified`

解释：

- `planned`：口径已建立，但还没开始改
- `in_progress`：至少一边已经在改
- `implemented`：前台/后台/后端代码都已落地，但未完整验收
- `verified`：共享链路已真实验证通过

## 7. 后续新增条目的模板

后面两边谁新增共享项，都按这个模板追加：

```md
### SX 共享项名称

- 状态：`planned | in_progress | implemented | verified`
- 影响范围：
  - 社区前台：
  - 管理后台：
  - 后端：
- 当前真实口径：
- 前台状态：
- 后台状态：
- 验证状态：
- 风险 / 未对齐点：
```

## 8. 当前结论

从现在开始：

- 社区前台自己的细节进度，继续记 `progress-community.md`
- 管理后台自己的细节进度，继续记 `progress-admin.md`
- 只要是会互相影响的真实共享链路，统一先看这份 `community-admin-shared-sync.md`

这份文档的意义不是“多一个文档”，而是：

- 让前后台共享链路不再靠聊天记忆维持
- 让两边的 Codex 有同一个基准面
- 减少“你改过了但我不知道”的无效开发
### 2026-05-19 moderation workflow/post 页面级 runtime 复核

- 本轮把 `workflow / post` 再做了一次浏览器页级复核，确认当前后台页面与公共详情一致。
- `workflow` 目标 `ac6d6c40-a384-41f7-8ef1-2182094280f7`
  - `/moderation` 详情当前显示 `已下线`
  - `恢复` 按钮可用，`下线` 按钮禁用
  - 公共 `/api/workflows/{id}` 当前返回 `404 WORKFLOW_NOT_FOUND`
- `post` 目标 `ca27ffdc-c143-4cef-a986-f9ac87a25acd`
  - `/moderation` 详情当前显示 `已下线`
  - `恢复` 按钮可用，`下线` 按钮禁用
  - 公共 `/api/discussions/threads/{slug}` 当前返回 `404 DISCUSSION_THREAD_NOT_FOUND`
- 结论：
  - `workflow / post` 现在已经同时具备后端自动化回归和页面级 runtime 复核
  - 当前 shared-gap 更值得继续收口的是 `video` 在 `/moderation` 直连动作下的同等级页面级 runtime 证据

### 2026-05-19 历史下线审核记录回填脚本远端预检

- 状态：`verified`
- 影响范围：
  - 社区前台：间接影响。只有当历史 `taken_down` 内容缺少 `publish_review` 审核记录时，前台被下线内容才可能出现“恢复池不可见、无法恢复”的治理残留。
  - 管理后台：直接影响。`/moderation` 恢复池是否能看到历史被下线内容，取决于这类审核记录是否存在。
  - 后端：已补齐 report-driven `offline-target` 的未来数据自动补审核记录能力；本次脚本用于处理历史残留。
- 当前真实口径：
  - 新产生的 `offline-target` 已由后端自动补 `publish_review`
  - 历史数据只在缺口真实存在时，才通过 `scripts/backfill-historical-moderation-audits.mjs` 修复
- 本轮结果：
  - 已修复脚本对 `.codex/测试环境资源清单.md` 的中文全角冒号解析兼容问题
  - 已在远端测试环境执行 dry-run
  - 结果为 `0` 条待回填，当前云测试库无该类历史残留
- 验证命令：
  - `node .\\scripts\\backfill-historical-moderation-audits.mjs --target remote --resource-file .codex/测试环境资源清单.md`
- 风险 / 未对齐点：
  - 这次验证的是“当前测试环境无历史残留”，不是说脚本永远不会再用到
  - 若后续导入旧库、回放历史数据或换新测试库，仍应先跑 dry-run 再决定是否 `--apply`

### 2026-05-21 管理后台测试环境云发布入口补齐

- 状态：`implemented`
- 影响范围：
  - 社区前台：间接影响。后台云上页面开始直接读取真实社区前台和共享后端数据，云端联调不再只停留在本地镜像。
  - 管理后台：直接影响。`apps/admin` 现在也有独立的测试环境发布、回滚和 release 查询入口。
  - 后端：间接影响。后台云发布继续复用同一台云机上的 `apps/server`，不新增第二套 admin 专用 Java 服务。
- 当前真实口径：
  - 管理后台发布脚本：`scripts/deploy-test-admin.ps1`
  - 管理后台回滚脚本：`scripts/rollback-test-admin.ps1`
  - release 查询脚本：`scripts/list-test-releases.ps1` 已支持 `admin`
  - 稳定基线补记脚本：`scripts/stamp-test-stable-baseline.ps1` 已支持在远端存在 admin current 时一并补 `release.json`
  - 根命令入口：
    - `npm run deploy:test:admin`
    - `npm run rollback:test:admin -- -ReleaseName <release> -VerifyAfterRollback`
    - `npm run release:list:test -- -Runtime admin`
- 当前云运行策略：
  - `apps/admin` 作为独立前端运行时发布到 `/opt/dramatv-community-admin`
  - 服务端请求共享后端继续走 `DRAMATV_ADMIN_API_BASE_URL=http://127.0.0.1:18080`
  - 浏览器侧真实图片、视频和前台静态资源解析继续走社区公网入口：
    - `NEXT_PUBLIC_DRAMATV_ADMIN_API_BASE_URL=<community public base url>`
    - `NEXT_PUBLIC_DRAMATV_WEB_BASE_URL=<community public base url>`
  - 管理后台服务监听 `0.0.0.0:3206`，而不是回环地址，否则即使放通端口也无法从外网验收
  - 这轮先固定后台公网验收入口为独立端口 `3206`，不和当前社区前台 `80 -> apps/web` 的 Nginx 根入口混写到同一套路由
- 验证状态：
  - 发布后最小验收入口固定为 `scripts/smoke-admin-routes.mjs`
  - 当前已把该 smoke 脚本直接接入 `deploy-test-admin.ps1` / `rollback-test-admin.ps1` 的部署后和回滚后验证
- 风险 / 未对齐点：
  - 当前还没有把 `admin-community.xxx.com` 这一类正式独立域名配置进脚本；如果后续启用正式域名，只需要替换公开入口参数，不应重造 release 目录和 rollback 结构
  - 当前如果直接按 `http://<公网IP>:3206` 验收，还需要云机安全组和本地防火墙放通 `3206`
  - 首条真实 admin 云发布完成后，还需要把实际 release 记录追加到 `ops/releases/test-env-release-ledger.md`
