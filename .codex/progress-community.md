# 社区主线进度

## 当前快照

- 2026-04-29 起，社区主线详细进度统一记录在本文件；`.codex/progress.md` 只保留总索引、跨线状态和全局里程碑，避免社区与后台两条线继续互相污染。
- 当前社区主线固定为 `apps/web + apps/server` 社区全链路，并与后台管理线并行推进；进度隔离依赖的是独立账本，不是让另一条线停写。
- 2026-05-21 已完成首页资源分流第一轮：`home` 兜底头图补成三条可播视频，首页各分区改为按分区伪随机抽样 + 全局去重，避免同一批内容反复铺满首屏；浏览器复检已确认 `3107` 云镜像首页分区开始分流，`3106` 本地 dev 端口也已重新拉起。
- 已完成发布状态语义第二轮收口：`video/workflow/post` 的提交响应已从伪 `published` 改为真实 `submitted`，并补齐“已提交草稿不可继续 `update/delete/resubmit`”的后端保护，避免前端锁表单但 API 仍可覆写的共享层隐患。
- 前端草稿状态映射已同步补齐 `submitted -> 已提交`，定向验证已通过：`DraftApiIntegrationTest` 4 条、`PublishPipelineIntegrationTest` 6 条，共 10 条用例全部通过；`apps/web` `npx tsc --noEmit -p apps/web/tsconfig.json` 已通过。
- 已完成 `T3 发布状态模型剩余收口`：当前阶段统一按“发布后直接可见、自动审核仅预留未启用、人工审核放后台、举报联动后台预警”口径落地，前后端 submit 返回值、生命周期审核状态和个人中心草稿展示都已对齐。
- 当前任务板仍未清空：社区主线侧还剩 `T5 后台治理剩余落地` 与 `C4 评论通知/查询性能第二轮收口` 两组待办；其中“举报功能 + 与后台联动”现已明确拆进 `T5`，不再只做口头约定。
- 已启动一轮 `Phase 5 可观测性 / requestId / 日志` 基础硬化：共享后端现已把常见业务标识注入 MDC，并让应用日志与访问日志统一带上 `biz` 业务上下文字段，后续排障不再只剩 `requestId` 一维定位。
- 已继续推进 `Phase 5` 到关键写链路：`reports`、`publish submit`、`media retry / admin media task`、`publish callback`、`moderation` 五组真实写路径现已补齐结构化业务日志，并让异常日志也能复用同一份请求业务上下文，排查“提交失败 / 重复提交 / 回调落库异常 / 审核动作失败 / 举报冲突 / 媒体任务重试失败 / 后台治理动作失败”时不再只剩通用报错。
- 已完成评论性能优化第一轮收口：`C1` 评论动作后整页重拉、`C2` 根评论真分页、`C3` 共享 `CommentThread` 重渲染拆分均已落地；`C4` 仅在后续浏览器 trace 证明通知查询仍是主瓶颈时再继续下探。
- 已完成 `T2-3 OSS / CDN / Range` 当前阶段正式收口：公网测试环境已实测通过“后端写 OSS + `/media/**` 代理读私有桶 + `Range` 可用”链路，上传 smoke、分段读取 smoke、上传代理 Cookie 鉴权口径与 `HEAD` 元数据优化均已补齐。
- 结合 `一些可能需要优化的点.md` 与当前代码现状，社区后续优化待办已重排为五条大任务：`T1 分类体系后端化`、`T2 媒体链路稳定化`、`T3 发布状态模型剩余收口`、`T4 登录/会话/权限专项`、`T5 后台治理剩余落地`。
- 已完成 `T1 分类体系后端化`：提示词 taxonomy 已从前端猜测逻辑升级为后端字段、前端正式消费口径和导入/回填脚本统一口径，后续资源导入不再继续依赖 `tagNames + modelName + 推断规则` 的多套混用。
- 已完成详情页推荐语义分开：提示词详情页、工作流/视频详情页、帖子详情页已分别接入真实推荐数据，不再共用一套前端占位推荐。

## 当前看板

- 活跃中：社区主线后续统一按 `apps/web + apps/server` 推进，优先处理会影响前台真实行为和共享状态一致性的后端问题。
- 已完成：`submit -> submitted` 真实落地，已提交草稿禁止再次编辑/删除/重提，前后端状态文案已对齐。
- 已完成：`Feed / Discussion / Video / Workflow / Prompt / Creator / Me / Canvas` 读链路集成测试基线已补齐并跑通。
- 已完成：前台社区已形成真实后端依赖矩阵，后端开发规划已按前台主线重写，不再按“从零重搭”或“admin-first”口径推进。
- 已完成：`T1 分类体系后端化`
  - `T1-1` 已完成：提示词 taxonomy 正式字段入库与接口化
  - `T1-2` 已完成：精选页 / 发布页改为优先消费后端 taxonomy 字段
  - `T1-3` 已完成：历史 prompt 资源 taxonomy 回填与导入口径统一
- 已完成：`T2 媒体链路稳定化`
  - `T2-1` 已完成：处理中 / 失败态前台展示
  - `T2-2` 已完成：媒体任务查询与手动重试入口
  - `T2-3` 已完成：OSS / CDN / Range 当前阶段正式收口
- 已完成：`T4 登录 / 会话 / 权限专项`
  - `T4-1` 已完成：多浏览器 / 多账号隔离回归
  - `T4-2` 已完成：登录重定向 / 受保护路由 / 上传代理回归
  - `T4-3` 已完成：公司登录替换兼容性检查
- 已完成：`T3 发布状态模型剩余收口`
  - `T3-1` 已完成：content 可见性 / 审核 / 处理职责边界
  - `T3-2` 已完成：前台页面状态消费统一
  - `T3-3` 已完成：回归测试
- 待做：`T5 后台治理剩余落地`
  - `T5-1` 前台举报入口与举报提交流程 `已完成`
  - `T5-2` 举报与后台人工审核联动 `已完成`
  - `T5-3` 举报阈值预警 / 待处理池 / 状态流转 `已完成基础闭环，状态语义仍可继续细修`
  - `T5-4` 媒体任务治理入口 `已完成后台最小真实闭环`
  - `T5-5` Feed / 排序运营入口 `已完成后台最小真实闭环`
- `C1` 已完成：评论提交 / 评论点赞 / 删评论 / 开关评论区后，已不再整页重拉详情；现已改成只刷新评论区与必要的 `commentCount/replyCount`。
- `C2` 已完成：`/api/comments` 已补根评论分页；仅分页根评论，二级回复继续内嵌在根评论下，保持当前“两层楼中楼”产品策略。
- `C3` 已完成：共享 `CommentThread` 已拆为 memoized root/reply item，并隔离局部输入状态，避免回复输入拖动整棵评论树重渲染。
- `C4` 进行中：评论通知轮询与通知查询 SQL 做第二轮收口；当前已先把“通知定位到具体评论”的显式契约补齐，再视真实 trace 决定是否继续压查询/轮询成本。
- 进行中：`Phase 5 可观测性 / 错误码 / 日志硬化`
  - 已完成：`P5-1` 常见业务 ID (`videoId / workflowId / draftId / commentId / runtimeId / copyTaskId / reportId / taskId / assetId / targetType / targetId`) 注入 MDC
  - 已完成：`P5-2` `application.log / access.log` 统一补 `biz` 业务上下文输出
  - 进行中：`P5-3` 已完成 `reports`、`publish submit`、`media retry / admin media task`、`publish callback`、`moderation`、`interaction write paths`、`admin comments / users / feed ops` 八组真实写链路的结构化业务日志收口；下一步优先继续挑剩余高价值真实写链路，不再停在单点 service 修修补补

## 追加日志

### 2026-05-21 discussion composer editor enhancement

- 这轮没有临时替换成重型富文本库，而是按“交付前先稳住现有 markdown 发布链路”的原则，把 `/discussions/new` 的编辑器从基础 `textarea + 几个按钮` 升级成更接近正式编辑器的体验层。
- 已完成的编辑能力增强：
  - 顶部工具条改成分组式结构：标题层级、强调格式、列表/引用/代码、媒体上传、预览分区清晰，不再是一排松散按钮
  - 新增 `H1 / H2 / H3`、`斜体`、`行内代码`、`有序列表`、`分割线`
  - 新增编辑快捷键：`Ctrl/⌘ + B` 加粗、`Ctrl/⌘ + I` 斜体、`Ctrl/⌘ + K` 插入链接、`Tab / Shift+Tab` 缩进/反缩进
  - 新增右键菜单：复制、剪切、粘贴、全选、加粗、斜体、插入链接、转引用、转列表、代码块
  - 新增链接弹层：不再让用户手写整段 markdown 链接语法
  - 新增媒体交互增强：支持直接粘贴图片/视频文件、拖拽图片/视频到编辑区上传并插入正文
  - 新增编辑状态条：显示当前模式、字数、行数
- 本轮主要修改文件：
  - `apps/web/src/features/discussions/DiscussionComposerPage.tsx`
  - `apps/web/src/features/discussions/DiscussionComposerPage.module.css`
- 验证结果：
  - `apps/web -> npm.cmd run typecheck` 通过
  - 浏览器运行态复检 `http://127.0.0.1:3106/discussions/new` 已确认：
    - 新工具条正常渲染
    - `Ctrl/⌘ + B` 可插入加粗 markdown
    - `Ctrl/⌘ + K` 可正常拉起“插入链接”弹层
- 当前做到哪一步：
  - 讨论帖发帖页已经不再只是“能输入”的简陋 textarea，而是具备一套轻量但完整的 markdown 编辑器交互
- 下次先做什么：
  - 如果继续加强这一块，优先考虑两件事：
    - 给工具条补更直观的小图标，减少纯文字按钮的密度感
    - 评估是否需要继续补“撤销/重做、表格、任务列表、快捷插入图片说明卡片”这类增强，而不是直接重型替换编辑器

### 2026-05-21 discussion composer toolbar compressed into dropdown menus

- 在上一条“工具条能力增强”基础上，又做了一轮结构收口：把原本重新堆出来的一排格式按钮压回更像成熟编辑器的主工具栏形态，避免编辑区顶部再次被过多按钮占满。
- 当前工具栏已改成：
  - `文字` 下拉：`H1 / H2 / H3 / 加粗 / 斜体 / 行内代码 / 插入链接`
  - `结构` 下拉：`引用 / 列表 / 编号 / 代码块 / 分割线`
  - `插入` 下拉：`插入图片 / 插入视频`
  - `预览` 保持直达按钮
- 这样处理后的结果是：
  - 首屏按钮数量明显下降
  - 仍保留常用能力，不牺牲 markdown 发帖效率
  - 工具栏更贴近“少量一级入口 + 下拉面板”的编辑器标准，而不是一排全部摊平
- 本轮修改文件：
  - `apps/web/src/features/discussions/DiscussionComposerPage.tsx`
  - `apps/web/src/features/discussions/DiscussionComposerPage.module.css`
- 验证结果：
  - `apps/web -> npm.cmd run typecheck` 通过
  - 浏览器运行态复检 `http://127.0.0.1:3106/discussions/new` 已确认工具栏首屏收口成功
  - 实测点击 `文字` 菜单可正常展开下拉项

### 2026-05-19 c4 notification client churn reduction

- 这轮先回到社区主线 `C4 评论通知 / 查询性能第二轮收口`，没有直接去动后端通知 SQL，而是先把前台通知层已经确认存在的“无变化也重复更新 / 重复标记已读 / 重复写本地存储”噪音收掉，避免在真正做 trace 前继续把前端自身开销和后端查询开销混在一起看。
- 已完成的前台收口点：
  - `apps/web/src/components/shared/CommunitySessionProvider.tsx`
    - 新增通知快照签名，服务端 layout 透传和客户端轮询如果拿到的通知列表没变，不再继续 `setState`
    - `markNotificationsViewed()` 改为只在已读集合真实变化时才更新 state 和 `localStorage`
    - `hasUnreadNotifications` 判定改为基于 `Set`，避免继续走数组 `includes` 反复扫描
  - `apps/web/src/components/shared/NotificationBell.tsx`
    - 去掉“打开铃铛后 force refresh 再 mark 一次 + 通知列表变化再 mark 一次”的重复路径
    - 现改为基于通知签名做一次性已读标记；同一批通知在弹层打开期间不会重复落本地存储
- 这轮验证：
  - `npm.cmd run typecheck:web`
  - `npm.cmd run build:web`
- 当前做到哪一步：
  - `C4` 先完成了前台通知层的第一轮减噪
  - 现在如果后续还要继续压性能，下一步就应该优先看真实浏览器 trace 或后端通知查询，而不是再在前端做盲目微调
- 下次先做什么：
  - 先补一轮社区前台浏览器级复检，确认评论区 / 通知铃铛 / 页面切换没有因为这轮减噪带出交互回归
  - 如果浏览器 trace 仍显示通知链路是瓶颈，再继续下探 `apps/server` 的 `MeQueryService#loadRecentNotifications`

### 2026-05-19 c4 browser recheck after notification churn reduction

- 已按上一条的计划补完社区前台浏览器级复检，重点不再是“页面能打开”，而是验证这轮通知减噪没有把真实用户链路带坏。
- 本轮先发现了一个运行态问题，不是业务回归：
  - 本地 `3106` 初次打开 `/login` 时出现过两条 `_next/static/chunks/*.js -> 500`
  - 页面只剩 route loading 壳
  - 处理方式是直接重启本地前端 runtime，而不是误判成评论/通知功能回归
- runtime 恢复后，已用 `creator-a / dramatv-local-dev` 完成浏览器级复检：
  - 登录进入 `/home` 正常
  - 打开铃铛后，最近互动弹层正常展示 5 条通知
  - 通知里的用户头像跳转仍指向作者主页
  - 第一条“回复你的评论”通知能正确跳到提示词详情，并定位到对应评论锚点
  - 在该提示词详情页内联回复一条评论后，成功提示正常，回复即时出现在楼中楼列表
  - 随后删除这条临时回复成功，评论树恢复正常
- 本轮自动化复验也已补齐：
  - `npm.cmd run smoke:web` -> `7 passed / 0 failed`
  - `npm.cmd run notification-smoke` -> `4 passed / 0 failed`
- 当前做到哪一步：
  - `C4` 目前已经完成“前台减噪 + 浏览器复检 + 通知契约 smoke”
  - 当前没有抓到新的评论区 / 铃铛 / 页面切换交互回归
- 下次先做什么：
  - 如果继续走 `C4`，下一步应基于真实 trace 再决定是否下探后端通知查询
  - 如果不继续深挖性能，就可以把社区主线切回 `T5` 剩余的治理联动浏览器级验收

### 2026-05-19 t5 comments runtime governance verification

- 已把社区主线切回 `T5`，这轮优先做后台 `/comments` 的治理联动浏览器级验收，而不是继续停留在“已有自动化测试”层面。
- 这轮先用真实提示词详情页评论做了一次完整链路：
  - 前台 `creator-a` 在提示词详情页创建一条唯一测试评论
  - 后台 `/comments` 选中同一条评论执行 `hide`
  - 公共 `/api/comments` 与 `/api/prompts/{id}` 已立即反映为评论隐藏、讨论数回退
- 过程中抓到一个真实前台共享缺口，不是后端问题：
  - 后台 `hide` 后，公共评论接口已经正确过滤该评论
  - 但前台详情页组件把服务端 `view` 初始化进本地 `useState` 后，没有在外部 `view` 变化时同步回本地状态
  - 结果是同一路径重新进入时，页面可能继续保留旧评论树与旧计数，直到彻底离开该页面重挂载
- 这轮已做共享修复，覆盖所有同类页面，不做单页特判：
  - `apps/web/src/features/video-detail/VideoDetailPage.tsx`
  - `apps/web/src/features/workflow-detail/WorkflowDetailPage.tsx`
  - `apps/web/src/features/discussions/DiscussionDetailPage.tsx`
  - `apps/web/src/features/creator/CreatorPage.tsx`
  - `apps/web/src/features/me/PersonalCenterPage.tsx`
  - 修法统一为：外部 `view` 变化时同步回本地状态；个人中心同时补齐 `profileForm` 的外部数据同步
- 这轮验证：
  - `npm.cmd run build:web`
  - `npm.cmd run typecheck:web`
  - `npm.cmd run smoke:web` -> `7 passed / 0 failed`
  - 浏览器级复验：
    - 后台 `/comments` 再次对同一条评论执行 `hide`
    - 前台同一路径重新进入后，评论已消失，`讨论 10 -> 9`
    - 随后已清理这条临时测试评论，避免把测试噪音留在正式数据里
- 当前做到哪一步：
  - `/comments` 这条治理链路现在已经具备“后台动作 -> 公共读接口变化 -> 前台详情页重新进入后可观察变化”的完整证据
  - 这轮没有去做前台实时推送；当前口径仍是“已打开页面不会自动热更新，但重新进入同一路径会拿到最新治理结果”
- 下次先做什么：
  - 继续把 `T5` 扩到 `/reports` 与 `/moderation` 的页面级 runtime 联动验收
  - 如果再抓到类似“服务端 `view` 变了但客户端本地态没跟”的问题，优先按共享页面模式继续排查，不回到单页补丁

### 2026-05-19 t5 reports-to-moderation restore chain hardening

- 这轮继续沿着 `T5` 往下做 `/reports` 与 `/moderation` 的页面级 runtime 联动验收，没有停在“接口测试都绿了”的状态。
- 已拿真实提示词举报链路跑通一条页面级证据：
  - 前台提示词详情页 `/prompts/d0afa607-4336-54c6-855c-cba066452f02` 通过真实举报入口创建工单
  - 后台 `/reports` 已看到真实工单 `43ceb245-4d34-4bf5-bce7-5df6e24c7c7d`
  - 后台先执行 `processing`，再执行 `offline-target`
  - 页面上已看到工单状态 `待处理 -> 处理中 -> 已处理`
  - 目标摘要已看到 `视频提示词 · 状态 published -> taken_down`
- 这轮没有把问题误判成前台单页问题，而是顺着共享链路继续排查，抓到了一个更关键的后端治理缺口：
  - 某些导入类 prompt 原本没有 `audit_records.publish_review`
  - `/reports/offline-target` 虽然能把内容下线成 `taken_down`
  - 但它不会自动补审核记录，导致该内容进不了 `/moderation` 的恢复池，后台页面无法执行 `restore`
- 已完成共享层修复，不做前台绕过：
  - `apps/server/src/main/java/com/dramatv/community/admin/moderation/AdminModerationService.java`
    - `updateAuditRecord(...)` 从“只更新已有 publish_review”改成真正 upsert
    - 没有现成 `publish_review` 审核记录时，会自动补插一条
    - `taken_down / rejected` 默认风险级别补为 `high`，其余补为 `low`
  - `apps/server/src/test/java/com/dramatv/community/integration/AdminReportApiIntegrationTest.java`
    - 新增 `reportDrivenOfflineTargetBackfillsModerationQueueForPromptWithoutAuditRecord`
    - 已覆盖“举报下线 -> 自动补审核记录 -> `/moderation` 可见 -> `restore` 恢复 -> 公共 `/api/prompts/{id}` 重新可见”整条链路
- 这轮顺手还补了一层前台读链路稳固，避免被下线内容因为附属请求失败落成误导性的 `Backend Unavailable`：
  - `apps/web/src/app/(community)/prompts/[id]/page.tsx`
  - `apps/web/src/app/(community)/videos/[id]/page.tsx`
  - `apps/web/src/app/(community)/workflows/[id]/page.tsx`
  - `apps/web/src/app/(community)/creators/[id]/page.tsx`
  - 现在统一改成：先拉主对象，主对象不存在时立即 `notFound()`；只有主对象存在时才继续并行拉 related/comments
- 这轮验证：
  - `npm.cmd run typecheck:web`
  - `& '.\scripts\use-local-java17-maven.ps1' -f apps/server/pom.xml '-Dtest=AdminReportApiIntegrationTest,AdminModerationApiIntegrationTest' test`
- 当前做到哪一步：
  - `/reports -> offline-target -> /moderation -> restore -> 公共详情重新可见` 这条共享治理链路已经有真实页面动作证据和自动化保护
  - “无历史审核记录的导入内容无法恢复”这个共享缺口已被代码和测试一起补住
- 下次先做什么：
  - 把本地 `18080 / 3106 / 3206` 运行态都切到当前源码后，再补一轮浏览器级复验，确认当前 runtime 里 `/moderation` 已能看到这类 report-driven `taken_down` 内容并执行 `restore`
  - 如果浏览器里还出现 `Backend Unavailable`，优先排查运行态是否还是旧代码，而不是回滚这轮共享修复

### 2026-05-19 t5 reports-to-moderation runtime recheck after restart

- 已把本地运行态补齐到当前源码：
  - `18080` 后端已重启到新进程，`/actuator/health` 与 `artifacts/runtime-readiness/latest/backend-start-18080.json` 均为通过
  - `3106` 前端 dev runtime 也已重启；之前提示词详情页还在显示旧的 `Backend Unavailable`，重启后已切到新逻辑
- 这轮浏览器级复验结果：
  - 被举报下线的提示词 `d0afa607-4336-54c6-855c-cba066452f02` 在前台重新访问时，不再落旧的 `Backend Unavailable`，而是正常进入 `404 notFound` 语义
  - 后台 `/moderation?status=taken_down&targetType=prompt` 在第一次打开时仍为空，继续排查后确认不是新修复失效，而是这条工单是在修复前就被下线过
  - 旧数据的真实现象是：
    - 修复只保证“修复后再触发的 `offline-target`”会自动补审核记录
    - 修复前已经被下线的旧内容不会自动 retroactive 回填进恢复池
- 为了验证当前 runtime 的真实行为，这轮对同一条真实工单重新执行了一次 `offline-target`：
  - 工单：`43ceb245-4d34-4bf5-bce7-5df6e24c7c7d`
  - 目标：`prompt:d0afa607-4336-54c6-855c-cba066452f02`
  - 重新执行后，后台 `/moderation?status=taken_down&targetType=prompt` 已出现该项
  - 浏览器已看到：
    - `高风险内容 = 1`
    - `已下线内容 = 1`
    - 审核列表出现该提示词，状态为 `已下线`
  - 随后在后台详情侧执行 `恢复`
  - 执行后：
    - `/moderation` 列表恢复为空
    - 公共 `GET /api/prompts/d0afa607-4336-54c6-855c-cba066452f02` 恢复 `200 OK`
    - 前台提示词详情页重新可打开
- 当前做到哪一步：
  - 现在已经拿到“前台 404 语义正确 + report-driven offline 进入 moderation 池 + restore 后前台重新可见”的真实 runtime 证据
  - 同时确认了一个剩余事实：历史旧数据如果是在修复前被下线，不会自动补回恢复池，需要重放 `offline-target` 或做一次性回填
- 下次先做什么：
  - 如果要彻底清掉这个尾巴，下一步应补一个“历史 taken_down 且缺少 `publish_review` 的内容回填脚本 / 运维修复手册”
  - 后续继续扩其他 targetType 的页面级 runtime 验收时，优先验证是否也存在“旧动作前数据不自动回填”的同类历史残留

### 2026-05-19 historical taken-down moderation backfill tool

- 已按上一条待办补上一套真正可执行的历史数据修复工具，而不是继续靠“重放一次工单”做零散手修。
- 新增脚本：
  - `scripts/backfill-historical-moderation-audits.mjs`
  - 默认 dry-run 预览
  - `--apply` 才真正写库
  - 支持 `--target-type` + `--target-id` 做单条定向修复
- 根脚本入口也已补齐：
  - `npm run moderation:backfill:preview`
  - `npm run moderation:backfill:apply`
- 脚本当前覆盖范围：
  - `video / workflow / prompt / post`
  - 只处理当前 `publish_status = taken_down`
  - 且缺少 `audit_type = publish_review` 的历史内容
