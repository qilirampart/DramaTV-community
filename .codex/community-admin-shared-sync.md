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

- 当前项目正式分支策略已收口为 `main + dev` 双分支
- `main` 作为稳定主分支与对外默认分支
- `dev` 作为日常开发、联调与集成分支
- 历史阶段使用过的 `pre / test` 分支已经完成退场清理，不再保留为当前仓库稳定分支
- GitHub 远端默认分支已经切到 `main`
- `main` 现在是对外默认分支和发布锚点，不再只是临时工作分支

### 目标分支方案

- `main`：生产主干，稳定可发布
- `dev`：日常开发集成分支
- 不再长期维护 `pre / test` 两条稳定环境分支
- 测试、联调、验收通过 `dev` 上的代码版本与具体 release 记录完成，不再依赖额外 Git 稳定分支

### 推荐流转

- 日常开发：`feature/*` -> `dev`
- 日常小修复：`fix/*` -> `dev`
- 稳定发布：`dev` -> `main`
- 紧急修复：从 `main` 或当前发布分支切 `hotfix/*`，修完再回灌

### 共享规则

- 前台和后台的共享改动不拆成两个 Git 仓库处理
- 影响双方的改动先记共享台账，再各自补单线进度
- 发布记录要能追到分支、commit 和回滚点
- 当前长期稳定分支只保留 `main / dev`
- `pre / test` 已转为历史记录，不再参与后续分支流转
- 分支名优先用 `main / dev` 这套轻量命名，不再强制叫 `master`

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
  - 后端正式字段仍是：
    - `model_category`
    - `content_category`
    - `composition_category`
  - 但当前业务语义已经明确拆分为两套：
    - `图片提示词`：只使用 `模型分类 + 内容分类`
    - `视频提示词`：使用 `模型分类 + 内容分类 + 视频模型使用方式`
  - 当前 `composition_category` 不再按“构图分类”理解：
    - 它只作为 `视频模型使用方式` 的兼容承载字段
    - 当前允许值仍为 `single-model / multi-model`
  - 后台 taxonomy 页当前应固定为 5 个治理板块：
    - `image-model`
    - `video-model`
    - `image-content-category`
    - `video-content-category`
    - `video-model-usage`
  - 完整度判定口径：
    - `image prompt` 只要求 `model_category + content_category`
    - `video prompt` 要求 `model_category + content_category + composition_category`
- 前台状态：
  - 已优先消费后端 taxonomy 字段
  - 发布页图片提示词不再展示/要求第三维
- 后台状态：
  - 已有最小真实管理闭环
  - taxonomy 治理页必须按图片/视频分开显示内容分类，不再把两端内容分类混为同一组
  - taxonomy 候选池里，图片提示词不再显示“缺少第三维就是待补齐”
- 验证状态：
  - 当前正在补齐接口、页面、草稿持久化与集成测试的一致性回归
- 当前风险：
  - 后台如果继续沿用旧的 `content-category / composition-category / 构图分类` 口径，前台筛选、发布和资源归类会直接错位
  - 历史 image prompt 草稿/标签如果带着 `single-model / multi-model`，会把视频侧 taxonomy 污染回图片侧
- 维护要求：
  - 新增 taxonomy 维度或分类值时，必须先明确是 `图片专属 / 视频专属 / 共享`
  - 任何涉及 taxonomy 的改动，都先更新这份共享台账，再分别改前台、后台、后端

### S5 feed-ops 运营编排

- 影响范围：
  - 后台：
    - `feed-ops/home`
    - `feed-ops/featured`
    - `feed-ops/landing`
    - `feed-ops/discussions`
  - 前台：
    - `/home`
    - `/`
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
  - `home / featured / landing / discussions` 四页都已补显式保存成功反馈，不再只靠静默跳转
  - 验证状态：
  - `home / featured / landing / discussions` 的发布生效与 draft 隔离已有后端回归
  - 已补当前本地 runtime 真验收：
    - `discussions`：后台发布后，`/api/admin/feed-ops/discussions`、`/api/discussions/home`、前台 `/discussions` 左侧频道顺序一致
    - `home`：后台发布后，`/api/admin/feed-ops/home` 与公共 `/api/feed/home` 的 8 个首页槽位顺序一致，前台 `/home` 首屏分区随之变化
    - `featured`：后台发布后，`/api/admin/feed-ops/featured` 与公共 `/api/feed/featured` 的首项顺序一致，前台 `/featured` 默认首卡随之变化
    - `landing`：后台发布后，`/api/admin/feed-ops/landing` 与公共 `/api/feed/landing` 的 `landing-archive-grid` 顺序一致，前台根首页 `/` 的“精选档案”12 卡随之变化
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
- `/feed-ops/landing`
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
  - `home / featured / landing / discussions` 的读取与更新
  - `home / featured / landing / discussions` 的候选池分页读取：
    - `/api/admin/feed-ops/home/candidates`
    - `/api/admin/feed-ops/featured/candidates`
    - `/api/admin/feed-ops/landing/candidates`
    - `/api/admin/feed-ops/discussions/candidates`
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
- feed-ops 四页配置面：
  - `home`
  - `featured`
  - `landing`
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
- `canvas`
- `commercial`
- `animation`
- `narrative`
- `mv`
- `creative`

2026-05-22 补充口径：

- 首页只保留一组 `为你推荐`，当前前后台共享 slot key 只认 `recommended-primary`
- 历史 `recommended-secondary` 仍可能留在数据库旧配置中，但从现在开始前台 `/home`、后台 `/feed-ops/home`、公共 `/api/feed/home` 都不再消费这组 legacy 配置
- 如果后续要清理这批历史配置，应视为数据治理动作，不要再把它恢复成真实首页结构的一部分

2026-05-22 cloud sync note:

- This shared home-feed contract change has been deployed to test cloud.
- Active releases:
  - backend: `/opt/dramatv-community-server/releases/20260522-201207`
  - web: `/opt/dramatv-community-web/releases/20260522-201251`
  - admin: `/opt/dramatv-community-admin/releases/20260522-201500`
- Public verification result:
  - `http://8.141.20.130/api/feed/home` now returns only:
    - `home-hero`
    - `recommended-primary`
    - `canvas`
    - `commercial`
    - `animation`
    - `narrative`
    - `mv`
    - `creative`
  - Public `/home` after login shows only one `为你推荐` section.
  - Public admin `:3206/feed-ops/home` is aligned to the same single-slot contract.

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

### 2026-05-26 `/featured` 统一切到 shared `featured-inventory` 分页口径

- 状态：`verified-local`
- 影响范围：
  - 社区前台：直接影响。`/featured` 的首屏 SSR、hydration、分类切换、排序、搜索、二级 facet、`查看更多` 现在统一消费同一套分页库存接口。
  - 管理后台：间接影响。后台 `feed-ops/featured` 仍只负责 pinned slot 顺序，不再承担 `/featured` 各 tab 真库存来源。
  - 后端：直接影响。共享读口径新增并正式启用 `GET /api/feed/featured-inventory`。
- 当前真实口径：
  - `/featured` 不再采用“SSR 用 `homeFeed + hotWorkflows`，客户端再补拉 prompt inventory”的双源模式。
  - 当前单一事实源为：
    - `GET /api/feed/featured-inventory`
  - 支持查询参数：
    - `filter=all|workflow|video_prompt|image_prompt|activity`
    - `sort=latest|hot`
    - `q`
    - `modelCategory`
    - `contentCategory`
    - `workflowType=copyable|placeholder`
    - `limit`
    - `cursor`
  - 当前 `/featured` 五个 tab 的真实库存来源已统一为：
    - `全部`
    - `工作流`
    - `视频提示词`
    - `图片提示词`
    - `活动`
  - `工作流` 不再继续依赖 `homeFeed.sections.hotWorkflows` 作为主数据源。
  - `活动` 不再继续固定为占位 `0`。
- 前台状态：
  - `apps/web/src/app/(community)/featured/page.tsx`
  - `apps/web/src/lib/api/community-public-cache.ts`
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
  - 已统一切到 `featured-inventory`
  - 本地同源代理路由已补齐：
    - `/api/featured-inventory`
    - `/api/public/featured-inventory`