- 写入策略：
  - 补写 `audit_records.publish_review`

### 2026-05-19 historical moderation backfill remote dry-run verified

- 这轮没有继续做新的上云部署，而是利用已恢复的内网连通性，把“历史下线内容审核记录回填脚本”先按远端测试环境跑通一次 dry-run。
- 先修了一个真实脚本缺口：
  - `scripts/backfill-historical-moderation-audits.mjs`
  - `getLineValue(...)` 之前只兼容半角冒号和一份旧乱码冒号，拿当前 `.codex/测试环境资源清单.md` 这种正常 UTF-8 中文全角冒号格式会找不到数据库端口锚点
  - 现已统一兼容 `:` / `：` / 旧乱码冒号，避免同类云脚本读取资源清单时再踩同一类坑
- 已实际执行远端 dry-run：
  - `node .\\scripts\\backfill-historical-moderation-audits.mjs --target remote --resource-file .codex/测试环境资源清单.md`
- 结果：
  - 远端 SSH 隧道、容器内 `psql`、RDS 读取链路均已打通
  - 当前云测试库命中 `0` 条“`publish_status=taken_down` 且缺少 `publish_review`”历史脏数据
  - 因为 dry-run 结果为 `0`，这轮没有执行任何云端写库动作
- 当前做到哪一步：
  - 本地修复逻辑已完成
  - 云端远程预检查已完成
  - 当前这条治理尾巴在测试环境里没有待回填残留
- 下次先做什么：
  - 如果后续测试环境再次出现“历史下线内容进不了 `/moderation` 恢复池”的情况，先直接重跑该脚本 dry-run
  - 只有命中真实残留记录时，才再执行 `--apply`
  - `status_code = taken_down`
  - `risk_level = high`
  - `reason_code = historical_backfill`
  - `operator_type = system`
  - `detail_json` 补 `repairSource / repairReason / repairedAt / backfilledAuditCreatedAt`
  - `created_at` 复用内容自身时间 `coalesce(updated_at, published_at, created_at, now())`，避免把历史修复误算成“今天处理的审核数据”
- 已落说明文档：
  - `docs/04_实施设计/历史下线内容审核记录回填脚本-2026-05-19.md`
- 本地实跑结果：
  - 第一次 dry-run 命中 `1` 条真实历史残留
  - 类型：`workflow`
  - 目标：`0c81983d-a087-4791-b9b3-64746732e74f`
  - 标题：`都市穿行工作流`
  - 随后已执行 `--apply`
  - 再次 preview 已回到 `0` 条剩余
- 这轮复核：
  - `node .\\scripts\\backfill-historical-moderation-audits.mjs`
  - `node .\\scripts\\backfill-historical-moderation-audits.mjs --apply`
  - `npm.cmd run moderation:backfill:preview`
  - admin API 复核：
    - `/api/admin/moderation/items?status=taken_down&targetType=workflow&q=都市穿行`
    - 已确认该历史工作流进入 `/moderation` 恢复池
- 当前做到哪一步：
  - “修复前旧数据不会自动进恢复池”的尾巴，现在已有可重复执行的工具和说明
  - 本地库当前已清空这类已知残留
- 下次先做什么：
  - 如果测试库或云库也要清尾，直接复用这套 preview/apply 流程
  - 后续若把修复扩到 `rejected` 等其他历史状态，再单开任务，不在这轮脚本里继续扩范围

### 2026-05-19 historical moderation backfill tool remote-ready follow-up

- 已继续把这套回填工具从“只能修本地库”扩到“本地 / 远端测试库双模式”，避免后面每次要清历史数据时再临时改脚本。
- 当前脚本新增运行目标：
  - `--target local`
  - `--target remote`
  - 兼容旧别名 `--target cloud`
- 远端模式当前复用已有测试环境连库口径：
  - 默认自动识别 `.codex/测试环境资源清单.md`
  - 默认 SSH 隧道本地端口 `15432`
  - 默认 Docker 容器名 `dramatv-postgres`
  - 支持 `--resource-file`、`--local-port`、`--container`、`--skip-tunnel`
- 本轮验证：
  - `node .\\scripts\\backfill-historical-moderation-audits.mjs --target local`
  - 结果：本地当前 `0` 条剩余，说明双模式改造没有把原有本地能力带坏
- 文档已同步补远端用法：
  - `docs/04_实施设计/历史下线内容审核记录回填脚本-2026-05-19.md`
- 当前做到哪一步：
  - 这套脚本现在已经具备“本地先验证、测试库后执行”的稳定入口
  - 在当前网络条件下没有强行实跑远端 apply，避免因为环境不可达把这轮任务噪音化
- 下次先做什么：
  - 等测试环境网络可用时，先执行 `--target remote` preview
  - 若 preview 命中，再决定是否执行 `--target remote --apply`

### 2026-05-08 notification comment anchor contract hardened

- 已把“通知点击后跳到具体评论/回复”从前端隐式约定收口成前后端显式契约，不再继续依赖“通知 id 恰好等于 comment id”这一脆弱前提。
- 这轮收口点：
  - `apps/server/src/main/java/com/dramatv/community/me/dto/response/MeNotificationsResponse.java`
    - `NotificationItem` 新增显式 `commentId`
  - `apps/server/src/main/java/com/dramatv/community/me/application/MeQueryService.java`
    - `like / favorite` 通知统一返回 `commentId = null`
    - `comment / reply` 通知统一返回真实 `comment.id`
  - `apps/server/src/test/java/com/dramatv/community/integration/MeReadApiIntegrationTest.java`
    - 已补断言：
      - `comment / reply` 通知必须返回非空 `commentId`
      - `like` 通知必须保持 `commentId = null`
  - `apps/web/src/lib/contracts/community-api.ts`
  - `apps/web/src/lib/api/community-service.ts`
    - 前端通知契约与映射已同步支持可选 `commentId`
  - `apps/web/src/components/shared/NotificationBell.tsx`
    - 通知跳转锚点已改为优先使用 `commentId`，仅在旧数据缺字段时才回退到 `id`
- 这轮的目的不是继续加新通知类型，而是先把已经落地的“评论通知 -> 页面内精确定位”能力做稳，避免后续通知主键或聚合策略变化后把定位能力悄悄带坏。
- 已验证：
  - `apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - `apps/web -> npm.cmd --prefix apps/web run build`
  - `apps/server -> powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=MeReadApiIntegrationTest test`
- 本轮顺手继续收了一层通知轮询噪音，不再让社区 layout 挂载后立刻把 SSR 已拿到的通知列表又无条件拉一次：
  - `apps/web/src/components/shared/CommunitySessionProvider.tsx`
    - 去掉挂载即二次刷新
    - 对 `focus / visibilitychange / interval` 这类被动刷新增加 `10s` 冷却
  - `apps/web/src/components/shared/NotificationBell.tsx`
    - 用户主动点开铃铛时改为 `force refresh`，保证“手动看最新通知”不受冷却影响
- 这部分已复验：
  - `apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - `apps/web -> npm.cmd --prefix apps/web run build`
- 这轮后续浏览器复核又抓到一个真实问题，不是理论优化：
  - 铃铛打开后最初出现了 `/api/me/notifications/recent` 连续重复请求
  - 根因是 `NotificationBell` 的打开态 effect 依赖 `markNotificationsViewed`，而它之前跟随 `notificationsState` 变化重建，导致“强制刷新 -> 状态变更 -> effect 再跑 -> 再刷新”的循环
  - 现已继续收口：
    - `apps/web/src/components/shared/CommunitySessionProvider.tsx`
      - `markNotificationsViewed()` 改为通过 ref 读取最新通知，避免回调随通知数组重建
      - 刷新后同步写入 `notificationsStateRef`
    - `apps/web/src/components/shared/NotificationBell.tsx`
      - 打开铃铛后先 `force refresh`，随后标记已查看
      - 面板打开期间的新通知快照也会同步标记，但不再触发刷新循环
- 这轮还顺手把评论定位高亮从“只依赖 CSS :target”补成共享组件内的显式 hash 状态，避免动态渲染场景下滚到了对应楼层但高亮不稳定：
  - `apps/web/src/components/comments/CommentThread.tsx`
    - 新增 `targetCommentId` 状态与 `hashchange` 监听
    - 回复通知进入详情页时，若目标是二级回复，会自动展开所属根楼层
    - 目标根评论或目标回复都会挂显式 `thread-entry-highlighted`
  - `apps/web/src/app/globals.css`
    - 新增 `.thread-entry-highlighted` 样式，并与原有 `:target` 保持同一视觉
- 浏览器级复核结果：
  - 新开本地 `http://127.0.0.1:3106/home` 首屏时，不再出现社区 layout 挂载后的通知重复拉取
  - 点开铃铛后，请求来源已收敛为“1 次铃铛主动刷新 + 正常生命周期刷新”，未再出现之前的短时间请求风暴
  - 直接访问通知详情链接 `.../prompts/d0afa607-4336-54c6-855c-cba066452f02?from=%2Fhome#comment-60bb337f-d9c3-4cde-b6da-976e7f7684da` 时：
    - 目标评论节点存在
    - hash 正确保留
    - 目标评论已拿到 `thread-entry-highlighted`
    - 回复楼层已自动展开
- 当前做到哪一步：
  - 评论通知的“事件模型 -> 前端通知对象 -> 页面锚点定位”这条共享契约已经显式化
  - `C4` 当前已不是纯待评估状态，并已完成一轮真实浏览器驱动的前端通知刷新降噪与定位稳固
  - 当前剩余是否还要继续往下做通知 SQL / 轮询策略压测，应以真实 trace 为准，不再凭感觉继续微调
- 下次先做什么：
  - 若继续推进 `C4`，优先根据真实浏览器 trace 判断是否还需要收 `CommunitySessionProvider` 的 15s 轮询策略
  - 如果通知查询已不是主瓶颈，就把 `C4` 收口停在“契约稳固 + 可用性增强”，不为了做而做查询微优化

### 2026-05-08 notification regression smoke added

- 已给 `C4` 补一条可重复执行的本地通知回归脚本，不再只依赖浏览器手工复核：
  - 新增脚本：`scripts/run-local-notification-regression.mjs`
  - 根脚本入口：`npm run smoke:notifications`
  - 产物位置：`artifacts/notification-smoke/latest/summary.json`
- 当前覆盖的通知回归点：
  - 匿名访问前端代理 `/api/me/notifications/recent` 必须返回空列表
  - 登录态读取后端 `/api/me/notifications/recent` 时，通知数组结构必须完整
  - `comment / reply` 通知必须带显式 `commentId`
  - `like / favorite` 通知必须保持 `commentId = null`
  - 评论类通知的目标链接仍应保持 anchor-free，`#comment-{id}` 由前端拼接，不把两层职责混回后端
- 这轮脚本首跑先抓到一个真实运行态差异，不是脚本误报：
  - 第一次执行时 `auth.notifications-shape` 失败，报 `reply notification missing commentId`
  - 根因不是源码缺失，而是本地 `18080` 仍跑着旧进程
  - 重新执行 `scripts/start-server-dev-18080.ps1` 把后端切到当前源码后，脚本复跑已通过 `4 passed / 0 failed`
- 当前这条回归的价值：
  - 后续再遇到“代码看起来对，但通知响应和预期不一致”时，可以先跑 `smoke:notifications`
  - 这条 smoke 也顺手把“运行态还是旧版本”这种假故障暴露得更早，不用等用户手工点页面才发现

### 2026-05-08 browser smoke now covers notification UX

- 已把这轮 `C4` 的两个关键浏览器行为并入现有总浏览器 smoke，不再只靠一次性手工验收：
  - `scripts/run-local-community-browser-smoke.py`
    - 新增 `auth.notification-bell`
      - 校验铃铛面板可打开
      - 校验面板文案与互动内容存在
      - 校验打开面板后新增通知请求数 `requestDelta <= 2`
      - 当前本地实跑结果：`requestDelta=1`
    - 新增 `auth.notification-comment-anchor`
      - 从通知面板里找带 `#comment-...` 的评论类通知
      - 直接跳转到目标详情页
      - 校验对应评论节点存在且带 `thread-entry-highlighted`
- 这轮顺手把两个已过时的浏览器 smoke marker 同步到当前真实页面文案，避免总脚本继续因旧文案误报：
  - `/home` 期望从旧内容名改成当前稳定文案：`灵感迸发 / 进入无限画布`
  - `/discussions/new` 期望从旧英文标题改成当前真实文案：`发起一篇值得讨论的帖子 / Markdown / 发布帖子`
- 当前浏览器 smoke 复跑结果：
  - `python scripts/run-local-community-browser-smoke.py --output artifacts/browser-smoke/latest/summary.json`
  - `19 passed / 0 failed`
- 当前这一步的意义：
  - `C4` 现在已经同时具备
    - 后端集成测试
    - API 级通知 smoke
    - 浏览器级通知 UX smoke
  - 后续如果通知链路回归，先看这三层，不用再完全靠人工复现

### 2026-05-08 phase5 request logging business context hardened

- 本轮从“继续补后台页面”切回共享后端治理基础，优先落一条能直接提升排障效率的真能力，而不是只停在文档约束：
  - `apps/server/src/main/java/com/dramatv/community/shared/request/RequestBusinessContextInterceptor.java`
  - `apps/server/src/main/java/com/dramatv/community/shared/config/RequestBusinessContextConfig.java`
  - `apps/server/src/main/java/com/dramatv/community/shared/request/AccessLogFilter.java`
  - `apps/server/src/main/resources/logback-spring.xml`
- 当前新增能力：
  - MVC 拦截器会把常见业务标识统一注入 MDC：
    - `videoId`
    - `workflowId`
    - `promptId`
    - `postId`
    - `draftId`
    - `commentId`
    - `runtimeId`
    - `copyTaskId`
    - `reportId`
    - `taskId`
    - `assetId`
    - `managedUserId`
    - `creatorId`
    - `auditLogId`
    - `threadSlug`
    - `targetType / targetId`
  - 对使用通用 `{id}` 路由的接口补了按真实路由模式的语义映射，避免日志里只剩无法分辨的裸 `id`
  - 新增聚合 `biz` 字段，应用日志和访问日志现在都会统一输出类似：
    - `biz=workflowId=...,targetType=workflow,targetId=...`
    - `biz=draftId=...`
- 这轮同时补了一个真实运行态缺口：
  - 之前 `AccessLogFilter` 只记 `method / path / status / duration / remoteIp`
  - 但它运行在拦截器清理 MDC 之后，导致就算业务层短暂打进过上下文，访问日志也拿不到
  - 现在改成从 request attribute 恢复业务上下文后再写访问日志，`access.log` 也能保留同一批业务标识
- 本轮验证已通过：
  - `apps/server -> powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml '-Dtest=RequestBusinessContextInterceptorTest,AccessLogFilterTest' test`
  - `apps/server -> powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml '-Dtest=MeReadApiIntegrationTest,AdminAuditLogApiIntegrationTest' test`
- 当前做到哪一步：
  - `requestId + traceId + userId + biz` 这一层日志上下文已经贯通到共享日志与访问日志
  - 以后查“某条评论治理、某个举报工单、某个草稿提交流程、某个画布复制链路”的日志时，不用只靠 requestId 单点回溯
- 下次先做什么：
  - 挑一条关键写链路继续补结构化业务日志，优先考虑 `reports / moderation / publish submit / media retry`
  - 再继续收统一错误码和关键失败态文案，避免底层异常继续裸透到前端

### 2026-05-07 local community QA round using test-case-generation

- 已按当前正式主线 `apps/web + apps/server` 完成一轮“先自动化、再浏览器级复检”的本地社区测试，测试口径参考新内化的 `test-case-generation` skill。
- 本轮自动化执行结果：
  - `node scripts/check-local-runtime-readiness.mjs`：`12 passed / 0 failed`
  - `node scripts/run-local-community-api-smoke.mjs`：`19 passed / 0 failed`
  - `node scripts/run-local-auth-session-regression.mjs`：`12 passed / 0 failed`
- 自动化结果已落盘：
  - `artifacts/qa/2026-05-07-local-runtime-readiness.json`
  - `artifacts/qa/2026-05-07-local-community-api-smoke.json`
  - `artifacts/qa/2026-05-07-local-auth-session-regression.json`
- 浏览器级复检已确认通过的主链路包括：
  - 匿名态 `/` 仅可浏览，进入画布/发布会先跳 `/login`
  - `/login?redirectTo=%2Fcanvas` 登录后可正确进入画布占位页
  - 画布占位页可返回 `/home`
  - 首页资源卡进入提示词详情页后，`返回列表` 会按 `from + hash` 回到来源位置
  - 讨论区列表可进入帖子详情页，详情页主体结构正常
  - 本轮 Playwright 控制台错误数为 `0`
- 本轮发现的明确问题只有 1 项数据侧残留：
  - `/discussions` 左侧频道列表仍出现两个英文 `Integration Channel`
  - 判断更像测试频道未清理，不像代码功能故障
  - 后续应作为前台演示环境清理项处理
- 已新增正式测试报告：
  - `docs/04_实施设计/社区主线本地测试报告-2026-05-07.md`
- 当前做到哪一步：
  - 已完成一轮可复现的本地主线 QA，当前可判定“核心闭环可用”，但不等于公网和性能专项已经一起验完
- 下次先做什么：
  - 先清理讨论区测试频道残留
  - 再补浏览器级“真实发布帖子 / 图片提示词 / 视频提示词”完整写链路测试
  - 然后做一轮公网环境对照回归

### 2026-05-05 discussion detail page editorial polish

- 已把帖子详情页 `/discussions/[slug]` 从“组件堆叠页”重组为更接近长文阅读的版式，当前重点不再是把正文塞进一个厚卡片，而是形成 `左侧目录 / 中间正文 / 右侧信息列 / 下方评论` 的阅读路径。
- 本轮改动集中在前端：
  - `apps/web/src/features/discussions/DiscussionDetailPage.tsx`
  - `apps/web/src/features/discussions/DiscussionDetailPage.module.css`
  - `apps/web/src/features/discussions/discussion-markdown.tsx`
- 结构调整结果：
  - 英文/中文标题层级保留，但正文区改成更强的 editorial 排版，摘要前置，正文标题与正文分离。
  - 左侧新增基于 markdown 标题自动提取的目录，不依赖后端新字段；标题点击可跳到正文对应段落。
  - 右侧信息列改成更轻的作者 / 发布信息 / 关联内容 / 标签 / 讨论上下文，而不是大面积厚重卡片。
  - 交互按钮区继续保留真实点赞 / 收藏 / 举报，不动已有评论与治理链路。
- 细节收口：
  - 帖子详情页内举报弹窗文案已改成中文。
  - 运行态读取确认当前参考帖子 `weekly-creator-thread` 可正常打开并展示新结构。
  - 为避免后续再次误判编码问题，本轮确认“之前在 shell 中看到的乱码是 PowerShell 默认输出编码导致的读取显示问题，不是源文件文案损坏”。
- 验证：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过。
  - Playwright 登录本地 `3106` 后实测打开 `/discussions/weekly-creator-thread`，并保存截图 `artifacts/discussion-detail-post-refine-2026-05-05.png`。
- 当前做到哪一步：
  - 帖子详情页已经从偏“后台卡片拼装感”的结构收口到更偏“社区长文阅读页”的结构。
- 下次先做什么：
  - 继续对照参考图做第二轮视觉精修，重点看正文宽度、右栏密度、评论区首屏节奏，以及是否还要继续弱化线条分隔感。

### 2026-05-04 cloud prompt import batch8 continued

- 已先核实上一轮 `stage-batch7` 的真实状态：云端远程 `state.cloud-batch1.json` 中 `nano` 计数已是 `744`，末尾键已到 `nano:000833-12519`，说明之前“导入成功但本地快照没变”的问题不是云端未落库，而是本地当时看的还是旧快照。
- 已把本地快照重新对齐到云端状态后继续滚动导入，新的本地基线计数现为：
  - `awesome-gpt-image-2: 290`
  - `gpt-comic: 30`
  - `nano: 984`
  - `nano-comic: 32`
  - `seedance: 11`
  - total `1347`
- 已完成 `stage-batch8` 的云端导入，范围为 `nano-banana` 下一段 `240` 条，首尾键为：
  - first: `nano:000835-12532`
  - last: `nano:001081-12208`
- 这批导入继续统一使用固定作者 `community`，不改动用户手动导入的数据；云端核实结果显示 `nano:001081-12208` 已真实入库。
- 这轮还暴露出两个已确认的工具侧问题，后续继续批量导入时要直接避开：
  - `scripts/run-cloud-import-stage.mjs` 的自动链路仍有不透明失败点，当前更稳的路径仍然是“构 stage -> 手动上传/解压 -> 远端执行 import -> 回拉快照”。
  - `pscp` 在回拉较大的 `state.cloud-batch1.json` 时出现过一次客户端断言崩溃；这次已改用 `plink + cat` 的方式把远端状态文件写回本地快照，结果正常。
- 当前做到哪一步：
  - 云端社区初始数据的 `nano` 图像提示词已从 `744` 推进到 `984`
  - 本地 `state.cloud-batch1.snapshot.json` 已与云端重新对齐
- 下次先做什么：
  - 继续下一批 `nano` 或切到其余待导入研究目录
  - 仍保持固定作者 `community`
  - 先把所有资源导完，再统一考虑去重与更细标签补齐

### 2026-05-04 cloud prompt import batch9 continued

- 已串行完成 `stage-batch9` 的云端导入，继续沿用固定作者 `community` 和 `source_campaign + source_item_id` 去重规则，不改动用户手动导入数据。
- 这批导入范围仍为 `nano-banana` 下一段 `240` 条，首尾键为：
  - first: `nano:001082-12206`
  - last: `nano:001334-11891`
- 已确认 batch9 真正落库，不是“本地快照滞后”的假象：
  - 远端导入返回中已包含末尾键 `nano:001334-11891`
  - 本地 `state.cloud-batch1.snapshot.json` 已用 `plink + cat` 从远端状态文件重新回写
  - 回写后计数已更新为：
    - `awesome-gpt-image-2: 290`
    - `gpt-comic: 30`
    - `nano: 1224`
    - `nano-comic: 32`
    - `seedance: 11`
    - total `1587`
- 这轮顺手把批量云导入脚本补稳了一步：
  - `scripts/run-cloud-import-stage.mjs` 之前回拉远端大状态文件时依赖 `pscp`
  - 现已改为通过 `plink + cat` 读取远端 `state.cloud-batch1.json` 并本地写回快照，避开之前 `pscp` 断言崩溃的问题
- 当前做到哪一步：
  - 社区初始数据 `nano` 图像提示词已从 `984` 推进到 `1224`
  - 本地云快照与远端 batch9 后状态已重新对齐
- 下次先做什么：
  - 继续后续 `nano` 批次，优先把现有研究资源导完
  - 全量导入完成后再统一考虑重复清理与更细标签回补

### 2026-04-29 社区主线进度文档接管

- 本文件从今天开始接管社区主线的详细追加日志；历史混合记录继续保留在 `.codex/progress.md` 里做归档，不做整段搬迁，避免这一步再次把大文档写乱。
- 后续社区相关的功能开发、接口收口、测试结论、阻塞点和“下次先做什么”，统一只往本文件追加。

### 2026-04-29 publish-state semantics round 2

- 已按“社区主线独立记账、后台线独立记账”的口径重新对齐当前记录方式，避免 `.codex/progress.md` 后续继续把社区和后台两条线混成一个线性队列。
- 这轮不是继续做表面文案，而是把一类共享层状态冲突真正收口：
  - `video/workflow/post` 提交成功后的 `publishStatus` 由伪 `published` 改为真实 `submitted`
  - 已提交草稿现在会被后端统一拒绝再次 `update / delete / resubmit`
  - 前端草稿状态映射已补 `submitted -> 已提交`，避免发布页、草稿箱回填脏状态