- 后端状态：
  - `apps/server` 已提供共享分页接口 `GET /api/feed/featured-inventory`
  - `FeedReadApiIntegrationTest` 已覆盖 `all / workflow / prompts / activity` 主要读取场景
- pinned / 运营位边界：
  - 精选页 pinned 顺序仍继续消费 `featured-all / featured-workflow / featured-video-prompt / featured-image-prompt / featured-activity`
  - 但 pinned 只负责排序前置，不再负责生成 tab 库存总量
- 当前验证证据：
  - 本地 `GET /api/feed/featured-inventory?limit=1 -> 200`
  - 本地 `GET /api/public/featured-inventory?limit=1 -> 200`
  - `/featured` 首屏计数与 unified summary 一致
  - `查看更多` 继续走 `cursor` 分页，不是前端假分页
- 当前风险 / 后续约束：
  - 后台如后续继续改 `featured` tab 结构、slot key 或 facet 语义，必须先看这条共享台账，避免又回到“双源数据口径不一致”
  - 如果后续继续优化 `/featured` 体感，优先在共享分页读取和前端预取/预热上做，不回退到整池全量拉取

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

### 2026-05-22 Git 分支策略收口为 dev / main 双分支

- 状态：`verified`
- 影响范围：
  - 前台社区：间接影响。后续对外同步、拉取和仓库入口默认都会按 `main` 作为基线。
  - 管理后台：间接影响。后台和前台共用同一仓库，默认分支切换会影响后续联调和发布口径。
  - 后端：间接影响。`apps/server` 仍复用同一仓库与同一套分支流转。
- 当前真实口径：
  - GitHub 仓库 `qilirampart/DramaTV-community` 的 default branch 已切到 `main`
  - 当前正式工作流收口为 `feature/* -> dev -> main`
  - `dev` 负责日常开发、联调和集成，`main` 负责稳定发布与对外基线
  - 历史阶段的 `pre / test` 分支已完成本地与远端清理，不再承接新的标准提测/预发流程
- 验证状态：
  - `git remote show origin` 已确认 `HEAD branch: main`
  - `git branch -a` 已确认当前仓库稳定分支只保留 `main / dev`
  - GitHub Settings 页面已显示 `Default branch changed to main`
- 风险 / 未对齐点：
  - 后续如果还要继续精简远端历史引用，可再按需清理已合并完成的临时 `feature/*` 分支

### 2026-05-21 云端前后台部署形态策略

- 状态：`verified`
- 影响范围：
  - 社区前台：直接影响。后续前台云发布继续保持独立前端运行时和独立 release，不和后台混成同一个 Next 运行进程。
  - 管理后台：直接影响。后台云发布继续保持独立前端运行时和独立 release，但共享同一个社区后端与业务数据。
  - 后端：直接影响。`apps/server` 继续作为前后台共享后端，不额外拆第二套后台专用社区业务后端。
- 当前真实口径：
  - 本地也不是“前后台共一个运行进程”，而是：
    - 社区前台 `3106`
    - 管理后台 `3206`
    - 共享后端 `18080`
    - 云镜像前台 `3107`
  - 云端推荐长期保持的形态是：
    - 同一 Git 仓库
    - 同一批次 commit/source
    - 共享 `apps/server`
    - `apps/web` 与 `apps/admin` 分别独立运行
    - `web / admin / server` 各自保留独立 release 与回滚点
  - “前后台互通”依赖的不是共一个前端进程，而是：
    - 共用同一套数据库、OSS、审核与编排数据
    - 前后台构建自同一个仓库快照
    - 共享链路变化持续写入本台账
- 不采用“云端前后台共一个前端进程”的原因：
  - 前台和后台无法独立回滚，任何一边的发布事故都更容易拖到另一边
  - Next 构建产物、缓存、静态资源和路由更容易互相污染
  - 后台发布会直接增加前台在线流量风险，不利于测试环境逐步收口到生产规范
  - 后续做独立 smoke、灰度、性能排障和单边热修都会更困难
- 验证状态：
  - 本地端口分工已固定写入 `docs/04_实施设计/本地手动启动操作指南-2026-05-21.md`
  - 当前后台测试环境云发布口径已明确为“独立端口、独立 release、共享后端”
- 风险 / 未对齐点：
  - 后续如果要进一步强化“同批次互通”，应该补的是统一 release label、统一发布记录和同批次验收，不是把前后台前端进程合并
  - 如果未来要上正式独立域名，仍按“前台一个入口、后台一个入口、共享后端”的思路扩展，不回退到共进程方案

### 2026-05-22 管理后台布局收口版已发到测试云环境

- 状态：`verified`
- 影响范围：
  - 社区前台：间接影响。后台治理页的视觉比例和操作空间更稳定后，云端联调时不再容易因为浏览器宽度差异误判为“发布未生效”或“云端样式错版”。
  - 管理后台：直接影响。`users / comments / moderation / reports / resources / media-tasks / audit-logs` 这批共享治理页已同步到测试云环境的新 release。
  - 后端：无接口契约变更，本轮只改后台前端布局与展示层响应式策略。
- 当前真实口径：
  - 本轮云发布命令：`npm run deploy:test:admin`
  - 远端 active release：`20260522-113320`
  - 远端路径：`/opt/dramatv-community-admin/releases/20260522-113320`
  - 公网入口：`http://8.141.20.130:3206`
  - 当前服务：`dramatv-community-admin` `active (running)`
- 本轮云上发布验证：
  - 公网 `public` smoke：`13 passed / 0 failed`
  - 云机内 `full` smoke：`25 passed / 0 failed`
  - 验证产物：
    - `artifacts/runtime-readiness/test/admin-deploy-20260522-113320-public-summary.json`
    - `artifacts/runtime-readiness/test/admin-deploy-20260522-113320-internal-summary.json`
- 这轮共享结论：
  - 之前“本地 Edge 看着正常、云端或 Chrome 看着拥挤”并不是云端后台和本地后台跑了不同代码版本，而是后台布局对有效视口宽度太敏感。
  - 这次已把共享治理页统一改成更稳的响应式策略，再验云端时应该优先按“同一页面在不同浏览器的有效宽度是否还会进入挤压带”来判断，而不是再先怀疑“云端没发上去”。

### 2026-05-22 用户管理创建账号链路补齐

- 状态：`verified-cloud`
- 影响范围：
  - 社区前台：间接影响。后台现在可以直接创建本地账号，这类账号后续可直接走社区 `/api/auth/login` 的本地密码登录链路。
  - 管理后台：直接影响。`/users` 已新增真实“创建账号”弹窗与提交链路。
  - 后端：直接影响。新增 `POST /api/admin/users`，写入真实用户、密码和审计日志。
- 当前真实口径：
  - 创建的是本地账号，不是画布侧外部账号。
  - 创建成功后后端会返回初始密码，当前由后台创建弹窗直接展示。
  - 支持创建时直接填写初始密码。
  - 如果密码留空，则统一回退到默认密码 `dramatv-local-dev`。
  - 新账号默认 `status=active`
  - 新账号默认走 `identity_provider=local`
  - 新账号会同步补 `creator_profiles`
- 权限边界：
  - `admin / operator` 可创建账号
  - `moderator` 只读，不可创建
  - `operator` 不可创建 `admin`
  - 只有 `admin` 可创建管理员账号
- 验证状态：
  - 已补后端集成测试：
    - `operatorCanCreateCreatorUserWithDefaultPasswordWhenPasswordBlank`
    - `operatorCanCreateCreatorUserWithExplicitPassword`
    - `operatorCannotCreateAdminUser`
  - 已做本地运行态真接口验证：
    - 后台 `admin-chief / dramatv-admin-demo` 登录成功
    - 空密码创建账号后，返回 `dramatv-local-dev` 且社区本地登录成功
    - 自定义密码创建账号后，返回自定义密码且社区本地登录成功
- 风险 / 未对齐点：
  - 这轮还没同步到测试云环境，目前先是本地真实可用
  - 当前创建表单只覆盖最小字段：`username / displayName / role / email / phone / password`
  - 如果后续需要“批量建号 / 初始化头像 / 强制首登改密”，应作为下一条共享能力继续补，不要直接改坏当前最小闭环