- 这轮为什么要一起改：
  - 之前前端虽然已经用 `lifecycle.editable` 锁表单，但后端接口层仍允许继续覆写已提交草稿，属于同类漏洞
  - 如果只改 submit 返回值，不补接口层冲突保护，状态语义还是会继续散掉
- 本轮涉及的共享层文件：
  - `apps/server/src/main/java/com/dramatv/community/publish/persistence/PublishDraftPersistenceService.java`
  - `apps/server/src/main/java/com/dramatv/community/publish/application/VideoDraftApplicationService.java`
  - `apps/server/src/main/java/com/dramatv/community/publish/application/WorkflowDraftApplicationService.java`
  - `apps/server/src/main/java/com/dramatv/community/publish/application/PostDraftApplicationService.java`
  - `apps/web/src/lib/api/community-service.ts`
  - `apps/web/src/lib/mappers/community.ts`
- 新增与更新的验证：
  - `DraftApiIntegrationTest` 新增“已提交视频草稿不可再编辑/再提交”用例
  - `PublishPipelineIntegrationTest` 同步改为断言 `publishStatus=submitted`
  - 实跑 `DraftApiIntegrationTest,PublishPipelineIntegrationTest` 共 10 条用例全部通过
  - `npx tsc --noEmit -p apps/web/tsconfig.json` 通过
- 当前做到哪一步：
  - `draftStatus / moderationStatus / processingStatus / editable / submittedAt` 与 `submit` 返回值已不再互相打架
  - 但内容表 `publish_status='published'` 仍承担“当前前台可见”语义，这和严格审核后上架不是同一个模型
- 下次先做什么：
  - 继续分析是否要把内容层的 `publish_status` 从“前台可见”里再拆出更明确的 `visibility / moderation / processing` 语义
  - 仍以前台主链路不能被打回半可用为前提推进

### 2026-04-29 frontend preview-video unload recovery

- 已重新回到前台体感优化线，不再零散微调样式，而是优先收一类会导致“多次切换后越来越卡”的共享隐患。
- 这轮定位到的高概率根因不是 query-tab 自循环，而是列表卡片的悬浮预览视频一旦被加载，就会长期留在 DOM 中；用户连续扫过更多卡片后，页面上会堆积越来越多已经挂载过的 `<video>` 节点，导致后续筛选切换、详情往返和列表滚动越来越重。
- 已在共享 hook `apps/web/src/components/shared/useInteractiveVideoPreview.ts` 增加 `unloadDelayMs` 能力：
  - 预览开始时立即取消待回收计时器
  - 预览结束后先暂停视频
  - 在短延迟后把 `shouldLoadVideo` 重新置回 `false`
  - 这样卡片会卸载 `<video>` 节点，回到仅封面态，而不是永久保留已加载视频
- 已把这条共享回收策略接到当前几处高频列表/相关作品入口：
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
  - `apps/web/src/features/home/CommunityHomePage.tsx`
  - `apps/web/src/features/home/HomePage.tsx`
  - `apps/web/src/features/video-detail/VideoDetailPage.tsx`
- 当前策略使用 `unloadDelayMs: 1200`，目的是避免鼠标轻微抖动时视频反复挂载/卸载，同时在用户离开卡片后尽快释放列表里的预览视频节点。
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
- 当前做到哪一步：
  - 前台主列表和相关作品位已经不再把所有“扫过一次”的视频永久留在 DOM 中
  - 这属于共享层修复，覆盖首页、精选页和详情页右侧相关作品，不是单页补丁
- 下次先做什么：
  - 继续做浏览器级复验，重点看 `/featured` 高频切分类、进入详情再返回后的 mounted video 数量和网络请求是否明显下降
  - 如果仍有卡顿，再继续查筛选切换时的整树重渲染和图片/视频混排布局成本

### 2026-04-29 frontend preview unload browser verification

- 已对本地主链路 `http://127.0.0.1:3106/featured` 做浏览器级复检，重点验证“视频节点是否继续堆积”而不是只看代码逻辑。
- 复检结果：
  - 登录后进入 `/featured` 首屏基线：`videoCount = 0`
  - 连续切换 `工作流 / 视频提示词 / 图片提示词 / 全部` 共 20 次左右后：`videoCount = 0`
  - 连续 hover 前 8 张提示词卡片后，页面会短暂出现预览视频：`videoCount = 2, playingCount = 1`
  - 鼠标移出并等待约 `1.7s` 后：`videoCount = 0, playingCount = 0`
  - 连续进入首张详情再返回 3 次后：页面仍回到 `videoCount = 0`
- 这说明当前这轮共享层补丁已经收掉了“扫过越多卡片，页面里残留的 `<video>` 越多”这个根因。
- 但网络侧还有一个残余现象：hover 多张卡片后，`/seedance-videos/*.mp4` 仍会产生多条 `206 Partial Content` 请求；这已经不是节点残留问题，而是预览本身的媒体读取成本仍偏高。
- 当前做到哪一步：
  - DOM 级残留已明显收口
  - 详情往返后列表页不会继续留住已加载视频节点
  - 高频切分类后也未见 `<video>` 节点持续堆积
- 下次先做什么：
  - 继续压 hover 预览的媒体请求成本，优先看是否需要补更轻的 `preview/poster` 资产或进一步限制同屏预览并发
  - 再继续检查 `/featured` 筛选切换时的重渲染成本，而不是回头重复怀疑 query-tab 循环

### 2026-04-29 frontend hover-preview intent + single-group mutex

- 已继续沿共享层收口 hover 预览性能，不再做单页补丁式优化；这轮目标是压“随手扫过卡片时就把一排视频都启动请求”的成本，同时尽量不牺牲正常用户停留预览的体感。
- 共享 hook `apps/web/src/components/shared/useInteractiveVideoPreview.ts` 已新增两类能力：
  - `previewStartDelayMs`
    - 鼠标 hover 启动前先走极短意图延迟，本轮使用 `160ms`
    - 目的不是让用户感觉到迟滞，而是拦掉快速扫过卡片时那些本来就不该起的视频请求
  - `previewGroup`
    - 同一组卡片内只允许一个预览实例处于激活态
    - 新卡片开始预览时，会通过共享事件通知同组旧卡片立即停止并卸载，避免同屏多张卡片一起挂 `<video>`
- 键盘可访问性没有被牺牲：
  - hook 额外提供 `handlePreviewImmediateStart`
  - `onFocus` 仍是立即启动，不走延迟
  - 只有鼠标 hover 走 `160ms` 的轻量意图判断
- 当前已接入的高频页面分组如下：
  - `/featured` -> `featured-grid`
  - `/home` 社区首页推荐卡片 -> `community-home-grid`
  - `/` landing 档案卡片 -> `landing-home-grid`
  - 视频/提示词详情页右侧相关作品 -> `video-detail-related`
- 本轮验证结果：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - Playwright 本地复检 `http://127.0.0.1:3106/featured`
    - 快速鼠标扫过前 8 张卡片，移出并等待约 `1.8s` 后：`videoCount = 0, playingCount = 0`
    - 单张停留再切到下一张卡片时：始终只有 `1` 个预览视频在播，同组互斥生效；移出约 `1.5s` 后回落到 `videoCount = 0`
    - 连续切换 `工作流 / 视频提示词 / 图片提示词 / 全部` 约 20 次后：URL 稳定，`videoCount = 0`
  - Playwright 本地复检 `http://127.0.0.1:3106/home`
    - 首页原本就有 `hero` 轮播视频常驻 `2` 个 `<video>`，这次单独排除了它们
    - 下方档案卡片区快速 hover 6 张后，卡片区 `archiveVideos = 0`，说明这轮共享优化没有把首页卡片区留脏
  - 浏览器控制台本轮无新增 error
- 这轮之后的判断：
  - “预览视频节点越扫越堆积”这一类共享层隐患已经基本收住
  - 但网络层仍可见多条 `206 Partial Content`，说明剩余瓶颈已转向“预览视频资产本身偏重”，而不是前端节点残留
- 当前做到哪一步：
  - hover 误触发成本已明显下降
  - 同组卡片并发预览已收敛到单实例
  - 首页、精选页、详情页右侧相关作品位已统一接上共享策略
- 下次先做什么：
  - 不再继续微调这套 hook，而是转去看更长期有效的媒体策略
  - 优先评估为视频内容补更轻的 `poster / preview` 资产，降低每次 hover 的 `206` 读取成本

### 2026-04-29 hover preview keeps poster before video ready

- 已继续收一类共享层媒体体验问题：鼠标悬浮到视频卡片上时，如果 `<video>` 节点已经挂载但首帧还没 ready，原来会先露出一层空白/纯底色，封面短暂消失，体感像“闪白一下再开始播”。
- 这次没有按页面分别打补丁，而是继续收口到共享预览链路：
  - `apps/web/src/components/shared/useInteractiveVideoPreview.ts`
    - 新增 `isVideoReady`
    - 监听 `loadeddata / canplay / emptied`
    - 只有视频真正到可播放阶段，才把 ready 状态抬起来
  - 四个高频卡片位同步接入 ready 态显隐：
    - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - `apps/web/src/features/home/CommunityHomePage.tsx`
    - `apps/web/src/features/home/HomePage.tsx`
    - `apps/web/src/features/video-detail/VideoDetailPage.tsx`
  - 对应样式已改成：
    - 封面层始终保留在底层
    - 视频层默认 `opacity: 0`
    - 只有 `isVideoReady === true` 才加 ready class 淡入
- 这轮还顺手修掉了首页 landing 卡片里的一个潜在样式问题：
  - `apps/web/src/features/home/HomePage.tsx` 原来视频 className 写成了两个样式名直接拼接，没有空格
  - 现已改成明确的 `archiveCardMediaVideo` / `archiveCardMediaVideoReady`，避免视频层样式异常
- 本轮验证：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - Playwright 本地复检 `http://127.0.0.1:3106/featured`
    - hover 首张卡片约 `190ms` 后，`video.readyState = 1` 时 `videoOpacity = 0`
    - 同时封面层仍在，说明视频未 ready 前不会盖掉封面
    - 约 `900ms` 后 `video.readyState = 4`，`videoOpacity = 1`，视频再正常淡入
    - 鼠标移出并等待后，`videoCount = 0`，说明这次修复没有带坏前一轮的卸载回收逻辑
- 当前做到哪一步：
  - “视频未加载好就先露底色/空白”的问题已从共享层收住
  - 首页、精选页、详情页右侧相关作品位都统一继承了这套行为
- 下次先做什么：
  - 继续观察列表 hover 的真实网络读取成本
  - 但这类“未 ready 先露白底”的问题后续不用再单页重修，当前共享层已经兜住

### 2026-04-30 comment reply collapse-expand

- 已开始收口评论区共享交互，不再让楼中楼只停留在“两层可见”，而是继续补齐真实社区常见的“回复折叠 / 展开”行为。
- 这轮范围固定在共享评论组件 `apps/web/src/components/comments/CommentThread.tsx`，目标是一次覆盖视频详情、提示词详情、工作流详情、帖子详情等所有复用评论区的页面，不做单页特判。
- 当前设计口径：
  - 根评论继续展示 `x 条回复`
  - 有回复时新增 `展开 x 条回复 / 收起回复`
  - 回复输入框打开时自动展开所属根楼层
  - 收起某个根楼层时，如果当前正在回复这一层里的任意评论，会同步关闭回复输入框，避免出现“输入框还挂着但回复区已经收起”的状态错位
  - 回复提交成功后，所属根楼层保持展开，避免用户发完后看不到刚发出的内容
- 同步把一条后续需求正式落账到社区待做：
  - `评论通知联动`：评论新增/回复后，需要和现有铃铛通知聚合链路联动，补齐“谁回复了我 / 谁在我的内容下继续讨论”的通知事件，不只停留在当前已有的点赞、收藏、评论主事件汇总
- 当前做到哪一步：
  - 交互方案已落到共享组件，下一步直接做类型校验与页面回归
- 下次先做什么：
  - 跑 `apps/web` 类型检查
  - 然后做评论区页面级冒烟，确认折叠/展开和两层楼中楼没有互相打架

### 2026-04-30 comment reply collapse-expand browser smoke

- 已完成这轮共享评论区的页面级冒烟，不再只停留在类型检查。
- 实测页面覆盖：

### 2026-05-03 T4 auth/session regression scripted closeout

- 已把 `T4` 从“手点验证为主”推进到“本地可重复回归”为主，新增脚本 `scripts/run-local-auth-session-regression.mjs`，覆盖以下共享链路：
  - 匿名访问 `/me`、`/publish`、`/discussions/new` 必须跳转到 `/login?redirectTo=...`
  - 匿名访问 `/api/me/notifications/recent` 必须按空列表软降级，不再误报 `500`
  - 匿名访问 `/api/uploads/image-policy` 必须返回 `401/403` 与真实 `X-Request-Id`
  - 两个本地账号 `qa-auth-alpha / qa-auth-beta` 的后端 token 身份与前端 `/me` 页面必须隔离
  - 有效 cookie 可以通过 `/me`、`/publish`、`/discussions/new`、通知代理、上传代理
  - 无效 cookie 与已 logout 的旧 cookie 必须被 `proxy.ts` 识别为失效会话，并重定向到登录页且清 cookie
- 这轮不是只补脚本，也同步收了两个共享层根因：
  - `apps/web/src/proxy.ts` 之前只读取 `DRAMATV_API_BASE_URL`，运行态若只注入 `NEXT_PUBLIC_DRAMATV_API_BASE_URL`，会直接跳过后端会话校验；现已与 `community-service.ts` 对齐为双变量兜底
  - `apps/web/src/lib/api/community-service.ts` 之前对鉴权失败的识别过度依赖 `instanceof`，在代理路由 / 不同打包边界下不够稳；现已收口为“`instanceof` + `error.name + path`”双通道识别，确保 `FORBIDDEN / AUTH_REQUIRED` 能稳定落到未登录语义
- 已把新回归脚本接入统一本地稳定性入口：
  - `package.json` 新增 `npm run smoke:auth-session`
  - `scripts/run-local-stability-suite.ps1` 新增 `smoke.auth-session` 步骤和 `-SkipAuthSessionSmoke`
- 本地实跑结果：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - `node scripts/run-local-auth-session-regression.mjs --frontend-base-url http://127.0.0.1:3106 --backend-base-url http://127.0.0.1:18080 --output artifacts/auth-session-smoke/latest/summary.json` 通过，`12/12`
  - `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/run-local-stability-suite.ps1 -SkipFrontendBuild -SkipBrowserSmoke -SkipBackendIntegration -SkipApiSmoke` 通过，`4/4`
- 产物位置：
  - `artifacts/auth-session-smoke/latest/summary.json`
  - `artifacts/stability-suite/latest/summary.json`
- 当前做到哪一步：
  - `T4-1` 本地多账号隔离已从“人工现象判断”升级为稳定脚本校验
  - `T4-2` 登录重定向 / 受保护路由 / 通知代理 / 上传代理 已完成本地共享层收口
- 下次先做什么：
  - 继续做 `T4-3`，把当前本地密码登录态替换点、cookie 名、用户会话解析口径整理成“接公司登录时只换 provider，不重写页面守卫”的兼容清单
  - 视频详情：`/videos/3d82413b-1036-4c1b-93dd-3a102e0b4683`

### 2026-04-30 T2-3 oss-cdn-range first close-out

- 已重新核对 `T2-3 OSS / CDN / Range` 的真实现状，确认当前社区后端并不是“还没 OSS 基础”，而是已经具备三块核心能力：
  - 上传服务支持 `storage-provider=oss` 时由后端直接写 OSS
  - `/media/**` 媒体代理支持从 `media_assets` 解析到 OSS 或本地文件
  - 代理层已经支持 `GET / HEAD / Range`
- 这轮没有再平行新造一条链路，而是把现有实现往“可作为当前正式方案使用”收口：
  - 明确当前测试环境只有私有桶和 `oss-cn-beijing-internal` 内网端点、还没有 CDN，因此浏览器端的正式链路应是 `Browser -> 社区后端 /media/** -> OSS 内网端点`
  - 更新了 [媒体上传与 OSS 预备方案.md](/E:/点众/DramaTV社区搭建/docs/03_架构/媒体上传与 OSS 预备方案.md)，把“无 CDN 时后端代理展示才是正式口径”写死，避免后面再按“浏览器应直连 OSS”误判
- 顺手收了一处真实的媒体代理开销问题：
  - `MediaProxyService` 在 OSS 模式下处理 `HEAD /media/**` 时，原先会先构造 `GetObjectRequest` 并走一次对象读取分支，再提前返回
  - 现在已改为：先用 metadata 计算响应头，`HEAD` 直接返回，不再触发 OSS 对象流下载
  - 这条优化对私有桶代理模式有实际意义，因为播放器和探测脚本经常会先发 `HEAD`
- 新增单测：
  - `apps/server/src/test/java/com/dramatv/community/shared/media/MediaProxyServiceTest.java`
  - 覆盖“OSS 模式下 `HEAD` 只读 metadata、不拉对象内容”这一行为
- 当前做到哪一步：
  - `T2-3` 的方案口径已经收敛清楚：现在先走“后端写 OSS + 后端代理读 + Range 保持可用”，`CDN` 留到后续资源到位再切
  - 代码层已经开始按这个方案做细节止损，而不是继续把 `CDN` 和 `OSS` 混成一个必须同时完成的大任务
- 下次先做什么：
  - 跑后端相关测试，确认这轮 `MediaProxyService` 的 `HEAD` 行为修正无回归
  - 然后继续补 `T2-3` 的第二部分验证：把“OSS 上传 smoke + Range smoke”整理成稳定的测试/验收口径

### 2026-04-30 T2-3 oss-cdn-range final close-out

- 已补完 `T2-3` 的第二部分验收，当前阶段可以正式按“已收口”处理，而不是继续挂在半完成状态：
  - 公网 `OSS 上传 smoke` 已通过，验证入口为 `http://8.141.20.130`
  - 公网 `Range smoke` 已通过，验证 `HEAD 200 + GET Range 206 + Content-Range` 正常
  - 产物已落到 `artifacts/oss-smoke-upload.json` 与 `artifacts/oss-smoke-range.json`
- 这轮额外确认了一条真实的公网代理约束：
  - `/api/uploads/**` 在公网入口下不是直达 Spring Boot，而是先经过 Next 上传代理
  - 当前上传代理依赖 `dramatv_access_token` Cookie 透传登录态，不能只带 Bearer Header
  - 因此后续所有公网上传 smoke 和自动化脚本都必须兼容 `Authorization + Cookie` 双携带口径，否则会把代理鉴权误报成后端上传失败
- 这轮顺手把一个会影响公网响应头一致性的部署细节也收了：
  - `scripts/deploy-test-web.ps1` 已去掉额外注入的 `Accept-Ranges`
  - 原因是后端 `/media/**` 已经自己返回该头，前端 Nginx 再补会出现 `accept-ranges: bytes, bytes`
- 这轮收口后，`T2-3` 的当前阶段定义已经固定：
  - 写链路：`Spring Boot -> OSS`
  - 读链路：`Browser -> 社区 /media/** -> OSS internal endpoint`
  - 播放链路：继续依赖社区代理提供 `HEAD / GET / Range`
  - `CDN` 不是当前阻塞项，后续资源到位后再单独切换
- 当前做到哪一步：
  - 代码、文档、smoke 脚本、部署模板四处口径已对齐
  - 可以把“无 CDN 时私有桶媒体如何对外提供”视为当前测试环境的正式答案
- 下次先做什么：
  - 回到 `T2-1`，继续收口媒体处理中 / 失败态在前台的展示一致性
  - `CDN` 与前端预签名直传留到运维资源进一步到位后再开新任务

### 2026-04-30 media lifecycle visibility T2-1 phase 2

- 已继续推进 `T2-1`，本轮不再只盯发布页，而是补上“创作者离开发布页后又看不到媒体状态”的断点。
- 现状确认：
  - `/me` 草稿区之前只展示 `statusCode / currentStep`
  - 已提交的视频/工作流草稿虽然还能通过 `draftId` 回到发布页，但个人中心没有把 `processingStatus / processingMessage` 露出来
  - 结果就是创作者一离开发布页，`排队中 / 处理中 / 失败原因` 又重新变成黑盒
- 本轮改动：
  - `apps/server/src/main/java/com/dramatv/community/me/application/MeQueryService.java`
    - `/api/me/hub` 的草稿项现已带出 `DraftLifecycleResponse`
    - 直接复用 `PublishDraftLifecycleQueryService.resolve(...)`，不再在个人中心单独猜状态
    - 工作流草稿回链已补 `workflowDraftId`
  - `apps/server/src/main/java/com/dramatv/community/me/dto/response/MeHubResponse.java`
    - `DraftItem` 新增 `lifecycle`
  - `apps/web/src/lib/contracts/community-api.ts`
  - `apps/web/src/lib/contracts/view-models.ts`
  - `apps/web/src/lib/mappers/community.ts`
    - 前端草稿视图已正式消费 lifecycle，并把 `processingStatus / processingMessage` 映射为个人中心可读字段
  - `apps/web/src/features/me/PersonalCenterPage.tsx`
  - `apps/web/src/features/me/PersonalCenterPage.module.css`
    - 草稿卡现会显示媒体处理状态与失败文案摘要
  - `apps/web/src/app/(community)/publish/page.tsx`
    - 发布页现已同时支持 `draftId` 与 `workflowDraftId` 回填
- 这轮收口后的状态：
  - 发布页之外，创作者在 `/me` 也能看到媒体处理中 / 失败态
  - 状态语义仍只有一套，以 publish lifecycle 为准，没有再复制第二套 me 专用规则
- 下次先做什么：
  - 跑前后端定向验证，确认 `/api/me/hub` 与个人中心类型消费无回归
  - 若验证通过，再判断是否需要把同一状态继续补到“作品区卡片”或作者主页

### 2026-04-30 media lifecycle visibility T2-1 phase 3

- 已继续把 `T2-1` 从“发布页状态可见”推进到“个人中心创作记录可见”。
- 这轮的核心判断：
  - `/me` 原先的“草稿箱”只收 `draft` 状态，已提交但仍在审核 / 处理中 / 失败的内容会直接从这里消失
  - 这会让创作者离开发布页后，再次失去对处理状态的可见性，尤其是 `prompt / video / workflow` 三类内容
- 本轮改动：
  - `apps/server/src/main/java/com/dramatv/community/me/application/MeQueryService.java`
    - 草稿查询已从 `status_code='draft'` 扩成 `status_code in ('draft','submitted')`
    - 因此 `/api/me/hub` 现在返回的是“创作记录”，不仅是未提交草稿
  - `apps/web/src/features/me/PersonalCenterPage.tsx`
    - 已提交且仍有 `continueHref` 的记录现在可以点回发布页 / 工作流发布页查看状态
    - 已提交记录的操作文案从“继续编辑”区分为“查看状态”
    - 已提交记录不再展示“删除草稿”按钮，避免给出错误操作预期
    - 空状态文案已从“草稿箱为空”改为“创作记录为空”
- 这轮收口后的状态：
  - 个人中心已经能覆盖“未提交草稿 + 已提交处理中记录”两类创作者自助视角
  - 发布页与个人中心之间的状态可见性不再断层
- 下次先做什么：
  - 跑一轮前后端定向验证，确认 `submitted` 记录进入 `/me` 后交互和文案无回归
  - 再决定是否还有必要把同类状态继续外露到作品卡片或作者主页

### 2026-04-30 media task query-retry kickoff

- 已正式启动 `T2-2 媒体任务查询与后台重试入口`，这轮范围固定在社区发布链路本身，不扩成后台系统。
- 本轮目标拆成三步：
  - 后端补 `GET /api/media-tasks/{id}` 与 `POST /api/media-tasks/{id}/retry`
  - 发布页失败态展示最新媒体任务状态，并提供手动重试入口
  - 补齐集成测试与前端类型校验，完成后回写本账本