### 2026-05-22 用户管理创建账号链路已同步到测试云环境

- 状态：`verified-cloud`
- 影响范围：
  - 社区前台：直接影响。后台新建的本地账号已经在测试云环境可通过社区 `/api/auth/login` 真实登录，不再只是本地演示链路。
  - 管理后台：直接影响。`/users` 的创建账号弹窗已发到测试云环境，对应公网入口 `http://8.141.20.130:3206`。
  - 后端：直接影响。共享后端 `POST /api/admin/users` 已在测试云环境切到包含“自定义密码优先、留空回退默认密码”的版本。
- 当前真实口径：
  - 创建的仍是社区本地账号，不是外部画布账号。
  - 最小创建字段仍是：`username / displayName / roleCode / email / phone / password`
  - 若 `password` 留空，则回退默认密码 `dramatv-local-dev`
  - 若 `password` 有值，则直接作为初始密码落库
  - 新账号仍默认：
    - `identity_provider=local`
    - `status=active`
    - 自动补 `creator_profiles`
- 本轮云端发布口径：
  - 共享后端 active release：`/opt/dramatv-community-server/releases/20260522-123003`
  - 管理后台 active release：`/opt/dramatv-community-admin/releases/20260522-123432`
  - 服务状态：
    - `dramatv-community-server` = `active`
    - `dramatv-community-admin` = `active`
- 本轮验证状态：
  - 后台公网 smoke：`artifacts/runtime-readiness/test/admin-deploy-20260522-123432-public-summary.json`
    - 结果：`13 passed / 0 failed`
  - 后台云机内 smoke：`artifacts/runtime-readiness/test/admin-deploy-20260522-123432-internal-summary.json`
    - 结果：`25 passed / 0 failed`
  - 云机内功能级真验收已补：
    - 管理员 `admin-chief / dramatv-admin-demo` 可通过 `http://127.0.0.1:18080/api/admin/auth/login` 登录
    - 空密码创建账号 `cloudsync_blank_20260522124137` 后，返回 `dramatv-local-dev`，并可通过社区 `http://127.0.0.1:18080/api/auth/login` 登录成功
    - 自定义密码创建账号 `cloudsync_custom_20260522124137` 后，返回 `CloudSync!20260522124137`，并可通过社区 `http://127.0.0.1:18080/api/auth/login` 登录成功
- 重要说明：
  - 本轮 backend deploy summary `artifacts/runtime-readiness/test/backend-deploy-20260522-123003-summary.json` 仍显示对公网社区入口 `http://8.141.20.130` 的一组 `fetch failed`
  - 这条失败不是“创建账号能力没同步上云”，而是当前脚本尾部跑的是社区公网 readiness，和本次后台账号创建能力不是同一条验收链路
  - 因此本条共享能力是否生效，应以后端 active release + 后台 smoke + 云机内功能级真验收三者同时成立为准
- 当前结论：
  - “后台创建本地账号 -> 社区本地密码登录”这条共享链路已经在测试云环境真实打通
  - 之前 `verified-local` 的本地状态已被这次 `verified-cloud` 覆盖

### 2026-05-22 后台真实媒体预览改为同源代理链路

- 状态：`verified-cloud`
- 影响范围：
  - 社区前台：间接影响。前台资源数据本身没有改，但后台不再依赖社区公网 `/media` 是否稳定来展示这些真实资源。
  - 管理后台：直接影响。`moderation / resources / feed-ops` 这类读取真实图片视频的页面，浏览器侧资源访问已切到后台同源代理。
  - 后端：无新的业务接口契约变更，仍复用现有 `/media/**`、前台静态资源路径和共享数据口径。
- 当前真实口径：
  - 后台审核接口和资源接口一直都已返回真实媒体字段：
    - `coverUrl`
    - `posterUrl`
    - `previewUrl`
    - `sourceUrl`
  - 之前云上问题不是“接口没对上真实资源”，而是后台前端把这些相对路径拼成了社区公网根入口：
    - `http://8.141.20.130/media/...`
  - 该公网路径在浏览器运行态里统一返回 `502 Bad Gateway`，导致后台看起来像“拿不到真实资源”
- 本轮修复策略：
  - 后台浏览器侧不再直接拼社区公网根域名
  - 改成统一输出同源代理路径：
    - `/__admin_proxy__/media/...`
    - `/__admin_proxy__/seedance-videos/...`
    - `/__admin_proxy__/nano-banana-images/...`
  - 后台 Next 运行时通过 rewrites 再转发到：
    - `127.0.0.1:18080`
    - 社区前台静态资源入口
- 本轮云端发布口径：
  - 管理后台 active release：`/opt/dramatv-community-admin/releases/20260522-130604`
  - 服务状态：`dramatv-community-admin = active`
- 本轮验证状态：
  - 后台 smoke：
    - `artifacts/runtime-readiness/test/admin-deploy-20260522-130604-public-summary.json`
    - `artifacts/runtime-readiness/test/admin-deploy-20260522-130604-internal-summary.json`
  - 浏览器运行态已验证：
    - 审核页旧请求 `http://8.141.20.130/media/...` 之前是 `502`
    - 新请求已切到 `http://8.141.20.130:3206/__admin_proxy__/media/...`
    - 新请求当前返回 `200 OK`
  - 云机内网核实：
    - `http://127.0.0.1:18080/media/...` 本身一直可用，说明问题确实是公网访问链路而不是共享后端资源缺失
- 当前结论：
  - “后台拿真实资源数据”这条共享链路原本就是通的
  - 本轮修复的是“后台浏览器访问真实资源”的云端公开链路
  - 后续只要保持后台同源代理口径，社区公网根入口短时异常也不会直接拖垮后台审核预览

### 2026-05-22 feed-ops 候选池改为轻页壳 + 异步分页契约

- 状态：`verified-local`
- 影响范围：
  - 社区前台：无直接接口消费变更。前台 `/home`、`/featured`、`/discussions` 的发布生效口径不变，仍只消费已发布配置。
  - 管理后台：直接影响。`/feed-ops/home`、`/feed-ops/featured`、`/feed-ops/discussions` 进入页面时不再先等待整池候选内容返回，页面壳和候选池改为分步加载。
  - 后端：直接影响。`/api/admin/feed-ops/{page}` 不再承担整池候选内容返回，新增候选池分页接口承接 `slotKey / keyword / promptFilter / page / pageSize` 查询。
- 当前真实口径：
  - 页面主配置接口：
    - `GET /api/admin/feed-ops/home`
    - `GET /api/admin/feed-ops/featured`
    - `GET /api/admin/feed-ops/discussions`
  - 上述主配置接口当前只返回页面摘要、slot 配置和每个 slot 的 `fallbackItems`，`candidatePool` 固定为空数组，不再承载整池候选数据。
  - 候选池读取统一拆到新接口：
    - `GET /api/admin/feed-ops/home/candidates`
    - `GET /api/admin/feed-ops/featured/candidates`
    - `GET /api/admin/feed-ops/discussions/candidates`
  - 候选池接口当前支持：
    - `slotKey`
    - `q`
    - `promptFilter=all|image|video`
    - `page`
    - `pageSize`
  - 后端查询口径已从“整池查出后前端/内存筛选”收口为“数据库侧筛选 + 分页返回”。
- 管理后台状态：
  - 三个 `feed-ops` 页面都已切到：
    - 路由级 `loading.tsx`
    - 页面主配置先返回
    - 候选池异步单独加载
    - 候选池翻页与关键词筛选走真实分页接口
- 后端状态：
  - 候选池分页接口已落地
  - `fallbackItems` 仍作为页面首屏兜底预览使用
  - 页面 fallback 池 prompt 读取已修正，不再把 `promptFilter=null` 误判成“图片提示词”
- 验证状态：
  - 已补后端定向集成测试：
    - `AdminFeedOpsHomeApiIntegrationTest`
    - `AdminFeedOpsFeaturedApiIntegrationTest`
    - `AdminFeedOpsDiscussionsApiIntegrationTest`
  - 已补本地后台构建验证：
    - `apps/admin -> npm run build`