- 这轮同时会把“刷新发布页后仍能看到最新媒体任务状态”一起收口，避免只靠 submit 当次返回的 `taskIds[0]` 临时兜底。

### 2026-04-30 media task query-retry T2-2 done

- 已完成 `T2-2 媒体任务查询与手动重试入口`，当前这条能力先服务社区发布页，不提前做成后台治理大面板。
- 后端已新增：
  - `GET /api/media-tasks/{id}`
  - `POST /api/media-tasks/{id}/retry`
- 当前约束已经收口到真实作者权限：
  - 只有当前登录作者可以查看自己名下的媒体任务
  - 只有 `video_media_process` 且状态为 `failed`、并且 `retry_count < max_retry_count` 的任务允许重试
  - 重试会复用原 `async_task_records` 记录，把任务重新置回 `queued`，同时清掉旧错误和完成时间，不新造第二套队列语义
- 发布页已同步补齐失败态可见性：
  - 生命周期里新增 `mediaTask` 摘要
  - 刷新发布页后，仍能看到最新媒体任务状态、错误信息、重试次数
  - 发布页状态卡已新增“刷新状态 / 重试处理”按钮
- 这轮涉及的主文件：
  - `apps/server/src/main/java/com/dramatv/community/publish/application/MediaTaskApplicationService.java`
  - `apps/server/src/main/java/com/dramatv/community/publish/controller/MediaTaskController.java`
  - `apps/server/src/main/java/com/dramatv/community/publish/application/PublishDraftLifecycleQueryService.java`
  - `apps/web/src/features/publish/PublishPage.tsx`
  - `apps/web/src/features/publish/actions.ts`
  - `apps/web/src/lib/api/community-service.ts`
- 本轮验证结果：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - `PublishPipelineIntegrationTest` 通过
  - 新增回归覆盖：
    - 失败任务详情可读
    - 失败任务可重试并回到 `queued`
    - 草稿生命周期可带出最新媒体任务摘要
- 当前做到哪一步：
  - 发布链路里的“媒体失败原因 + 当前任务状态 + 手动重试”已经不再是黑盒
  - 但这仍属于创作者自助入口，不等于后台治理视角的任务总览
- 下次先做什么：
  - 继续推进 `T2-3 OSS / CDN / Range` 正式收口
  - 后续若进入后台治理线，再复用这一套任务接口语义做管理员视角的任务面板
  - 帖子详情：`/discussions/weekly-creator-thread`
  - 提示词详情：`/prompts/d38c33fd-7926-53af-961a-e12eb47e5846`
  - 工作流详情：`/workflows/dd715ee9-189b-4450-a4ca-fdf71fb8aafb`
- 实测结论：
  - 视频详情页已确认 `展开 1 条回复 -> 收起回复 -> 回复二级评论 -> 收起时关闭回复框` 全链路生效。
  - 提示词详情页已确认共享评论区已挂上新的 `展开 1 条回复` 入口，说明这次不是只修视频页。
  - 帖子详情页与工作流详情页当前测试数据都只有单层评论，没有子回复，因此不会显示 `展开 x 条回复`，这是当前数据现状，不是挂载缺失。
  - 四类页面当前都仍复用同一个 `CommentThread` 共享组件，没有出现单页分叉。
- 这轮同时确认的产品语义：
  - 只有根评论存在子回复时，才显示折叠/展开按钮
  - 单层评论不强行显示空折叠控件，避免界面噪音
- 已验证：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - 本地浏览器手动交互路径通过
- 当前做到哪一步：
  - 评论区“两层楼中楼 + 回复目标 + 折叠展开”这条共享交互已经从代码和浏览器两层都跑通
- 下次先做什么：
  - 如果继续沿评论能力补强，下一步优先转到 `评论通知联动`
  - 然后再评估是否要补“默认展开还是默认折叠”的产品策略微调，而不是继续改结构

### 2026-04-30 comment notification linkage

- 已把评论能力继续从“评论区内可见”推进到“铃铛通知可感知”，这轮不做前端假文案，而是把后端通知语义先拆清。
- 当前通知口径固定为两类：
  - `comment`：别人评论了我发布的内容
  - `reply`：别人回复了我本人写过的评论
- 这次明确排除了一个容易混淆的错误口径：
  - 如果我是内容作者，但对方回复的是另一个用户的评论，我不应该收到 `reply`
  - 我只保留“内容被评论”的 `comment` 事件
- 共享层改动：
  - `apps/server/src/main/java/com/dramatv/community/me/application/MeQueryService.java`
    - `loadCommentNotifications(...)` 已按上面两条语义分开查询
    - `reply` 事件当前不再额外拼“回复了你和 xxx 的讨论”这类混合语义字段
  - `apps/server/src/test/java/com/dramatv/community/integration/MeReadApiIntegrationTest.java`
    - 已拆成两段真实场景验证：
      - 内容作者读取 `/api/me/notifications/recent`，只收到 `comment`
      - 被回复评论的作者读取 `/api/me/notifications/recent`，收到 `reply`
  - `apps/web/src/components/shared/NotificationBell.tsx`
    - `reply` 文案统一收敛为 `回复了你的评论`
  - `apps/web/src/lib/api/community-service.ts`
    - `replyToActorName` 已统一归一为空值安全的可选字段，避免前端继续把 JSON `null` 当成字符串差异处理
- 已验证：
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -Dtest=MeReadApiIntegrationTest test` 通过
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -Dtest=CommentApiIntegrationTest test` 通过
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
- 重启恢复：
  - 本地 Docker 依赖已确认恢复：`dramatv-postgres`、`dramatv-redis` 正常运行
  - 本地链路已恢复可访问：
    - 后端健康检查 `http://127.0.0.1:18080/actuator/health` 返回 `{"status":"UP"}`
    - 前端 `http://127.0.0.1:3106/` 返回 `200`
    - 云镜像前端 `http://localhost:3107/` 返回 `200`
- 当前做到哪一步：
  - 评论区“二层结构 + 折叠展开 + 通知回流”这条线已经开始贯通
  - 这次先打通了 reply/comment 事件模型，还没继续做评论通知和页面内评论定位跳转
- 下次先做什么：
  - 继续做评论通知增强时，优先补“通知点击后定位到对应评论/楼层”
  - 然后再做用户提过的“评论通知联动记录汇总/更多场景覆盖”，例如删除评论、关闭评论区后的通知与展示收口

### 2026-04-30 comment performance optimization backlog

- 已先完成评论性能瓶颈归因，不急着做数据库微优化，先按收益顺序收口共享链路。
- 当前确认的优先级如下：
  - `C1` 评论动作后的整页重拉过重，是第一优先级；视频详情、提示词详情、工作流详情、帖子详情都属于同类问题。
  - `C2` `/api/comments` 目前仍是全量返回，后端没有真分页；数据量继续上涨后会放大列表与组树成本。
  - `C3` `CommentThread` 仍是单块共享组件，任一局部交互都会带动整棵评论树参与重渲染，但这不是当前第一瓶颈。
  - `C4` 通知轮询与通知 SQL 仍有收口空间，但属于评论主链路之外的次级成本。
- 这轮先只落任务，不立即改代码，避免和正在推进的其他社区优化混在一起。
- 当前做到哪一步：
  - 已完成评论性能问题代码级排查，确认先做 `C1`，再做 `C2`，最后才评估 `C3-C4`。
- 下次先做什么：
  - 先开始 `C1`：把评论提交 / 评论点赞 / 删评论 / 开关评论区后的返回，从“重拉整个详情 view”改成“只更新评论区数据 + 必要计数”。

### 2026-04-30 comment performance optimization C1 done

- 已完成 `C1`：评论提交 / 评论点赞 / 删评论 / 开关评论区后的前端刷新路径，已从“整页详情 view 全量重拉”改成“评论局部补丁合并”。
- 这轮覆盖范围不是单页补丁，而是四类详情页共用链路一起收口：
  - 视频详情
  - 提示词详情
  - 工作流详情
  - 帖子详情
- 本轮共享层改动：
  - `apps/web/src/features/community-interactions/actions.ts`
    - 评论类 server action 已改为返回 `patch(comments/commentCount/commentPolicy)`，不再返回整页 `view`
  - `apps/web/src/features/discussions/actions.ts`
    - 帖子评论链路同样改为返回 `patch(comments/replyCount/commentPolicy)`
  - `apps/web/src/lib/mappers/community.ts`
    - `mapComment` 已导出，供评论局部刷新链路复用，避免在 action 层重复拼装评论树
- 页面层改动：
  - `apps/web/src/features/video-detail/VideoDetailPage.tsx`
  - `apps/web/src/features/workflow-detail/WorkflowDetailPage.tsx`
  - `apps/web/src/features/discussions/DiscussionDetailPage.tsx`
  - 三类页面已新增局部 `applyCommentPatch(...)` 合并逻辑，只更新 `comments/commentPolicy/commentCount/replyCount`，不再替换正文、作者区、相关推荐等无关区域。
- 已验证：
  - `apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
- 当前做到哪一步：
  - 评论主链路最大前端刷新成本已经先收掉，后续再看评论量继续上涨时的接口分页与组件重渲染问题。
- 下次先做什么：
  - 进入 `C2`：给 `/api/comments` 补根评论分页，继续保持二级回复内嵌，不改现有两层产品策略。

### 2026-04-30 comment performance optimization C3 done

- Completed `C3`: rebuilt `apps/web/src/components/comments/CommentThread.tsx` into memoized root/reply items instead of one shared inline render block.
- Root composer and inline reply composer now keep local draft state, so typing in one composer no longer drags the entire comment tree into the same re-render path.
- Preserved the validated two-level behavior:
  - one root level plus one visible reply level only
  - replying to a second-level reply still stays visually under the root thread
  - collapsing a root thread also closes the active inline reply box inside that root

### 2026-04-30 taxonomy backendization T1 done

- 已完成 `T1-1`：提示词 taxonomy 正式字段已贯通到后端发布入库与读取契约。
  - 新增迁移 `apps/server/src/main/resources/db/migration/V19__add_prompt_taxonomy_fields.sql`
  - `video draft -> publish -> prompt_entries` 已写入 `model_category / content_category / composition_category`
  - `/api/prompts` 与 `/api/prompts/{id}` 已返回 taxonomy 对象
  - 修复了 `PublishedContentPersistenceService.upsertPromptForReview(...)` 的 SQL 占位符错位，解决 `栏位索引超过许可范围：22，栏位数：21`
  - 定向验证通过：
    - `DraftApiIntegrationTest`
    - `PublishPipelineIntegrationTest`
    - `PromptReadApiIntegrationTest`
- 已完成 `T1-2`：前端 taxonomy 消费口径已统一为“后端正式字段优先，标签推断兜底”。
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx` 不再只依赖前端 `classifyPromptTaxonomy(...)` 猜测筛选标签
  - `apps/web/src/features/publish/PublishPage.tsx` 草稿回填优先吃正式 taxonomy 字段
  - `apps/web/src/lib/taxonomy/prompt-taxonomy.ts` 已放宽为接收后端字符串字段，并只识别合法枚举值
  - 验证通过：`npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
- 已完成 `T1-3`：历史导入 / 回填脚本已补 taxonomy 显式字段，后续资源导入与历史修正不再只回填 tag。
  - `scripts/import-youmind-assets-via-api.mjs` 现会在导入 payload 中写入 `modelCategory / contentCategory / compositionCategory`
  - `scripts/backfill-youmind-prompt-source-metadata.mjs` 现会同步回填 taxonomy 三字段，并把 SQL 差异检测一起纳入
  - 脚本语法校验通过：
    - `node --check scripts/import-youmind-assets-via-api.mjs`
    - `node --check scripts/backfill-youmind-prompt-source-metadata.mjs`
- 这一轮收口后的状态：
  - 新发布 prompt、精选页筛选、发布页草稿回填、历史导入脚本、历史回填脚本，taxonomy 口径已经统一
  - 后续如果再做资源分类增强，应从 taxonomy 枚举与导入数据源规则入手，不要重新退回前端自由推断
- 下一个大任务建议切到 `T2 媒体链路稳定化`：
  - 先从 `T2-1` 处理中 / 失败态前台展示开始
  - 然后接 `T2-2` 媒体任务查询与后台重试入口

### 2026-04-30 media lifecycle visibility T2-1 phase 1

- 已开始 `T2-1`，当前先收口“发布后用户看不到媒体处理状态”的第一阶段问题，不先上后台重试入口。
- 后端 lifecycle 已补充说明字段：
  - `apps/server/src/main/java/com/dramatv/community/publish/dto/response/DraftLifecycleResponse.java`
  - 新增 `moderationMessage / processingMessage`
  - `apps/server/src/main/java/com/dramatv/community/publish/application/PublishDraftLifecycleQueryService.java`
    - 为 `moderationStatus` 提供用户可读文案
    - 为 `processingStatus` 提供用户可读文案
    - 当媒体任务失败时，会从 `async_task_records.error_message` 提取最新失败原因透给前端
- 前端发布页状态卡已补真实状态展示：
  - `apps/web/src/features/publish/PublishPage.tsx`
  - `apps/web/src/features/publish/PublishPage.module.css`
  - 现在会展示：
    - 提交时间
    - 审核状态 + 审核说明
    - 媒体处理状态 + 处理说明 / 失败原因
  - 视频提示词、工作流、视频类内容提交后，不再只显示“已提交”，而是能区分 `排队中 / 处理中 / 已完成 / 失败`
- 前端契约与映射已同步：
  - `apps/web/src/lib/contracts/community-api.ts`
  - `apps/web/src/lib/contracts/view-models.ts`
  - `apps/web/src/lib/api/community-service.ts`
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - `DraftApiIntegrationTest, PublishBootstrapApiIntegrationTest, PublishPipelineIntegrationTest` 定向测试通过
  - 新增失败态回归：
    - `submittedVideoDraftLifecycleIncludesMediaFailureMessage`
    - 已验证媒体任务失败后，`/api/video-drafts/{id}` 能返回 `processingStatus=failed` 与失败文案
- 当前做到哪一步：
  - 发布页已具备最小可读的媒体状态闭环
  - 但用户还不能查看任务列表、手动重试或看到更详细的处理阶段
- 下次先做什么：
  - 继续 `T2-2`：媒体任务查询与后台重试入口
  - successful reply submit clears the local draft and keeps the root expanded
- The shared component still plugs into the current detail pages without page-side contract changes:
  - video detail
  - workflow detail
  - discussion detail
  - existing comment policy / like / delete / load-more hooks remain intact
- Verified:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` passed
- Current state:
  - local input / expand / reply-target switching cost is now isolated inside the shared comment component
  - remaining comment-path cost is mainly the post-mutation server patch refresh, not local shared UI state churn
- Next:
  - only move to `C4` if browser traces still show notification query or comment query cost as the next real bottleneck

### 2026-04-30 comment performance optimization C2 done

- 已完成 `C2`：`/api/comments` 现在已经从“全量根评论一次性返回”改成“只分页根评论 + 二级回复继续跟随根评论内嵌返回”。
- 这轮前端收口：
  - `apps/web/src/features/devtools/local-smoke/shared.ts`
    - 本地 smoke 校验已同步升级到 `ApiCommentPage`，不再把评论分页结构当数组直接消费。
  - `apps/web/src/lib/prefill/imported-prompt-library.ts`
  - `apps/web/src/lib/prefill/prompt-detail-demo.ts`
  - `apps/web/src/lib/prefill/workflow-detail-demo.ts`
    - 预填充 / demo 详情数据已统一切到 `CommentPageView` 契约，避免分页结构接入后旧 demo 再把类型面拖垮。
- 这轮后端收口：
  - `apps/server/src/main/java/com/dramatv/community/interaction/persistence/InteractionJdbcPersistenceService.java`
    - 新增根评论分页常量与游标编解码。
    - `listComments(...)` 已改成两段式查询：
      - 先按 `created_at asc, id asc` 只取根评论分页切片
      - 再只为当前页根评论补齐其直属二级回复
    - 返回仍保持 `CursorPageResponse<CommentResponse>`，但 `nextCursor/hasMore` 已开始真实生效。
    - 中途暴露过一次 PostgreSQL 游标 SQL 语法问题，已改成“无游标 / 有游标”两条明确分支查询，不再靠 `? is null` 混合兜底。
- 新增验证：
  - `apps/server/src/test/java/com/dramatv/community/integration/CommentApiIntegrationTest.java`
    - 已新增根评论分页用例：
      - 第一页只返回 10 个根评论
      - `hasMore=true`
      - `nextCursor` 非空
      - 第二页能正确续取第 11 个根评论
      - 当前页根评论下的二级回复仍随根评论一起返回
- 已验证：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -Dtest=CommentApiIntegrationTest test` 通过
- 当前做到哪一步：
  - 评论链路现在已经先收掉了“动作后整页重拉”和“根评论全量返回”这两个一阶成本，后续可以更聚焦地看共享组件重渲染和通知查询。
- 下次先做什么：
  - 进入 `C3`：继续拆 `CommentThread` 的共享渲染成本，优先减少展开/输入/点赞等局部状态对整棵评论树的牵连。

### 2026-04-30 comment frontend synced to cloud

- 已将本轮评论区前端共享组件优化同步到云端前端环境。
- 本次同步范围：
  - `apps/web/src/components/comments/CommentThread.tsx`
- 同步前已验证：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
- 已执行云端前端部署脚本：
  - `scripts/deploy-test-web.ps1`
- 本次云端发布结果：
  - release: `/opt/dramatv-community-web/releases/20260430-170523`
  - service: `dramatv-community-web.service` `active (running)`
  - nginx 配置校验通过
  - 部署脚本内置的服务自检返回 `200`
- 说明：
  - 本轮是前端同步，没有改后端接口契约。
  - 回复输入框仍保持“点哪条评论，就在那条评论下方打开输入框”的已确认交互，不做回退。

### 2026-04-30 optimization backlog rebaseline

- 已按“先把任务账本写清，再开始实做”的要求，重新整理社区后续优化队列，避免继续沿旧的混合日志顺序推进。
- 这次不再把 `一些可能需要优化的点.md` 直接当执行清单，而是按当前真实代码和产品优先级重排为五个大任务：
  - `T1 分类体系后端化`
    - `T1-1` 提示词 taxonomy 正式字段入库与接口化
    - `T1-2` 精选页 / 发布页优先消费后端 taxonomy 字段
    - `T1-3` 历史 prompt 资源 taxonomy 回填与导入口径统一
  - `T2 媒体链路稳定化`
    - `T2-1` 处理中 / 失败态前台展示
    - `T2-2` 媒体任务查询与后台重试入口
    - `T2-3` OSS / CDN / Range 正式收口
  - `T3 发布状态模型剩余收口`
    - `T3-1` content 可见性 / 审核 / 处理职责边界
    - `T3-2` 前台页面状态消费统一
    - `T3-3` 回归测试
  - `T4 登录 / 会话 / 权限专项`
    - `T4-1` 多浏览器 / 多账号隔离回归
    - `T4-2` 登录重定向 / 受保护路由 / 上传代理回归
    - `T4-3` 公司登录替换兼容性检查
  - `T5 后台治理剩余落地`
    - `T5-1` 举报处理与审核联动
    - `T5-2` 媒体任务治理入口
    - `T5-3` Feed / 排序运营入口
- 本次重排的核心判断：
  - 前端 taxonomy 已经具备较清晰的模型分类和内容母类，但后端仍主要依赖 `tagNames + modelName + content_kind`，这会持续影响 `/featured` 筛选、发布表单、历史导入、后台治理和后续搜索推荐。
  - 因此当前直接进入 `T1-1`，先把提示词 taxonomy 正式落到数据库、发布链路和读接口里，再继续做消费层和历史回填。
- 同步修正了评论性能旧状态：
  - `C1-C3` 现已统一标记为已完成
  - `C4` 保持待评估，不再误写成仍有 `C3` 未做
- 当前做到哪一步：
  - 优化任务已完成重新立账
  - 下一步直接进入 `T1-1` 的后端与前端契约实现
- 下次先做什么：
  - 新增 prompt taxonomy 正式字段迁移
  - 打通 draft / publish / prompt read 三条链路的字段透传
  - 跑针对性集成测试和类型校验后，把 `T1-1` 标记为已完成

### 2026-04-30 media lifecycle visibility T2-1 wording cleanup

- 已把 `/me` 页里残留的“草稿箱 / 草稿”展示文案统一收口为“创作记录 / 创作中”，避免用户把已提交但仍在处理中、审核中、失败待处理的条目误解成仅是本地草稿。
- 本次只调整展示语义，不改内部路由和查询键：
  - 继续保留 `?tab=drafts`
  - 继续保留前后端 `draftItems` / `draftType` 等内部命名，避免这一轮额外扩大修改范围
- 前台文案调整点：
  - tab `草稿箱` -> `创作记录`
  - 统计项 `草稿` -> `创作中`
  - 类型徽标 `视频草稿 / 帖子草稿 / 工作流草稿 / 草稿` -> `视频创作 / 帖子创作 / 工作流创作 / 创作记录`
  - 删除按钮 `删除草稿` -> `删除记录`
  - 删除确认文案同步改成“删除后不会显示在创作记录中”
  - 摘要兜底文案同步改成“这条创作记录还没有摘要...”
  - 空状态说明同步改成“未提交内容，以及已提交但仍在审核或媒体处理中的创作记录...”
- 变更文件：
  - `apps/web/src/features/me/PersonalCenterPage.tsx`
- 已验证：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
- 当前做到哪一步：
  - `T2-1` 已完成从发布页可见性、个人中心状态透出到产品语义收口这一整段闭环
- 下次先做什么：
  - 评估是否还需要把轻量处理状态外露到其他创作者可见入口；如果没有明确产品收益，优先转回 `T1-1` taxonomy 正式字段化

### 2026-04-30 T1-1 taxonomy formalization verified and backlog corrected

- 已对 `T1-1 提示词 taxonomy 正式字段入库与接口化` 做了一轮代码与测试级复核，结论是这项不是“待开始”，而是已经实际落进当前主线代码，只是进度账本没有及时修正。
- 已核实的落地点：
  - 数据库迁移已存在：
    - `apps/server/src/main/resources/db/migration/V19__add_prompt_taxonomy_fields.sql`
    - `prompt_entries` 已补 `model_category / content_category / composition_category`
  - 发布草稿链路已透传 taxonomy：
    - `apps/server/src/main/java/com/dramatv/community/publish/dto/request/UpsertVideoDraftRequest.java`
    - `apps/server/src/main/java/com/dramatv/community/publish/application/VideoDraftApplicationService.java`
    - `apps/server/src/main/java/com/dramatv/community/publish/dto/response/VideoDraftResponse.java`
  - 发布落库链路已写入 taxonomy：
    - `apps/server/src/main/java/com/dramatv/community/publish/persistence/PublishedContentPersistenceService.java`
  - Prompt 读接口已返回 taxonomy：
    - `apps/server/src/main/java/com/dramatv/community/prompt/application/PromptQueryService.java`
    - `apps/server/src/main/java/com/dramatv/community/prompt/dto/response/PromptSummaryResponse.java`
    - `apps/server/src/main/java/com/dramatv/community/prompt/dto/response/PromptDetailResponse.java`
  - 前端发布页 / 精选页已优先消费 taxonomy：
    - `apps/web/src/features/publish/PublishPage.tsx`
    - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - `apps/web/src/lib/taxonomy/prompt-taxonomy.ts`
  - 前后端契约已透传 taxonomy：
    - `apps/web/src/lib/contracts/community-api.ts`
    - `apps/web/src/lib/api/community-service.ts`
- 已验证：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - `DraftApiIntegrationTest, PromptReadApiIntegrationTest, PublishPipelineIntegrationTest` 通过
- 看板修正：
  - `T1-1` 现应视为已完成
  - `T1-2` 当前主线代码也已具备真实消费 taxonomy 的能力，不再作为阻塞项单独挂起
  - `T1` 当前剩余真实工作聚焦到 `T1-3 历史 prompt 资源 taxonomy 回填与导入口径统一`

### 2026-04-30 T1-3 import taxonomy path unified

- 已补齐旧的直写库导入脚本，使其与“真实 API 导入脚本”和“source metadata 回填脚本”在 taxonomy 口径上保持一致，不再只靠 `tag_names` 间接表达分类。
- 本次修正：
  - `scripts/import-youmind-prompts.mjs`
    - 旧脚本现在会显式计算 `modelCategory / contentCategory / compositionCategory`
    - 写入 `prompt_entries` 时同步落 `model_category / content_category / composition_category`
    - upsert 更新分支同步补齐这三个正式字段
- 对比当前三条脚本口径：
  - `scripts/import-youmind-assets-via-api.mjs`
    - 已走真实发布 API，并已提交 taxonomy 字段
  - `scripts/backfill-youmind-prompt-source-metadata.mjs`
    - 已支持回填 `source + taxonomy + tag_names`
  - `scripts/import-youmind-prompts.mjs`
    - 本轮已补齐 taxonomy 正式字段写库
- 已验证：
  - `node --check scripts/import-youmind-prompts.mjs`
  - `node --check scripts/backfill-youmind-prompt-source-metadata.mjs`
  - `node --check scripts/import-youmind-assets-via-api.mjs`
- 当前做到哪一步：
  - 历史 prompt 的“新导入 / 旧直写库导入 / 云端 source backfill”三条脚本口径已经统一到 taxonomy 正式字段
- 下次先做什么：
  - 按你后续指定的资源批次，选择“走真实 API 导入”或“跑 metadata/taxonomy backfill”其中一条执行到数据层

### 2026-05-03 docs/02 研究资源本地小批量导入实验

- 按“先找一点 `docs/02_研究` 里的资源做实验”的口径，先选了风险最低的一批图片提示词做本地导入验证，不直接上视频，也不直接写云环境。
- 这次实验走的是：
  - 资源来源：`docs/02_研究/youmind-image-assets/nano-banana-library-p001-p190`
  - 导入链路：`scripts/import-youmind-assets-via-api.mjs`
  - 目标后端：`http://127.0.0.1:18080`
  - 状态文件：`artifacts/youmind-import/latest/state.local-experiment.json`