- 风险 / 未对齐点：
  - 这轮状态还是 `verified-local`，还没补云端这版共享后端是否已实际重启到新候选池契约的复验。
  - 后续如果继续调整 `slotKey`、候选类型或筛选参数，必须先同步这里，再改 `apps/admin / apps/server`，否则最容易再次出现“新前端读旧后端”的错配。

### 2026-05-22 历史四分支推进记录归档

- 状态：`historical`
- 影响范围：
  - 社区前台：仅保留历史上下文，说明这批共享改动曾按旧四分支流程推进过。
  - 管理后台：仅保留历史上下文，说明后台治理页相关改动曾进入过 `test`。
  - 后端：仅保留历史上下文，说明共享后端改动曾随旧流程一起推进。
- 当前真实口径：
  - 这条记录描述的是双分支策略收口前已经发生过的一次旧流程推进：
    - `feature/admin-reliability-and-governance-20260522`
    - `-> dev`
    - `-> test`
  - 对应历史分支头一度为：
    - `origin/dev = 6f3ae91`
    - `origin/test = 2caed28`
    - `origin/pre = 6391feb`
  - 这段信息只用于解释历史推进痕迹，不再代表当前项目推荐流转。
- 当前已确认的最低验证条件：
  - 本地 `apps/admin -> npm run build` 已通过
  - 本地后端定向集成测试已通过：
    - `AdminMediaTaskApiIntegrationTest`
    - `AdminUserGovernanceApiIntegrationTest`
  - 本地后台运行态复验已通过：
    - `/comments`
    - `/moderation`
    - `/reports`
    - `/feed-ops/home`
    - `/media-tasks`
    - `/audit-logs`
  - 云端共享链路已分别补过功能级验证：
    - 后台创建账号 -> 社区本地密码登录
    - 后台真实媒体预览同源代理
- 当前还没做的事：
  - 旧流程下原本还没执行 `test -> pre`
  - 但当前项目已经改为 `dev / main` 双分支，所以这条旧推进链不再继续补完
- 当前结论：
  - 这条记录保留的是“我们曾经真实走过旧四分支流程”的历史事实
  - 从当前策略开始，后续统一按 `feature/* -> dev -> main` 执行，不再继续补 `test / pre` 口径
- 建议的下一步：
  - 如果确认不再需要保留历史环境分支，可在后续单独执行 `pre / test` 本地与远端清理

- 2026-05-24 已将后台 `运营配置` 单入口 + `首页/精选页/落地页/讨论区` 四 tab 结构同步到测试云，发布版本 `20260524-193217`。
- 公网 smoke 通过，唯一 full-smoke 失败项是 `root.redirect` 断言口径和当前 `/admin` basePath 不一致，不影响页面本身。

### 2026-05-24 前台公共页取消缓存，发布立即生效

- 前台公共页的 landing/home/featured 数据读取此前包了一层 `unstable_cache`，而底层后端请求已经是 `no-store`。
- 结果是后台发布后，前台可能在缓存窗口内看起来没变，容易误判为“发布没生效”。
- 本轮已在 `apps/web/src/lib/api/community-public-cache.ts` 去掉这层缓存，并同步到测试云。
- 验证结果：
  - `apps/web -> npm.cmd run build`
  - `npm.cmd run deploy:test:web -VerifyBeforeDeploy -VerifyAfterDeploy`
  - web release：`20260524-222205`
- 当前结论：
  - 后台发布 landing / home / featured 后，前台会直接读最新后端数据
  - 共享链路不再依赖 15 秒的公共读缓存窗口

### 2026-05-25 taxonomy 后台页按“分类定义 + 提示词重绑”重构

- 状态：`verified-local`
- 影响范围：
  - 社区前台：间接影响。后台 taxonomy 对提示词分类的新增、删除、重绑会直接改写共享 `prompt_entries` 分类字段和 taxonomy 标签，前台后续读到的是同一套真实数据。
  - 管理后台：直接影响。`/taxonomy` 不再沿用旧的“统计板 + 分类治理 + 待补齐池”混合页面，改成两块真实工作区：
    - `分类定义管理`
    - `提示词资源重绑`
  - 后端：直接影响。`/api/admin/taxonomy` 这组接口现在正式支持：
    - `POST /api/admin/taxonomy/categories`
    - `DELETE /api/admin/taxonomy/categories/{sectionKey}/{categoryValue}`
    - `POST /api/admin/taxonomy/prompts/rebind`
    - `GET /api/admin/taxonomy/prompts?page=&pageSize=`
- 当前真实口径：
  - taxonomy 后台页当前不是“分类统计看板”，而是面向运营/治理的工作台。
  - 上半区只处理分类项本身：
    - 选维度
    - 新增分类
    - 删除分类
    - 调整启停 / 排序 / 曝光位 / 备注
  - 下半区只处理真实提示词和分类绑定：
    - `全量重绑`
    - `待补齐优先`
    - 分页读取候选池
    - 勾选后批量绑定到当前分类
  - 删除分类的安全口径已固定：
    - 如果仍有 prompt 在使用该分类，则删除失败
  - 重绑分类的保留口径已固定：
    - 只改当前维度
    - 其它 taxonomy 维度保留
    - 非 taxonomy 的业务标签保留
    - 旧 taxonomy 标签会随这次重绑一起刷新，避免残留旧值
- 前台状态：
  - 前台当前继续直接消费共享后端里的 prompt taxonomy 字段和标签，不需要单独改一套 taxonomy 逻辑。
- 后台状态：
  - `/taxonomy` 已切换到新结构。
  - 候选提示词池已统一分页，当前页大小固定 `15`。
  - 图片 / 视频分类维度继续分开，后台不再把它们混成一个“通用分类池”。
- 验证状态：
  - 后端定向集成测试已通过：
    - `AdminTaxonomyApiIntegrationTest`
    - `AdminTaxonomyLoggingIntegrationTest`
  - 本轮新增覆盖点已通过：
    - 创建空分类后仍会出现在 taxonomy 列表
    - 未被使用的分类可删除
    - 被 prompt 使用中的分类不可删除
    - prompt 候选池分页元数据正确
    - 重绑分类时其它维度保留且 taxonomy 标签刷新
  - 后台前端本地验证已通过：
    - `apps/admin -> npm.cmd run build`
    - `apps/admin -> npm.cmd run typecheck`
  - 2026-05-25 已同步到测试云：
    - shared backend active release：`/opt/dramatv-community-server/releases/20260525-221644`
    - admin active release：`/opt/dramatv-community-admin/releases/20260525-224039`
    - backend post-deploy readiness：`artifacts/runtime-readiness/test/backend-deploy-20260525-221644-summary.json`
      - 结果：`11 passed / 0 failed`
    - admin public smoke：`artifacts/runtime-readiness/test/admin-deploy-20260525-224039-public-summary.json`
      - 结果：`13 passed / 0 failed`
    - admin internal smoke：`artifacts/runtime-readiness/test/admin-deploy-20260525-224039-internal-summary.json`
      - 结果：`25 passed / 0 failed`
- 本轮云同步范围说明：
  - 这次实际需要同步的是 `apps/server + apps/admin`
  - `apps/web` 只有本地 TypeScript 收口，未涉及当前 taxonomy 云端运行时行为，因此本轮没有单独发社区前台
- 重要补充：
  - admin 云端 full smoke 已补齐 `basePath=/admin` 的根路由验收口径
  - 当前内网直连 `3206/` 的合法行为是：`/ -> /admin -> /admin/login?redirectTo=%2F`
  - 这属于后台部署验收脚本收口，不是 taxonomy 页面功能缺陷
- 当前结论：
  - taxonomy 后台这次已经从“难理解的混合页”收口成真实可用的后台工作台。
  - taxonomy 相关共享后端与管理后台前端都已同步到测试云，当前云端口径与本地一致。

### 2026-05-25 taxonomy 标准分类集口径补齐

- 状态：`verified-cloud`
- 影响范围：
  - 社区前台：直接影响。精选页里视频模型、内容分类看到的是一套固定标准分类口径，后台 taxonomy 现在要与这套口径对齐。
  - 管理后台：直接影响。`/taxonomy` 不再只展示“当前数据库偶然落库到的分类值”，而是要稳定展示项目标准分类集。
  - 后端：直接影响。`/api/admin/taxonomy` 的 section 聚合、分类标签展示名、内置分类的增删边界统一收口到共享后端。