- 先做了 dry-run，确认选中的 3 条样本为：
  - `nano:000065-13260`
  - `nano:000066-13271`
  - `nano:000067-13290`
- 随后已完成真实导入，3 条均成功发布到本地社区库：
  - `nano:000065-13260` -> prompt `c3bb6c6d-5824-4e5b-be03-8c560875cf66`
  - `nano:000066-13271` -> prompt `7b3e0cf5-0d6d-4368-a77e-e22ef101bd14`
  - `nano:000067-13290` -> prompt `a02de90f-513d-4927-a8c3-38dd1e7c8694`
- 本次实验确认点：
  - 本地 `docker compose up -d postgres redis` 可用
  - 本地 Spring Boot `18080` 可正常启动并承接导入
  - 真实 API 导入链路在本地可用，未再复现之前云端 `/api/uploads/image-policy` 的 `403 FORBIDDEN`
  - 新导入 prompt 已能通过本地接口读出，并出现在 `GET /api/feed/home` 返回结果里
  - taxonomy 已按正式字段落库，例如：
    - `modelCategory=nanobanana`
    - `contentCategory=animation / prop`
    - `compositionCategory=single-model`
- 这次刻意没有做的事：
  - 没有改云端数据库
  - 没有覆盖 `artifacts/youmind-import/latest/state.json`
  - 没有扩到大批量视频导入
- 当前做到哪一步：
  - 已经证明 `docs/02_研究` 里的图片提示词资源可以先在本地用真实发布 API 小批量导入
- 下次先做什么：
  - 要么继续按这个口径再导入一小批 `nano / gpt-comic / nano-comic`
  - 要么切回排查云端 `upload policy 403`，把同样的导入链路推到云测试环境

### 2026-05-03 docs/02 研究资源本地小批量导入实验第二批

- 在第一批 `nanobanana` 本地实验成功后，继续补了一批 `gpt-image-2` 图片提示词，验证不同模型母类的本地真实导入链路。
- 这次实验走的是：
  - 资源来源：`docs/02_研究/youmind-image-assets/gpt-image-2-comic-storyboard-extracted`
  - 导入链路：`scripts/import-youmind-assets-via-api.mjs`
  - 目标后端：`http://127.0.0.1:18080`
  - 状态文件：`artifacts/youmind-import/latest/state.local-experiment.json`
- dry-run 选中的 5 条样本为：
  - `gpt-comic:000001-13467`
  - `gpt-comic:000002-14858`
  - `gpt-comic:000003-14857`
  - `gpt-comic:000004-14939`
  - `gpt-comic:000005-14853`
- 已完成真实导入，对应本地 prompt id：
  - `gpt-comic:000001-13467` -> `bb2bcc41-adc3-4f01-a580-6c640b9d1e68`
  - `gpt-comic:000002-14858` -> `e1136976-be2f-4cec-ae4a-277fd147c666`
  - `gpt-comic:000003-14857` -> `f0eb4682-5271-47a1-a802-f4942de49daf`
  - `gpt-comic:000004-14939` -> `4d4afe72-a755-4a16-8886-bebf9e2b24bb`
  - `gpt-comic:000005-14853` -> `99370cdd-8337-4419-9bcd-66a8d2b2d041`
- 本次确认点：
  - 本地真实发布 API 导入链路不只支持 `nanobanana`，也支持 `gpt-image-2`
  - 详情接口已能返回正确 taxonomy，例如：
    - `modelCategory=gpt-image-2`
    - `contentCategory=animation`
    - `compositionCategory=single-model`
  - 新导入的 `gpt-image-2` 资源已能进入 `GET /api/feed/home`
  - 当前本地实验库里已经同时存在两类图片提示词母类：
    - `nanobanana`
    - `gpt-image-2`
- 当前做到哪一步：
  - `docs/02_研究` 的本地实验已经从“单一模型试跑”扩展到“两类图片模型母类都可真实导入”
- 下次先做什么：
  - 可以继续补第三批 `nano-comic`
  - 或者转去把这批本地实验结果接到前端 `3106` 做页面级验收

### 2026-05-03 docs/02 研究资源本地小批量导入实验第三批

- 已继续补第三批 `nano-comic` 图片提示词，目标是把当前三类主要图片提示词来源都在本地真实导入链路上跑通。
- 这次实验走的是：
  - 资源来源：`docs/02_研究/youmind-image-assets/nano-banana-comic-storyboard-extracted`
  - 导入链路：`scripts/import-youmind-assets-via-api.mjs`
  - 目标后端：`http://127.0.0.1:18080`
  - 状态文件：`artifacts/youmind-import/latest/state.local-experiment.json`
- dry-run 选中的 5 条样本为：
  - `nano-comic:000001-14706`
  - `nano-comic:000002-14703`
  - `nano-comic:000003-14294`
  - `nano-comic:000004-14707`
  - `nano-comic:000005-14297`
- 已完成真实导入，对应本地 prompt id：
  - `nano-comic:000001-14706` -> `2c3ec234-2533-4039-8cac-6b803195e307`
  - `nano-comic:000002-14703` -> `e0c3ab9f-e0a4-4abb-897d-ee4fe52639d2`
  - `nano-comic:000003-14294` -> `37fea8e3-097b-41ef-ac5f-f3d184012521`
  - `nano-comic:000004-14707` -> `fed41105-0a63-4a45-aa31-f2a4b0ce0a46`
  - `nano-comic:000005-14297` -> `602a091c-056f-4826-b659-66e9d8e1faaa`
- 本次确认点：
  - 本地真实发布 API 导入链路已覆盖三类主要图片提示词来源：
    - `nanobanana`
    - `gpt-image-2`
    - `nano-comic`
  - `nano-comic` 详情接口已能返回正确 taxonomy，例如：
    - `modelCategory=nanobanana`
    - `contentCategory=animation`
    - `compositionCategory=single-model`
  - 新导入的 `nano-comic` 资源已能进入 `GET /api/feed/home`
- 当前做到哪一步：
  - `docs/02_研究` 里的图片提示词资源，当前三类主要来源都已在本地实验库中通过真实 API 导入验证
- 下次先做什么：
  - 优先转到前端 `3106` 做页面级验收，确认这些实验数据是否已经能在精选页和分类维度里被正确看见
  - 如果页面级展示还不够，再决定是否继续补更大批量，还是先做分类筛选与展示收口

### 2026-05-03 docs/02 研究资源本地实验数据页面级验收

- 已把这三批本地实验数据接到真实前端 `http://127.0.0.1:3106/featured?filter=image_prompt` 做浏览器级验收，不只停留在接口层确认。
- 本轮验收环境：
  - 后端：`http://127.0.0.1:18080`
  - 前端：`http://127.0.0.1:3106`
  - 登录账号：`creator-a`
  - 验收方式：Playwright 真实点击模型筛选与题材筛选
- 页面基线已确认：
  - 顶部主筛选显示：`全部 75 / 工作流 2 / 视频提示词 30 / 图片提示词 43 / 活动 0`
  - 图片提示词模型筛选显示：`gpt-image-2 5 / nanobanana 38 / midjourney 0 / 其他模型 0`
  - 图片提示词题材筛选显示：`真人 11 / 动画 12 / 场景 4 / 道具 3 / 其他 13`
- 页面上已直接可见本轮导入的实验数据，包含：
  - `复古迈阿密艺术约会漫画页`
  - `雨夜黑色电影风格漫画页面`
  - `电影级动作拼贴分屏`
  - `动漫情侣矢量插画`
  - `“Paramecium” 角色特写动漫电影海报`
  - `极具张力的双重曝光运动肖像`
- 组合筛选验收结果：
  - `gpt-image-2` 点击后 URL 变为 `?filter=image_prompt&model=gpt-image-2`，页面只剩 5 条，对应本轮导入的 5 条 `gpt-comic`
  - `nanobanana` 点击后 URL 变为 `?filter=image_prompt&model=nanobanana`，页面只显示 `nanobanana` 系列资源
  - `gpt-image-2 + 动画` 点击后 URL 变为 `?filter=image_prompt&model=gpt-image-2&content=animation`，结果仍为 5 条，和本轮 `gpt-comic` 的 taxonomy 一致
  - `nanobanana + 动画` 点击后 URL 变为 `?filter=image_prompt&model=nanobanana&content=animation`，页面结果收敛到 7 条，说明模型类和题材类组合过滤已经生效
  - `场景` 单独点击后 URL 变为 `?filter=image_prompt&content=scene`，页面结果为 4 条，标题均与场景类语义一致
- 本轮结论：
  - `docs/02_研究` 这三批图片提示词实验数据，已经打通“本地真实导入 -> 本地真实 API -> 本地真实前端页面展示”
  - `Featured` 页的图片提示词模型筛选、题材筛选、模型+题材组合筛选目前在本地主链路上工作正常
  - 页面采用了渐进渲染，首屏 DOM 中读取到的卡片数量是当前已挂载批次，不应和顶部总量计数直接混为一谈
- 当前做到哪一步：
  - 已完成 `docs/02_研究` 图片提示词实验数据的小批量页面级验收
- 下次先做什么：
  - 可以继续按同样链路再补一批图片提示词实验数据
  - 或者转去处理云端真实导入链路里的 `/api/uploads/image-policy 403`

### 2026-05-03 T4 auth/session first pass shared-layer hardening

- 已正式切入 `T4 登录 / 会话 / 权限专项`，这轮先不做页面零散补丁，而是优先收共享认证层的一个稳定性问题。
- 当前定位到的问题：
  - 后端受保护接口在匿名或失效会话场景下，实际可能返回 `403 / FORBIDDEN`
  - 但前端共享层原先只把 `401` 或 `AUTH_REQUIRED` 识别成“需要重新登录”
  - 这会导致“cookie 还在但 session 已失效”的一类场景，前端未必会稳定走回登录流程
- 本轮已落地修复：
  - `apps/web/src/proxy.ts`
    - Next 路由代理在校验 `dramatv_access_token` 时，除了 `401`，现在也把 `403` 视为失效 token
    - 这样受保护页面访问时，失效 cookie 会被清掉并重定向回 `/login?redirectTo=...`
  - `apps/web/src/lib/api/community-service.ts`
    - `isCommunityAuthRequiredError(...)` 现在同时识别：
      - `status === 401`
      - `status === 403`
      - `code === AUTH_REQUIRED`
      - `code === FORBIDDEN`
    - 这样 `layout / me / publish / canvas / discussions/new / 通知代理` 这些共享调用点会统一把这类失效态当成登录失效处理
- 本轮验证：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - `AuthMeApiIntegrationTest` 通过
- 当前做到哪一步：
  - `T4` 的第一轮共享层会话失效识别已经收口
  - 还没有开始做浏览器级的多账号隔离和重定向回归
- 下次先做什么：
  - 继续 `T4-1/T4-2`，跑本地浏览器级回归：
    - 登录页 -> 受保护路由 -> 返回目标页
    - 退出后重新访问受保护页是否稳定回登录
    - 上传代理在未登录 / 失效登录态下的返回是否合理

### 2026-05-03 T4-3 company-login compatibility closeout

- 已完成 `T4-3 公司登录替换兼容性检查`，这轮没有提前猜公司登录协议细节，而是先把当前本地密码登录改造成“provider-ready”的兼容形态，保证后续接公司登录时尽量只换 provider，不重写社区页面守卫和 session 契约。
- 本轮后端落地：
  - `apps/server` 新增 `CommunityAuthProperties`，把社区登录 provider 的主入口、展示名、描述文案和本地密码登录开关改为配置驱动。
  - `AuthApplicationService` 现在把本地密码登录正式收敛为 `local_password` provider，同时继续兼容历史 `password` 登录类型，避免旧脚本和旧测试立即失效。
  - `AuthController` 新增 `GET /api/auth/providers`，供前端登录页读取当前可用 provider 配置。
- 本轮前端落地：
  - `apps/web` 登录页改为先读 `getAuthProviderConfig()`，再由 `LoginPage` 根据后端返回的 `primaryProvider` 和 `loginProviders` 渲染当前登录方式。
  - `loginAction` / `loginCommunity` 现在会显式透传 `loginType`，默认仍走 `local_password`，但调用面已经具备 provider 切换位。
  - 共享适配层继续保留现有 cookie 名、`/api/auth/me` 校验口径和 `redirectTo` 守卫行为，避免这轮兼容性改造把现有社区登录流程打散。
- 这轮顺手补的一刀共享层加固：
  - `apps/web/src/lib/api/community-service.ts` 中的鉴权错误识别与 `requestId` 读取，已统一走“`instanceof` + `name/path` 结构兜底”的共享函数，不再只依赖原型链。
  - 这样后续公司登录接入后，即便错误对象跨了不同 Next server 边界，`401/403/AUTH_REQUIRED/FORBIDDEN` 仍能稳定被识别成“登录失效”。
- 本轮验证：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AuthMeApiIntegrationTest test` 通过，4/4
  - `node scripts/run-local-auth-session-regression.mjs --frontend-base-url http://127.0.0.1:3106 --backend-base-url http://127.0.0.1:18080 --output artifacts/auth-session-smoke/latest/summary.json` 通过，12/12
  - `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/run-local-stability-suite.ps1 -SkipFrontendBuild -SkipBrowserSmoke -SkipBackendIntegration -SkipApiSmoke` 通过，4/4
- 当前做到哪一步：
  - `T4-1/T4-2/T4-3` 已全部收口，本地登录/会话/权限这一条线已经从“页面现象修补”升级为“共享层 + 回归脚本 + provider-ready 兼容位”。
- 下次先做什么：
  - 如果接下来继续社区主线，可切回 `T3 发布状态模型剩余收口` 或用户当前更急的媒体/前台优化任务。
  - 如果要开始对接公司登录，则下一步优先补“公司登录 provider 配置字段映射文档”和“cookie / token / me 接口兼容清单”，而不是先改页面。

### 2026-05-03 T3 publish-visible-now semantics closeout

- 已按当前产品规则正式收口 `T3 发布状态模型剩余收口`，这轮不再把“审核中”当作现阶段默认发布路径，而是统一改成：
  - 发布后先直接可见
  - 自动审核只做预留，不启用
  - 人工审核后续放后台
  - 举报功能后续接后台，举报量过高时走后台预警与人工介入
- 本轮后端落地：
  - `apps/server` 的 `video/workflow/post` submit response 新增显式 `draftStatus` 与 `contentStatus`
  - 兼容字段 `publishStatus` 暂时保留，继续指向草稿提交流程状态，避免旧前端或旧脚本立刻断掉
  - 发布落库写入的 `audit_records.status_code` 已从 `pending_review` 改为 `not_required`
  - `PublishDraftLifecycleQueryService` 已统一把 `not_required / skipped / bypassed / disabled` 归一到 `not_applicable`
  - 生命周期审核文案已改为“当前阶段发布后直接可见，审核链路仅做预留”
- 本轮前端落地：
  - `apps/web` submit action 不再把 `publishStatus` 回写到草稿 `statusCode`
  - 发布后草稿状态统一读取 `draftStatus`
  - 个人中心创作记录状态展示优先读取 `lifecycle.draftStatus`，避免继续混用旧 `statusCode`
- 本轮验证：
  - `npx.cmd tsc --noEmit -p tsconfig.json`（`apps/web`）通过
  - `DraftApiIntegrationTest` 4/4 通过
  - `PublishPipelineIntegrationTest` 9/9 通过
  - `MeReadApiIntegrationTest` 3/3 通过
- 当前做到哪一步：
  - 社区前台的真实产品口径已经从“默认待审核”切到“默认直接可见”
  - 审核链路仍保留接口位和状态位，方便后续后台人工审核、举报治理接入
- 下次先做什么：
  - 若进入后台治理线，优先落 `T5-1 举报处理与审核联动`
  - 社区前台继续开发时，不再新增任何“发布成功但前台默认显示待审核”的新逻辑

### 2026-05-03 task-board check and report-flow expansion

- 已按当前任务板重新核对社区主线状态，结论是：任务板还没做完。
- 当前已完成的大项：
  - `T1 分类体系后端化`
  - `T2 媒体链路稳定化`
  - `T3 发布状态模型剩余收口`
  - `T4 登录 / 会话 / 权限专项`
  - `C1-C3` 评论性能第一轮
- 当前仍待完成的大项：
  - `T5 后台治理剩余落地`
  - `C4 评论通知轮询 / 通知查询 SQL 第二轮收口`
- 本轮顺手把“举报功能和与后台的联动”从模糊描述改成了明确任务拆分：
  - `T5-1` 前台举报入口与举报提交流程
  - `T5-2` 举报与后台人工审核联动
  - `T5-3` 举报阈值预警 / 待处理池 / 状态流转
  - `T5-4` 媒体任务治理入口
  - `T5-5` Feed / 排序运营入口
- 当前做到哪一步：
  - 任务板已经重新对齐到你刚确认的产品规则：现在默认发布即公开，审核链路放后台，举报链路后续与后台治理一起落。
- 下次先做什么：
  - 如果继续按任务板推进，优先从 `T5-1 前台举报入口与举报提交流程` 开始，再接 `T5-2` 和 `T5-3`。

- 2026-05-04 云端前端同步完成：重新部署 `scripts/deploy-test-web.ps1`，补齐公网 Nginx 对 Next `app/api` 路由的转发，公网 `http://8.141.20.130` 下 `/api/me/notifications/recent` 已恢复为 200。复检时确认 Edge 先前的“免登录进入”是本地已有 cookie，不是公网放开登录态。

- 2026-05-04 已处理通知与头像联动：通知铃铛新增未读红点，已读状态改为按用户本地持久化；通知列表中的作者头像可点击进入作者主页；评论区头像也改为可点击进入作者主页。已完成 `tsc`、本地构建和云端同步复检。

- 2026-05-04 已完成社区主线云同步审计，文档落到 `.codex/community-cloud-sync-audit-2026-05-04.md`：已核对 `T1 taxonomy` 等历史大任务确实涉及前端/后端/数据库三层，并确认当前云前端、云后端和云数据库结构均已追到本地主线；后续若继续排查差异，应优先查数据内容差异而不是代码/结构是否上云。

- 2026-05-04 启动 `docs/02_研究` 资源上云导入：先用现有 `scripts/import-youmind-assets-via-api.mjs` 按提示词内容与现有 taxonomy 自动打标，分小批次把 YouMind 视频/图片提示词导入云端内容库；当前先做首批小样本验证，完成一批记一批，避免全量导入后不好回滚。

- 2026-05-04 `docs/02_研究` 云端资源导入首批已完成：沿用昨天验证过的“上传 staging 包到云服务器，再在服务器本机直连 `http://127.0.0.1:18080` 导入”的链路，绕开当前公网 `/api/**` 仍偶发 `502` 的前门问题。
  - 首批 staging 包：`artifacts/cloud-import/stage-batch1`
  - 云端归档：`/tmp/stage-batch1.tar.gz`
  - 云端解压目录：`/tmp/stage-batch1`
  - 云端导入状态文件：`/tmp/stage-batch1/artifacts/youmind-import/latest/state.cloud-batch1.json`
  - 已成功导入总计 `26` 条：
    - `awesome-gpt-image-2`: `8`
    - `gpt-comic`: `6`
    - `nano`: `8`
    - `seedance`: `4`
  - 当前分类口径保持不变：
    - 图片模型：`gpt-image-2 / nanobanana / midjourney / other-image-model`
    - 视频模型：`seedance / kling / happyhorse / wan / other-video-model`
    - 组合维度：`single-model / multi-model`
    - 内容维度继续由提示词文本、已有来源字段和 extra signals 自动推断
  - 当前约束：
    - `youmind` 仍作为隐藏来源标签，不在前端显式展示
    - 后续继续按小批次导入，避免一次性全量灌入后难以校验或回滚
    - 公网 API 前门 `502` 解决前，云端资源导入统一继续走“服务器本机直连后端”方案
  - 下次先做什么：
    - 基于同一状态文件继续准备第二批 `awesome-gpt-image-2 / nano / seedance` 资源
    - 抽样校验首批内容在云环境数据层和页面层的落库结果

- 2026-05-04 `docs/02_研究` 云端资源导入第二批已完成：新增本地 staging 构建脚本后，第二批已按“本地切批次 -> `tar.gz` 上传 -> 云服务器本机导入”的稳定链路成功落库。
  - 新增脚本：`scripts/build-cloud-import-stage.mjs`
    - 用于按 `start + count` 从研究资源库切出小批次目录与精简 `library-manifest.json`
    - 后续第三批起继续复用，不再手工拷目录
  - 第二批 staging 包：
    - 目录：`artifacts/cloud-import/stage-batch2`
    - 归档：`artifacts/cloud-import/stage-batch2.tar.gz`
    - 云端解压目录：`/tmp/stage-batch2-fixed`
  - 本批次导入数量总计 `36` 条：
    - `awesome-gpt-image-2`: `12`
    - `gpt-comic`: `8`
    - `nano`: `12`
    - `seedance`: `4`
  - 当前累计已导入总计 `62` 条：
    - `awesome-gpt-image-2`: `20`
    - `gpt-comic`: `14`
    - `nano`: `20`
    - `seedance`: `8`
  - 导入状态文件继续沿用：
    - `/tmp/stage-batch1/artifacts/youmind-import/latest/state.cloud-batch1.json`
  - 这轮额外确认的工程约束：
    - Windows `Compress-Archive` 生成的 `zip` 不适合直接给 Linux 解压做 staging，路径里的反斜杠会被保留成文件名，导致 `scripts/...` 与 `docs/...` 无法按目录解析
    - 后续跨平台 staging 统一走 `tar.gz`
  - 下次先做什么：
    - 抽样核对云端页面层是否已能看到第二批分类资源
    - 继续准备第三批，优先补 `nano-comic`，再继续扩 `awesome-gpt-image-2 / nano / seedance`