- 当前真实口径：
  - 前台精选页的模型/内容分类按钮本身是固定选项集，并不等于数据库里当前真实已落库了多少分类。
  - 后台 taxonomy 原实现按 `prompt_entries.model_category / content_category / composition_category` 聚合，只能看到当前真实落库值，因此会出现“前台能看到 `kling / wan / happyhorse / 其他`，后台只看到 `seedance / 真人 / 其他`”的错位。
  - 当前修复策略已经明确：
    - 后端统一内置标准分类集：
      - `image-model`: `gpt-image-2 / nanobanana / midjourney / other-image-model`
      - `video-model`: `seedance / kling / happyhorse / wan / other-video-model`
      - `image-content-category`: `real-person / animation / scene / prop / other`
      - `video-content-category`: `real-person / animation / other`
      - `video-model-usage`: `single-model / multi-model`
    - `/api/admin/taxonomy` 返回时先带标准分类，再用真实聚合数据覆盖对应项。
    - 后台展示名同步按标准标签映射，不再直接把数据库 value 原样当 label。
    - 内置标准分类视为真实治理口径的一部分：
      - 不能重复创建
      - 不能被删除
- 当前代码状态：
  - `apps/server/src/main/java/com/dramatv/community/admin/taxonomy/AdminTaxonomyService.java`
    - 已补内置标准分类集常量
    - 已补分类 label 映射
    - 已补 section 默认项注入
    - 已补内置分类保护删除逻辑
  - `apps/server/src/main/resources/db/migration/V26__seed_builtin_admin_taxonomy_categories.sql`
    - 已补 admin taxonomy 配置表的标准分类初始化迁移
  - `apps/server/src/test/java/com/dramatv/community/integration/AdminTaxonomyApiIntegrationTest.java`
    - 已补“标准分类返回存在”与“内置分类不可删”回归
- 验证状态：
  - 本地定向后端回归已通过：
    - `AdminTaxonomyApiIntegrationTest`
    - `AdminTaxonomyLoggingIntegrationTest`
  - 当前已确认 `/api/admin/taxonomy` 会稳定返回标准分类集，不再依赖当前 prompt 是否正好落库到这些值。
  - 云端共享后端回归已通过：
    - `npm.cmd run smoke:api`
      - 结果：`19 passed / 0 failed`
    - `npm.cmd run smoke:auth-session`
      - 结果：`12 passed / 0 failed`
    - `npm.cmd run deploy:test:backend`
      - backend active release：`/opt/dramatv-community-server/releases/20260525-234447`
    - `artifacts/runtime-readiness/test/backend-deploy-20260525-234447-summary.json`
      - 结果：`11 passed / 0 failed`
  - 这轮只需要同步共享后端，不需要单独发 `apps/admin`：
    - 原因是 taxonomy 页面前端本身已是泛化渲染
    - 本轮真实缺口在后端返回口径，而不是后台页面结构
- 当前风险 / 未对齐点：
  - 这一步先解决“后台 taxonomy 分类范围和前台标准分类不一致”的问题。
  - 还没有彻底解决“前台提示词单条分类来源有时是字段、有时是标题/摘要/标签推断”的更深层共享口径漂移；后续仍需继续把提示词 taxonomy 解析规则进一步收口。

### 2026-05-26 首页 hero 运营位容量与公开出参统一扩到 6

- 状态：`verified-local`
- 影响范围：
  - 社区前台：直接影响。公共 `/api/feed/home` 的 `layout.slots[home-hero]` 不再最多只吐 `3` 条，当前会按已发布配置和 fallback 规则最多返回 `6` 条。
  - 管理后台：直接影响。`/feed-ops/home` 的 `home-hero` 配置位上限、fallback 预览和右侧首页轮播预览都已从 `3` 扩到 `6`。
  - 后端：直接影响。`admin feed-ops` 的 slot 定义、保存校验、published 读取和公共首页布局组装都已统一按 `6` 执行。
- 当前真实口径：
  - `home-hero` 现在是“首页首屏轮播池 6 条”，不是旧的 3 条。
  - 前台首页真实展示策略仍是：
    - 首屏同时可见 `3` 张
    - 轮播池总量 `6` 张
  - 后台运营配置现在只负责这 `6` 条轮播池内容，不再和旧的 3 条上限混用。
  - 共享实现已同步覆盖 4 层：
    - `apps/admin` slot 元数据与预览
    - `apps/server` `AdminFeedOpsService` slot 定义 / fallback / 校验
    - `apps/server` `CommunityCatalogJdbcQueryService` 公共 `/api/feed/home` 布局组装
    - 定向集成测试对 admin 读写与 public 出参的保护
- 验证状态：
  - `apps/admin -> npm.cmd run typecheck` 通过
  - `apps/admin -> npm.cmd run build` 通过
  - `apps/server -> .\scripts\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminFeedOpsHomeApiIntegrationTest,FeedReadApiIntegrationTest test`
    - 结果：`12 passed / 0 failed`
  - 当前已补的关键断言：
    - 后台 `GET /api/admin/feed-ops/home` 里 `home-hero.maxItems = 6`
    - 后台可真实保存并读回 `6` 条 `home-hero` 内容
    - 公共 `GET /api/feed/home` 里 `home-hero.items.size = 6`
- 当前结论：
  - 这次不是单纯后台工作台视觉调整，而是“后台配置上限 -> 后端保存校验 -> 公共首页返回”三层共享契约已重新对齐到 6
  - 当前状态为本地验证完成，尚未同步测试云

### 2026-05-27 featured feed-ops fallback 语义收口并清理历史污染配置

- 状态：`verified-cloud`
- 影响范围：
  - 社区前台：直接影响。`/featured` 的首屏 pinned order 不再把 fallback 伪装成真实运营编排，前台首屏顺序回到 `featured-inventory` 的真实库存顺序，除非后台明确发布了精选配置。
  - 管理后台：直接影响。`/admin/feed-ops/featured` 当前“手工配置位”和“前台真实展示”语义已重新对齐；空配置位不再被公共 `/api/feed/featured` 自动补成假编排。
  - 后端：直接影响。公共 `GET /api/feed/featured` 对 `featured-all / featured-workflow / featured-video-prompt / featured-image-prompt / featured-activity` 五个 slot 的语义已从“configured + fallback merge”收口为“configured only”。
- 根因确认：
  - 这批“几十条脏数据”不是前台 hydration 闪页自己写回，也不是随机数据库坏数据。
  - 已有历史证据指向 `.codex/progress-admin.md` 的 `2026-05-17 feed-ops empty-config recovery after reboot`：
    - 当时 `admin_feed_slot_configs` 变空
    - 系统把 fallback 可见内容重新发布成了 `featured` 真实配置
    - 后续又同步到了测试云
  - 同时，旧后端 `CommunityCatalogJdbcQueryService.loadFeaturedArchive()` 仍会对 featured slots 调用 `fillHomeLayoutSlot(configuredItems, fallbackPool, maxItems)`，导致“没有手工配置时也像是有配置”。
- 当前真实口径：
  - `GET /api/feed/featured`
    - 只返回后台已发布的人工配置项
    - 空 slot 返回空数组
    - 不再把 fallback 作为 featured pinned order 输出
  - `GET /api/featured-inventory`
    - 继续承担 `/featured` 页面真实库存与分页来源
    - 在没有精选手工配置时，前台应按 inventory 顺序显示，而不是按 `/api/feed/featured` 假配置排序
  - `GET /api/feed/landing`
    - 仍保留 landing 自身的 fallback merge 语义
    - 这次收口只针对 featured，不把 landing 一起改坏
- 当前代码状态：
  - `apps/server/src/main/java/com/dramatv/community/shared/persistence/CommunityCatalogJdbcQueryService.java`
    - 新增 `addFeaturedArchiveConfiguredSlot(...)`
    - `loadFeaturedArchive()` 现统一改走 configured-only
    - `loadLandingArchive()` 继续保留 fallback merge
  - `apps/server/src/test/java/com/dramatv/community/integration/FeedReadApiIntegrationTest.java`
    - 已补回归：`featuredFeedReturnsEmptyPromptPinsWhenNoPublishedFeaturedConfigExists`
    - 当前显式断言 featured 无配置时 `featured-all / featured-image-prompt / featured-video-prompt` 返回空 `items`
- 验证状态：
  - 本地验证已通过：
    - `.\scripts\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=FeedReadApiIntegrationTest test`
    - 结果：`14 passed / 0 failed`
  - 云端共享后端已实际生效：
    - `npm.cmd run deploy:test:backend` 本轮尾部因远端 `curl 127.0.0.1:18080` 探活过早而报错
    - 但浏览器直接复核 `http://8.141.20.130/api/feed/featured` 已确认新后端运行态生效
    - 清理前：`featured-workflow=3`、`featured-activity=3` 仍被 fallback 补位
    - 清理后：二者已回到 `0`
  - 云端后台污染配置已清理：
    - 清理前 `/admin/feed-ops/featured` 可见：
      - `全部首屏 12/12`
      - `视频提示词 tab 12/12`
      - `图片提示词 tab 12/12`
      - 合计 `36` 条真实已发布脏配置
    - 当前已在云端后台逐个清空并发布：
      - `featured-all`
      - `featured-video-prompt`
      - `featured-image-prompt`
    - 清理后 `/api/feed/featured` 五个 slot 全部为空
- 当前结论：
  - featured 页的共享契约已重新明确：
    - feed-ops `featured` 只表达“人工精选置顶位”
    - inventory 才表达“真实库存”
  - 后续再出现 `admin_feed_slot_configs` 空配置恢复，不允许把 fallback 推断结果重新发布成 featured 真配置

### 2026-05-27 featured 默认首屏消费口径从“排序提示”收口为“真实首屏来源”

- 状态：`verified-local`
- 影响范围：
  - 社区前台：直接影响。`/featured` 默认首屏现在会真正使用后台 `featured` 已发布配置作为首屏来源，而不是只把它当作当前 inventory 结果里的排序提示。
  - 管理后台：直接影响。`/admin/feed-ops/featured` 当前运营位语义终于和前台默认首屏一致，后台配置不再要求“配置的项必须恰好也出现在当前 inventory 首批里”才会生效。
  - 后端：本轮不改共享接口；继续沿用：
    - `GET /api/feed/featured` = 人工精选配置
    - `GET /api/featured-inventory` = 实时库存与分页
- 历史问题：
  - 前一轮虽然已经把 `/api/feed/featured` 的 fallback 污染清掉了，但前台 `FeaturedArchivePage.tsx` 仍然存在一个实现缺口：
    - 渲染列表完全来自 `featured-inventory`
    - `featuredSlots` 只参与 `pinnedRank` 排序
    - 如果后台配置项不在当前 inventory 首批里，就不会真正出现在默认首屏
  - 这正是用户看到“后台配置已经变了，但前台展示还是没变”的剩余根因。
- 当前真实口径：
  - `/featured` 默认首屏视图：
    - `sort=latest`
    - 无搜索词
    - `workflow` 无二级筛选
    - `prompt` 无 `model/content` facet
  - 只有在这组默认条件下，前台才会把 `/api/feed/featured` 的 slot 项映射成真实卡片并注入到首屏前部。
  - 一旦用户切到：
    - `最热`
    - 搜索
    - `workflow` 二级筛选
    - `video_prompt / image_prompt` 的 model 或 content facet
    - 前台就回到纯 `featured-inventory` 实时结果，不让运营位污染筛选视图。
- 当前代码状态：
  - `apps/web/src/lib/featured/featured-curation.ts`
    - 新增共享前台消费规则：
      - `shouldUseCuratedFeaturedItems(...)`
      - `mergeCuratedFeaturedItems(...)`
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - 已改为：
      - 把 `featuredSlots` 映射成与 inventory 同构的卡片项
      - 默认首屏执行“精选配置注入 + 去重 + inventory 续接”
      - 非默认视图走纯 inventory
    - 已移除旧的 `pinnedRank` 伪排序逻辑，避免继续留下“配置像生效又没真生效”的灰区
  - `apps/web/src/lib/featured/featured-curation.test.mjs`
    - 已补回归测试，保护：
      - 默认视图会真实插入精选配置
      - 过滤视图不会误用精选配置
- 验证状态：
  - 本地已通过：
    - `apps/web -> npm.cmd run typecheck`
    - `apps/web -> npm.cmd run build`
    - `featured-curation.test.mjs -> 3 passed / 0 failed`
  - 当前还没同步测试云，因此状态先记 `verified-local`
- 当前结论：
  - 现在 shared contract 已经完整闭环：
    - 后台 `featured` 配的是“默认首屏运营位”
    - 前台默认首屏会真实使用它
    - inventory 继续承担筛选、搜索、查看更多和实时库存
### 2026-05-28 admin resources prompt modality contract exposed explicitly
- 状态：`verified-local`
- 影响范围：
  - 后台：`/admin/resources`
  - 后端：`GET /api/admin/resources`
  - 后端：`GET /api/admin/resources/{targetType}/{targetId}`
- 本轮共享契约收口：
  - `AdminResourceListResponse.Item` 新增 `promptModality`
  - `AdminResourceDetailResponse` 新增 `promptModality`
  - `AdminResourceQueryService` 列表/详情映射显式下发 `prompt_modality`
  - `apps/admin/src/lib/admin-service.ts` 同步补齐返回类型
  - `apps/admin/src/app/(dashboard)/resources/page.tsx` 改为基于 `promptModality` 渲染 `图片提示词 / 视频提示词`
- 根因说明：
  - 之前 `/resources` 前端把 `previewUrl/sourceUrl` 误当成 prompt 类型判据
  - 这会把带有媒体资源的图片提示词误渲染成 `视频提示词`
  - 现在资源类型与后端筛选逻辑统一都以 `prompt_entries.modality` 为准
- 本轮验证：
  - `apps/admin -> npm.cmd run typecheck` 通过
  - `apps/admin -> npm.cmd run build` 通过
  - `apps/server -> AdminResourceApiIntegrationTest` 通过

### 2026-05-28 featured 活动分类保留，但帖子不再进入公共精选

- 状态：`verified-local`
- 影响范围：
  - 社区前台：`/featured`
  - 管理后台：`/admin/feed-ops/featured`
  - 后端：
    - `GET /api/feed/featured`
    - `GET /api/feed/featured-inventory`
    - `GET /api/admin/feed-ops/featured`
    - `GET /api/admin/feed-ops/featured/candidates`
    - `PUT /api/admin/feed-ops/featured`
- 当前真实口径：
  - `活动` tab 继续保留
  - 但 `post / 帖子` 不再属于公共精选资源池
  - `featured-all` 当前只允许 `prompt / workflow`
  - `featured-activity` 当前也只允许 `prompt / workflow`
  - 公共 `featured-inventory` 的 `activity` 过滤当前返回空库存，活动 tab 的真实展示改为完全消费后台 `featured-activity` 已发布配置
- 根因说明：
  - 历史上 `featured` 存在两层口径漂移：
    - 公共 inventory 会把 `discussion thread` 混进 `all / activity`
    - 后台 `featured-activity` 又允许挂 `post`
  - 这会导致：
    - 帖子进入精选公共页
    - 活动 tab 变成帖子池
    - 历史旧配置里的 `post` ref 即使不该再展示，也会继续影响前台
- 本轮共享收口：
  - `apps/server/src/main/java/com/dramatv/community/feed/application/FeaturedInventoryQueryService.java`
    - `filter=activity` 现在返回空库存页
    - `summary.counts.activity=0`
    - `all` 库存不再拉 `discussion thread`
    - `all` 库存新增图片/视频提示词混排逻辑，避免后续库存单边偏成图片提示词
  - `apps/server/src/main/java/com/dramatv/community/admin/feedops/AdminFeedOpsService.java`
    - `featured-all` 允许目标收口为 `prompt / workflow`
    - `featured-activity` 允许目标收口为 `prompt / workflow`
    - 历史已存的非法 `post` ref 在后台读取和公共 published 读取时都会被过滤
    - `PUT /api/admin/feed-ops/featured` 对 `featured-activity -> post` 现在会返回 `400 ADMIN_FEED_OPS_TARGET_UNSUPPORTED`
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - 继续保留 `活动` tab
    - `活动` tab 改为直接消费 `featured-activity` curated items
    - `activity` 计数改为用 curated items 长度兜底，不再依赖公共 inventory