- 2026-05-04 `docs/02_研究` 云端资源导入第三批已完成：已优先补上 `nano-comic`，并把剩余 `seedance` 全部收口。
  - 第三批 staging 包：
    - 目录：`artifacts/cloud-import/stage-batch3`
    - 归档：`artifacts/cloud-import/stage-batch3.tar.gz`
    - 云端解压目录：`/tmp/stage-batch3`
  - 本批次导入数量总计 `39` 条：
    - `awesome-gpt-image-2`: `10`
    - `nano`: `10`
    - `nano-comic`: `16`
    - `seedance`: `3`
  - 当前累计已导入总计 `101` 条：
    - `awesome-gpt-image-2`: `30`
    - `gpt-comic`: `14`
    - `nano`: `30`
    - `nano-comic`: `16`
    - `seedance`: `11`
  - 当前状态：
    - `seedance` 当前可导入样本已在这轮全部收口
    - `nano-comic` 已正式进入云端内容库，不再是空分类
    - 云端状态文件 `/tmp/stage-batch1/artifacts/youmind-import/latest/state.cloud-batch1.json` 已核对，累计条数与分类计数一致
  - 下次先做什么：
    - 进入页面侧验收，确认 `3107` / 公网环境的精选页分类里已经能看到 `nano-comic` 和新增图片提示词
    - 后续如果继续扩量，优先补 `gpt-comic` 与更多 `awesome-gpt-image-2 / nano`

- 2026-05-04 云端页面侧验收已完成：本轮优先用公网 `http://8.141.20.130/featured` 验收导入结果；本地 `3107` 当时未启动，因此这轮以公网页面为准。
  - 精选页一级分类数量已更新：
    - `全部 646`
    - `工作流 2`
    - `视频提示词 144`
    - `图片提示词 500`
    - `活动 0`
  - 图片提示词页二级分类已验证：
    - `gpt-image-2 296`
    - `nanobanana 204`
    - `midjourney 0`
    - `其他模型 0`
    - 内容母类：`真人 77 / 动画 381 / 场景 10 / 道具 5 / 其他 27`
  - 组合筛选已验证：
    - `nanobanana + 动画` 页面可见新导入 `nano-comic` 资源
    - 已实际打开其中一条新导入详情页：
      - 标题：`电影级动作拼贴分屏`
      - 详情页可正常访问
  - 视频提示词页二级分类已验证：
    - `seedance 144`
    - `kling 0 / happyhorse 0 / wan 0 / 其他模型 0`
    - 内容母类：`真人 52 / 动画 36 / 其他 56`
  - 视频提示词详情页已验证：
    - 已实际打开 `seedance` 分类下详情页
    - 示例标题：`万镜碎虚-测试`
    - 详情页可正常访问
  - 当前结论：
    - 新导入数据不只是落库成功，已经能在公网精选页分类和详情页中实际看到
    - `nano-comic` 现在已从“无内容”变成前台可见分类资源

- 2026-05-04 `docs/02_研究` 云端资源导入第四批已完成：本轮继续做厚图片提示词池，重点扩 `gpt-comic` 与 `nano-comic`，并补充 `awesome-gpt-image-2 / nano`。
  - 第四批 staging 包：
    - 目录：`artifacts/cloud-import/stage-batch4`
    - 归档：`artifacts/cloud-import/stage-batch4.tar.gz`
    - 云端解压目录：`/tmp/stage-batch4`
  - 本批次导入数量总计 `56` 条：
    - `awesome-gpt-image-2`: `12`
    - `gpt-comic`: `16`
    - `nano`: `12`
    - `nano-comic`: `16`
  - 当前累计已导入总计 `157` 条：
    - `awesome-gpt-image-2`: `42`
    - `gpt-comic`: `30`
    - `nano`: `42`
    - `nano-comic`: `32`
    - `seedance`: `11`
  - 当前状态：
    - 图片提示词池四个主要来源里，`gpt-comic / nano-comic` 都已不再是薄层样本
    - 云端状态文件 `/tmp/stage-batch1/artifacts/youmind-import/latest/state.cloud-batch1.json` 已再次核对，累计条数与分类计数一致
  - 下次先做什么：
    - 再做一轮页面侧抽查，看 `gpt-image-2 / nanobanana` 对应计数是否继续上升
    - 后续若继续扩量，可优先补更多 `gpt-comic / nano-comic`

- 2026-05-04 公网 `featured` 提示词数量异常已定位并修复。
  - 问题现象：
    - 新导入图片提示词卡片已经能在前台看到，但数量数字看起来没有同步增长。
  - 根因：
    - 精选页前端统计依赖“提示词库存数组长度”。
    - 该库存读取此前在前后端都被 `500` 条上限截断：
      - 前端缓存层 `featured-image-prompts / featured-video-prompts` 读取上限是 `500`
      - 后端提示词列表接口最大 `limit` 也是 `500`
    - 结果就是：
      - 新内容进入最近列表后，卡片会变化
      - 但计数只能在被截断的 `500` 条窗口内统计，容易出现“内容更新了，数字却不明显变化”的假象
  - 已完成修复：
    - 后端 `PromptQueryService.MAX_LIST_LIMIT` 已提升到 `2000`
    - 前端 `community-public-cache` 中精选页提示词库存拉取上限已提升到 `2000`
    - 修复已同步部署到云端
  - 公网复核结果：
    - 页面：`http://8.141.20.130/featured`
    - 顶部计数已变为：
      - `全部 1,016`
      - `工作流 2`
      - `视频提示词 144`
      - `图片提示词 870`
      - `活动 0`
    - 图片提示词子分类计数已变为：
      - `gpt-image-2 325`
      - `nanobanana 545`
      - `midjourney 0`
      - `其他模型 0`
  - 当前结论：
    - 新导入图片资源已经正确计入公网精选页统计。
    - 如果个别浏览器仍看到旧数字，优先等待缓存刷新窗口（`15s`）或手动强刷一次页面。

- 2026-05-04 `docs/02_研究` 云端资源导入第五、六批已完成：这两批开始按“社区初始数据”口径统一落到固定作者 `community`，同时显式跳过历史脚本自动导入过的 `source_campaign + source_item_id` 组合，避免继续把旧 `ymimport-*` 数据重复灌一遍。
  - 作者口径：
    - 新增导入脚本默认作者模式已切到 `fixed`
    - 默认固定作者：
      - `username: community`
      - `displayName: community`
      - `bio/headline: 社区初始数据`
    - 这轮按用户要求，不碰手动导入到现有作者名下的数据，只处理脚本自动导入的历史数据
  - 去重口径：
    - 新增旧自动导入 `source pair` 导出文件：`artifacts/youmind-import/latest/cloud-seeded-source-pairs.json`
    - 当前导出的历史自动导入 pair 数：`834`
    - 导入时统一通过 `--skip-source-pairs-file` 跳过这些旧 pair
  - 第五批 staging 包：
    - 目录：`artifacts/cloud-import/stage-batch5`
    - 归档：`artifacts/cloud-import/stage-batch5.tar.gz`
    - 云端解压目录：`/tmp/stage-batch5`
  - 第五批实际结果：
    - `awesome-gpt-image-2`: 新增 `120`
    - `nano`: 新增 `222`
    - `gpt-comic`: 因命中历史自动导入 pair，本批目标窗口 `120` 条全部跳过
    - `nano-comic`: 因命中历史自动导入 pair，本批目标窗口 `160` 条全部跳过
  - 第六批 staging 包：
    - 目录：`artifacts/cloud-import/stage-batch6`
    - 归档：`artifacts/cloud-import/stage-batch6.tar.gz`
    - 云端解压目录：`/tmp/stage-batch6`
  - 第六批实际结果：
    - `awesome-gpt-image-2`: 新增 `128`
    - `nano`: 新增 `240`
  - 旧自动导入作者归并：
    - 已新增并修稳脚本：`scripts/reassign-cloud-seeded-prompts-to-community.mjs`
    - 现已可稳定命中并正式执行，不再被 `ON CONFLICT DO UPDATE command cannot affect row a second time` 卡住
    - 本轮 dry-run 与正式执行的命中结果一致：
      - `prompt_entries`: `951`
      - `media_assets`: `86`
    - 归并范围仍只限当前作者 `username like 'ymimport-%'` 的历史自动导入数据，不会碰手动导入作者
  - 当前云端状态文件核对：
    - 远端状态文件：`/tmp/stage-batch1/artifacts/youmind-import/latest/state.cloud-batch1.json`
    - 远端实际条数已核对为 `867`
    - 当前分类分布：
      - `awesome-gpt-image-2`: `290`
      - `gpt-comic`: `30`
      - `nano`: `504`
      - `nano-comic`: `32`
      - `seedance`: `11`
  - 当前结论：
    - `awesome-gpt-image-2` 当前可导入样本 `290` 条已全部进入云端内容库
    - `nano` 已从 `42` 条扩到 `504` 条，云端图片提示词主池明显做厚
    - `gpt-comic / nano-comic / seedance` 的剩余样本当前大多已被旧自动导入 pair 占用，因此继续扩量前应优先看是否还要保留这批历史 `ymimport-*` 内容，还是进一步合并 / 去重
  - 下次先做什么：
    - 页面侧再抽查一次 `http://8.141.20.130/featured`，确认 `gpt-image-2 / nanobanana` 数量和卡片展示继续上升
    - 如果继续扩量，优先补更多 `nano`
    - 再决定是否为 `gpt-comic / nano-comic / seedance` 做更细粒度的历史去重或作者彻底归并

- 2026-05-04 精选页图片提示词 `2000` 上限再次触顶，已在前后端同步抬高读取上限。
  - 触发现象：
    - 图片提示词总量继续增长后，精选页图片提示词数量会卡在 `2000`，前台看起来像“资源没继续导入”。
  - 根因定位：
    - 后端 `PromptQueryService.MAX_LIST_LIMIT` 仍写死为 `2000`
    - 前端 `community-public-cache` 的精选页图片/视频提示词库存拉取也写死为 `limit: 2000`
  - 本次修复：
    - 后端 `MAX_LIST_LIMIT` 已提升到 `10000`
    - 前端精选页提示词库存拉取上限已提升到 `10000`
    - 前端精选页公共读取超时从 `4000ms` 放宽到 `8000ms`，避免数量上升后因超时再次被误判为“没数据”
  - 当前结论：
    - 这是“列表读取上限”问题，不是“云端导入失败”
    - 本地 `apps/web` `tsc --noEmit` 与 `apps/server` `compile` 已通过
    - 云端前后端已重新部署
    - 实测：
      - `GET /api/prompts?modality=image&sort=latest&limit=10000` 已返回 `4297`
      - `GET /api/public/featured-prompts` 在 Next `revalidate=15s` 缓存窗口刷新后，已返回 `image=4297`、`video=144`、`total=4441`
    - 这次也确认了一个排查口径：
      - Spring Boot 已先解除上限
      - 如果精选页短时间内仍看到旧数值，优先看 Next 公共缓存窗口是否还没过，而不是立刻怀疑导入失败

- 2026-05-04 `gpt-image-2` 待补资源复核完成，本轮不再继续补传。
  - 用户诉求：
    - 继续确认 `gpt-image-2` 这条线是否还有待上传资源，并优先把这个分类补完。
  - 本轮先修的问题：
    - `scripts/export-cloud-seeded-source-pairs.mjs` 之前只按历史作者 `ymimport-*` 导出云端已存在 `source pair`。
    - 由于旧自动导入资源已归并到统一作者 `community`，该脚本会错误导出 `0` 条，导致后续 dry-run 存在“把云端已有研究数据误判成未导入”的风险。
  - 本次修复：
    - 已修改 `scripts/export-cloud-seeded-source-pairs.mjs`
    - 导出条件改为同时覆盖：
      - `author.username like 'ymimport-%'`
      - `author.username in ('community')`
    - 导出的 `cloud-seeded-source-pairs.json` 现已包含：
      - `count: 4241`
      - `authorUsernames: ['community']`
  - 复核动作：
    - 用修复后的 `cloud-seeded-source-pairs.json` 重新对两条 `gpt-image-2` 来源做云端 dry-run：
      - `awesome-gpt-image-2`
      - `gpt-comic`
    - 运行口径：
      - `--backend-base-url http://8.141.20.130`
      - `--state-file artifacts/youmind-import/latest/state.cloud-batch1.snapshot.json`
      - `--skip-source-pairs-file artifacts/youmind-import/latest/cloud-seeded-source-pairs.json`
      - `--dry-run true`
  - 复核结果：
    - `awesome-gpt-image-2`
      - 当前研究库有效样本 `290`
      - dry-run 结果全部为 `already-imported`
      - 结论：这条线已经传满，没有剩余待补资源
    - `gpt-comic`
      - 当前研究库有效样本 `252`
      - 其中前 `30` 条为当前状态文件里的 `already-imported`
      - 后续 `222` 条全部命中云端已存在 `source pair`，原因是 `existing-source-item`
      - 结论：这条线也没有“可安全新增”的待补资源；剩余样本已存在于云端历史研究数据中
  - 当前结论：
    - 当前项目里 `gpt-image-2` 两条研究来源都已补到现阶段上限
    - 这次用户感觉“可能还有没上传”的根因不是漏传，而是：
      - 旧 `source pair` 导出脚本漏掉了 `community`
      - 以及页面计数此前曾被 `2000` 上限卡住
  - 下次先做什么：
    - 如果后续还要继续扩 `gpt-image-2`，需要新的研究源或新的分类库，而不是继续重复导当前这两套目录
    - 继续上传时优先转向仍有真实增量空间的资源线，例如 `nanobanana` 或新的图片/视频分类源

- 2026-05-04 开始转向视频提示词 `seedance` 云端扩量。
  - 本地研究目录复核：
    - 目录：`docs/02_研究/youmind-video-assets`
    - 当前共命中 `27` 个 `youmind-seedance-library*` 子库
    - `library-manifest` 总条目：`1531`
    - 按当前导入口径可用的 `A 级 + 有 meta + 有 video.mp4` 样本：`1452`
  - 当前云端基线：
    - 当前状态文件中的 `seedance` 已导入条数：`11`
    - `cloud-seeded-source-pairs.json` 中已存在的 `youmind-seedance|*` pair：`100`
    - 因此前台当前看到的 `144` 不是研究目录总量，而只是云端当前可见的视频提示词数量
  - 第一轮 dry-run：
    - 运行口径：
      - `--kind seedance`
      - `--seedance-limit 200`
      - `--dry-run true`
    - 结果：
      - 可新增：`100`
      - `already-imported`: `11`
      - `existing-source-item`: `89`
    - 结论：
      - `seedance` 仍有较大真实增量空间，可以继续按批次上传
      - 第一批正式导入优先按这 `100` 条新增窗口推进
  - 第一批正式导入已完成：
    - staging 包：`artifacts/cloud-import/stage-batch20-seedance`
    - 取样窗口：前 `200` 条可导样本
    - 实际正式新增：`100`
    - 跳过：
      - `already-imported`: `11`
      - `existing-source-item`: `89`
    - 导入方式说明：
      - 远端服务器回打公网 `http://8.141.20.130` 会超时
      - 已确认测试机内可稳定访问 `http://127.0.0.1:18080`
      - 因此本轮正式导入改为在远端使用本机后端地址执行
    - 远端状态文件回读结果：
      - `seedance` 条数已从 `11` 增长到 `111`
      - 当前状态分布：
        - `awesome-gpt-image-2`: `290`
        - `gpt-comic`: `30`
        - `nano`: `3221`
        - `seedance`: `111`
        - `nano-comic`: `32`
  - 下次先做什么：
    - 继续做 `seedance` 第二批扩量，建议仍按“先 dry-run 再按真实增量窗口正式导入”的节奏推进
    - 等前台缓存刷新后，再复核 `http://8.141.20.130/featured?filter=video_prompt&model=seedance` 的数量是否抬升

- 2026-05-04 已完成 `seedance` 第二到第四批云端正式导入，视频提示词主库扩量完成。
  - 第二批导入前复核：
    - 先直接回读云端状态文件：`/tmp/stage-batch1/artifacts/youmind-import/latest/state.cloud-batch1.json`
    - 复核结果：第二批 `stage-batch21-seedance` 已真实落库，`seedance` 计数已从 `111` 增长到 `511`
    - 结论：之前第二批不是“没成功”，而是“还没回读真实 state”
  - 第三、第四批 staging：
    - `artifacts/cloud-import/stage-batch22-seedance`
      - 选样：`400`
      - 本地文件数：`1829`
      - 本地总大小：`1813870474` bytes
    - `artifacts/cloud-import/stage-batch23-seedance`
      - 选样：`452`
      - 本地文件数：`2135`
      - 本地总大小：`2388509962` bytes
  - 执行过程中的问题与修正：
    - 复用 `scripts/run-cloud-import-stage.mjs` 继续推批次时，本地 `pscp/plink` 在大包上传阶段异常退出，进程返回码：`-1073740791`
    - 为避免反复卡在本地 PuTTY 客户端，本轮改走 `Python + paramiko + SFTP` 直传
    - 远端仍沿用同一执行口径：
      - 上传到 `/tmp/<stage-name>.tar.gz`
      - 解压到 `/tmp/<stage-name>`
      - 导入命令仍调用远端本机后端：`http://127.0.0.1:18080`
      - 状态文件仍写：`/tmp/stage-batch1/artifacts/youmind-import/latest/state.cloud-batch1.json`
      - 去重基线仍使用：`artifacts/youmind-import/latest/cloud-seeded-source-pairs.json`
  - 正式导入结果：
    - `stage-batch22-seedance`
      - 实际新增：`400`
      - `skipped`: `[]`
    - `stage-batch23-seedance`
      - 实际新增：`452`
      - `skipped`: `[]`
    - 两批合计新增：`852`
  - 最终云端状态回读：
    - `seedance` 最终计数：`1363`
    - 计算校验：
      - 研究目录可用样本：`1452`
      - 历史已存在 `existing-source-item`：`89`
      - 可新增上限：`1363`
      - 与当前云端最终计数一致
    - 当前云端状态分布：
      - `awesome-gpt-image-2`: `290`
      - `gpt-comic`: `30`
      - `nano`: `3221`
      - `seedance`: `1363`
      - `nano-comic`: `32`
  - 本地同步动作：
    - 已重新从云端回拉 `state.cloud-batch1.json`
    - 本地快照已更新为：`artifacts/youmind-import/latest/state.cloud-batch1.snapshot.json`
  - 当前结论：
    - `docs/02_研究/youmind-video-assets` 下按当前导入口径可用的 `seedance` 视频提示词已完成本轮全量导入
    - 前台如果暂时还看不到 `1363`，优先怀疑页面缓存 / revalidate 延迟，而不是导入未成功
  - 下次先做什么：
    - 前台复核 `http://8.141.20.130/featured?filter=video_prompt&model=seedance` 的实际展示数量与刷新延迟
    - 再决定是否继续转向其它视频模型线，或回头处理去重与分类细化

### 2026-05-05 report entry + submit flow landed

- 已完成 `T5-1 前台举报入口与举报提交流程` 第一轮正式落地，不再只是占位按钮：
  - 后端 `ReportApplicationService` 已从假响应改为真实写入 `report_tickets`
  - 已补 target 校验、reason 校验，以及“同一用户对同一目标存在 `pending/processing` 举报时禁止重复提交”的保护
  - 当前支持的举报目标已覆盖 `video / workflow / prompt / post`
- 前端已补齐真实提交流程：
  - 新增共享 `ReportModal`
  - 视频/提示词详情页顶部冗余评论数按钮已改为举报入口
  - 工作流详情页顶部冗余评论数按钮已改为举报入口
  - 帖子详情页正文下方冗余回复数按钮已改为举报入口
- 当前这轮没有继续下探后台审核联动、举报阈值预警与待处理池；这些仍归在 `T5-2 / T5-3`
- 本轮验证结果：
  - `npx tsc --noEmit -p apps/web/tsconfig.json` 通过
  - `scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=ReportApiIntegrationTest test` 通过
- 当前做到哪一步：
  - 举报入口、提交流程、后端落库、重复保护已成闭环
  - 管理后台侧消费这些举报单仍待后续联动
- 下次先做什么：
  - 继续 `T5-2`，把举报单和后台人工审核列表串起来
  - 继续 `T5-3`，补举报阈值预警和状态流转

### 2026-05-05 report browser verification + stale-runtime fix

- 已完成 `T5-1` 的浏览器级复检，本地 `3106 -> 18080` 真实链路已经验收通过：
  - `prompt` 详情页：首次举报成功，重复举报可正确返回 `REPORT_DUPLICATE`
  - `workflow` 详情页：举报弹窗、提交、成功提示通过
  - `post` 详情页：正文下方原冗余“回复数”位已替换为举报入口，提交正常
- 这轮复检先抓到一个真实运行态偏差：
  - 激活中的本地后端 `18080` 当时仍是旧运行态，`/api/reports` 还在返回旧的 `statusCode=queued`
  - 这会造成“源码已改好、integration test 已通过，但浏览器验收仍然不对”的假象
  - 已重启本地 `18080` 后端切到最新源码，再次直接调 API 核实：
    - 首次举报返回 `statusCode=pending`
    - 第二次重复举报返回 `REPORT_DUPLICATE`
- 本轮补充验证：
  - PowerShell 直接调用 `POST /api/auth/login` + `POST /api/reports` 已确认运行态与新源码一致
  - Playwright 已验证前端页面能正确显示重复举报错误文案，并带 `Request ID`
- 当前做到哪一步：
  - `T5-1` 已从“代码完成”推进到“源码 / 运行态 / 浏览器页面三层一致”
  - 后续可以直接进入 `T5-2 / T5-3`
- 下次先做什么：
  - 进入 `T5-2`，把举报单查询 / 管理接到后台管理线
  - 进入 `T5-3`，把举报阈值预警、待处理池和状态流转补齐

### 2026-05-06 cloud prompt dedup for community seeded assets

- 已新增脚本 `scripts/deduplicate-cloud-community-prompts.mjs`，用于云端 `community` 初始 prompt 的重复审计与清理；当前去重策略固定为：`author in community` + `modality` + `title` + `prompt_hash(md5(prompt_text_raw/prompt_text))`。
- 本轮先执行 dry-run 审计，再执行 apply，审计产物落在：
  - `artifacts/youmind-import/latest/cloud-prompt-dedup-audit.json`
  - `artifacts/youmind-import/latest/cloud-prompt-dedup-postcheck.json`
- 本轮清理结果：
  - 重复组 `143` 组
  - 软删除重复 prompt `150` 条
  - 收口 `feed_items` 引用 `286` 条
  - 候选重复项上的 `comments / interaction_actions / report_tickets` 实测均为 `0`，因此本轮未发生用户互动丢失风险
- 复检结果：按当前去重规则再次审计后，云库已收口到 `0` 组 / `0` 条残留重复。
- 当前做到了哪一步：云端 `community` 初始 prompt 的主要重复导入已完成数据库级去重，前台公共页在 `15s` revalidate 窗口后应自动反映新结果。
- 下次先做什么：如果还看到“同标题同卡面”残留，再针对剩余“同标题但不同 prompt_hash”的组做第二轮人工抽样，决定是否扩大去重口径；当前不要直接按“同标题”硬删，避免误伤同名不同内容。

### 2026-05-06 clipboard fallback for prompt copy on http environments