- 验证状态：
  - 后端定向集成测试已通过：
    - `FeedReadApiIntegrationTest`
    - `AdminFeedOpsFeaturedApiIntegrationTest`
    - 结果：`17 passed / 0 failed`
  - 前端本地验证已通过：
    - `apps/web -> npm.cmd --prefix apps/web run typecheck`
    - `apps/web -> npm.cmd --prefix apps/web run build`
    - `node --test apps/web/src/lib/featured/featured-curation.test.mjs apps/web/src/lib/featured/featured-back-anchor.test.mjs`
      - 结果：`6 passed / 0 failed`
- 当前结论：
  - 前后台共享契约已重新明确：
    - `activity` 是精选页的一个运营 tab，不是帖子聚合页
    - 公共精选库存只面向 `prompt / workflow`
    - 帖子应继续留在讨论区体系，不再回流到精选公共页

### 2026-05-28 featured 帖子退出公共精选口径已同步测试云

- 状态：`verified-cloud`
- 云同步范围：
  - backend：`20260528-161045`
  - web：`20260528-161330`
- 云端验证结果：
  - 公网 `GET /api/feed/featured-inventory?filter=all&limit=3`
    - 当前 `summary.counts.activity=0`
  - 公网 `GET /api/feed/featured`
    - 当前 `featured-activity.items=[]`
  - `artifacts/runtime-readiness/test/web-deploy-20260528-161330-summary.json`
    - 结果：`13 passed / 0 failed`
  - `npm.cmd run readiness:test -- --creator-username creator-b --creator-password 123456`
    - 结果：`17 passed / 0 failed`
    - 已确认登录态 `auth.web.featured-inventory` 正常
- 同步过程补充说明：
  - backend 首次发布失败不是共享契约问题，而是本地 `18080` Java 进程锁住了 `apps/server/target` 的 jar
  - backend 第二次发布脚本尾部仍因为远端健康探活时序窗口报错，但公网接口复核和当前 active release 已确认新版本真实生效
- 当前结论：
  - 这条共享契约现在不再只是本地成立，而是已在测试云前后端联动态上生效：
    - `活动` tab 保留
    - 帖子退出公共精选库存
    - 帖子退出 `featured-activity` 运营位
### 2026-05-28 admin reports bypass rate limit
- 状态：`verified-local`
- 影响范围：
  - 前台：`POST /api/reports`
  - 后台：`/api/admin/reports`
- 新共享口径：
  - 普通用户举报仍保留频控
  - `admin / operator / moderator` 举报不限频
  - 同一举报人对同一目标若仍有 `pending / processing` 工单，继续返回 `REPORT_DUPLICATE`
- 根因：
  - 旧逻辑对举报统一按 `userId` 限流，默认 `60 秒 / 5 次`
  - 这会阻断管理员通过前台连续标记多条资源进行下架处理
- 共享代码改动：
  - `apps/server/src/main/java/com/dramatv/community/shared/security/ActionRateLimiter.java`
  - `apps/server/src/main/java/com/dramatv/community/publish/application/ReportApplicationService.java`
- 回归验证：
  - `ActionRateLimitIntegrationTest`
  - `ReportApiIntegrationTest`
  - `AdminReportApiIntegrationTest`
  - 结果：`14 passed / 0 failed`

### 2026-05-29 admin cloud media proxy internal-origin split已同步测试云

- 状态：`verified-cloud`
- 影响范围：
  - 后台：`/admin/__admin_proxy__/seedance-videos/*`
  - 后台：`/admin/__admin_proxy__/nano-banana-images/*`
  - 后台：`/admin/feed-ops/*` 等依赖服务端媒体代理的管理页面
  - 云端 admin env：
    - `DRAMATV_ADMIN_API_BASE_URL`
    - `DRAMATV_WEB_BASE_URL`
    - `NEXT_PUBLIC_DRAMATV_WEB_BASE_URL`
- 当前共享口径：
  - `DRAMATV_WEB_BASE_URL` 只用于 admin 服务端 rewrite / 代理目标，必须指向 ECS 内部上游，如 `http://127.0.0.1:3106`
  - `NEXT_PUBLIC_DRAMATV_WEB_BASE_URL` 继续保留浏览器可见的公网地址，如 `http://8.141.20.130`
  - admin 服务端媒体代理不得再自调公网 `8.141.20.130:80`
- 云同步结果：
  - admin release：`20260529-095822`
  - 远端 env 已确认：
    - `DRAMATV_ADMIN_API_BASE_URL=http://127.0.0.1:18080`
    - `DRAMATV_WEB_BASE_URL=http://127.0.0.1:3106`
    - `NEXT_PUBLIC_DRAMATV_WEB_BASE_URL=http://8.141.20.130`
- 云端验证：
  - `curl -I http://127.0.0.1:3206/admin/__admin_proxy__/nano-banana-images/000029-13311/01.jpg -> 200 OK`
  - `artifacts/runtime-readiness/test/admin-deploy-20260529-095822-public-summary.json`
    - 结果：`14 passed / 0 failed`
  - `artifacts/runtime-readiness/test/admin-deploy-20260529-095822-internal-summary.json`
    - 结果：`34 passed / 0 failed`
  - `journalctl -u dramatv-community-admin -n 30`
    - 本轮重启后未再出现新的 `connect ETIMEDOUT 8.141.20.130:80`
- 当前结论：
  - 这条共享链路已经从“本地收口”推进到“测试云已验证生效”
  - 后续只要 admin 新增同类服务端媒体代理，也必须继续遵守“内部上游 / 公网前缀分拆”的同一口径

### 2026-05-29 featured feed-ops 按最新/最热分配置已本地收口

- 状态：`verified-local`
- 影响范围：
  - 后台：`/admin/feed-ops/featured`
  - 前台：`/featured`、`/featured?sort=latest`
  - 后端：
    - `GET/PUT /api/admin/feed-ops/featured?sort=hot|latest`
    - `GET /api/feed/featured?sort=hot|latest`
- 当前真实口径：
  - `featured` 继续作为“最新”配置桶
  - 新增 `featured-hot` 作为“最热”配置桶
  - 后台精选运营页现在有显式 `最新 / 最热` 切换
  - 公共 `/featured` 默认 `sort=hot`，会消费 `featured-hot`
  - 公共 `/featured?sort=latest` 会消费原有 `featured`
- 本轮根因补记：
  - 这次不是 controller 或前端参数丢失，而是数据库 `admin_feed_slot_configs.page_key` 约束仍只允许旧值
  - `sort=hot` 首次保存时会因 `chk_admin_feed_slot_configs_page_key` 拒绝 `featured-hot`
  - 当前已通过 `V27__allow_featured_hot_admin_feed_slot_configs.sql` 把允许值扩到 `featured-hot`
- 当前代码状态：
  - `apps/server/src/main/java/com/dramatv/community/admin/feedops/AdminFeedOpsController.java`
  - `apps/server/src/main/java/com/dramatv/community/admin/feedops/AdminFeedOpsService.java`
  - `apps/server/src/main/java/com/dramatv/community/feed/controller/HomeFeedController.java`
  - `apps/server/src/main/java/com/dramatv/community/feed/application/HomeFeedQueryService.java`
  - `apps/server/src/main/java/com/dramatv/community/shared/persistence/CommunityCatalogJdbcQueryService.java`
  - `apps/admin/src/app/(dashboard)/feed-ops/featured/page.tsx`
  - `apps/admin/src/app/(dashboard)/feed-ops/featured/actions.ts`
  - `apps/admin/src/app/(dashboard)/feed-ops/shared/FeedOpsPageClient.tsx`
  - `apps/admin/src/lib/admin-service.ts`
  - `apps/web/src/app/(community)/featured/page.tsx`
  - `apps/web/src/lib/api/community-service.ts`
  - `apps/web/src/lib/api/community-public-cache.ts`
- 验证状态：
  - 后端定向集成测试：
    - `AdminFeedOpsFeaturedApiIntegrationTest`
    - `FeedReadApiIntegrationTest`
    - 结果：`19 passed / 0 failed`
  - 前端构建：
    - `apps/admin -> npm.cmd run build`
    - `apps/web -> npm.cmd run build`
- 当前结论：
  - 这条共享契约已经在本地前后台和公共读链路上闭环
  - 还没有同步测试云，云端当前仍只有“公共 `/featured` 默认最热”的旧一半能力，尚未带上后台分桶配置
### 2026-06-02 creator works API unified across server and web

- shared read contract changed for creator public works:
  - new endpoint: `GET /api/creators/{id}/works`
  - response shape: one mixed cursor page carrying both `video` and `prompt` items with a shared `itemType`
- shared frontend contract changed:
  - `CreatorPageView` now uses `works` + `nextWorksCursor`
  - creator load-more no longer depends on separate `nextVideoCursor` / `nextPromptCursor`
- compatibility note:
  - legacy `/api/creators/{id}/videos` and `/api/creators/{id}/prompts` still exist for now
  - the public creator page has already switched to the unified works feed
- verification:
  - `CreatorReadApiIntegrationTest`
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - `apps/web -> npm.cmd run build`

### 2026-06-02 local auth defaults hardened across community/admin/server

- shared runtime default changed:
  - `dramatv.community-auth.provider.local-password-enabled=false`
  - `dramatv.community-auth.provider.local-password-bootstrap-secret=` (empty by default)
- community login semantics changed:
  - `/api/auth/login` with `local_password` now returns `AUTH_LOGIN_TYPE_DISABLED` unless the environment explicitly enables the provider
  - auto-create local creator accounts and initialize blank local passwords no longer accept the hardcoded shared password path by default
- admin user governance semantics changed:
  - creating a local user with blank password now returns a generated temporary password (`DT` + 10 chars) instead of falling back to `dramatv-local-dev`
  - admin users page copy now matches the new generated-password behavior
- test contract note:
  - backend integration base `ApiIntegrationTestSupport` now explicitly opts into local-password auth for tests with `local-password-enabled=true` and `local-password-bootstrap-secret=dramatv-local-dev`
- verification:
  - `CommunityAuthDefaultsIntegrationTest`
  - `AdminUserGovernanceApiIntegrationTest`
  - `AuthMeApiIntegrationTest`
  - `apps/admin -> npm.cmd run build`

### 2026-06-02 creator pagination contract cleaned up across shared read surfaces

- shared creator read contract changed again after the unified works feed landed:
  - legacy creator list endpoints `/api/creators/{id}/videos|prompts|workflows|posts` no longer advertise an unimplemented public `sort` parameter
  - creator list `nextCursor` values are now opaque on fresh responses instead of leaking raw `offset:N`
- rollout compatibility note:
  - backend still accepts historical `offset:*` creator cursors so older callers do not break during transition
  - public creator page is already on `/api/creators/{id}/works`, so this slice mainly removes misleading legacy contract surface
- verification:
  - `CreatorReadApiIntegrationTest`

### 2026-06-09 shared deploy helper `Host` collision fix

- status: `verified-cloud`
- shared change:
  - `scripts/lib/test-env-release-common.ps1` no longer uses the PowerShell-reserved name `Host` for helper variables or parameters
  - renamed the absolute-url validator local variable from `$host` to `$publicHostName`
  - renamed `Test-IsIpLiteralHost` parameter from `Host` to `HostName`
- why this matters:
  - `deploy-test-web.ps1 -VerifyAfterDeploy` was blocked before the actual upload/build phase with `Cannot overwrite variable Host because it is read-only or constant`
  - the failure came from the shared helper, so the same collision risk applied to other deploy/rollback/readiness flows that dot-source `test-env-release-common.ps1`
- verification:
  - after the helper fix, `./scripts/deploy-test-web.ps1 -VerifyAfterDeploy` completed successfully
  - cloud web release `20260609-135718` went live and readiness passed `13 / 0`

### 2026-06-02 测试云公网入口 Host 隔离已收口到社区专属域名

- 状态：`verified-cloud`
- 共享口径：
  - 社区前台默认公网入口改为 `http://community.8.141.20.130.nip.io`
  - 管理后台默认公网入口改为 `http://community.8.141.20.130.nip.io/admin`
  - 社区 `web` 部署脚本不再允许 `server_name _`、通配 host、裸 IP 或 `localhost`
  - `web / admin / backend` 的 deploy、rollback、readiness、k6 与 smoke 默认测试入口统一跟随上述专属 host
- 根因：
  - 当前测试 ECS 已并存多个项目，共用同一个 `:80` 入口
  - 使用裸 IP 或 catch-all `server_name` 时，浏览器历史、验活和压测都可能命中错误项目
- 本轮云端修复：
  - 已确认云端 `/etc/nginx/conf.d/dramatv-community-http.conf` 仍是 `server_name _`
  - 同机同事项目 `dramaloom.conf` 是精确 Host，但因加载顺序实际承接了所有未命中的默认请求
  - 已只修改社区自己的 Nginx 配置，把 `server_name _` 改为 `server_name community.8.141.20.130.nip.io`
  - 修改前已备份：`/etc/nginx/conf.d/dramatv-community-http.conf.bak-20260602-hostfix`
  - `nginx -t` 通过并已 `systemctl reload nginx`
- 云端复验：
  - `http://community.8.141.20.130.nip.io` 返回 `DramaTV 社区`
  - `http://community.8.141.20.130.nip.io/admin` 返回 `DramaTV 社区后台`
  - `http://dramaloom.8.141.20.130.nip.io` 仍返回 `DramaLoom - AI剧本协作编辑器`
  - `http://novel-similarity.8.141.20.130.nip.io` 仍返回 `小说库相似度比对平台`
- 当前边界：
  - 本轮只修社区 Nginx Host 绑定，不修改同事 `dramaloom.conf` 和法务相似度项目配置
  - 裸 IP `http://8.141.20.130` 仍不作为社区业务入口
### 2026-06-09 featured public ratio metadata contract wired, admin semantics unchanged

- 状态: `local-verified`
- 影响范围:
  - 社区前台: `direct`
    - `/featured` 的分档布局现在会优先消费后端返回的 `width / height`
  - 管理后台: `reviewed-no-ui-change`
    - `/admin/feed-ops/featured` 当前槽位语义、首屏 `12` 条口径、候选池分页和 tab 定义都不变
    - 本轮没有要求后台预览区达到前台所见即所得，也没有改后台运营配置协议
  - 后端共享读口径: `direct`
    - `GET /api/feed/featured-inventory`
    - `GET /api/feed/featured`
    - `GET /api/feed/home`
    - 相关返回项已支持可选 `width / height`
- 共享契约收口:
  - `apps/server`
    - `HomeFeedResponse.FeedItemResponse`
    - `FeaturedInventoryResponse.Item`
    - `FeaturedInventoryQueryService`
    - `CommunityCatalogJdbcQueryService`
    - 已补 `width / height` 查询与映射
  - `apps/web`
    - `community-api.ts`
    - `community-service.ts`
    - `FeaturedArchivePage.tsx`
    - 前台布局已改成 backend-ratio-first，缺失时继续回退客户端自然尺寸测量
- 本轮额外确认的真实边界:
  - 当前本地真实库存里，很多历史资源的 `width / height` 仍为空
  - 这说明共享契约已经打通，但后台或共享数据层暂时还不需要为运营页新增预览 UI；当前首先缺的是历史媒体维度回填，而不是 admin feed-ops 语义重写
  - 如果后续要让后台精选运营页也看到接近前台的真实拼贴效果，再单独重开 admin preview 跟进，不在这轮直接扩散
- 验证:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
  - 浏览器复验 `http://127.0.0.1:3106/featured`
    - console error `0`
    - 首屏 `12` 条
    - `查看更多` 后 `24` 条
  - 浏览器抓取 `/api/public/featured-inventory?limit=12`
    - 已确认当前 live inventory 仍存在大量 `width / height = null`