- 已修复提示词详情页“复制提示词失败”的根因：之前前端直接依赖 `navigator.clipboard.writeText(...)`，在公网 `http` 场景或部分浏览器权限设置下会直接失败。
- 新增通用 helper：`apps/web/src/lib/browser/copy-text.ts`，策略为：优先走 `navigator.clipboard`，失败或非安全上下文时自动降级到 `textarea + document.execCommand('copy')`。
- 已同步替换四处直接剪贴板调用：
  - `apps/web/src/features/video-detail/VideoDetailPage.tsx`
  - `apps/web/src/features/creator/CreatorPage.tsx`
  - `apps/web/src/features/nano-banana-replica/NanoBananaReplicaPage.tsx`
  - `apps/web/src/features/seedance-replica/SeedanceReplicaPage.tsx`
- 验证：`npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 已通过。
- 已同步到公网前端：`scripts/deploy-test-web.ps1` 执行完成，发布版本为 `/opt/dramatv-community-web/releases/20260506-183216`，`http://8.141.20.130` 前端已切到新版本。
- 当前做到哪一步：公网与本地前端都已具备复制兜底能力，后续类似“复制链接/复制提示词”功能默认复用该 helper，不再裸调剪贴板 API。
### 2026-05-06 inline prompt like on featured/home cards

- Added `viewerActions.liked` to prompt summary responses so prompt inventory cards can render real viewer like state.
- `/featured` and `/home` prompt cards now support inline like from the bottom-right heart; liked state turns red and anonymous users are redirected to `/login?redirectTo=...`.
- Authenticated `featured` / `home` pages now bypass the anonymous public cache for prompt inventory reads, so logged-in users get personalized card state while anonymous traffic keeps cached reads.
- Fixed one related home-card merge issue: prompt inventory `viewerLiked` should no longer be overwritten by feed-side fallback cards.
- Verified with:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml "-DskipTests" compile`

### 2026-05-06 featured prompt inventory cache-size fix

- Root cause confirmed: anonymous `/featured` was still pulling the full prompt inventory through `unstable_cache`, and the public helper route `/api/public/featured-prompts` also tried to cache the same large payload. After the prompt import expansion, that payload grew past Next's per-item data cache ceiling and triggered the `items over 2MB can not be cached` warning during build/deploy.
- This was not a functional crash, but it meant:
  - the intended anonymous cache entry could not be written
  - public featured requests lost most of their cache benefit
  - build/deploy logs kept carrying noisy cache warnings
  - anonymous `/featured` first-screen delivery was heavier than necessary
- Current fix:
  - `loadFeaturedArchivePublicData` no longer embeds the full prompt inventory for anonymous `/featured`
  - anonymous `/featured` renders base feed/workflow content first, then hydrates the large prompt inventory on the client from `/api/public/featured-prompts`
  - `/api/public/featured-prompts` was switched away from `unstable_cache` and is now a dynamic route with short `Cache-Control` headers
- Verification:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - `npm.cmd --prefix apps/web run build`
  - build output no longer reports the `featured-prompts` cache oversize warning

### 2026-05-06 featured prompt inventory hard-limit removal

- 已继续收口 `/featured` 提示词库存的另一个隐患：之前无论是登录态 SSR 还是匿名态 `/api/public/featured-prompts`，底层都依赖单次 `limit=10000` 拉全量数据。
- 这条链路的问题不是“当前一定坏了”，而是：
  - `10000` 本质上是硬上限，库存继续增长后会静默漏数
  - 问题出现时前端只会表现成“新导入资源没显示全”，排查成本高
  - 即便当前总量还没到上限，这种写法也会把“是否完整”绑死在一个魔法数字上
- 当前修复：
  - 后端 `GET /api/prompts` 新增可选 `offset`
  - 前端 `community-service.ts` 新增 `getAllPrompts()`，按 `pageSize=1000` 分批拉取，直到后端返回不足一页为止
  - 登录态 `/featured` 已改用 `getAllPrompts({ modality: "video" | "image" })`
  - 匿名态 `/api/public/featured-prompts` 也已改用同一 helper，不再依赖 `limit=10000`
  - 旧的 `loadFeaturedArchivePromptInventory` 大缓存入口已移除，避免后续误用把大库存重新塞回 `unstable_cache`
- 已补验证：
  - `PromptReadApiIntegrationTest` 新增 offset 分页用例并通过
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - `npm.cmd --prefix apps/web run build`
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=PromptReadApiIntegrationTest test`
- 当前做到哪一步：`/featured` 的提示词库存已经不再被 `10000` 这个单次拉取上限卡住；后续如果库存继续增长，展示链路至少不会先因为硬上限静默漏数。
- 下次先做什么：如果后续库存再明显增大，再把当前“服务端分批拉完后一次返回整包”的模式继续升级成真正的前端分段加载，而不是在内存里先拼完整包。

### 2026-05-07 browser publish-flow addendum

- 宸插畬鎴愬悓涓€娴忚鍣ㄤ細璇濅腑鐨勭湡瀹炲彂甯冨洖鍚堬紝瑕嗙洊鍥剧墖鎻愮ず璇嶄笌瑙嗛鎻愮ず璇嶄袱鏉￠摼璺紝鍒嗗埆鍋氫簡鈥滀笂浼犱繚瀛樿崏绋? -> 鍙戝竷 -> 鏄剧ず鍦ㄧ簿閫夐〉鈥濈殑鐜矾璁よ瘉銆?
- 鍥剧墖鎻愮ず璇嶏細
  - 鎴愬姛涓婁紶鍥剧墖锛氬師濮嬫娴嬭矾寰勪负 `docs/02_研究/youmind-image-assets/nano-banana-library-p001-p030/000011-13330/images/01.jpg`
  - 鍙戝竷鍚庣珛鍗虫杞埌 `http://127.0.0.1:3106/featured?filter=image_prompt`
  - 鏂板彂甯冮」鍦ㄧ簿閫夐〉棣栧睆鍙锛屽悕绉扮‘璁や负 `QA 图片提示词链路验证 2026-05-07`
  - 棰滃€�缁熻鍦?`/featured` 涓凡浠庝笂娆＄殑 `43` 鎺ㄥ崌鍒?`44`
- 瑙嗛鎻愮ず璇嶏細
  - 鎴愬姛涓婁紶瑙嗛锛氬師濮嬫娴嬭矾寰勪负 `docs/02_研究/youmind-video-assets/youmind-seedance-library-p034-p037/409-2334-011c337b6cc1214ef6430f6d1eb78a16/video.mp4`
  - 鍙戝竷鍚庣珛鍗虫杞埌 `http://127.0.0.1:3106/featured?filter=video_prompt`
  - 鏂板彂甯冮」鍦ㄧ簿閫夐〉棣栧睆鍙锛屽悕绉扮‘璁や负 `QA 视频提示词链路验证 2026-05-07`
  - 棣栧睆绗竴寮犺棰戝崱鍙祴鍒板疄闄?`video` 鍏冪礌锛屾簮鍦板潃涓?`/media/community/local/video/source/ef196f3e-b4cf-4c6f-b22b-50f96a108329/video.mp4`
- 鍏ㄧ▼楠岃瘉锛?
  - 鍥剧墖 / 瑙嗛涓や釜鍙戝竷鍒嗘敮鍧囧凡鎴愬姛鍒拌揪绮鹃€夐〉鍒楄〃
  - 鏁伴噺宸叉甯稿悓姝?`图片提示词 44 / 视频提示词 31 / 全部 76`
  - 鏈疆鐪熷疄鍙戝竷鏈啀浜х敓鏂扮殑鎺ュ彛閿欒
- 娴嬭瘯涓彂鐜扮殑涓€涓噺绾︿俊鎭細褰撴祻瑙堝櫒浼氳瘽娌℃湁杩炵画 cookie 鏃讹紝`/api/uploads/image-policy` 浼氱洿鎺ョ粰鍑?`403 Forbidden`锛屽墠绔彧浼氭樉绀哄師濮嬪悗绔敊璇紝涓嶄細鑷姩寮曞鍒扮櫥褰曢〉銆?  - 杩欐槸浼氳瘽澶辨晥鏃剁殑浣撻獙缂洪櫡锛屼笉鏄湰娆＄湡瀹炲彂甯冨姛鑳介槻濉炵偣

### 2026-05-07 browser workflow-detail addendum

- 宸插湪鍚屼竴娴忚鍣ㄤ細璇濅腑闄嗙画澶嶆 `http://127.0.0.1:3106/featured?filter=workflow` 鍜?`/workflows/{id}` 鐨勭湡瀹炶鎯呴摼璺€?
- 工作流卡片 `QA 工作流链路验证 2026-05-07` 可正常从精选页打开到详情页，详情页正文可读，包含 `工作流名称`、`适用场景`、`当前状态`、`评论区`、`相关推荐` 等关键区块。
- 详情页 `← 返回列表` 已验证可回到 `http://127.0.0.1:3106/featured?filter=workflow#featured-item-ac6d6c40-a384-41f7-8ef1-2182094280f7`，说明工作流详情也已接上“返回原列表位置”的统一回链策略。
- 本轮确认的工作流详情文案包括：`QA 工作流链路验证 2026-05-07`、`暂未接入画布入口`、`后续这里会承接由这个流程产出的作品。`
- 当前工作流内容已和图片/视频提示词一样，能够在精选页首屏展示、进入详情、再回到原位置，闭环没有断点。

### 2026-05-08 local discussion-channel cleanup recheck + public regression round 1

- 先按“数据先核实、再决定是否清理”的顺序复核了本地讨论频道问题。
- 本地数据库直接核查 `discussion_channels` 后，当前只剩 5 个正式频道：
  - `prompt-lab / 提示词拆解`
  - `video-production / 视频制作经验`
  - `canvas-workflows / 画布工作流经验`
  - `official-events / 官方活动`
  - `casual-lounge / 闲聊茶水间`
- 同步核查本地 `discussion_threads` 聚合后，当前仅 `video-production` 下有 `2` 条已发布帖子，其余频道均为 `0`；未再发现 `Integration Channel`。
- 结论更新：
  - 上一轮本地 QA 报告里的 `Integration Channel` 残留，当前已不是现态问题
  - 现有本地演示基线已干净，无需再专门补一次讨论频道清理脚本
  - 后续若该问题复现，优先怀疑测试执行过程中插入了临时频道但未走完整清理，而不是前台代码写死
- 随后完成一轮公网 `http://8.141.20.130` 浏览器回归，当前已确认通过：
  - 匿名访问 `/` 正常，首页可浏览
  - 匿名点击首页 `浏览档案` 会被正确重定向到 `/login?redirectTo=%2Ffeatured`
  - 使用公网测试账号 `creator-b / 123456` 登录成功，登录后可进入 `/featured`
  - 公网 `/featured` 当前分类数量正常显示：`全部 5645 / 工作流 2 / 视频提示词 1489 / 图片提示词 4154 / 活动 0`
  - 公网 `/discussions` 左侧也只展示 5 个正式中文频道，未出现 `Integration Channel`
  - 公网帖子详情 `weekly-creator-thread` 可正常打开，正文、评论区、右侧信息列可读
  - 公网从帖子详情点击右上角头像可正常进入 `/me`
- 本轮顺手确认的一个现态差异：
  - 公网帖子详情页当前没有单独的 `返回列表` 文案按钮，仍以面包屑/板块链接回链为主
  - 这和工作流/提示词详情页的显式 `返回列表` 不是同一交互样式，后续若要统一，可作为体验细修项单独收口

### 2026-05-08 public write-path regression round 2

- 已在公网 `http://8.141.20.130/` 用真实浏览器补完一轮“写链路 + 互动链路”回归，测试账号为 `creator-b / 123456`。
- 已通过的真实发布链路：
  - 图片提示词发布：
    - 标题：`公网QA 图片提示词链路验证 2026-05-08`
    - 成功跳转到 `http://8.141.20.130/featured?filter=image_prompt`
    - 精选页首屏可见新卡片
  - 视频提示词发布：
    - 标题：`公网QA 视频提示词链路验证 2026-05-08`
    - 成功跳转到 `http://8.141.20.130/featured?filter=video_prompt`
    - 精选页首屏可见新卡片
  - 工作流发布：
    - 标题：`公网QA 工作流链路验证 2026-05-08`
    - 成功跳转到 `http://8.141.20.130/featured?filter=workflow`
    - 精选页首屏可见新卡片
  - 帖子发布：
    - 标题：`公网QA 帖子发布链路验证 2026-05-08`
    - 发布频道：`官方活动`
    - 成功跳转到 `http://8.141.20.130/discussions?channel=official-events`
    - 讨论区列表可见新帖子
- 已通过的真实互动链路：
  - 在提示词 `万镜碎虚` 详情页中：
    - 点赞成功：`点赞 1 -> 2`
    - 收藏成功：`收藏 0 -> 1`
    - 评论成功：`讨论 3 -> 4`，并看到新评论 `公网QA 评论链路验证 2026-05-08...`
  - 举报提交成功：
    - 在提示词详情页中打开举报弹窗
    - 选择 `垃圾信息/刷屏`
    - 提交后页面出现成功文案 `Report submitted.`
- 本轮确认的共享回归问题：
  - 举报入口并没有真正消失，而是被错误挂在“评论/回复数量按钮”上
  - 提示词详情页点击 `讨论 4` 会弹出举报框
  - 帖子详情页点击 `回复 2` 也会弹出举报框
  - 这说明“举报入口错位”是共享交互回归，不是单页偶发
  - 举报成功文案仍是英文 `Report submitted.`，未完成中文化
- 已新增正式报告：
  - `docs/04_实施设计/社区公网回归测试报告-2026-05-08.md`
- 当前做到哪一步：
  - 公网核心写链路已验证到“基本可用”
  - 当前最明确的公网体验问题不是接口不可用，而是举报入口和举报成功文案的交互/文案回归
- 下次先做什么：
  - 先修复“举报入口挂错位置 + 举报成功文案未中文化”
  - 修完后重跑一轮公网互动链路回归

### 2026-05-07 landing hero overlay cleanup

- 已修复 `/` 首页 hero 在大屏下误叠首张精选卡封面的问题。
- 根因确认：
  - `HomePage.tsx` 之前把 `archiveCards[0]` 取成 `heroCard`
  - hero 背景层又把这张卡的 `coverUrl` 当作 `backgroundImage`
  - 所以首屏视频层下方会隐约透出第一张精选卡的封面，屏幕越大越容易看出来
- 当前修复：
  - 首页 hero 不再读取 `archiveCards[0]` 作为背景图
  - `styles.heroMedia` 只保留纯背景层，视频层继续独立叠加
  - 连带移除了已无用的 `.heroMediaHasImage` 样式，避免后续误挂回去
- 已补验证：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
- 当前做到哪一步：本地首页首屏已经不再混入首卡封面图；下一步把这次前端修改同步到云测试环境并做公网回查。

### 2026-05-07 landing hero overlay synced to cloud

- 已将这轮首页首屏修复同步到云测试环境。
- 发布结果：
  - 前端 release：`/opt/dramatv-community-web/releases/20260507-103815`
  - `dramatv-community-web.service` 已重启并保持 `active (running)`
  - 公网 `http://8.141.20.130/` 与 `http://8.141.20.130/featured` 均返回 `200`
- 当前做到哪一步：云测试环境已带上首页首屏去首卡封面叠层的修复，后续直接做公网视觉验收即可。

### 2026-05-09 related recommendations split to real data

- 已把详情页推荐语义按内容类型拆开，不再共用一套前端占位推荐：
  - 提示词详情页使用真实 `relatedPrompts`
  - 视频 / 工作流详情页使用真实 `relatedVideos` / `videosForWorkflow`
  - 帖子详情页使用真实 `relatedThreads`
- 推荐排序改为后端规则打分，主要看：
  - 作者
  - 分类 / 题材 / 模型组合
  - 标签重合
  - 热度与时间衰减
- 前端已同步改为直接消费真实推荐数据，只有空态时才回落到占位文案。
- 本地验证已完成：
  - `apps/web` `tsc --noEmit` 通过
  - 后端相关读链路集成测试已回归通过
- 当前做到哪一步：
  - 推荐位已经从“占位叙事”切换成“真实数据 + 规则排序”
  - 后续如果继续优化，就是调权重和卡片层级，不再回到前端硬编码推荐

### 2026-05-09 related recommendations synced to cloud and prompt detail rechecked

- 已将这轮“详情页推荐语义分开”的改动同步到云测试环境 `8.141.20.130`。
- 后端发布结果：
  - release：`/opt/dramatv-community-server/releases/20260509-123834`
  - `dramatv-community-server.service` 已重启并保持 `active (running)`
- 前端发布结果：
  - release：`/opt/dramatv-community-web/releases/20260509-123903`
  - `dramatv-community-web.service` 已重启并保持 `active (running)`
- 云端抽查已确认：
  - `提示词详情页` 可正常展示真实 `相关作品`
  - `提示词操作` 卡位已被收口成更轻量的说明区
  - `提示词讨论`、点赞、收藏、返回列表等核心区域仍正常存在
- 当前做完的不是“只改本地”，而是本地完成后已同步到云测试环境，云端与本地这轮推荐分流保持一致。
- 下一步如果继续推进，优先看 `工作流详情页` 和 `帖子详情页` 的同类推荐位是否还需要继续调权重或压缩信息层级。

### 2026-05-09 workflow and discussion detail browser recheck

- 已继续在云测试环境抽查工作流详情页与帖子详情页，确认这轮推荐分流没有只在提示词页生效。
- 工作流详情页当前可见：
  - 真实 `相关推荐`
  - `返回列表` 可回原位置
  - `复制到我的空间` 仍保留在入口位
- 帖子详情页当前可见：
  - 真实 `延伸阅读`
  - 作者信息位、标签位、回复区均正常
  - 帖子侧推荐不再混用工作流卡片
- 这说明这轮“推荐语义分开”已在云端三类详情页都生效，不是只在本地或单页生效。

### 2026-05-09 notification route soft fallback and public smoke

- 已把公网 `/api/me/notifications/recent` 改成软降级输出，后台或会话异常时也返回 `200` + 空列表，不再把通知辅助功能放大成控制台 500/502。
- 公网接口已实测通过：
  - `GET http://8.141.20.130/api/me/notifications/recent`
  - 返回 `200`
  - 返回体为 `{"code":"OK","message":"ok","data":{"items":[]},"requestId":"me-notifications-anonymous"}`
- 这次的目标不是继续扩通知能力，而是先把“通知拉取失败时的噪音”收掉，给评论通知和铃铛交互留一个更稳的底座。

### 2026-05-09 phase5 reports and publish-submit structured logging round

- 这轮继续推进 `Phase 5 / P5-3`，不再只停留在“请求入口能打 requestId + biz”，而是开始把关键真实写链路补到 service 级结构化业务日志。
- 先收口了 `reports` 这一条治理敏感链路：
  - 新增 `apps/server/src/main/java/com/dramatv/community/shared/request/MdcBusinessContextScope.java`
    - 支持在 service 内临时补 `reportId / targetType / targetId` 等业务上下文
    - 退出作用域后自动恢复 MDC
    - 同时把上下文合并回当前 `HttpServletRequest`，保证后续统一异常日志与访问日志也能复用
  - `apps/server/src/main/java/com/dramatv/community/publish/application/ReportApplicationService.java`
    - 举报提交成功、目标不存在、重复举报等分支已补结构化日志
  - `apps/server/src/main/java/com/dramatv/community/admin/reports/AdminReportService.java`
    - 后台举报工单 `processing / close / offline-target / hide-comment` 已补成功 / noop / rejected 日志
  - `apps/server/src/main/java/com/dramatv/community/shared/error/ApiExceptionHandler.java`
    - 统一异常日志会在输出前恢复当前 request 的业务上下文，不再丢 `targetType / targetId / reportId`
- 随后继续收口了 `publish submit` 这条社区主线真实写链路：
  - `apps/server/src/main/java/com/dramatv/community/publish/application/VideoDraftApplicationService.java`
    - `submitDraft()` 现已按真实落库目标补日志
    - 普通视频提交日志会带 `videoId`
    - 视频提示词 / 图片提示词提交日志会自动转成 `promptId`
    - 重复提交等异常场景会把 `draftId + targetType + targetId` 继续挂在 request 上，供统一异常日志复用
  - `apps/server/src/main/java/com/dramatv/community/publish/application/WorkflowDraftApplicationService.java`
    - 工作流提交成功日志已补 `workflowId + draftId + targetType=workflow`
  - `apps/server/src/main/java/com/dramatv/community/publish/application/PostDraftApplicationService.java`
    - 帖子提交成功日志已补 `postId + threadSlug + draftId`
- 这轮新增 / 更新的测试：
  - 新增 `apps/server/src/test/java/com/dramatv/community/shared/request/MdcBusinessContextScopeTest.java`
  - 新增 `apps/server/src/test/java/com/dramatv/community/shared/error/ApiExceptionHandlerTest.java`
  - 新增 `apps/server/src/test/java/com/dramatv/community/publish/application/PublishDraftSubmitLoggingTest.java`
  - 更新 `apps/server/src/test/java/com/dramatv/community/integration/ReportApiIntegrationTest.java`
  - 更新 `apps/server/src/test/java/com/dramatv/community/integration/AdminReportApiIntegrationTest.java`
  - 复用回归 `apps/server/src/test/java/com/dramatv/community/integration/DraftApiIntegrationTest.java`
  - 复用回归 `apps/server/src/test/java/com/dramatv/community/integration/PublishPipelineIntegrationTest.java`
- 已验证：
  - `powershell -Command & '.\scripts\use-local-java17-maven.ps1' -f apps/server/pom.xml '-Dtest=MdcBusinessContextScopeTest,ApiExceptionHandlerTest,AccessLogFilterTest,RequestBusinessContextInterceptorTest' test`
  - `powershell -Command & '.\scripts\use-local-java17-maven.ps1' -f apps/server/pom.xml '-Dtest=ReportApiIntegrationTest,AdminReportApiIntegrationTest' test`
  - `powershell -Command & '.\scripts\use-local-java17-maven.ps1' -f apps/server/pom.xml '-Dtest=PublishDraftSubmitLoggingTest,DraftApiIntegrationTest,PublishPipelineIntegrationTest' test`
- 本轮产出的直接结果：
  - `report create / admin report action / publish submit` 这三类写链路现在都能在日志里带出真实业务对象，而不是只有路径和 requestId
  - 视频草稿提交日志不再把 `video_prompt / image_prompt` 错记成普通 `video`
  - 重复举报、重复提交这类冲突错误，统一异常日志也能带上对应的 `biz`
- 当前做到哪一步：
  - `P5-3` 已不再是纯规划项，已经完成两条最关键真实写链路的落地验证
  - 现在的结构是：请求入口拦截器负责 path/query 业务 ID，service 级 `MdcBusinessContextScope` 负责 body/落库后才知道的业务 ID，`ApiExceptionHandler` 负责失败态兜底输出
- 下次先做什么：
  - 优先把同一套模式继续补到 `media retry / admin media task`
  - 再决定是否继续往 `publish callback / moderation` 推进，避免一次铺太散

### 2026-05-09 phase5 media retry structured logging round

- 这轮继续沿着 `Phase 5 / P5-3` 往下收口，没有新开散点任务，而是把同一套 `request biz + service 结构化日志 + ApiExceptionHandler 失败兜底` 模式继续补到真实可操作的媒体任务重试链路。
- 收口点集中在两条真实写路径：
  - `apps/server/src/main/java/com/dramatv/community/publish/application/MediaTaskApplicationService.java`
    - 公共 `retryOwnedTask()` 现已补 `taskId + targetType + targetId` 作用域上下文
    - 成功重试会打 `media task retry success`
    - 不可重试会先打 `media task retry rejected`，随后统一异常日志继续复用同一份 `biz`
    - `targetType=video/prompt` 会自动派生出 `videoId / promptId`
  - `apps/server/src/main/java/com/dramatv/community/admin/mediatasks/AdminMediaTaskService.java`
    - 后台 `retryTask()` 现已补 `taskId + targetType + targetId` 作用域上下文
    - 成功重试会打 `admin media task retry success`
    - 不可重试会先打 `admin media task retry rejected`，随后统一异常日志继续复用同一份 `biz`
    - 现有 admin audit log 记录逻辑保持不变，只是在应用日志层补齐了真实业务对象
- 这轮新增测试：
  - `apps/server/src/test/java/com/dramatv/community/integration/MediaTaskRetryLoggingIntegrationTest.java`
    - 覆盖公共重试成功
    - 覆盖公共重试失败时 service rejected log + `ApiExceptionHandler` error log 共用同一份 `biz`
    - 覆盖后台重试成功
    - 覆盖后台重试失败时 service rejected log + `ApiExceptionHandler` error log 共用同一份 `biz`
- 这轮复用回归：
  - `apps/server/src/test/java/com/dramatv/community/integration/AdminMediaTaskApiIntegrationTest.java`
  - `apps/server/src/test/java/com/dramatv/community/integration/PublishPipelineIntegrationTest.java`
- 已验证：
  - `powershell -Command & '.\scripts\use-local-java17-maven.ps1' -f apps/server/pom.xml '-Dtest=MediaTaskRetryLoggingIntegrationTest,AdminMediaTaskApiIntegrationTest,PublishPipelineIntegrationTest' test`
- 本轮产出的直接结果：
  - 现在公共媒体任务重试和后台媒体任务重试都能在日志里直接带出真实 `taskId + videoId/promptId + targetType + targetId`
  - 重试被拒绝时，不再只有一个通用 `409`，`ApiExceptionHandler` 也能带着同一份业务上下文落日志
  - `P5-3` 已经不只覆盖举报和发布提交，开始进入媒体治理这类真实运维链路
- 当前做到哪一步：
  - `P5-3` 已完成 `reports`、`publish submit`、`media retry / admin media task` 三组真实写链路
  - 结构上已经验证：path/query 业务 ID 走拦截器，落库后才知道的业务 ID 走 `MdcBusinessContextScope`，失败态统一由 `ApiExceptionHandler` 兜底复用
- 下次先做什么：
  - 优先判断 `publish callback` 还是 `moderation` 更值得继续补结构化业务日志
  - 继续保持按真实写链路收口，不为了“Phase 5 看起来完整”去做泛化过度的抽象

### 2026-05-09 phase5 publish callback and moderation structured logging round

- 这轮继续沿着 `Phase 5 / P5-3` 往下收口，先补了 `publish callback`，随后直接把同一套模式落到后台 `moderation`，没有再把任务停在“二选一待定”状态。
- 先完成 `publish callback` 这条链路的收口：
  - `apps/server/src/main/java/com/dramatv/community/internal/application/InternalCallbackApplicationService.java`
    - `media / audit / workflow_validate` 三类内部回调已统一补成功接受日志
    - 回调入口现在会把 `taskId + targetType + targetId` 或 `taskId + draftId` 先挂进 `MdcBusinessContextScope`
  - `apps/server/src/main/java/com/dramatv/community/publish/persistence/PublishModerationPersistenceService.java`
    - `media callback applied`、`audit callback applied`、`audit callback ignored` 已补结构化日志
    - 这轮修掉了一个关键上下文缺口：即使回调里的 `targetType` 非法，只要请求里带了原始 `targetType/targetId`，忽略日志和异常兜底日志也会继续保留这份原始 `biz`
- 随后完成 `moderation` 这条后台真实写链路的收口：
  - `apps/server/src/main/java/com/dramatv/community/admin/moderation/AdminModerationService.java`
    - `approve / reject / offline / restore` 统一补 `targetType + targetId` 作用域上下文
    - 新增 `admin moderation action success` 结构化日志，显式带出：
      - `operatorId`
      - `authorId / workflowId`
      - `previousPublishStatus -> nextPublishStatus`
      - `previousAuditStatus -> nextAuditStatus`
      - `hasNote`
    - 现有 admin audit log 保持不变，但应用日志层已经能直接定位真实审核对象与状态流转
- 这轮新增 / 更新测试：
  - 新增 `apps/server/src/test/java/com/dramatv/community/integration/InternalCallbackLoggingIntegrationTest.java`
    - 覆盖媒体回调成功日志跨层共享 `videoId/taskId`
    - 覆盖非法审核目标时 `audit callback ignored` 继续保留原始 `prompt` 上下文
  - 新增 `apps/server/src/test/java/com/dramatv/community/integration/AdminModerationLoggingIntegrationTest.java`
    - 覆盖审核通过成功日志带真实 `promptId`
    - 覆盖非法 `targetType` 时 `ApiExceptionHandler` 继续保留 path 层 `targetType/targetId`
  - 复用回归：
    - `apps/server/src/test/java/com/dramatv/community/integration/PublishPipelineIntegrationTest.java`
    - `apps/server/src/test/java/com/dramatv/community/integration/AdminModerationApiIntegrationTest.java`
- 已验证：
  - `powershell -Command & '.\scripts\use-local-java17-maven.ps1' -f apps/server/pom.xml '-Dtest=InternalCallbackLoggingIntegrationTest,PublishPipelineIntegrationTest' test`
  - `powershell -Command & '.\scripts\use-local-java17-maven.ps1' -f apps/server/pom.xml '-Dtest=AdminModerationLoggingIntegrationTest,AdminModerationApiIntegrationTest' test`
- 本轮产出的直接结果：
  - `publish callback` 现在不再只知道“回调打进来了”，而是能在日志里保留真实 `taskId + targetType + targetId`，连非法目标也不会把原始上下文丢掉
  - 后台 `moderation` 的四类真实动作现在都能在日志里直接看见前后状态流转，而不是只剩 admin audit log 的抽象记录
  - `P5-3` 已经从举报、提交、媒体治理继续推进到回调与审核两条更贴近真实运维/治理的链路
- 当前做到哪一步：
  - `P5-3` 已完成 `reports`、`publish submit`、`media retry / admin media task`、`publish callback`、`moderation` 五组真实写链路
  - 结构上已连续验证：path/query 业务 ID 走拦截器，body/落库后业务 ID 走 `MdcBusinessContextScope`，失败态统一由 `ApiExceptionHandler` 兜底复用
- 下次先做什么：
  - 继续挑剩余高价值真实写链路，看是否还存在“写动作成功了，但日志只剩 requestId”的治理盲区
  - 若 `P5-3` 的高价值写链路已基本收口，再评估是否转入下一轮错误码映射或日志噪音治理

### 2026-05-09 phase5 interaction and admin governance structured logging round

- 这轮继续沿着 `Phase 5 / P5-3` 往下收口，没有另开新主线，而是把社区互动写链路和后台治理剩余几组真实写动作一起补到同一套结构化日志口径。
- 先修了一个底层上下文缺口，不再只做单点绕过：
  - `apps/server/src/main/java/com/dramatv/community/shared/request/MdcBusinessContextScope.java`
    - 嵌套作用域现在会基于当前 MDC 合并重算 `bizContext`
    - 这样内层作用域补 `commentId / reportId / draftId` 时，不会把外层 `videoId / targetType / targetId` 冲掉
  - `apps/server/src/test/java/com/dramatv/community/shared/request/MdcBusinessContextScopeTest.java`
    - 已补嵌套作用域回归，显式钉住“外层 target + 内层 comment”合并语义
- 随后完成 `interaction write paths` 这组真实前台互动写链路收口：
  - `apps/server/src/main/java/com/dramatv/community/interaction/persistence/InteractionJdbcPersistenceService.java`
    - 评论创建成功日志现在会稳定带 `videoId/workflowId/promptId/postId + commentId + targetType + targetId`
    - 评论删除成功日志也会保留同一份复合 `biz`
    - 点赞 / 收藏 / 关注失败态继续复用请求层上下文
  - `apps/server/src/test/java/com/dramatv/community/integration/InteractionLoggingIntegrationTest.java`
    - 已覆盖评论创建成功日志
    - 已覆盖评论删除成功日志
    - 已覆盖点赞非法目标失败态
    - 已覆盖自关注失败态
- 再把后台治理侧三组还缺应用日志的真实写动作收口：
  - `apps/server/src/main/java/com/dramatv/community/admin/comments/AdminCommentService.java`
    - `hide / restore / delete / updateTargetSettings` 已补成功日志
    - `deleted` / noop 分支已补 rejected / noop 日志
  - `apps/server/src/main/java/com/dramatv/community/admin/users/AdminUserGovernanceService.java`
    - `updateGovernance` 已补成功日志，显式带 `previousRoleCode -> nextRoleCode`、`previousStatusCode -> nextStatusCode`、`revokedSessions`
    - `resetPassword` 已补成功日志，显式带 `passwordAction`、`identityProviderBefore -> identityProviderAfter`、`revokedSessions`
    - 自操作 / 越权等失败态已补 rejected 日志，继续复用 `managedUserId`
  - `apps/server/src/main/java/com/dramatv/community/admin/feedops/AdminFeedOpsService.java`
    - `updatePageConfig` 已补成功日志，显式带 `pageKey`、`statusCode`、`configuredSlotCount`、`configuredItemCount`
    - `feed-ops` 页面配置失败态现在也能稳定保留 `targetType=feed_ops_page,targetId={pageKey}`
- 这轮新增测试：
  - `apps/server/src/test/java/com/dramatv/community/integration/AdminCommentLoggingIntegrationTest.java`
  - `apps/server/src/test/java/com/dramatv/community/integration/AdminUserGovernanceLoggingIntegrationTest.java`
  - `apps/server/src/test/java/com/dramatv/community/integration/AdminFeedOpsLoggingIntegrationTest.java`
- 这轮复用回归：
  - `apps/server/src/test/java/com/dramatv/community/integration/CommentApiIntegrationTest.java`
  - `apps/server/src/test/java/com/dramatv/community/integration/InteractionApiIntegrationTest.java`
  - `apps/server/src/test/java/com/dramatv/community/integration/AdminCommentApiIntegrationTest.java`
  - `apps/server/src/test/java/com/dramatv/community/integration/AdminUserGovernanceApiIntegrationTest.java`
  - `apps/server/src/test/java/com/dramatv/community/integration/AdminFeedOpsHomeApiIntegrationTest.java`
  - `apps/server/src/test/java/com/dramatv/community/integration/AdminFeedOpsFeaturedApiIntegrationTest.java`
  - `apps/server/src/test/java/com/dramatv/community/integration/AdminFeedOpsDiscussionsApiIntegrationTest.java`
- 已验证：
  - `powershell -Command & '.\scripts\use-local-java17-maven.ps1' -f apps/server/pom.xml '-Dtest=MdcBusinessContextScopeTest,InteractionLoggingIntegrationTest,CommentApiIntegrationTest,InteractionApiIntegrationTest' test`
  - `powershell -Command & '.\scripts\use-local-java17-maven.ps1' -f apps/server/pom.xml '-Dtest=InteractionLoggingIntegrationTest,MdcBusinessContextScopeTest' test`
  - `powershell -Command & '.\scripts\use-local-java17-maven.ps1' -f apps/server/pom.xml '-Dtest=AdminCommentLoggingIntegrationTest,AdminUserGovernanceLoggingIntegrationTest,AdminFeedOpsLoggingIntegrationTest,AdminCommentApiIntegrationTest,AdminUserGovernanceApiIntegrationTest,AdminFeedOpsHomeApiIntegrationTest,AdminFeedOpsFeaturedApiIntegrationTest,AdminFeedOpsDiscussionsApiIntegrationTest' test`
- 本轮产出的直接结果：
  - 评论创建 / 删除这类会跨目标对象和评论对象的日志，`bizContext` 不再丢一半
  - 后台评论治理、账号治理、运营编排三组真实写动作，现在都不再只剩 admin audit log，应用日志也能直接看到真实业务对象和状态变化
  - `P5-3` 已基本覆盖前台互动写链路和后台高频治理写链路，剩余盲区已经明显缩小
- 当前做到哪一步：
  - `P5-3` 已从“请求入口带 requestId”推进到“关键真实写动作成功/失败都能带真实 biz 对象”
  - 当前排障时，评论治理、账号治理、feed 运营配置、互动动作这几类问题，不再需要先靠猜是哪条对象出了问题
- 下次先做什么：
  - 继续盘点是否还剩未覆盖的高价值后台写动作，例如 `admin audit log` 补充语义日志或其余治理入口
  - 如果高价值写链路已基本收口，就转入下一轮 `错误码映射 / 对外文案统一 / 日志噪音治理`
## 2026-05-09 upload logging hardening

- Completed:
  - `apps/server/src/main/java/com/dramatv/community/publish/application/UploadApplicationService.java`
    - upload policy creation and binary upload now emit structured success logs with `assetId`
  - `apps/server/src/test/java/com/dramatv/community/integration/UploadLoggingIntegrationTest.java`
    - covers policy creation and binary upload MDC assertions
- Verified:
  - `powershell -Command & '.\scripts\use-local-java17-maven.ps1' -f apps/server/pom.xml '-Dtest=UploadLoggingIntegrationTest,PublishPipelineIntegrationTest' test`
- Next:
  - continue scanning whether any remaining high-value write endpoints still lack structured logs before switching to error-code mapping and outward message unification

## 2026-05-09 canvas copy logging hardening

- Completed:
  - `apps/server/src/main/java/com/dramatv/community/canvas/application/CanvasApplicationService.java`
    - copy-to-canvas now emits structured success logs with `workflowId / runtimeId / copyTaskId`
  - `apps/server/src/test/java/com/dramatv/community/integration/CanvasCopyLoggingIntegrationTest.java`
    - covers copy success MDC assertions
- Verified:
  - `powershell -Command & '.\scripts\use-local-java17-maven.ps1' -f apps/server/pom.xml '-Dtest=CanvasCopyLoggingIntegrationTest,CanvasReadApiIntegrationTest,CommunitySessionLoggingIntegrationTest,AuthMeApiIntegrationTest,MeReadApiIntegrationTest' test`
- Next:
  - continue scanning remaining high-value write endpoints, especially `upload`, if the current community session and canvas surface stays green

## 2026-05-09 community auth/me logging hardening

- Completed:
  - `apps/server/src/main/java/com/dramatv/community/identity/application/AuthApplicationService.java`
    - community login / logout now emit structured success logs with `targetType=session,targetId={userId}`
  - `apps/server/src/main/java/com/dramatv/community/me/application/MeProfileApplicationService.java`
    - profile update now emits structured success logs with `creatorId={userId}`
  - `apps/server/src/test/java/com/dramatv/community/integration/CommunitySessionLoggingIntegrationTest.java`
    - covers login/logout and profile update MDC assertions
- Verified:
  - `powershell -Command & '.\scripts\use-local-java17-maven.ps1' -f apps/server/pom.xml '-Dtest=CommunitySessionLoggingIntegrationTest,AuthMeApiIntegrationTest,MeReadApiIntegrationTest' test`
- Next:
  - keep scanning remaining high-value write endpoints, especially `canvas` / `upload`, if the current login/profile surface stays green

## 2026-05-09 publish draft CRUD logging hardening

- Completed:
  - `apps/server/src/main/java/com/dramatv/community/publish/application/VideoDraftApplicationService.java`
    - `create/update/delete` now emit structured success logs with `draftId`
    - invalid `draftId` and missing draft states now emit explicit rejection logs
  - `apps/server/src/main/java/com/dramatv/community/publish/application/WorkflowDraftApplicationService.java`
    - `create/update/delete` now emit structured success logs with `draftId`
    - invalid `draftId` and missing draft states now emit explicit rejection logs
  - `apps/server/src/main/java/com/dramatv/community/publish/application/PostDraftApplicationService.java`
    - `create/update/delete` now emit structured success logs with `draftId`
    - invalid `draftId` and missing draft states now emit explicit rejection logs
  - `apps/server/src/test/java/com/dramatv/community/publish/application/PublishDraftSubmitLoggingTest.java`
    - added CRUD logging coverage for video/workflow/post draft flows
- Verified:
  - `& '.\\scripts\\use-local-java17-maven.ps1' -f apps/server/pom.xml '-Dtest=PublishDraftSubmitLoggingTest,DraftApiIntegrationTest' test`
- Next:
  - continue scanning remaining high-value write endpoints, then decide whether to switch to error-code mapping and outward message unification

## 2026-05-19 cloud r2 sync and release metadata formalization

- 已完成测试环境新批次 `r2-20260519-community` 的云同步，前后端都已切到新的测试环境 release：
  - backend: `/opt/dramatv-community-server/releases/20260519-212502`
  - web: `/opt/dramatv-community-web/releases/20260519-212618`
- 已通过标准入口验证：
  - `npm run deploy:test:backend`
  - `npm run deploy:test:web`
  - 两轮都包含 `deploy:verify:pre` 与 `deploy:verify:post:test`
- 已确认云端 current：
  - `release:list:test` 里 backend / web 当前 release 都已切到新批次
  - 远端 `release.json` 已补齐，可作为后续回滚和版本对照依据
- 发布台账已新增：
  - `ops/releases/test-env-release-ledger.md`
- 当前做到哪一步：
  - 社区前台与后端已不再只靠“聊天里记住上次同步到哪”，而是有了明确的稳定基线和新批次发布记录
- 下次先做什么：
  - 继续把这套 `r2` 基线上再往前推进一轮具体业务优化，若要回滚也按 `release:list:test` + `rollback:test:*` 走固定入口

## 2026-05-19 cloud r2 public browser verification

- 已对公网测试环境 `http://8.141.20.130` 完成一轮干净的浏览器级复检，先关闭旧的本地 `3106 / 3206` 标签页并重开 Playwright 页面，避免历史 console 噪音污染本次判断。
- 先做匿名态复检：
  - `/` 可正常打开
  - 点击受保护入口 `进入社区讨论` 会正常跳到 `/login?redirectTo=%2Fdiscussions`
  - 新浏览器会话下 console `error = 0`
- 再做登录态复检，使用 `creator-b / 123456`：
  - 登录后成功落到 `/discussions`
  - `/home`、`/featured`、`/me`、`/canvas`、`/publish` 均可正常打开
  - 铃铛弹层可正常展开
  - 精选页进入提示词详情后，`← 返回列表` 会回到 `#featured-item-*` 原锚点，浏览器内已确认目标卡片仍在当前视口
  - 讨论帖详情页、画布占位页、发布页均能正常渲染，未出现黑屏或循环跳转
- 运行态检查结果：
  - `browser_console_messages(level=error)` 在本次干净会话中始终为 `0`
  - 最近一轮网络请求抽查均为 `200`，包含 `/home`、`/featured`、`/discussions`、`/me`、`/api/me/notifications/recent`
  - `npm run release:list:test` 复核通过，当前云端 release 仍为：
    - backend `20260519-212502`
    - web `20260519-212618`
- 当前结论：
  - 这次云端更新已经生效
  - 本轮验收未发现新的前端报错、登录异常、黑屏、循环跳转或关键页面不可用问题
- 下次先做什么：
  - 若继续推进公网验收，优先补一轮“真实写操作”复检，重点放在发布、互动和举报这些会落库的链路

## 2026-05-21 home section diversification and video hero fallback

- 已针对社区首页做第一轮内容分流：
  - `apps/web/src/lib/prefill/home-resource-catalog.ts`
    - 首页兜底头图的 3 张 hero slide 都补了视频源，避免头图区域只有首张在播、后两张只是图
  - `apps/web/src/features/home/CommunityHomePage.tsx`
    - 首页分区改成按分区伪随机抽样，不再用同一批内容顺序铺满所有栏目
    - 各栏目之间继续保留全局去重，避免同一内容在首屏重复出现
    - 分区池加入 slot + fallback 双层来源，后续后台配置上来后仍可继续接管
- 已做浏览器级复检：
  - `3107` 云镜像首页已看到 3 条视频头图
  - `为你推荐`、`精选画布`、`电视广告`、`动画`、`叙事短片`、`MV`、`创意` 的卡片已开始分流，不再同一批内容重复铺满
  - `3106` 本地 dev 端口已重新拉起，但访问 `127.0.0.1:3106/home` 会按登录态正常回到登录页，属于当前会话状态，不是前端崩溃
- 当前做到哪一步：
  - 首页内容分流已经从“固定同批”推进到“分区抽样 + 头图视频化”
- 下次先做什么：
  - 等后台管理系统上云后，把首页分区的人工配置接进 slot 数据
  - 再补一轮首页视觉和加载体感微调

## 2026-05-21 cloud deploy and public verification for home diversification

- 已把这轮首页分流同步到云测试环境：
  - 发布脚本：`scripts/deploy-test-web.ps1`
  - 发布标签：`home-section-diversification-2026-05-21`
  - 云端 release：`/opt/dramatv-community-web/releases/20260521-132138`
- 发布前后验收结果：
  - `deploy:verify:pre` 通过
  - `deploy:verify:post:test` 通过
  - 云端公网 `http://8.141.20.130/home` 已在登录态下确认能看到新首页分流结果
  - hero 区域已显示 3 条视频头图
  - `为你推荐`、`精选画布`、`电视广告`、`动画`、`叙事短片`、`MV`、`创意` 已按新的分区抽样逻辑展示
- 当前做到哪一步：
  - 本轮首页分流已经完成本地和云端同步
- 下次先做什么：
  - 后台管理系统上云后，把首页各分区的人工配置接到 slot 数据
  - 再做首页卡片的进一步精修和体感优化

### 2026-05-21 discussion composer upgraded to wysiwyg rich editor

- �ѽ� `/discussions/new` �� `textarea + markdown ��ť` ����Ϊ�����ĸ��ı��༭�������������� `# / ** / *` ���ܿ�Ԥ��ȷ��Ч����ģʽ��
- ���ֺ��ĸĶ���
  - ���� `apps/web/src/features/discussions/discussion-rich-content.ts`��ͳһ�������������ĵĸ��ı� schema����Ƶ��ڵ㡢markdown/html ˫��ת�������Ĵ��ı���ȡ�߼���
  - ���� `apps/web/src/features/discussions/discussion-rich-editor.tsx` + `discussion-rich-editor.module.css`�����ӷ���ҳ����֧�����������ñ༭������㼶����б�塢���ӡ��б������á�����顢���롢��ɫ���ֺš�ͼƬ���롢��Ƶ���붼�ڱ༭��ֱ����Ⱦ��
  - `DiscussionComposerPage.tsx` ���л�Ϊʹ���¸��ı��༭������ `textarea`���Ҽ��˵���markdown �ַ�������ʽ�����߼����Ƴ���
  - `discussion-markdown.tsx` �� `discussion-markdown.module.css` ��ͬ���е�ͬһ��ֻ�����ı���Ⱦ���壬Ԥ����������������ҳ�ɼ������ѵ�ǰ `content` �ַ�������������������ֺš���ɫ����Ƶ��͸��ı� HTML ���ġ�
- ��ǰ�Ա��ֺ�� `content_text` ��Լ���䣺
  - �༭����ͨ�� `content` �ַ������˽�����
  - Ϊ����������·���༭��������ȱ��� HTML ������ģ�
  - �� markdown �����Կɱ�������ȡ����Ⱦ��
- ����֤��
  - `apps/web -> npm.cmd run typecheck` ͨ����
- ��ǰ������һ����
  - ���ı��༭������ֻ����Ⱦ��������ǰ�������ϣ���һ����Ҫ����������� `/discussions/new` ��ʵ�ʽ����뷢��������ҳ���Ա��֡�
- �´�����ʲô��
  - ��������ձ���/��ɫ/�ֺ�/ͼƬ/��Ƶ�����Ƿ�Ԥ�ڹ�����
  - ���������б�ժҪ¶�� HTML Ƭ�Σ��򲹺�� `buildExcerpt` �ĸ��ı�ժҪ��ϴ����
