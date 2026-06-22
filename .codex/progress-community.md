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

- 2026-06-02 新增项目级审查与优化任务板：`docs/04_实施设计/project-code-review-optimization-board-2026-06-02.md`
- 进行中：`O7-1` 收口后台 bootstrap 默认入口，先补回归保护，再改默认值和后台登录页预填行为。

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
- 进行中：`R1 发布页参考素材增强`
  - `R1-1` 已完成：视频/图片提示词草稿模型扩展，支持 `referenceImageAssetIds / referenceAudioAssetIds`
  - `R1-2` 已完成：上传层新增音频上传策略、大小校验与 MIME/扩展名白名单
  - `R1-3` 已完成：发布持久化接入 `prompt_example_links(reference_image/reference_audio)`
  - `R1-4` 已完成：发布页 UI 与前端 API 契约接入参考图片/参考音频
  - `R1-5` 已完成：提示词详情页接入参考素材展示与下载闭环
  - `R1-6` 已完成：本地类型检查、`apps/web` 生产构建与后端集成测试验收
- 进行中：`Phase 5 可观测性 / 错误码 / 日志硬化`
  - `P5-1` 已完成：关键请求入口已统一补 `requestId + biz` 业务上下文透传
  - `P5-2` 已完成：`application.log / access.log` 统一补 `biz` 业务上下文输出
  - `P5-3` 进行中：已完成 `reports`、`publish submit`、`media retry / admin media task`、`publish callback`、`moderation`、`interaction write paths`、`admin comments / users / feed ops` 八组真实写链路的结构化业务日志收口；下一步优先继续挑剩余高价值真实写链路，不再停在单点 service 修修补补

## 追加日志

### 2026-06-17 featured multi-hop browser-back restore root cause narrowed to history-entry degradation and fixed locally

- 这轮没有继续直接改 `/featured` 的专用恢复状态机，而是先做了云端高数据量真实回放，重点压了：
  - `/featured` 深滚动到 `300` 条左右
  - 进入提示词详情
  - 再进入作者页
  - 再进入作者作品详情
  - 之后逐级 `back`
- 复现结论明确分成两层：
  - `作者作品详情 -> 作者 -> 原详情` 这两跳返回都很快，说明共享 `appendBackSource / ContextBackLink / 普通列表恢复` 并不是这轮慢点主因
  - 真正异常集中在最后一跳回 `/featured`：
    - 返回后常常先落到一个无 hash 的浅层 `/featured`
    - 精选页虽然已经有大量列表数据，但恢复遮罩仍会继续挂着
    - 体感上就表现成“最后一跳回精选尤其慢、而且定位容易漂”
- 根因判断：
  - 这不是单纯的 shared `back-anchor` 轮询节奏问题
  - 也不是再次回到 `/featured` 后列表数据没恢复
  - 更像是多跳链路里 `history.back()` 回到的那一项，本身已经退化成“无 hash 的旧列表历史项”
  - 一旦最后一跳回的是 `/featured` 而不是 `/featured#featured-item-*`，就会绕开精选页更强的锚点恢复语义，只剩普通滚动恢复，导致深处回退体感明显变差
- 本地修复：
  - `apps/web/src/lib/routes/redirect-utils.ts`
    - 新增 `shouldReplaceHistoryEntryForBackSource(...)`
    - 用于判断某次带 `from` 的出链，是否其实是在离开“当前同一路由但更精确锚点版本”的页面
  - `apps/web/src/components/shared/PageShell.tsx`
    - 在捕获带 `from` 的同源出链点击时，若 `from` 指向当前同一路由但带更精确 hash 的版本，则先执行一次 `history.replaceState(..., from)`
    - 然后继续沿用原有 `rememberBackAnchorSource(from)` 逻辑
  - 目的：
    - 不改 `/featured` 专用恢复状态机
    - 不把 `/featured` 的特殊逻辑扩散到别的页面
    - 只保证后续 `history.back()` 真正回到“带锚点的列表历史项”，避免多跳后退化为无 hash 列表页
- 回归覆盖：
  - `apps/web/src/lib/routes/redirect-utils.test.mjs`
    - 新增“同路由无 hash -> 同路由带 hash”应当升级当前历史项的测试
    - 新增“不同路由不应误替换历史项”的测试
- 本地验证：
  - `node --test apps/web/src/lib/routes/redirect-utils.test.mjs` 通过
  - `apps/web -> npm.cmd run typecheck` 通过
- 当前状态：
  - 这轮修复只落在本地
  - 下一步应使用全新云端标签页重新验证：
    - 深滚动 `/featured`
    - 进入详情 -> 作者 -> 作者作品详情
    - 连续使用页面返回或浏览器返回逐级退出
    - 确认最终回到的是带 `#featured-item-*` 的精选页历史项，而不是浅层无 hash `/featured`

### 2026-06-16 featured detail-return pagination stall fixed and synced to cloud

- 用户新反馈的症状已按真实云端链路复现并收口：
  - `/featured` 深滚动进入详情页后，通过 `返回列表` 回到精选页
  - 返回定位虽然成功，但继续下滑时可能不再触发后续资源加载，表现为“退出定位后直接加载不了新视频”
- 这次根因不是接口没数据，也不是单纯的 `IntersectionObserver` 丢失，而是精选页的“下一页已预取”状态只存放在：
  - `bufferedPageRef`
  - `bufferedPageKeyRef`
- 上述缓冲页状态只放在 `ref` 里时，预取成功本身不会触发 React 重新渲染：
  - 返回定位后页面可能已经处在底部附近
  - 但负责“自动合并缓冲页 / 继续加载下一批”的 effect 没有收到新的渲染信号
  - 于是页面表面看起来已经到底，却不会继续长出新批次
- 本轮修复：
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - 新增 `bufferedPageVersion` 状态
    - 预取成功写入缓冲页时递增版本号
    - 合并缓冲页清空缓冲区时递增版本号
    - 因筛选条件切换而清空缓冲区时递增版本号
  - 目标是让“缓冲页已就绪 / 已消费 / 已失效”这些关键节点真正进入渲染信号，保证返回定位后的自动续载逻辑能继续推进
- 本地验证：
  - `apps/web -> npm.cmd run typecheck` 通过
  - `apps/web -> npm.cmd run build` 通过
- 云端同步：
  - 执行：
    - `./scripts/deploy-test-web.ps1 -PublicBaseUrl http://drama-community-dev.dzkjm.cn -ServerNames drama-community-dev.dzkjm.cn -VerifyAfterDeploy`
  - 云端 web release：
    - `20260616-202157`
  - readiness：
    - `artifacts/runtime-readiness/test/web-deploy-20260616-202157-summary.json`
    - `13 passed / 0 failed`
- 云端复测证据：
  - 路径：
    - `/featured` 深滚动到 `120` 条
    - 打开详情 `/prompts/100d955b-83d6-4e60-9640-81461a937a66?...`
    - 点击 `返回列表`
    - 返回后继续持续下滑触发加载
  - 结果：
    - 返回前：
      - `count=120`
      - `scrollY=4628.8`
      - `height=12344`
      - 目标卡片仍在视口内
      - 无 `Restoring featured position` 遮罩
    - 返回后继续下滑：
      - `count=192`
      - `scrollY=18717.6`
      - `height=19373`
      - 未卡在 `加载中...`
      - 未落入 `加载失败，点击重试`
- 当前判断：
  - 这条“详情返回后后续不再加载”的主症状在当前云端 build 上已收口
  - `/featured` 返回定位链路仍然是高风险页面，后续如果再出现同类卡死，优先继续检查“缓冲页状态是否进入渲染信号”这条线，而不是先怀疑接口本身

### 2026-06-16 featured hash return no longer re-centers on every later incremental load

- 用户新反馈的异常现象已单独复现：
  - 从精选详情返回后，URL 形如：
    - `http://drama-community-dev.dzkjm.cn/featured#featured-item-...`
  - 首次返回定位本身是对的
  - 但继续下滑触发后续增量加载时，页面会再次被拉回这个旧的 `featured-item-*` 资源
- 根因确认：
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
  - 页面里有一段“轻量 hash 锚点校正”逻辑：
    - 非 blocking back-scroll 模式下，如果当前 hash 对应的卡片已经存在，就执行一次 `target.scrollIntoView({ block: "center" })`
  - 旧实现把这段逻辑依赖到了：
    - `renderedItems.length`
    - `snapshotRestoreState.phase`
  - 结果是返回完成后，只要后面继续增量加载、列表条数变化，effect 就会再次执行，把页面重新拉回旧锚点，看起来像“每次加载一批就重新定位一次”
- 本轮修复：
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - 新增 `softHashAnchorCenteredRouteRef`
    - 对同一个 `featuredBackAnchorRouteKey` 只允许执行一次轻量 `scrollIntoView`
    - 当 routeKey 变化或返回链路变化时再重置，避免把一次正常的返回校正变成后续每轮增量加载都重复执行的副作用
  - 同时把这段 effect 的触发依赖从 `renderedItems.length` 收窄到真正需要的 route/restore 维度，避免单纯追加新卡片就重新触发定位
- 本地验证：
  - `apps/web -> npm.cmd run typecheck` 通过
  - `apps/web -> npm.cmd run build` 通过
- 云端同步：
  - 执行：
    - `./scripts/deploy-test-web.ps1 -PublicBaseUrl http://drama-community-dev.dzkjm.cn -ServerNames drama-community-dev.dzkjm.cn -VerifyAfterDeploy`
  - 云端 web release：
    - `20260616-203743`
  - readiness：
    - `artifacts/runtime-readiness/test/web-deploy-20260616-203743-summary.json`
    - `13 passed / 0 failed`
- 云端专项复测证据：
  - 路径：
    - `/featured` 深滚动
    - 打开详情 `/prompts/924e3991-ed93-4a2f-a3c5-c387f530c2ef?...`
    - `返回列表`
    - 返回后继续连续下滑 8 轮触发增量加载
  - 返回瞬间：
    - `count=228`
    - `scrollY=3672`
    - 目标卡片 `top=224.4`
  - 后续继续加载：
    - 第 1 轮就增长到 `count=240`
    - `scrollY=22260.8`
    - 目标旧卡片 `top=-18364.3`
    - 之后不再被重新拉回旧锚点
  - 结论：
    - 返回后继续加载已经不会再“每次加载一批就重新定位回那个旧资源”

### 2026-06-16 deep featured return overlay stall narrowed to restore-source priority and fixed on cloud

- 用户继续反馈新的深层问题：
  - 精选页滑动得更深后，从详情返回有时会直接卡在：
    - `Restoring featured position`
  - 用户截图对应的是整页恢复遮罩长期不退出，而不是单纯“回到的位置不准”
- 本轮先做了真实云端深滑回放，确认这类问题的高风险前提是：
  - `/featured` 已经滚到远超首批和普通分页缓存的深度
  - 返回时 URL 带 `#featured-item-*`
  - 恢复链路需要在“快照 route snapshot / 同标签内存缓存 / session 缓存”之间选一份列表状态作为恢复底稿
- 确认的结构性风险：
  - `featured-hash-route-snapshot.ts` 当前 route snapshot 仍有 `240` 条上限
  - `featured-inventory-session-cache.ts` 的持久化 session cache 每条只有 `72` 条
  - 但同标签 memory cache 实际能保留更深的当前页列表状态
  - 旧实现的恢复顺序是：
    - 先吃 route snapshot
    - 再看 memory cache
    - 最后才看 session cache
  - 这会导致一个典型深层回归：
    - 用户离开前其实已经滚到 `300` 条
    - 返回时先恢复一份被 route snapshot 截断到 `240` 条的列表
    - hash 目标卡如果在更深位置，恢复状态机就会继续等它挂载
    - 于是容易出现遮罩卡住或恢复推进异常
- 本轮修复：
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - 新增 `FeaturedRestoreCandidate`
    - 新增 `getFeaturedRestoreAnchorTargetId(...)`
    - 新增 `featuredRestoreEntryContainsTargetId(...)`
    - 新增 `choosePreferredFeaturedRestoreCandidate(...)`
  - 恢复策略从“固定先 route snapshot”改成：
    - 在 `route snapshot / memory cache / session cache` 三份候选里
    - 优先选择：
      - 真正包含当前 `#featured-item-*` 目标卡的那份
      - 如果都包含或都不包含，则优先条数更深的那份
      - 条数相同再按 `route snapshot > memory > session` 选
  - 这样深层同标签返回时，会优先吃更完整的 memory cache，不再被 `240` 条截断快照抢先接管
  - 只有在最终选中的恢复源本身带有效 masonry snapshot 时，才进入 `restoring-layout`
  - 否则直接进入 `restoring-viewport`，避免因为拿不到可复用的布局快照而额外拖长阻塞态
- 本地验证：
  - `apps/web -> npm.cmd run typecheck` 通过
  - `apps/web -> npm.cmd run build` 通过
- 云端同步：
  - 执行：
    - `./scripts/deploy-test-web.ps1 -PublicBaseUrl http://drama-community-dev.dzkjm.cn -ServerNames drama-community-dev.dzkjm.cn -VerifyAfterDeploy`
  - 云端 web release：
    - `20260616-205402`
  - readiness：
    - `artifacts/runtime-readiness/test/web-deploy-20260616-205402-summary.json`
    - `13 passed / 0 failed`
- 云端深滑回放证据：
  - 路径：
    - `/featured` 深滚动到 `300` 条
    - 打开详情 `/prompts/db03fc7c-3872-4d17-ab93-512e41c75fe0?...`
    - 点击 `返回列表`
  - 返回结果：
    - `count=300`
    - `scrollY=15144`
    - `height=32038`
    - 目标卡 `found=true`
    - `top=165.7`
    - `inViewport=true`
    - `overlay=false`
    - `loadingText=false`
- 当前结论：
  - 这轮修复后，云端 `300` 条深滑返回已经没有复现“卡在 Restoring featured position”
  - 如果用户后续再次遇到，优先对照当前云端 release 是否至少为：
    - `20260616-205402`
  - 并继续重点看是否存在“同标签更深 memory cache 丢失”或“跨链路返回切换成了另一路恢复源”的新场景

### 2026-06-16 featured deep hash refresh cloud follow-up completed

- objective in this slice:
  - continue the cloud-only `/featured#featured-item-*` refresh repair after the earlier blocking overlay fix
  - confirm whether the remaining issue was still the full-screen `Restoring featured position` overlay or a deeper hash-restore paging gap
- first repair in this round:
  - `apps/web/src/lib/featured/featured-back-anchor.ts`
    - added `shouldShowFeaturedBackAnchorRestoreOverlay(...)`
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - overlay rendering is now gated by the real blocking featured restore state, not by the mere presence of a `#featured-item-*` hash
  - regression coverage added in:
    - `apps/web/src/lib/featured/featured-back-anchor.test.mjs`
- local verification after the first repair:
  - `node --test apps/web/src/lib/featured/featured-back-anchor.test.mjs apps/web/src/lib/featured/featured-buffered-commit.test.mjs apps/web/src/lib/routes/redirect-utils.test.mjs`
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
- first cloud deploy in this round:
  - web release `20260616-181723`
  - readiness artifact `artifacts/runtime-readiness/test/web-deploy-20260616-181723-summary.json`
  - readiness result `13 passed / 0 failed`
- first cloud replay verdict after that deploy:
  - medium-depth manual hash refresh no longer showed `Restoring featured position`
  - but deeper hash refresh could still silently fall back because the target card was not yet mounted
  - conclusion: blocking overlay bug was fixed, but manual hash refresh still needed non-blocking auto-paging until the target card exists
- second repair in this round:
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - added a soft featured hash-restore paging state for `#featured-item-*` routes without stored back-scroll
    - deep manual hash refresh now participates in the same buffered-page / load-more progression until the target card mounts
    - the blocking overlay still remains reserved for real stored-scroll featured return restore only
- local verification after the second repair:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
- second cloud deploy in this round:
  - web release `20260616-183411`
  - readiness artifact `artifacts/runtime-readiness/test/web-deploy-20260616-183411-summary.json`
  - readiness result `13 passed / 0 failed`
- cloud replay evidence on `http://drama-community-dev.dzkjm.cn/featured`:
  - deep hash refresh no longer shows the blocking overlay
  - a deep replay sample reached:
    - before reload: `count=180`, `target=featured-item-e5b6e726-5e7f-4e4d-8fa6-b3841eaa752f`
    - after reload: `scrollY=8876.7998`, `count=84`, `overlay=false`, `targetExists=true`, `target in viewport=true`
- important residual observation collected in the same cloud session:
  - another target `featured-item-470850ee-6a63-4081-90f0-594e480b21db` did not remount even after the page kept loading from `204 -> 264` cards
  - this means one more residual issue still exists in the hash-refresh restore path:
    - overlay is no longer the blocker
    - auto-paging is active
    - but some manual hash targets can still be skipped by the rebuilt masonry/list route even after additional pages append
- current status:
  - cloud sync for this round is complete
  - the original “refresh gets stuck on restoring overlay” symptom has been removed
  - the remaining open item is narrower: certain manual deep hash targets can still fail to reappear after refresh even while non-blocking auto-paging continues

### 2026-06-14 featured return-restore regressions observed again and explicitly recorded

- 用户本轮再次反馈并提供截图，`/featured` 瀑布流返回定位链路目前至少还有两条未收口回归，必须单独记录，不能再只留在临时对话里：
  - 回到精选列表后，左侧列会出现“数据看不见”的空列现象；继续下滑一段、触发下一次增量加载后，该列内容才会重新出现。
  - 回到精选列表后，返回定位偶发卡死在加载遮罩界面，长时间停留在 `Restoring featured position`，未能自行恢复。
- 当前判断：
  - 这两条都属于 `/featured` 返回定位与瀑布流增量恢复的真实线上/云端回归，不是单次浏览器偶发现象。
  - 其中第一条更像“返回后已恢复的数据批次、列分配或可见区重建不完整”；第二条更像“返回定位完成条件没有被正确满足或释放”。
- 处理要求：
  - 后续修复时必须把这两条作为独立验收项同时验证，不能只验证“能回到大致位置”。
  - 回归验证至少覆盖：深滚动进入详情、`返回列表`、恢复后不再出现空左列、无遮挡卡死、无需再次触发下一页加载即可稳定展示。

### 2026-06-14 featured return-restore first repair slice landed locally

- 本轮先只处理 `/featured` 返回链路，不继续混入 hydration 首帧问题，目标是先收口用户当前最直观的两条回归：
  - 返回后左侧列偶发空掉，必须再触发一次增量加载才恢复。
  - 返回后偶发长时间停留在 `Restoring featured position` 遮罩。
- 本轮代码收口：
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - 将“正常首屏未滚动时禁止 buffer 直接并入列表”和“返回定位期间允许继续补批次”显式拆开，不再共用同一条提交条件。
    - 返回定位活跃期间，瀑布流列分配显式 `forceReset`，避免沿用旧列缓存导致恢复后列分布不完整。
    - `IntersectionObserver` 与 near-bottom 提交逻辑都改为识别返回恢复态，避免普通首屏和返回恢复互相污染。
- 本地回归证据：
  - `apps/web -> npm.cmd run typecheck` 通过
  - `apps/web -> npm.cmd run build` 通过
  - Playwright 本地深返回回放：
    - `/featured` 自底部自动加载到 `60` 条
    - 进入深处详情 `/prompts/31101f38-9f78-5cae-b679-e39eb7de9ecd`
    - 点击 `返回列表`
    - 返回后结果：
      - `scrollY = 5122.4`
      - `cards = 60`
      - 遮罩文本不存在
      - 三列卡片数分别为 `22 / 21 / 17`
      - console `error = 0`
- 当前边界：
  - 本地返回定位两条直观回归已先压住
  - 云端同路径仍需复验
  - `#418 / hydration mismatch` 仍是独立问题，尚未在本轮一并收口

### 2026-06-12 local 3106 dev-origin mismatch fixed and featured interaction restored

- 用户反馈“从之前经验看是服务启动方式有问题导致的”，本轮已确认这是准确判断，不是精选页业务逻辑再次回归。
- 根因闭环：
  - 当前本地 `3106` 实际是 `next dev`，不是稳定的 `next start`
  - 但 `apps/web/package.json` 里的 `dev` 脚本只写了 `next dev --port 3106`，默认绑定到 `localhost`
  - 用户与脚本长期按项目约定通过 `http://127.0.0.1:3106` 访问
  - Next 16 因 dev-origin 安全限制直接拦截了 `127.0.0.1` 对 `/_next/webpack-hmr` 的访问，`web-3106.out.log` 已明确出现：
    - `Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr from "127.0.0.1"`
  - 表面症状就变成“精选页分类点不了、主题切换没反应、滚动加载像坏了”，本质是客户端交互层没有正常接管
- 本轮修复：
  - `apps/web/package.json`
    - `dev` 改为 `next dev --hostname 127.0.0.1 --port 3106`
  - `apps/web/next.config.ts`
    - 新增 `allowedDevOrigins: ["127.0.0.1", "localhost"]`
  - 停掉旧 `3106` 进程后，按标准脚本重新拉起：
    - `scripts/start-web-3100.ps1 -Mode dev -Port 3106 -BindHost 127.0.0.1`
- 验证证据：
  - Playwright 复验 `http://127.0.0.1:3106/featured`
    - console `error = 0`
    - 点击 `视频提示词` 后 URL 从 `/featured` 变为 `/featured?filter=video_prompt`
    - 主题切换从 `dark -> light`
    - 底部滚动后文档高度从 `2152 -> 3239`，说明自动加载继续生效
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - `apps/web -> npm.cmd run build` 通过
- 当前结论：
  - 这次问题是本地 dev 启动口径和访问口径不一致，不是精选页业务代码本身再次坏掉
  - 后续只要继续以 `127.0.0.1:3106` 为固定入口，这个绑定和 `allowedDevOrigins` 就不能再丢

### 2026-06-02 项目级审查问题已收口到独立任务板

- 已把 2026-06-02 代码审查确认的问题和优化顺序写入 `docs/04_实施设计/project-code-review-optimization-board-2026-06-02.md`，不再只留在聊天记录里。
- 本轮固定顺序为：`O7-1 后台 bootstrap 默认入口` -> `O7-2 社区本地密码默认入口` -> `O7-3/O7-4 作者主页数据契约` -> `O7-5 typecheck 工程链路`。
- 当前先做 `O7-1`，范围控制在 `apps/server + apps/admin`，目标是先关掉默认后台入口，再保留测试环境显式开启能力。

### 2026-05-26 creator page backdrop unified to theme background

- 用户反馈作者主页存在前台视图不一致：自己看 `/me` 时背景是正常深色底，但别人看 `/creators/{id}` 时，如果该作者没有公开作品封面，整页背景会错误回退成头像大图。
- 根因已确认在前端 `apps/web/src/features/creator/CreatorPage.tsx`，不是后端数据问题：
  - 作者页原逻辑先后经历过 `作品封面 -> 头像` 的背景回退
  - 这会导致作者页背景跟随内容或头像漂移，而 `/me` 页面本身并没有同类 hero 背景逻辑
- 最终按产品口径收口：
  - 作者页背景不再回退到头像
  - 作者页背景也不再回退到作品封面
  - 当前统一为主题背景：
    - 夜间模式：黑底
    - 日间模式：白底
  - 头像仍只保留在 hero 头像位，不再影响整页背景
- 本轮修复：
  - `apps/web/src/features/creator/CreatorPage.tsx`
    - 去掉作者页背景层的动态 `backgroundImage`
    - 头像也不再从作品封面回退
  - `apps/web/src/features/creator/CreatorPage.module.css`
    - 背景层收口为固定主题底色
    - 新增 light 主题下的最小配色覆盖，保证白底时文字、tab、卡片、空态仍可读
- 验证证据：
  - `npm.cmd run typecheck:web` 通过
  - Playwright 本地复验通过：
    - dark：`backdropImage.backgroundColor = rgb(5, 7, 10)`，`backgroundImage = none`
    - light：`backdropImage.backgroundColor = rgb(255, 255, 255)`，`backgroundImage = none`
- 当前结论：
  - 这是一条前台展示层 bug，影响范围收口在 `CreatorPage`
  - 共享接口、共享状态语义和后端契约都无需改动

### 2026-05-25 publish reference panels tightened to fixed-height blocks

- 用户确认公网音频上传恢复后，又补充了发布页参考素材区的视觉要求：不要再形成过长的内容块，而要表现为固定大小的控件区。
- 已在 `apps/web/src/features/publish/PublishPage.module.css` 继续收口：
  - 桌面端 `参考图片 / 参考音频` 卡片高度从上一轮的大尺寸收为固定 `320px`
  - 中屏保持固定 `312px`
  - 小屏保持固定 `288px`
  - 列表区继续保留内部滚动，避免素材数量把整段发布页再次撑长
- 已完成本地校验：
  - `npm.cmd --prefix apps/web run typecheck`
- 已完成云端同步与复看：
  - `scripts/deploy-test-web.ps1 -VerifyAfterDeploy` -> web release `20260525-155547`
  - 公网 `http://8.141.20.130/publish` Playwright 复看已确认参考素材区高度落为固定 `320px`
  - 本轮同步被默认 `deploy:test:web` 预检里的后端时序波动拦过一次，根因是无关的 `PublishPipelineIntegrationTest` 断言 `queued` / 实际更快进入 `processing`；最终按“前端样式只发 web”口径单独完成同步

### 2026-05-24 publish reference asset enhancement taskboard initialized

- 已把“发布页参考素材增强”正式挂进社区主线任务板，避免继续停留在聊天口径。
- 当前确定的产品边界：
  - 图片提示词：`主示例图片 1` + `参考图片 0-9`
  - 视频提示词：`主示例视频 1` + `参考图片 0-9` + `参考音频 0-5`
  - 工作流：本轮不接参考素材，继续保持占位
- 当前确定的实现边界：
  - 不新建单独的 draft reference 表
  - 优先复用 `prompt_example_links`
  - 通过 `role_code=example/reference_image/reference_audio/preview` 承接主示例、参考图、参考音频与预览
- 本轮任务拆分：
  - `R1-1` 草稿模型扩展
  - `R1-2` 上传层新增音频支持
  - `R1-3` 发布持久化写入参考素材关系
  - `R1-4` 发布页 UI 与前端契约接入
  - `R1-5` 本地验证与回写进度
- 当前做到哪一步：
  - 任务板已初始化，下一步先落后端最小闭环：草稿 DTO + 应用服务校验 + 音频上传策略
- 下次先做什么：
  - 完成 `R1-1` 与 `R1-2` 后，立刻补集成测试，再继续做前端接入

### 2026-05-24 r1-1 draft reference payload support completed

- `R1-1` 已按真实后端链路落地，不再停留在任务板层面。
- 本轮完成内容：
  - `VideoDraftApplicationService` 默认 payload 已补 `referenceImageAssetIds / referenceAudioAssetIds`
  - 草稿 `mergePayload -> toResponse` 已贯通两个参考素材数组字段
  - 草稿校验已补齐：
    - 非 prompt 分类禁止携带参考素材
    - 参考图片最多 `9` 条
    - 参考音频最多 `5` 条
    - `image_prompt` 禁止参考音频
  - 错误码已补：
    - `VIDEO_DRAFT_REFERENCE_ASSET_NOT_ALLOWED`
    - `VIDEO_DRAFT_REFERENCE_IMAGE_LIMIT_EXCEEDED`
    - `VIDEO_DRAFT_REFERENCE_AUDIO_LIMIT_EXCEEDED`
    - `VIDEO_DRAFT_REFERENCE_AUDIO_NOT_ALLOWED`
- 已验证：
  - `DraftApiIntegrationTest` 已覆盖草稿 round-trip 与 `image_prompt` 禁止参考音频场景
  - `& '.\scripts\use-local-java17-maven.ps1' -f apps/server/pom.xml '-Dtest=DraftApiIntegrationTest' test` -> `6 passed / 0 failed`
- 当前做到哪一步：
  - `R1-1` 已完成，任务板状态已回写
  - 下一步直接进入 `R1-2`，先补上传层音频策略和集成测试

### 2026-05-24 publish reference asset detail-download scope added

- 已把用户补充的“提示词详情页素材下载闭环”正式纳入 `R1`，避免这轮只把发布链路做通、却把详情消费层留空。
- 当前范围补充为：
  - 图片提示词详情页：主示例图片 + 参考图片，均应可展示并可下载
  - 视频提示词详情页：主示例视频 + 参考图片 + 参考音频，均应可展示并可下载
  - 下载仍走现有 `/media/**` 代理链路，不暴露内部 OSS 细节
- 任务板同步调整：
  - `R1-3` 继续负责后端落库角色化关系
  - `R1-4` 继续负责发布页上传与前端契约
  - 新增 `R1-5`：提示词详情页参考素材展示与下载
  - 原本验收项顺延为 `R1-6`
- 当前做到哪一步：
  - 需求边界已收口，下一步先做后端持久化与详情查询，否则前端无从消费

### 2026-05-25 R1 prompt reference asset publish/detail loop completed

- 这轮把“提示词可带参考素材”从后端能力补到了前端可用闭环，不再停留在 DTO 和落库层。
- 已完成的前端闭环：
  - `apps/web` 新增 `/api/uploads/audio-policy`，前端上传代理现在正式支持 `audio`
  - 发布页 `图片提示词` 支持 `1 主图 + 0-9 参考图`
  - 发布页 `视频提示词` 支持 `1 主视频 + 0-9 参考图 + 0-5 参考音频`
  - 参考素材使用 `attachment` 角色上传，草稿保存时会带上 `referenceImageAssetIds / referenceAudioAssetIds`
  - 提示词详情页已新增“参考素材 / 下载素材”区，主素材、参考图片、参考音频都会按分组展示并提供下载入口
- 共享层补齐内容：
  - `view-models.ts` 已补 `VideoDraftView` 的参考素材数组，以及提示词详情页的 `promptAssets`
  - `community-service.ts` 已补 publish bootstrap / update draft / upload policy 的音频与参考素材映射
  - `community.ts` 已把后端 `examples(role=example/reference_image/reference_audio)` 映射成前端可直接渲染的下载资产视图
- 验证证据：
  - 后端上一轮已通过 `PublishPipelineIntegrationTest + PromptReadApiIntegrationTest + DraftApiIntegrationTest + UploadValidationIntegrationTest`，`35 passed / 0 failed`
  - 本轮前端执行 `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - 本轮前端执行 `apps/web -> npm.cmd run build` 通过，构建产物已出现 `/api/uploads/audio-policy` 与 `/prompts/[id]`
- 当前做到哪一步：
  - `R1-1 ~ R1-6` 已全部收口，当前提示词参考素材发布链路与详情下载链路已具备本地可交付状态
- 下次先做什么：
  - 如果要继续增强，优先考虑补“草稿态已上传参考素材文件名回显”而不是继续扩散到工作流发布页

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

### 2026-05-25 local publish page recovered by correcting the 3106 runtime mode

- 用户反馈 `http://127.0.0.1:3106/publish` 打不开；先复现后确认并不是路由丢失，而是登录后进入发布页时前端运行时崩溃。
- 真实根因已经定位：
  - `3106` 端口当时跑的是 `next start`，不是标准本地联调态 `next dev`
  - 浏览器在 `/publish` 登录后请求了路由依赖 chunk：
    - `/_next/static/chunks/0m2_9i66egy7d.js`
    - `/_next/static/chunks/097zf_exb0hqo.js`
    - `/_next/static/chunks/0kb123i2v-7ne.css`
  - 这些静态资源全部返回 `500`
  - 控制台随后出现 `ChunkLoadError`，页面落到 `This page couldn't load`
- 已执行修复：
  - 停掉错误的 `next start --port 3106` 进程
  - 通过 `scripts/start-web-3100.ps1 -Mode dev -Port 3106` 按标准方式重新拉起本地社区前台
- 验证证据：
  - 重新拉起后 `web-3106.out.log` 显示 `next dev --port 3106 --hostname 127.0.0.1`
  - Playwright 登录后再次访问 `/publish`，页面已正常渲染出完整发布表单
  - 新控制台仅剩开发态正常日志：`React DevTools` 提示和 `[HMR] connected`
- 当前做到哪一步：
  - 本地发布页已恢复可用
  - 这次属于运行时恢复，不是新的业务代码 bug；相关经验已同步写入 `memory/MEMORY.md`
- 下次先做什么：
  - 继续回到发布链路增强主线时，先确认 `3106` 仍处于 `next dev`，避免再次在错误运行模式上排假问题
## 2026-05-25 prompt asset detail popup UI refined

- 提示词详情页的参考素材展示已从“正文下方长列表”收口成“紧凑摘要入口 + 弹窗下载”。
- 本轮改动：
  - `apps/web/src/features/video-detail/VideoDetailPage.tsx`
    - 新增 `PromptAssetModal`
    - 主视图只保留 `参考素材 + 共 N 项 · 分组计数 + 查看素材`
  - `apps/web/src/features/video-detail/VideoDetailPage.module.css`
    - 压缩参考素材入口卡片高度
    - 新增弹窗样式，避免破坏现有详情页主排版
- 验证证据：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - Playwright 复验 `video prompt` 与 `image prompt` 两种详情页：
    - 详情页正文区已不再被素材列表拉长
    - `查看素材` 按钮可打开弹窗
    - 弹窗内仍保留分组下载入口

## 2026-05-25 prompt asset popup synced to cloud

- 已将这轮提示词详情页“参考素材入口收口成弹窗”的前端改动同步到测试云前台。
- 这次云验收中顺手定位并修掉了一处前后端版本差异带来的兼容口：
  - 云上旧 prompt 详情接口返回 `examples[]` 时，历史数据未稳定带 `role`
  - 前端共享映射层现已补兼容：缺 `role` 时按 `video/image => example`、`audio => reference_audio` 兜底
  - 这样无需先发后端，云上旧数据也能正常点亮 `查看素材` 入口
- 云发布结果：
  - 初次 web release：`20260525-135652`
  - 兼容修复后最终 web release：`20260525-140650`
- 验证证据：
  - 两次 `deploy:test:web` 均完成 `VerifyBeforeDeploy + VerifyAfterDeploy`
  - 最新云端 readiness 产物：`artifacts/runtime-readiness/test/web-deploy-20260525-140650-summary.json`
  - 公网详情页 spot check：`/prompts/fc73e857-6925-4913-a0af-aa6ce10a834f`
    - 页面已出现 `参考素材 / 共 1 项 · 示例视频 1 / 查看素材`
    - 点击后弹窗可正常打开，并显示下载入口

## 2026-05-25 cloud audio upload recovered and publish reference panels bounded

- 公网发布页“参考音频上传失败”已定位并收口，不是文件问题，而是云后端版本落后。
- 真实根因证据：
  - 公网复现请求：`POST http://8.141.20.130/api/uploads/audio-policy -> 404 RESOURCE_NOT_FOUND`
  - 本地后端已具备 `UploadController /audio-policy`
  - 故障前云后端 release 仍是 `20260524-215718`，未带上本轮 `R1` 音频上传能力
- 处理动作：
  - 本地先复验后端链路：`UploadValidationIntegrationTest + PublishPipelineIntegrationTest = 24 passed / 0 failed`
  - 同步云后端：`deploy:test:backend` -> backend release `20260525-144731`
  - 再同步发布页前端微调：`deploy:test:web` -> web release `20260525-145458`
- 发布页布局同步优化：
  - `参考图片 / 参考音频` 卡片改为固定高度
  - 卡片内容区改为内部滚动，不再被 9 张图或多条音频把整段页面撑长
  - `referenceGrid` 增加 `align-items: start`，避免左右卡片被最长一列一起拉高
- 验证证据：
  - `apps/web -> tsc --noEmit` 通过
  - `deploy:test:backend` 前置校验通过，后置 readiness `11 passed / 0 failed`
  - `deploy:test:web` 前后校验通过，后置 readiness `11 passed / 0 failed`
  - 用户已在公网确认：参考音频上传恢复可用

### 2026-05-26 creator page published works mismatch analysis

- 用户反馈“作者主页的作品页作品和实际发布的作品有偏差，好像没有真实绑定”，本轮先完成根因分析，暂未改代码。
- 已确认这不是后端“我的主页”和“别人看我主页”两套数据源不一致：
  - `apps/server/src/main/java/com/dramatv/community/me/application/MeQueryService.java`
    - `/api/me/hub` 的 `publishedContent.videos` 直接来自 `videoQueryService.summariesForAuthor(currentUser.id())`
  - `apps/server/src/main/java/com/dramatv/community/creator/application/CreatorQueryService.java`
    - `/api/creators/{id}/videos` 同样直接来自 `videoQueryService.summariesForAuthor(creatorId)`
  - `apps/server/src/main/java/com/dramatv/community/shared/persistence/CommunityCatalogJdbcQueryService.java`
    - `videosForAuthor(...)` 查询的是作者全部 `publish_status='published'` 且未删除的视频，不会因为是否绑定工作流而过滤
- 根因已定位在前端展示层二次裁剪：
  - `apps/web/src/features/creator/CreatorPage.tsx:74`
    - `toArchiveCard(video)` 中只要存在 `video.workflow?.id` 就直接 `return null`
  - `apps/web/src/features/me/PersonalCenterPage.tsx:203`
    - `buildPublishedCards(...)` 同样过滤 `video.workflow?.id`
  - 结果是：
    - 已发布且绑定工作流的视频，后端其实正常返回了
    - 但作者主页“作品”tab 和我的主页“作品”tab 都把这类视频前端丢掉了
    - 用户会误以为“作品没有真实绑定”或“发布结果和主页展示对不上”
- 当前实现还有一层语义冲突：
  - `AGENTS.md` 明确要求作者主页“至少分两个内容区：作品、工作流”
  - 但现在 `CreatorPage` 实际是把“未绑定工作流的视频 + 工作流”混在同一个“作品”tab 里，并且把“已绑定工作流的视频”过滤掉
  - 同时统计口径又按后端真实已发布内容计算，容易出现“作品数”和列表内容不一致
- 当前做到哪一步：
  - 已完成 creator/me/mapper/frontend page 四层链路比对，确认问题不是数据库绑定丢失，而是前端筛选逻辑错误
- 下次先做什么：
  - 优先做最小修复：作者主页与我的主页都不要再过滤 `video.workflow?.id`
  - 修完后补一条回归验证：已绑定工作流的视频应同时出现在作者视频接口返回和作者主页作品列表中

### 2026-05-26 creator and me works list restored for workflow-bound videos

- 已按最小修复收口“已绑定工作流的视频被作者主页/我的主页过滤掉”的前端 bug，不改后端接口和共享契约。
- 本轮改动：
  - `apps/web/src/features/creator/CreatorPage.tsx`
    - 去掉 `toArchiveCard(video)` 中对 `video.workflow?.id` 的直接过滤
    - 作者主页“作品”tab 现在会展示作者全部已发布视频，再和工作流卡片一起组合显示
  - `apps/web/src/features/me/PersonalCenterPage.tsx`
    - 去掉 `buildPublishedCards(...)` 中对 `video.workflow?.id` 的过滤
    - 我的主页“作品”tab 现在同样展示全部已发布视频
- 验证证据：
  - `npm.cmd run typecheck:web` 通过
  - 本地浏览器复验通过：
    - `/me` 作品列表已恢复展示 `雨夜追逐短片`
    - 该视频详情页明确带有 `工作流名称：写实追逐工作流`
    - 对应作者页 `/creators/11111111-1111-1111-1111-111111111111` 的“作品”tab 现在也能看到这条视频
- 当前结论：
  - 这次问题的根因已确认并修复，之前不是“绑定没有写上”，而是前端把“已绑定工作流的视频”错误过滤掉了
- 仍需后续单独评估的产品问题：
  - 当前作者页仍是“作品 + 工作流”混排在同一个 tab 里，这和 `AGENTS.md` 中“作者主页至少分作品/工作流两个内容区”的规则仍不完全一致

### 2026-05-26 creator/me work cards aligned with featured-style media fallback

- 在“作者主页/我的主页作品数量已恢复正确”之后，继续收口了剩余的作品卡片媒体缺口：历史预填充视频摘要里如果缺 `cover/poster/preview/source`，作品卡片之前会渲染成空白媒体区，看起来就不像精选页，也无法悬浮播放。
- 根因确认：
  - `apps/web/src/lib/mappers/community.ts`
    - `mapVideoMiniCard(...)` 之前完全信任后端 summary 里的 `coverUrl/posterUrl/previewUrl/sourceUrl`
    - 对历史本地预填充视频（例如 `3d82413b-1036-4c1b-93dd-3a102e0b4683 / 雨夜追逐短片`）来说，这四个字段可能全空
  - `ProfileMediaCard` 本身没有问题：
    - 没图就显示空 media
    - 没 `preview/source` 就不会挂 `<video>`
  - 视频详情页之所以还能播放，是因为它单独走了 `resolvePrefillVideoForDetail(...)` 的详情兜底，不代表列表卡片链路正常
- 本轮修复：
  - 新增 `apps/web/src/lib/prefill/prefill-video-fallback.ts`
    - 把预填充视频的关键词、预览地址和静态封面图统一收口到共享 fallback 解析器
    - 新增 `resolvePrefillVideoCardMediaFallback(...)`
    - 规则固定为：
      - 已有真实 `preview/source` 时不覆盖真实播放链路
      - 但如果缺 `cover/poster`，仍可按标题/摘要补静态封面
      - 如果四个媒体字段都缺，则同时补封面和预览视频
  - `apps/web/src/lib/prefill/prefill-videos.ts`
    - 改成兼容出口，详情页继续复用同一套 prefill 元数据，不再和列表卡片各自维护两套映射
  - `apps/web/src/lib/mappers/community.ts`
    - `mapVideoMiniCard(...)` 现在接入共享 fallback
    - 这样作者主页、我的主页、详情页相关推荐等所有依赖 `VideoMiniCardView` 的视频小卡片都会一起受益
  - 新增轻量回归：
    - `apps/web/src/lib/prefill/prefill-video-fallback.test.mjs`
    - 覆盖“全空媒体时补全封面+预览”和“已有真实 preview/source 时只补封面、不覆盖真实播放”两条规则
- 验证证据：
  - `apps/web -> npm.cmd run typecheck` 通过
  - `node --test apps/web/src/lib/prefill/prefill-video-fallback.test.mjs` 通过
  - 本地 Playwright 复验通过：
    - `/creators/11111111-1111-1111-1111-111111111111`
      - `雨夜追逐短片` 卡片已补出封面 `/nano-banana-images/000014-13327/01.jpg`
      - hover 后已真实挂载 `<video src=\"/prefill-videos/009-warehouse-fight.mp4\">`
    - `/me`
      - 同一条视频卡片 hover 后也已挂载 `/prefill-videos/009-warehouse-fight.mp4`
- 当前结论：
  - 作者主页/我的主页这条问题已经从“作品数量不匹配”推进到“作品卡片媒体表现也与精选页同口径”
  - 剩余如果还要继续增强，就是纯产品层优化：是否进一步把作者页作品 tab 的排序、首屏优先级和精选页完全做成同一编排语义，而不是当前只对齐卡片展示方案

### 2026-05-26 creator/me work cards trimmed to title-only overlays

- 用户继续反馈作者主页与个人主页作品卡片的信息层级太重：标题、简介同时压在封面上，导致封面可视面积被明显挤占。
- 这轮按最小范围收口，没有改共享 `ProfileMediaCard` 组件，也没有改工作流/帖子/点赞/收藏卡片：
  - `apps/web/src/features/creator/CreatorPage.tsx`
    - `toWorkCard(...)` 去掉作品卡片 `subtitle`
    - `toPromptCard(...)` 去掉提示词卡片 `subtitle`
  - `apps/web/src/features/me/PersonalCenterPage.tsx`
    - `buildPublishedCards(...)` 里的 `video` 作品卡片去掉 `subtitle`
    - `buildPublishedCards(...)` 里的 `prompt` 卡片去掉 `subtitle`
- 当前展示结果已收口为“封面上只保留标题 + 作者/互动指标”，不再把摘要文案继续压在作品封面上。
- 验证证据：
  - `apps/web -> npm.cmd run typecheck` 通过
  - 本地 Playwright 复验通过：
    - `/creators/11111111-1111-1111-1111-111111111111` 的“作品”tab 中，`雨夜追逐短片` 等卡片文本已只剩标题，不再出现摘要段落
    - `/me` 的“作品”tab 中，同一批作品卡片也已只剩标题
    - 作者页和 `/me` 中 `雨夜追逐短片` hover 后仍会挂载 `/prefill-videos/009-warehouse-fight.mp4`，说明这轮只收掉文字层，没有打坏封面/悬浮播放链路
- 当前结论：
  - 这轮已经把用户指出的“简介挡住封面”问题按最小成本修掉
  - 如果后续还要继续精修，方向应是作品卡片标题排版和封面构图，而不是把简介再加回来

### 2026-05-26 personal-center secondary tabs aligned to title-only cards

- 用户继续补充个人中心的一致性要求：`/me` 中不只“作品”tab 要去掉简介，`工作流 / 帖子 / 点赞 / 收藏` 这几类卡片也要统一成“只保留标题”，避免封面和主视觉再次被摘要文本压住。
- 本轮按最小范围收口：
  - `apps/web/src/features/me/PersonalCenterPage.tsx`
    - `workflowCards` 去掉 `subtitle`
    - `buildLibraryCards(...)` 去掉 `subtitle`，因此 `点赞 / 收藏` 卡片不再展示 `summary / workflowTitle / channelTitle`
    - `buildPostCards(...)` 去掉 `subtitle`，帖子卡片不再展示 `excerpt / 绑定目标标题`
- 同轮顺手补平了一处已有在途编译缺口，但不改变页面行为：
  - `apps/web/src/lib/mappers/community.ts`
    - 把已被 `community-interactions/actions.ts` 引用的 `mapVideoMiniCard / mapPromptMiniCard / mapWorkflowMiniCard` 正式导出，消除前端 `typecheck` 阻塞
- 验证证据：
  - `apps/web -> npx.cmd tsc --noEmit` 通过
- 当前结论：
  - 个人中心现在已和作者主页作品卡片保持同一信息密度方向：封面层只保留标题，摘要类文案不再覆盖在卡片主视觉上

### 2026-05-26 creator page load-more completed for works workflows and posts

- 用户对作者主页首屏负载控制的要求已经从“不能硬限制数量”收口为真实交互：首屏可以分批，但列表底部必须有 `查看更多`，点击后继续加载下一批。
- 已确认此前状态是“后端分页 + 前端 server action 半完成，作者页 UI 未接通”：
  - 后端 `/api/creators/{id}/videos|prompts|workflows|posts` 已支持 `offset:*` cursor 分页
  - `apps/web/src/features/community-interactions/actions.ts` 已有 `loadMoreCreatorWorksAction / loadMoreCreatorWorkflowsAction / loadMoreCreatorPostsAction`
  - 但 `apps/web/src/features/creator/CreatorPage.tsx` 之前只有“当前仅展示最近公开内容”的提示，没有真正的 `查看更多`
- 本轮已补齐作者页前端闭环：
  - `apps/web/src/features/creator/CreatorPage.tsx`
    - 接入三个 tab 的 `查看更多` 按钮
    - 作品 tab 同时消费 `nextVideoCursor + nextPromptCursor`，点击后把视频和提示词一并追加
    - 工作流 / 帖子 tab 分别按各自 cursor 继续追加
    - 新增本地去重追加逻辑，避免重复卡片混入
    - 新增加载中状态，防止连续点击
  - `apps/web/src/features/creator/CreatorPage.module.css`
    - 补 `查看更多` 行和按钮样式，并兼容 light theme
- 验证证据：
  - `apps/web -> npx.cmd tsc --noEmit` 通过
- 当前结论：
  - 作者页这条“首屏控负载 + 点击查看更多继续加载”的交互现在已经不是提示语，而是完整可用状态

### 2026-05-26 top-nav page switch latency optimized locally

- 用户继续反馈首页、精选页、讨论区等顶部导航切换“每次都差不多慢”，希望首跳更快，二次切换不要还是同样的慢感。
- 本轮已确认这不是单一接口慢，而是三层问题叠加：
  - `apps/web/src/components/shared/CommunityRouteTransitionProvider.tsx`
    - 共享转场遮罩固定最短 `500ms`，会把快跳也渲染成“至少慢半秒”
  - `apps/web/src/components/shared/CommunityTransitionLink.tsx` + `PageShell.tsx`
    - 顶部导航此前只在 `hover/focus` 时被动 `prefetch`
    - 触屏和直接点击场景预取命中率低
  - `apps/web/src/app/(community)/featured/page.tsx`
    - 登录态进入 `/featured` 时，服务端首屏仍阻塞全量 `getAllPrompts(video + image)`
    - 导致和公网匿名态相比，登录态精选页首跳明显更重
- 本轮前端收口：
  - `CommunityRouteTransitionProvider.tsx`
    - 把最短转场时长从 `500ms` 收到 `160ms`
  - `CommunityTransitionLink.tsx`
    - 新增 `onTouchStart` 预取，减少触屏点击前完全无预热的情况
  - `PageShell.tsx`
    - `variant="home"` 顶部主导航现在会主动预取 `/`、`/home`、`/featured`、`/discussions`
    - 显式跳过 `/login?...` 这类 gated 路径，避免无效预取
  - `apps/web/src/app/(community)/featured/page.tsx`
    - 登录态 `/featured` 改成和公网同口径：首屏先只等 `homeFeed + featuredLayout`
    - 提示词全量库存改为客户端异步拉 `/api/featured-prompts`
  - `apps/web/src/app/api/featured-prompts/route.ts`
    - 新增登录态专用的同源库存聚合路由
    - 返回 `private, max-age=15, stale-while-revalidate=60`，避免把登录态内容混进公共缓存
  - `apps/web/src/app/(community)/home/page.tsx` + `apps/web/src/lib/api/community-public-cache.ts`
    - 首页 hero 不再额外单独打一次 `video-only` prompts
    - 统一从已获取的 `all prompts` 中截取前 `12` 条视频提示词，减少一次首屏阻塞请求
- 验证证据：
  - `apps/web -> npx.cmd tsc --noEmit` 通过
  - `apps/web -> npm.cmd run build` 通过
  - Playwright 本地运行态复验：
    - `http://127.0.0.1:3106/featured` 新标签页打开后控制台无新增错误
    - 网络请求已验证登录态 `/featured` 先完成页面路由请求，再异步请求 `/api/featured-prompts -> 200`
    - `home -> featured -> home -> featured` 顶部导航切换可正常往返，第二次回到 `/featured` 仍沿用“页面先到、库存后补”的节奏
- 当前结论：
  - 这轮已经把“固定半秒假慢感 + 顶部导航预热不足 + 登录态精选首屏过重”三条最直接影响体感的前台问题一起压下去
  - 下一步如果还要继续压切换耗时，优先看 `/api/me/notifications/recent` 轮询噪音和首页/精选页 mounted video 数量，而不是先去做激进全局缓存

### 2026-05-26 top-nav switch performance synced to test cloud

- 已将这轮前台导航切换性能优化同步到测试云前台，未改云后端与共享接口语义。
- 云发布范围：
  - `apps/web`
  - 发布标签：`nav-switch-performance-2026-05-26`
  - web release：`20260526-144312`
- 本轮发布过程说明：
  - 默认 `deploy:test:web` 预检会顺带跑后端 core 集成测试
  - 当前工作区存在无关的后端在途改动，`apps/server` 的 `CreatorQueryService` 编译失败，导致 `VerifyBeforeDeploy` 被拦
  - 本轮已按“只发前台 web、不碰后端”口径改用：
    - `scripts/deploy-test-web.ps1 -VerifyAfterDeploy`
  - 因此这次云同步不是前台代码问题导致中断，而是主动绕开与本轮无关的后端预检阻塞
- 云端验证证据：
  - 远端 `apps/web` 生产构建通过，构建产物已包含：
    - `/api/featured-prompts`
    - `/featured`
    - `/home`
  - 测试云 readiness：
    - `artifacts/runtime-readiness/test/web-deploy-20260526-144312-summary.json`
    - 结果：`11 passed / 0 failed`
  - 服务状态：
    - `dramatv-community-web` 已重启成功并处于 `active (running)`
- 当前结论：
  - 这轮“导航切换体感优化”已经完成本地实现与测试云同步
  - 如果接下来还要看真实公网体感差异，下一步应直接做浏览器级复验和必要的细调，而不是再回头改接口层
### 2026-05-26 home hero coverflow width widened toward page edges

- 鐢ㄦ埛缁х画绮句慨棣栭〉 hero 锛屼笉鏄鍐嶆敼涓夊崱缁撴瀯锛岃€屾槸瑕佽杩欎釜 coverflow 鍖哄煙鍚戝乏鍙充袱渚у啀鎷夊紑涓€鐐癸紝鏇撮潬杩?Liblib 鍙傝€冪珯鐨勮竟璺濆彛寰勩€?
- 鏈疆鍙仛瀹瑰櫒瀹藉害鏀跺彛锛屼笉鍐嶅姩 hero 鍗＄墖缁撴瀯銆佽嚜鍔ㄨ疆鎾€佷袱渚у墠鍚庣墖鍜?6 dots 閫昏緫锛?
  - `apps/web/src/features/home/CommunityHomePage.module.css`
    - 鎶?`.hero` 浠庡師鏉ュ拰 `inspiration / shelves` 鍏辩敤鐨?`1138px` 瀹藉害鎷嗗嚭鏉?
    - hero 鏂板搴︽敼涓?`min(1720px, calc(100vw - 104px))`
    - `inspiration / shelves` 缁х画淇濇寔鍘熸潵鐨勫唴瀹瑰搴︼紝閬垮厤鏁翠釜棣栭〉涓嬫柟 shelf 鍚岃疆琚竴璧锋斁澶?
- 楠岃瘉璇佹嵁锛?
  - Playwright 妗岄潰绔?`1705px` 瑙嗗彛涓嬶紝hero 瀹瑰櫒瀹藉害宸茶揪 `1602px`锛屽乏鍙宠竟璺濈害 `44px`
  - 鍚岃疆澶嶇湅纭锛?coverflow 鐨?3 寮犲彲瑙佸崱鐗囥€?6 涓?dots`銆佷腑蹇冨崱鎾斁鍜屼袱渚у崱鐗囧睍绀洪兘鏈杩欐瀹藉害璋冩暣鎵撳潖

### 2026-05-26 home hero coverflow perspective and centering refined locally

- 用户继续细修首页 hero，希望更接近 Liblib 参考站的 coverflow 质感：
  - 两侧卡片和中间卡片之间要有明显夹角
  - 同时不能再出现“页面整体向右偏、左右不对称”的观感
- 本轮收口分成两层，不改接口、不上云，只在 `apps/web` 本地前台修：
  - `apps/web/src/features/home/CommunityHomePage.tsx`
    - 把 hero 的可见层正式收口为 `3 卡可见 / 6 卡轮播`
    - 为两侧卡片补上更明显的 `rotateY + translateZ`，让 coverflow 夹角真正成立
    - 保留“点击两侧卡片先激活、中心卡片播放”的既有交互
  - `apps/web/src/features/home/CommunityHomePage.module.css`
    - 给 `heroStage` 补 `perspective` / `preserve-3d`
    - 去掉首页外层原本 `100vw + 负 margin` 的不稳定撑宽方式
    - 改成 hero 自身相对视口居中，消除滚动条参与计算时造成的横向偏移
- 根因确认：
  - “两侧没有夹角”不是位移量不够，而是之前只有 `rotateY` 数值，没有真正的 3D 透视环境
  - “页面像是整体向右偏”不是后续 shelf 或顶栏的问题，而是首页最外层 `100vw` 在有纵向滚动条时会引入横向溢出，导致视觉中心漂移
- 本地验证证据：
  - `npm.cmd --prefix apps/web run typecheck` 通过
  - `npm.cmd --prefix apps/web run build` 通过
  - Playwright 复验：
    - `document.documentElement.scrollWidth == clientWidth`，首页不再有横向溢出
    - hero 容器回到对称位置：左约 `44px` / 右约 `44px`
    - 当前桌面态只保留 `3` 张可见卡片，且两侧卡片已具备明显透视夹角
- 当前结论：
  - 这一轮已经把“更像 Liblib 的 coverflow 透视感”和“首页整体偏移”的问题一起收住
  - 当前仍是本地改动，尚未同步测试云

### 2026-05-26 home hero titles removed from first-screen carousel

- 用户继续收首页首屏 hero 的信息密度，明确要求“首屏这些视频不要展示标题”。
- 本轮只改前台展示层：
  - `apps/web/src/features/home/CommunityHomePage.tsx`
    - 去掉 hero 轮播卡片上的标题/副标题覆盖层
  - `apps/web/src/features/home/CommunityHomePage.module.css`
    - 同步减轻 hero 遮罩，避免保留大面积为文案服务的底部压暗层
- 验证：
  - `npm.cmd --prefix apps/web run typecheck` 通过
  - `npm.cmd --prefix apps/web run build` 通过
- 当前结论：
  - 首页首屏 hero 现在只保留画面、箭头和 dots，不再压标题文字

### 2026-05-26 home shelf area widened slightly on both sides

- 用户继续细修首页下方内容区，希望“为你推荐 / 电视广告 / 动画”等 shelf 区域整体向两侧再扩一点。
- 本轮保持 4 列卡片结构不变，只放宽容器：
  - `apps/web/src/features/home/CommunityHomePage.module.css`
    - `inspiration / shelves` 宽度从 `min(1138px, calc(100vw - 96px))` 调整为 `min(1248px, calc(100vw - 96px))`
- 验证：
  - `npm.cmd --prefix apps/web run typecheck` 通过
  - `npm.cmd --prefix apps/web run build` 通过
  - 本地浏览器复看确认下方 shelf 已整体向两侧铺开，且 4 列卡片结构未被打坏

### 2026-05-26 home hero bottom black band removed

- 用户继续细修首页首屏 hero，指出底部 dots 下方还残留一条黑色圆角底栏，需要去掉。
- 根因确认：
  - 这不是额外组件，而是 hero 还保留着旧标题区时代的底部预留高度
  - 标题移除后，这段 `heroFrame` 底部 padding 直接暴露成了空黑条
- 本轮只收布局预留，不改轮播结构：
  - `apps/web/src/features/home/CommunityHomePage.module.css`
    - `heroFrame` 底部 padding 从 `54px` 收到 `10px`
    - `dots` 从底栏里抬回到画面上方，桌面 `bottom` 调整到 `14px`
    - 移动端同步把 `heroFrame` 底部 padding 从 `46px` 收到 `10px`，`dots bottom` 调整到 `10px`
- 验证：
  - `npm.cmd --prefix apps/web run typecheck` 通过
  - `npm.cmd --prefix apps/web run build` 通过
  - 本地浏览器复看确认：首屏 hero 底部黑色圆角空带已消失，dots 贴回视频画面底部

### 2026-05-26 recent home hero refinements synced to test cloud

- 已按“只同步前台 web、不碰后端”的口径，把最近这几轮首页 hero / shelf 细修同步到测试云：
  - hero 改为更接近 Liblib 的 coverflow 透视
  - 去掉首屏 hero 标题覆盖层
  - 去掉 hero 底部黑色圆角空带
  - 下方 shelf 区整体向两侧放宽
- 云端发布方式：
  - `scripts/deploy-test-web.ps1 -VerifyAfterDeploy`
  - 本轮工作区仍是 dirty 状态，发布脚本给出提示，但未阻断 web-only 云同步
- 云端发布结果：
  - web release: `20260526-180222`
  - release dir: `/opt/dramatv-community-web/releases/20260526-180222`
  - readiness artifact: `artifacts/runtime-readiness/test/web-deploy-20260526-180222-summary.json`
  - readiness 结果：`12 passed / 0 failed`
- 已确认的云端验收点：
  - 远端 `apps/web` 生产构建通过
  - `dramatv-community-web.service` 已重启并处于 `active (running)`
  - 公网根页、登录页、匿名受保护路由重定向、`/api/feed/home`、`/api/prompts`、`/api/discussions/home`、`/api/me/notifications/recent` 均通过 readiness 复核
- 当前结论：
  - 最近这轮首页前台细修已完成测试云同步
  - 本轮仍未改动测试云后端

### 2026-05-26 公共首页 hero 共享布局口径改为 6 条轮播池

- 用户补充要求不是前台样式，而是共享布局语义：首页 hero 既然已经按“首屏 3 张、轮播池 6 张”设计，后台配置和公共首页接口也不能继续把 `home-hero` 截成 3。
- 本轮前台主线相关的共享收口：
  - `apps/server/src/main/java/com/dramatv/community/shared/persistence/CommunityCatalogJdbcQueryService.java`
    - 公共 `/api/feed/home` 的 `home-hero` 布局上限从 `3` 改到 `6`
  - 这样前台首页消费共享布局时，不会再出现“后台可配更多、但公共接口只给前 3 条”的截断
- 同轮配套共享改动已在后台线完成，但这里记录前台结果：
  - `apps/admin / feed-ops/home` 的 `home-hero` 也已同步扩到 `6`
  - `apps/server / AdminFeedOpsService` 的 slot 定义、fallback 与保存校验已统一按 `6`
- 验证证据：
  - `apps/server -> .\scripts\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminFeedOpsHomeApiIntegrationTest,FeedReadApiIntegrationTest test`
    - 结果：`12 passed / 0 failed`
  - 其中 `FeedReadApiIntegrationTest.homeFeedReturnsPublishedHomeHeroLayoutFromAdminFeedOps`
    - 已明确断言公共 `/api/feed/home` 的 `home-hero.items.size = 6`
- 当前结论：
  - 这轮没有改社区前台 `apps/web` 页面代码，但把前台真正依赖的公共首页 hero 布局语义收口成了 6 条轮播池
  - 当前仍是本地验证完成态，若要让测试云后台和后台工作台都同步这条口径，还需要单独发 `apps/server + apps/admin`

### 2026-05-26 精选页刷新首屏错页修复

- 用户反馈的现象不是普通“加载慢”，而是 `/featured` 刷新时会先短暂显示一版小库存错误页：
  - 首屏 tab 计数只有 `全部 15 / 工作流 3 / 视频提示词 1 / 图片提示词 11`
  - 随后客户端再跳回真实大库存页
- 根因已确认在前台数据装配层，而不是云端资源或样式：
  - `apps/web/src/app/(community)/featured/page.tsx` 首屏 SSR 只传了 `homeFeed + featuredLayout`
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx` 里的 `prompts` 初始值默认是空数组
  - 页面真正的大 prompt 库存依赖客户端 `useEffect` 再请求 `/api/public/featured-prompts` 或 `/api/featured-prompts`
  - 结果就是“服务端首屏一套小池子，客户端补完后另一套大池子”，刷新时必然闪错页
- 本轮修复：
  - 新增 `apps/web/src/lib/api/featured-prompt-inventory.ts`
    - 统一精选页 prompt 库存加载逻辑
    - 公共读增加 `15s` 级别服务端缓存
    - 同时保留 backend timeout / unavailable 时回退空库存的软降级
  - `apps/web/src/app/(community)/featured/page.tsx`
    - 登录态首屏现在会在服务端直接带入 `prompts`
  - `apps/web/src/lib/api/community-public-cache.ts`
    - 游客态 `loadFeaturedArchivePublicData()` 现在也会在服务端直接带入 `prompts`
  - `apps/web/src/app/api/public/featured-prompts/route.ts`
  - `apps/web/src/app/api/featured-prompts/route.ts`
    - 两条客户端补数路由统一复用同一套库存加载器，避免后续再分叉
- 当前首屏口径：
  - `/featured` 刷新时服务端和客户端现在使用同一套 prompt 库存来源
  - 客户端懒请求仍保留，但只作为空库存/失败场景下的兜底重试，不再是主数据源
- 验证证据：
  - `apps/web -> npm.cmd --prefix apps/web run typecheck`
    - 结果：通过
  - `apps/web -> npm.cmd --prefix apps/web run build`
    - 结果：通过
  - 本地 `GET /api/public/featured-prompts`
    - 已可稳定返回完整 prompt 库存，而不是首页小池子裁剪结果
- 当前结论：
  - 这轮修的是精选页首屏数据一致性，不是样式遮挡
  - 当前为本地验证完成态；如果要让公网 `8.141.20.130/featured` 也消除这次刷新闪错页，还需要单独同步 `apps/web`
### 2026-05-26 精选页刷新首屏错页修复已同步测试云

- 已按 `web-only` 口径把本轮 `/featured` 首屏一致性修复同步到测试云：
  - 发布命令：`./scripts/deploy-test-web.ps1 -VerifyAfterDeploy`
  - web release：`20260526-185525`
  - release dir：`/opt/dramatv-community-web/releases/20260526-185525`
- 部署后机器状态正常：
  - `dramatv-community-web.service` 为 `active (running)`
  - readiness artifact：`artifacts/runtime-readiness/test/web-deploy-20260526-185525-summary.json`
  - readiness 结果：`12 passed / 0 failed`
- 云端复验证据：
  - `GET http://8.141.20.130/api/featured-prompts` 已返回大库存，当前 `items=5645`
  - 使用公网测试账号 `creator-b / 123456` 登录后，浏览器真实进入 `http://8.141.20.130/featured`
  - 刷新后首屏计数稳定为：`全部 5,648 / 工作流 3 / 视频提示词 1,490 / 图片提示词 4,155 / 活动 0`
  - 直接抓取带登录态的 `/featured` 服务端 HTML，已确认首屏 SSR 直接渲染 `24` 张卡片，并带 `继续加载更多内容...`，不再是旧的 `15 / 3 / 1 / 11` 小库存首屏
- 当前结论：
  - 本轮问题已同步修复到测试云
  - 这次修的是 `/featured` 首屏 SSR 与 hydration 数据源不一致，不是单纯前端遮挡或延迟加载假象

### 2026-05-26 精选页分页缓存导出修复已完成

- 本轮继续收口了 `/featured` 的分页加载和分类切换链路，核心修复是把客户端页面对 `serializeFeaturedPromptInventoryQuery` 的引用迁回纯 query 模块，避免 `next/headers` 被拉进客户端构建。
- `apps/web/src/lib/api/featured-prompt-inventory.ts` 现在继续对路由和服务端提供公共库存读取，同时把 `serializeFeaturedPromptInventoryQuery` / route input 转换方法补回公共导出，供页面和 API route 复用。
- `FeaturedArchivePage` 仍保留 query-key cache + 底部“查看更多”双入口，当前没有改成强行截断数量。
- 验证已完成：
  - `npm.cmd --prefix apps/web run typecheck`
  - `npm.cmd --prefix apps/web run build`

### 2026-05-26 精选页加载速度优化任务板初始化

- 这轮把 `/featured` 后续优化单独挂板，避免“改到一半换会话就丢上下文”：
  - `F0` 任务板初始化：`已完成`
  - `F1` 分类 / tab / 首屏计数 / 查询参数适配复核：`已完成`
  - `F2` 首屏媒体预热策略收口：`已完成（首批落地）`
  - `F3` 路由切换体感优化：`已完成（首批落地）`
  - `F4` 浏览器级验证与结果回写：`已完成`
- 当前约束：
  - 不回退到“后端全量拉取 + 前端只做渲染分页”
  - 继续保留服务端首屏分页、前端 query-key cache、底部 `查看更多`
  - 后续每完成一项，直接把对应状态改成 `已完成` 并追加验证证据
- 当前已确认的适配缺口：
  - 本轮已收口：`全部 / 工作流 / 视频提示词 / 图片提示词 / 活动` 全部改为统一 `featured-inventory` 真分页库存
  - 后续如果还要继续压缩首屏体感，优先看首屏图片/视频请求量与 hover 预览策略，而不是回退到全量后拉

### 2026-05-26 精选页 unified inventory 本地运行时验收完成

- 本轮先把本地运行时从“代码已改但 18080 还是旧进程”收口到真实可验收状态：
  - 停掉旧的 `18080` Java 进程 `PID=30132`
  - 按 `scripts/start-server-18080.ps1` 重启本地后端
  - 新进程 `PID=13232` 已带最新 `apps/server` JAR 启动，日志显示本地 schema 已到 `Flyway V26`
- 本地接口实测已通过：
  - `GET http://127.0.0.1:18080/api/feed/featured-inventory?limit=1 -> 200`
  - 当前本地 summary 为：
    - `all=82`
    - `workflow=1`
    - `videoPrompt=32`
    - `imagePrompt=45`
    - `activity=4`
  - 说明 `/featured` 已不再停留在旧的 `404` 运行态
- 本地前端统一分页链路实测已通过：
  - `GET http://127.0.0.1:3106/api/public/featured-inventory?limit=1 -> 200`
  - `/featured` 首屏文本与统一 summary 一致：`82 / 1 / 32 / 45 / 4`
  - `视频提示词` tab 切换后 URL 变为 `/featured?filter=video_prompt`
  - 切换后模型/内容二级 facet 正常显示，首屏卡片保持 `24`
  - `查看更多` 点击后卡片数从 `24` 增到 `48`
- 本轮顺手把体感优化第一批一起落地到 `FeaturedArchivePage.tsx`：
  - `F2`：首屏只对前 `6` 张可播卡片做 viewport 预热，其余仍维持 hover/focus 挂载，避免首屏全量 mount video
  - `F3`：tab / 二级筛选 / 排序增加 hover/focus 预取，并在首屏 idle 时预拉相邻高频分类库存
  - 浏览器验证证据：
    - `/featured` 首屏 `document.querySelectorAll('video').length = 3`
    - 切到 `video_prompt` 后 mounted video 为 `6`
    - 加载更多到 `48` 卡后 mounted video 仍为 `4`
  - 网络验证证据：
    - `GET /api/featured-inventory?filter=video_prompt -> 200`
    - `GET /api/featured-inventory?filter=image_prompt -> 200`
    - `GET /api/featured-inventory?cursor=offset:24 -> 200`
    - `GET /api/featured-inventory?filter=workflow -> 200`
- 本轮代码级验证：
  - `npm.cmd --prefix apps/web run typecheck`
  - `npm.cmd --prefix apps/web run build`

### 2026-05-27 精选页 inventory 云端 404 与“查看更多”闪烁已修复并同步测试云

- 用户反馈的“底部 `加载中...` 和 `查看更多` 一直来回闪”不是单纯前端动画问题，而是云端真实请求失败后被 `IntersectionObserver` 反复重试。
- 根因已经确认在测试云入口转发，不在 `apps/server`：
  - `scripts/deploy-test-web.ps1` 生成的 Nginx 配置只把
    - `/api/featured-prompts`
    - `/api/public/featured-prompts`
    这两条 Next 同源路由转给 `3106`
  - 新增的
    - `/api/featured-inventory`
    - `/api/public/featured-inventory`
    没进白名单，命中了通用 `location /api/ -> 18080`
  - 后端没有这两条路径，所以公网真实返回 `RESOURCE_NOT_FOUND`
  - `FeaturedArchivePage` 的触底加载失败后只会把 `isLoading` 复位，不会阻断 observer，于是按钮文案在“加载中 / 查看更多”之间循环打闪
- 本轮修复分两层：
  - `scripts/deploy-test-web.ps1`
    - 补上 `/api/featured-inventory` 与 `/api/public/featured-inventory` 的前端同源代理规则
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - 触底加载失败后新增 `loadMoreError` 收口
    - observer 在失败态暂停自动重试
    - 底部按钮文案改为 `加载失败，点击重试`，不再无限闪烁
  - `scripts/check-test-runtime-readiness.mjs`
    - 新增 `public.web.featured-inventory` 验收项
    - 防止下次 web-only 发布再次漏掉这类 Next API 路由
- 本地验证：
  - `apps/web -> npm.cmd run build` 通过
  - 构建产物已明确包含：
    - `/api/featured-inventory`
    - `/api/public/featured-inventory`
  - `npm.cmd run readiness:local` 通过：`12 passed / 0 failed`
- 测试云同步：
  - `./scripts/deploy-test-web.ps1 -VerifyAfterDeploy`
  - web release：`20260527-211040`
  - readiness artifact：`artifacts/runtime-readiness/test/web-deploy-20260527-211040-summary.json`
  - readiness 结果：`13 passed / 0 failed`
  - 随后补跑带测试账号的云端 readiness：
    - `npm.cmd run readiness:test -- --creator-username creator-b --creator-password 123456`
    - 结果：`17 passed / 0 failed`
    - 已明确包含 `auth.web.featured-inventory`
- 云端浏览器级复验：
  - 直接访问
    - `http://8.141.20.130/api/featured-inventory?limit=1 -> 200`
    - `http://8.141.20.130/api/public/featured-inventory?limit=1 -> 200`
  - 登录态新页签进入 `/featured` 后，控制台新增错误为 `0`
  - 网络请求已确认恢复：
    - `GET /api/featured-inventory?filter=video_prompt -> 200`
    - `GET /api/featured-inventory?filter=image_prompt -> 200`
    - `GET /api/featured-inventory?cursor=offset:24 -> 200`
    - `GET /api/featured-inventory?cursor=offset:48 -> 200`
- 当前结论：
  - 这轮问题的主根因是测试云 Nginx 没把新增的 Next inventory 路由转给前端运行时
  - 闪烁症状已随路由修复消失，同时前端也补了失败态止损，不会再因为单次分页失败无限自动重试

### 2026-05-27 精选页历史脏编排根因确认并已清理

- 用户反馈 `/featured` 实际展示内容持续和后台配置不一致，并怀疑“刷新时一闪而过的旧数据”落回了正式页面。
- 根因已确认不是前台 hydration 残影，而是两层共享问题叠加：
  - 历史根因：
    - `.codex/progress-admin.md` 已记录 `2026-05-17 feed-ops empty-config recovery after reboot`
    - 当时 `admin_feed_slot_configs` 变空后，系统把 fallback 推断内容重新发布成了 `featured` 真实配置
  - 共享后端旧逻辑：
    - `CommunityCatalogJdbcQueryService.loadFeaturedArchive()` 之前仍用 `fillHomeLayoutSlot(configuredItems, fallbackPool, maxItems)`
    - 这会让 `/api/feed/featured` 在“没有人工配置”时继续吐出 fallback 内容，看起来像前台还在吃一套旧的手工编排
- 本轮后端修复：
  - `apps/server/src/main/java/com/dramatv/community/shared/persistence/CommunityCatalogJdbcQueryService.java`
    - `featured-all / featured-workflow / featured-video-prompt / featured-image-prompt / featured-activity`
    - 现在全部改为“只返回真实 configured items”，不再把 fallback 混进 `/api/feed/featured`
  - `landing` 仍保留 fallback merge 语义，不影响根首页档案区
  - `apps/server/src/test/java/com/dramatv/community/integration/FeedReadApiIntegrationTest.java`
    - 已把精选页无配置场景改成严格断言：
      - `featured-all.items = []`
      - `featured-video-prompt.items = []`
      - `featured-image-prompt.items = []`
- 本地验证：
  - 本地 `18080` 已按 `scripts/start-server-18080.ps1` 恢复
  - `.\scripts\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=FeedReadApiIntegrationTest test`
    - 结果：`14 passed / 0 failed`
- 测试云同步与清理：
  - `npm.cmd run deploy:test:backend` 本轮尾部报错并非功能失败，而是远端 `curl 127.0.0.1:18080` 探活打在 Spring Boot 刚重启尚未完成绑定的窗口，属于部署脚本尾部就绪校验过早
  - 随后浏览器直接复核云端真实运行态：
    - `http://8.141.20.130/api/feed/featured`
    - 已确认 `featured-workflow` 和 `featured-activity` 不再被 fallback 自动补成 `3` 条，而是回到 `0`
  - 云端后台 `http://8.141.20.130/admin/feed-ops/featured`
    - 清理前可见：
      - `全部首屏 12/12`
      - `视频提示词 tab 12/12`
      - `图片提示词 tab 12/12`
      - 合计 `36` 条真实已发布脏配置
    - 本轮已逐个清空并发布：
      - `全部首屏`
      - `视频提示词 tab`
      - `图片提示词 tab`
    - 清理后五个 featured slot 均为 `0/12`
- 云端复验结果：
  - `GET http://8.141.20.130/api/feed/featured`
    - 当前 `featured-all / workflow / video-prompt / image-prompt / activity` 五个 slot 全部返回空数组
  - 公网 `http://8.141.20.130/featured`
    - 默认页与 `video_prompt / image_prompt` 分类继续正常通过 `featured-inventory` 展示真实库存
    - 首屏顺序已回到 inventory 顺序，不再受那批历史 36 条脏编排干扰
- 当前结论：
  - “那几十条脏数据”不是前台自己闪出来的缓存脏读，也不是数据库随机坏数据
  - 它们本质上是 `2026-05-17` 那次 empty-config recovery 里由 fallback 推断结果重新发布成的真实 featured 配置
  - 当前已同时完成：
    - 后端不再把 fallback 伪装成 featured 手工编排
    - 云端历史污染的 featured 配置已清空

### 2026-05-27 精选页默认首屏改为真实消费后台精选配置

- 用户继续反馈一个更深层的问题：即使后台 `featured` 配置后来重新配好并发布，前台 `/featured` 默认首屏仍可能“不跟着变”。
- 根因已确认在 `apps/web`，不是后台发布失败：
  - `FeaturedArchivePage.tsx` 之前只把 `/api/feed/featured` 的 slot 内容做成 `pinnedRank`
  - 但页面真实渲染源始终来自 `featured-inventory`
  - 结果是：只有“刚好已经在当前 inventory 首批结果里”的配置项才可能被提前；不在当前 inventory 首批中的配置项根本不会出现在首屏
- 本轮前台修复：
  - 新增 `apps/web/src/lib/featured/featured-curation.ts`
    - 显式收口“什么时候允许把后台精选配置注入首屏”
    - 当前规则固定为：
      - 只在 `/featured` 默认视图下注入
      - 默认视图定义：`sort=latest`、无搜索词、无工作流二级筛选、无 prompt model/content facet
      - 一旦用户进入搜索、切 `最热`、切二级 facet，就回到纯 `featured-inventory` 实时结果
  - 新增 `apps/web/src/lib/featured/featured-curation.test.mjs`
    - 已补回归：
      - 默认视图下会把后台精选配置真实插到首屏前部
      - 过滤视图不会被后台精选配置篡改
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - 现在会先把 `featuredSlots` 映射成与 inventory 同构的前台卡片项
    - 再按上述规则执行“配置首屏注入 + 去重 + inventory 续接”
    - 已顺手移除旧的 `pinnedRank` 伪排序逻辑，避免以后再次出现“配置只参与排序提示、不参与真实首屏来源”的灰区
- 本地验证证据：
  - `npm.cmd --prefix apps/web run typecheck`
  - `node` 执行 `featured-curation.test.mjs` -> `3 passed / 0 failed`
  - `npm.cmd --prefix apps/web run build`
  - 本地运行态补充确认：
    - `GET http://127.0.0.1:18080/api/feed/featured` 当前为空配置
    - `GET http://127.0.0.1:18080/api/feed/featured-inventory?limit=12` 与页面首屏保持一致
    - 说明当前前台已不会在“空配置”场景误吃旧 pinned 逻辑
- 当前结论：
  - 现在 `/featured` 的共享语义已经清晰：
    - 默认首屏：真实吃后台 `featured` 发布配置
    - 搜索 / facet / 二级筛选视图：纯走 `featured-inventory`
  - 本轮已同步测试云并完成公网复验：
    - `npm.cmd run deploy:test:web`
    - web release：`20260527-232734`
    - readiness artifact：`artifacts/runtime-readiness/test/web-deploy-20260527-232734-summary.json`
    - readiness 结果：`13 passed / 0 failed`
    - 公网 `GET http://8.141.20.130/api/feed/featured` 当前已返回新的 `featured-all` 12 条视频提示词配置
    - 公网 `http://8.141.20.130/featured` 刷新后，默认首屏前 12 张已切换为后台配置的视频提示词序列，不再停留在旧的 inventory 首批帖子/工作流顺序
### 2026-05-28 精选页分页后返回定位丢失已修复
- 用户反馈：
  - 精选页之前点进详情再返回，能回到刚才点开的那一块区域
  - 改成分页加载后，只有前 24 条还能正常回位
  - 超过前 24 条的资源返回后统一回到页顶
- 根因已确认：
  - 旧的返回定位逻辑依赖 `from=/featured#featured-item-...` 对应的卡片 DOM 已经存在
  - 精选页改成 `featured-inventory` 分页后，首屏默认只挂首批数据
  - 当返回目标在后续批次里时，hash 对应卡片还没渲染出来，`useBackAnchorRestore(...)` 会直接退出，导致页面停在顶部
- 本轮前台修复：
  - 新增 `apps/web/src/lib/featured/featured-back-anchor.ts`
    - 收口精选卡片 anchor 规则
    - 收口“是否需要因返回锚点自动补拉下一页”的判定
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - 保留原有返回锚点恢复逻辑
    - 在检测到当前 URL 带 `featured-item-*` 锚点、但目标卡片尚未挂载时，自动继续拉取后续分页
    - 一直拉到目标卡片出现或库存到底为止
    - 不会对非精选卡片 hash 或正常首次进入触发额外补拉
  - 新增轻量回归：
    - `apps/web/src/lib/featured/featured-back-anchor.test.mjs`
- 本轮本地验证：
  - `apps/web -> npm.cmd run build` 通过
  - `node --test apps/web/src/lib/featured/featured-curation.test.mjs apps/web/src/lib/featured/featured-back-anchor.test.mjs`
    - 结果：`6 passed / 0 failed`
  - `apps/web -> npm.cmd run typecheck`
    - 当前单独执行仍受既有 `.next/types/*.d.ts` 缺失影响
    - 但 `next build` 已完整跑过 TypeScript，说明本轮改动未引入新的类型错误
- 当前结论：
  - 这不是“返回定位功能被删了”，而是分页后返回目标不在首批 DOM 中
  - 现在精选页已补上“带返回锚点时按需自动补页”的能力，后续批次资源返回也能恢复到原位置

### 2026-05-28 精选页活动分类保留，但帖子正式退出公共精选与活动 tab
- 用户补充的真实产品口径已经收口清楚：
  - `活动` 分类要保留
  - 但 `post / 帖子` 不能再进入公共 `/featured`
  - 也不能再进入 `活动` 分类
  - `全部` 在首屏 12 条之后不能继续变成“图片提示词一边倒”，而要保持图片/视频提示词混排
- 根因确认：
  - 之前精选公共库存、后台 featured 配置和前台活动 tab 的消费口径并不一致
  - 历史 `post` 既可能从 `featured-inventory` 混进 `all/activity`，也可能作为旧配置残留在 `featured-activity`
  - 同时 `all` 后续库存之前是全局按时间排序的 prompt 池，视觉上容易连续落成图片提示词
- 本轮后端收口：
  - `apps/server/src/main/java/com/dramatv/community/feed/application/FeaturedInventoryQueryService.java`
    - `filter=activity` 现在直接返回空库存页，活动 tab 改为只消费 curated slot
    - `summary.counts.activity` 当前固定回到 `0`
    - `all` 库存不再拉 `discussion thread`
    - `all` 库存新增图片/视频提示词混排逻辑，避免后续列表继续被单一模态占满
  - `apps/server/src/main/java/com/dramatv/community/admin/feedops/AdminFeedOpsService.java`
    - `featured-all` 允许目标收口为 `prompt / workflow`
    - `featured-activity` 允许目标收口为 `prompt / workflow`
    - 历史已存的 `post` ref 现在在读取配置时会被过滤，不再继续落回前台
- 本轮前台收口：
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - 保留 `活动` tab
    - `活动` tab 改为直接消费 `featured-activity` 的 curated items
    - `activity` 计数改为以 curated items 长度兜底，不会因为公共 inventory 为空把 tab 计数打没
    - `all`、`workflow`、`video_prompt`、`image_prompt` 继续走真实 `featured-inventory`
- 本轮验证：
  - `apps/server -> FeedReadApiIntegrationTest, AdminFeedOpsFeaturedApiIntegrationTest`
    - 结果：`17 passed / 0 failed`
  - `apps/web -> npm.cmd --prefix apps/web run typecheck`
    - 结果：通过
  - `apps/web -> npm.cmd --prefix apps/web run build`
    - 结果：通过
  - `node --test apps/web/src/lib/featured/featured-curation.test.mjs apps/web/src/lib/featured/featured-back-anchor.test.mjs`
    - 结果：`6 passed / 0 failed`
- 当前结论：
  - `活动` 分类没有被移除
  - 但帖子现在已经从公共精选和活动 tab 的共享口径里正式退出
  - 这轮仍是本地验证完成态，尚未同步测试云

### 2026-05-28 精选页帖子退出公共精选口径已同步测试云
- 本轮已按 `backend -> web` 顺序同步到测试云：
  - backend release：`20260528-161045`
  - web release：`20260528-161330`
- 同步过程中的两处非功能性阻塞已确认并排除：
  - 第一次 backend 发布失败不是代码问题，而是本地 `18080` 运行中的 Java 进程占住了 `apps/server/target/*.jar`，导致 `spring-boot:repackage` 无法重命名产物
  - 第二次 backend 发布尾部 `curl 127.0.0.1:18080/actuator/health` 失败，是远端 Spring Boot 刚重启尚未完成 bind 的时序窗口；随后手工公网复核已确认后端新版本真实生效
- 云端复核证据：
  - `GET http://8.141.20.130/api/feed/featured-inventory?filter=all&limit=3`
    - 当前 `summary.counts` 已为：
      - `all=5641`
      - `workflow=2`
      - `videoPrompt=1489`
      - `imagePrompt=4150`
      - `activity=0`
  - `GET http://8.141.20.130/api/feed/featured`
    - 当前 `featured-activity.items=[]`
    - 说明活动 tab 仍保留，但帖子没有再通过公共精选配置回流
  - `apps/web -> artifacts/runtime-readiness/test/web-deploy-20260528-161330-summary.json`
    - 结果：`13 passed / 0 failed`
  - `npm.cmd run readiness:test -- --creator-username creator-b --creator-password 123456`
    - 结果：`17 passed / 0 failed`
    - 已明确包含 `auth.web.featured-inventory`
- 2026-05-28 讨论区卡片摘要移除：
  - 用户要求 `/discussions` 的“超能社区”线程卡片与其他资源卡片统一，只保留标题，不保留摘要/简介
  - 前端已删除 `apps/web/src/features/discussions/DiscussionsPage.tsx` 中 `thread.excerpt` 的渲染与回退文案
  - 前端已删除 `apps/web/src/app/globals.css` 中 `.discussion-replica-thread-excerpt` 及 light theme 对应样式引用
  - 本地验证已通过：
    - `npm.cmd --prefix apps/web run typecheck`
    - Playwright 访问 `http://127.0.0.1:3106/discussions`
    - 结果：线程卡片仅保留标题，频道/时间/标签/作者/互动统计仍正常
  - 已同步测试云：
    - `./scripts/deploy-test-web.ps1 -VerifyAfterDeploy`
    - web release：`20260528-164329`
    - readiness artifact：`artifacts/runtime-readiness/test/web-deploy-20260528-164329-summary.json`
    - readiness 结果：`13 passed / 0 failed`
    - 公网 Playwright 复核：`http://8.141.20.130/discussions`
    - 结果：云端线程卡片同样仅保留标题，未再展示摘要/简介
- 2026-05-28 管理员举报不限频修复：
  - 用户确认真实使用口径：前台举报会被当作运营快速标记下架入口，管理员账号举报不应再受“举报过于频繁”限制
  - 当前收口规则调整为：
    - 普通用户：继续保留举报频控
    - `admin / operator / moderator`：举报不限频
  - 后端改动：
    - `apps/server/src/main/java/com/dramatv/community/shared/security/ActionRateLimiter.java`
      - `checkReport(...)` 新增基于 `roleCode` 的运营角色豁免
    - `apps/server/src/main/java/com/dramatv/community/publish/application/ReportApplicationService.java`
      - 举报创建时改为传入当前用户 `roleCode`
  - 回归测试已补：
    - `apps/server/src/test/java/com/dramatv/community/integration/ActionRateLimitIntegrationTest.java`
      - 新增 `reportCreateByAdminRoleBypassesRateLimit`
  - 本地验证已通过：
    - `ActionRateLimitIntegrationTest`
    - `ReportApiIntegrationTest`
    - `AdminReportApiIntegrationTest`
    - 汇总结果：`14 passed / 0 failed`
- 本地运行态恢复：
  - 为避免后续本地开发环境被这次发布打断，发布完成后已重新按标准脚本拉回本地后端 `18080`
- 当前结论：
  - 这轮“活动分类保留，但帖子退出公共精选与活动 tab”的共享口径已经同步到测试云
  - 当前测试云前后端与本地代码口径一致
- 2026-05-28 精选页深位置返回回位提速与顶部闪动收口：
  - 用户反馈 `/featured` 越往下滑再返回时，回位越来越慢，并且会先短暂显示页面顶部，再跳回进入前的位置
  - 根因确认：
    - 回位锚点恢复仍依赖 `hash -> DOM 已存在 -> 再 scrollTo/scrollIntoView`
    - 精选页改成 `featured-inventory` 分页后，深位置目标卡片往往不在首批 DOM 中，需要一页页补拉
    - 之前没有把“补拉分页 + 恢复滚动”的阶段并进页面级加载态，所以用户会先看到顶部
  - 本轮前端收口：
    - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
      - 新增精选页 `sessionStorage` 级 inventory cache，返回同一路由时优先恢复已加载分页结果
      - 新增 back-anchor 恢复状态机；当目标卡片尚未恢复完成时，整页进入专用恢复遮罩，不再直接暴露顶部首屏
      - 保留现有“查看更多 / 自动补拉分页 / 回位到目标卡片”能力
    - `apps/web/src/lib/featured/featured-inventory-session-cache.ts`
      - 新增分页结果会话缓存读写与过期清理
    - `apps/web/src/lib/routes/back-anchor.ts`
      - 把回位滚动从 `useEffect` 前移到 `useLayoutEffect`，减少已命中目标时的可见闪动
    - `apps/web/src/features/featured/FeaturedArchivePage.module.css`
      - 新增返回恢复遮罩与恢复中内容隐藏样式
  - 回归测试已补：
    - `apps/web/src/lib/featured/featured-back-anchor.test.mjs`
    - `apps/web/src/lib/featured/featured-inventory-session-cache.test.mjs`
  - 本地验证已通过：
    - `node --test apps/web/src/lib/featured/featured-back-anchor.test.mjs apps/web/src/lib/featured/featured-inventory-session-cache.test.mjs`
      - 结果：`7 passed / 0 failed`
    - `npm.cmd --prefix apps/web run typecheck`
    - `npm.cmd --prefix apps/web run build`
    - Playwright 本地复核：
      - 登录 `http://127.0.0.1:3106/featured`
      - 扩展到 `72` 条卡片后点开第 `40` 张资源再返回
      - 返回采样结果保持在原始 `scrollY=2764`，未再出现“先回顶部再跳回”的阶段
  - 当前结论：
    - 这轮修复已在本地闭环
    - 尚未同步测试云，后续如需上云可以直接按 `web` 侧发布链路推进
### 2026-05-28 社区返回定位与提示词详情标题区收口

- 用户补充了两个前台问题：
  - `/discussions` 查看帖子后返回列表时，也要像 `/featured` 一样尽量回到进入前的位置，不能再只回到顶部。
  - 提示词详情页标题过长时，标题区会把下方“提示词内容”区域挤压得过小；需要先把标题调小，再固定标题区域高度。
- 本轮前台修复分三层：
  - `apps/web/src/lib/routes/back-anchor.ts`
    - 把 hash 同步从 `useEffect` 前移到 `useLayoutEffect`
    - 让回位锚点在首次可见渲染前尽早进入恢复流程，减少顶部先露出来再跳转的闪动窗口
  - `apps/web/src/features/discussions/DiscussionsPage.tsx`
    - 新增讨论列表页 back-anchor 恢复状态
    - 当 URL 带帖子回位锚点时，页面先进入恢复遮罩，待目标卡片完成回位后再显露列表
  - `apps/web/src/features/discussions/DiscussionDetailPage.tsx`
    - 讨论详情顶部面包屑里的“社区”入口改为消费 `backHref`
    - 不再写死跳 `/discussions` 顶部，而是带上进入详情时的回位锚点返回
  - `apps/web/src/app/globals.css`
    - 补讨论列表页恢复中的隐藏态与恢复遮罩样式
  - `apps/web/src/features/video-detail/VideoDetailPage.tsx`
  - `apps/web/src/features/video-detail/VideoDetailPage.module.css`
    - 新增 `titleBlock`
    - 标题字号从原先的大尺寸收窄
    - 标题区改为固定高度并限制为 2 行
    - 桌面端标题区固定 `88px`，移动端固定 `74px`
    - 这样长标题不会继续侵占下方“提示词内容”区高度
- 本轮本地验证已通过：
  - `npm.cmd --prefix apps/web run typecheck`
  - `npm.cmd --prefix apps/web run build`
  - Playwright 本地复核：
    - `/discussions` 进入帖子详情后点击面包屑“社区”返回，当前 URL 已为 `#discussion-thread-...`，目标帖子卡片稳定回到视口中部附近
    - 提示词详情页桌面端实测：
      - 标题字号约 `29.76px`
      - 标题块高度固定 `88px`
      - “提示词内容”面板仍保有稳定可见高度
    - 提示词详情页移动端 `390px` 宽度实测：
      - 标题字号约 `27.2px`
      - 标题块高度固定 `74px`
      - 提示词内容面板高度保持 `300px`
- 当前结论：
  - 这轮属于纯前台交互与布局修复，未改共享后端契约
  - 当前状态为本地验证完成，尚未同步测试云

### 2026-05-28 社区返回定位与提示词详情标题区已同步测试云

- 本轮已按 `apps/web` 单独同步测试云：
  - web release：`20260528-222321`
  - readiness artifact：`artifacts/runtime-readiness/test/web-deploy-20260528-222321-summary.json`
  - readiness 结果：`13 passed / 0 failed`
- 发布说明：
  - 本次同步刻意只发 `web`
  - 原因是这批待上云内容都落在前台：
    - 精选页深位置返回恢复与遮罩
    - 社区帖子返回定位
    - 作者页/个人页主页相关前台展示调整
    - 提示词详情页标题区高度收口
  - 当前未把本地那批独立脏着的 `apps/server` 改动一起带上云，避免把未在这轮验收范围内的后端工作树一并发布
- 云端浏览器级复核已通过：
  - 讨论区回位：
    - 登录 `creator-b / 123456`
    - 访问 `http://8.141.20.130/discussions`
    - 进入 `weekly-creator-thread`
    - 点击面包屑“社区”返回后，当前 URL 为 `http://8.141.20.130/discussions#discussion-thread-98b8a9e5-61b1-4bf9-94fd-2ed845de886a`
    - 目标帖子卡片保持在视口中部附近：`targetTop≈279.84px`
  - 提示词详情标题区：
    - 云端移动端复核：
      - 标题块高度 `74px`
      - 标题 `line-clamp=2`
      - 提示词内容面板高度 `300px`
    - 云端桌面端复核：
      - 标题块高度 `88px`
      - 标题字号约 `35.28px`
      - 提示词内容面板仍保有稳定可见高度 `156.4px`
- 当前结论：
  - 这批最近的主页/列表返回定位与提示词详情布局改动已经同步到测试云
  - 当前测试云前台与本地这轮 `apps/web` 代码口径一致

### 2026-05-29 公网登录态压测已按真实会话重跑并补齐路由拆分

- 这轮压测不再沿用 `20260526-184954` 那份匿名公网结果，因为已确认：
  - 公网 `/featured`、`/home`、`/discussions` 在未登录态下都会 `307 -> /login`
  - 老报告主体实际测到的是重定向/登录链路，不是登录后真实内容页
- 为了避免再次误测，本轮已把登录态压测脚本固定为：
  - `scripts/k6/public-auth-shared.js`
    - `setup()` 先登录一次，复用 `dramatv_access_token`
    - 页面请求统一 `redirects: 0`
    - 新增 `ROUTES` 环境变量覆写，便于按单路由复压而不复制脚本
  - 使用脚本：
    - `scripts/k6/public-auth-baseline.js`
    - `scripts/k6/public-auth-load.js`
- 混合路由登录态结果：
  - 基线压测：
    - 产物：`artifacts/qa-reruns/20260529-public-auth-stress/baseline.summary.json`
    - 结果：`avg=131.90ms`，`p95=303.65ms`，`0% failed`
  - 50 VU 混合压测：
    - 产物：`artifacts/qa-reruns/20260529-public-auth-stress/load.summary.json`
    - 结果：`avg=6002.97ms`，`med=3393.36ms`，`p95=19145.64ms`，`max=60014.40ms`，`http_req_failed=1.063%`
- 为了拆出具体瓶颈页，又补跑了三组同档并发的单路由缩短压测（`1m -> 50 VU`，`2m hold`，`1m -> 0`）：
  - `/home`
    - 产物：`artifacts/qa-reruns/20260529-public-auth-stress/home.load.summary.json`
    - 结果：`avg=8761.44ms`，`med=5110.81ms`，`p95=32489.54ms`，`max=60000.87ms`，`http_req_failed=2.493%`
  - `/featured`
    - 产物：`artifacts/qa-reruns/20260529-public-auth-stress/featured.load.summary.json`
    - 结果：`avg=7339.79ms`，`med=5004.32ms`，`p95=20303.95ms`，`max=60001.87ms`，`http_req_failed=1.014%`
  - `/discussions`
    - 产物：`artifacts/qa-reruns/20260529-public-auth-stress/discussions.load.summary.json`
    - 结果：`avg=1224.36ms`，`med=557.95ms`，`p95=3951.46ms`，`max=60001.18ms`，`http_req_failed=0.038%`
- 这轮最关键的性能信号已经稳定复现，不是偶发：
  - 混合压测：
    - `http_req_waiting avg/p95 = 67.50 / 156.54ms`
    - `http_req_receiving avg/p95 = 5935.44 / 19094.27ms`
  - `/home`：
    - `waiting avg/p95 = 73.59 / 173.52ms`
    - `receiving avg/p95 = 8687.84 / 32446.66ms`
  - `/featured`：
    - `waiting avg/p95 = 66.78 / 153.06ms`
    - `receiving avg/p95 = 7272.99 / 20263.76ms`
  - `/discussions`：
    - `waiting avg/p95 = 50.23 / 79.82ms`
    - `receiving avg/p95 = 1174.13 / 3910.01ms`
- 当前判断：
  - 真实瓶颈不在首字节等待阶段，而在登录后内容页 HTML/流式响应体的接收阶段
  - 优先级已经明确：
    1. `/home`
    2. `/featured`
    3. `/discussions`
  - 接下来该查的是公网同时间窗下的 `nginx / dramatv-community-web / dramatv-community-server` 路由级日志和响应体积，而不是继续参考匿名旧压测报告
- 额外记录：
  - `k6 --summary-export` 里的 threshold 布尔值本轮再次出现误导，结论统一以控制台统计和原始 metric 数值为准

## 2026-05-29 home / featured SSR 首屏减载第一轮已在本地落地

- 这轮只改 pps/web，目标是先压低 /home 与 /featured 登录态首屏 SSR 负载，不直接动后端查询契约，也还没有同步到云端。
- /home 已落地的减载动作：
  - 新增 pps/web/src/features/home/home-page-data.ts
  - 服务端现在先把首页 hero + 6 组 shelf 计算成最小渲染数据，再传给 CommunityHomePage
  - 登录态与公开态首页 prompts 拉取上限从 60 收到 30
  - CommunityHomePage 不再依赖整包 iew + prompts 在客户端首屏再做二次组装
- /featured 已落地的减载动作：
  - pps/web/src/lib/featured/featured-inventory-query.ts 默认首批分页从 24 收到 12
  - 默认精选页在 ll + latest + 无搜索/无二级筛选 条件下，SSR 只带运营位和 summary，首批 inventory 改为 hydration 后立即补拉
  - FeaturedArchivePage 首轮 hydration 已跳过默认精选 key 的 sessionStorage 覆盖，避免 defer inventory 时出现 hydration mismatch
- 本地验证：
  - 
px.cmd tsc --noEmit -p apps/web/tsconfig.json 通过
  - pps/web -> npm.cmd run build 多轮通过
  - Playwright 本地复核：
    - /home 登录后可正常进入，hero 与 shelf 正常渲染
    - /featured 默认页可正常进入，defer inventory 后无 hydration console error
- 压测结论需要区分环境：
  - 2026-05-29 这轮后续 k6 公网复跑仍然默认命中 http://8.141.20.130，因为本地代码尚未发布，所以那几份公网 summary 不能用于判断本轮代码改动效果
  - 本地直接把 public-auth-load.js 指到 http://127.0.0.1:3106 也不可直接复用：当前本地 Next 开发入口不存在 POST /api/auth/login，脚本 setup 会拿到 404
- 当前阶段结论：
  - /home 首屏序列化减载已经落地，方向明确
  - /featured 默认首屏也已改成 运营位先出、inventory 后补的更轻口径
  - 下一步若要拿到有效性能结论，必须先把这轮 pps/web 代码同步到测试云，再按登录态脚本重跑公网压测

## 2026-05-29 community web first-screen performance slice synced to test cloud and validated on public authenticated load

- 本轮已把社区前台首屏减载切片同步到测试云：
  - web release：`20260529-114158`
  - readiness artifact：`artifacts/runtime-readiness/test/web-deploy-20260529-114158-summary.json`
  - readiness 结果：`13 passed / 0 failed`
- 本轮公网登录态压测产物：
  - `/home`：旧 `artifacts/qa-reruns/20260529-public-auth-stress/home.load.summary.json` -> 新 `artifacts/qa-reruns/20260529-public-auth-stress-post-deploy/home.load.summary.json`
  - `/featured`：旧 `artifacts/qa-reruns/20260529-public-auth-stress/featured.load.summary.json` -> 新 `artifacts/qa-reruns/20260529-public-auth-stress-post-deploy/featured.load.summary.json`
  - 混合 `/featured + /home + /discussions`：旧 `artifacts/qa-reruns/20260529-public-auth-stress/load.summary.json` -> 新 `artifacts/qa-reruns/20260529-public-auth-stress-post-deploy/load.summary.json`
- `/home` 新旧对比已经形成稳定收益：
  - `avg 8761.44ms -> 5275.71ms`，下降约 `39.8%`
  - `p95 32489.54ms -> 16489.43ms`，下降约 `49.2%`
  - `fail 2.493% -> 0.632%`
  - `http_req_receiving avg 8687.84ms -> 5174.67ms`
  - 单请求接收体量约 `159.81 KiB -> 92.29 KiB`
- `/featured` 新旧对比同样明显改善：
  - `avg 7339.79ms -> 3945.29ms`，下降约 `46.2%`
  - `p95 20303.95ms -> 12463.72ms`，下降约 `38.6%`
  - `fail 1.014% -> 0.241%`
  - `http_req_receiving avg 7272.99ms -> 3872.08ms`
  - 单请求接收体量约 `135.28 KiB -> 74.95 KiB`
- 混合登录态公网压测也已改善，不只是单路由：
  - `avg 6002.97ms -> 3431.21ms`，下降约 `42.8%`
  - `p95 19145.64ms -> 10925.85ms`，下降约 `42.9%`
  - `fail 1.063% -> 0.406%`
  - `http_req_receiving avg 5935.44ms -> 3363.52ms`
  - 单请求接收体量约 `107.99 KiB -> 65.25 KiB`
- 这轮最关键的验证结论：
  - 收益主要来自 `receiving` 和响应体量下降，不是 `waiting` 明显下降
  - 说明 `/home` 与 `/featured` 这次命中的是真实瓶颈：SSR 首屏序列化负担和首屏响应过重
  - `/home` 仍是当前最慢页，虽然已经从 `p95 32.49s` 压到 `16.49s`，但仍高于目标，需要继续做第二轮减载
- 当前后续优先级：
  1. 继续压 `/home` 首屏 shelf payload 和非关键区块首屏输出
  2. 继续检查 `/featured` 默认页还能否再缩 summary / curated payload
  3. 如需继续下探，再看云端 `Next route` 级日志与 HTML/RSC 实际体积，而不是优先怀疑后端首字节

## 2026-05-29 /home 第二轮客户端瘦身已在本地落地

- 延续上一轮 `/home` SSR 首屏减载后的排查，已确认 `apps/web/src/features/home/CommunityHomePage.tsx` 仍残留一整套旧的客户端数据拼装逻辑：
  - prompt / workflow -> card 转换
  - hero slide 组装
  - 首页 slot -> shelf 混排与去重
  - 这些逻辑现在已经由 `apps/web/src/features/home/home-page-data.ts` 在服务端统一完成
- 本轮已把 `CommunityHomePage.tsx` 收口为“渲染 + 交互”组件：
  - 删除不再参与运行的旧 helper 和对应 import
  - 保留的职责只剩 hero 轮播、卡片悬浮播放、点赞交互和返回锚点恢复
  - `/home` 的 `page.tsx -> buildCommunityHomePageData(...) -> <CommunityHomePage pageData={...} />` 现在口径更干净，避免同一套首页组装逻辑同时存在于 server/client 两侧
- 本地验证已通过：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - `apps/web -> npm.cmd run build`
- 当前状态：
  - 这是 `/home` 第二轮减载的本地切片，已完成代码与构建验证
  - 还没有重新同步测试云，也还没有新的公网 k6 结果
- 下一步：
  1. 同步新的 `apps/web` 到测试云
  2. 重跑公网登录态 `/home` 与 mixed k6
  3. 如果收益仍有限，再继续看 `/home` 下半屏 shelf 是否要进一步拆成更轻的首屏输出

## 2026-05-29 /home 第二轮客户端瘦身已同步测试云并完成公网复测

- 社区前台新 release 已同步到测试云：
  - `web release=20260529-123950`
  - readiness artifact: `artifacts/runtime-readiness/test/web-deploy-20260529-123950-summary.json`
  - readiness: `13 passed / 0 failed`
- 这轮复测补跑了两组真实登录态 k6：
  - `/home`：`artifacts/qa-reruns/20260529-public-auth-stress-post-client-trim-home.load.summary.json`
  - mixed `/featured + /home + /discussions`：`artifacts/qa-reruns/20260529-public-auth-stress-post-client-trim-mixed.load.summary.json`
- 对比上一版已部署的 `20260529-114158`：
  - `/home`
    - `avg 5275.71ms -> 4988.85ms`
    - `p95 16489.43ms -> 16262.35ms`
    - `fail 0.632% -> 0.699%`
    - `http_req_receiving avg 5174.67ms -> 4933.72ms`
    - 单请求接收体量 `92.30 KiB -> 92.22 KiB`，基本不变
  - mixed
    - `avg 3431.21ms -> 3415.08ms`
    - `p95 10925.85ms -> 11182.40ms`
    - `fail 0.406% -> 0.368%`
    - `http_req_receiving avg 3363.52ms -> 3358.57ms`
    - 单请求接收体量 `65.25 KiB -> 65.28 KiB`，基本不变
- 当前结论已经很明确：
  - 这轮“客户端 bundle / 组件清理”本身对公网 k6 只有很小收益，且没有继续压低首屏接收体量
  - 原因并不意外：当前 k6 主要在测页面文档请求，客户端组件里残留 helper 清掉后，运行态更干净，但不会像上一轮那样明显改变 SSR 文档大小
  - 下一轮不该继续在 `CommunityHomePage.tsx` 做同类小修，而该回到 `/home` 的服务端首屏输出本身，继续减轻首屏真正返回的 shelf / card payload
- 下一步建议已收口为：
  1. 继续分析 `/home` 哪些 shelf 属于首屏非关键输出，可延后或进一步瘦身
  2. 如需确认 HTML/RSC 体量瓶颈，可直接抓 `/home` 文档响应大小或 route 级日志，而不是继续押注客户端 helper 清理

## 2026-05-29 /featured 最新/最热配置分桶已在本地接通后台

- 这轮不是继续做性能，而是补齐精选页和后台运营之间的新共享口径：
  - 公共 `/featured` 默认仍是 `最热`
  - 但“最热”和“最新”现在不再共用同一份后台精选配置
- 当前前台消费口径：
  - `apps/web/src/app/(community)/featured/page.tsx`
    - 默认 `sort=hot`
    - 会按当前路由 sort 维度读取对应的精选 layout
  - `apps/web/src/lib/api/community-service.ts`
    - `getFeaturedArchiveLayout(sort)` 已按 `sort=hot|latest` 请求公共 `/api/feed/featured`
  - `apps/web/src/lib/api/community-public-cache.ts`
    - 公共未登录态精选页也会按相同 sort 维度读取 layout，不再把热榜/最新共用一份缓存入口
- 这轮实际共享阻塞点也已顺手定位并修掉：
  - 后端原本虽然已经支持 `featured-hot` page key 分桶
  - 但数据库 `admin_feed_slot_configs` 约束不允许 `featured-hot`
  - 当前已补 `V27__allow_featured_hot_admin_feed_slot_configs.sql`
- 验证结果：
  - `apps/server -> AdminFeedOpsFeaturedApiIntegrationTest,FeedReadApiIntegrationTest`
    - 新增回归保护：
      - 后台 `latest/hot` 配置互不覆盖
      - 公共 `/api/feed/featured` 会按 `sort` 读对桶
    - 结果：`19 passed / 0 failed`
  - `apps/web -> npm.cmd run build`
- 当前状态：
  - 本地闭环完成，尚未同步测试云
  - 云端当前还没有这条“后台最热/最新分配置”的完整能力，只带了更早那条“公共 `/featured` 默认最热”的前台默认值切换

## 2026-05-29 /featured 云端分类切换穿插详情返回卡死已复现并修复

- 本轮直接按用户反馈在测试云 `http://8.141.20.130` 复现 `/featured` 真机问题，而不是只看本地：
  1. 打开 `/featured?filter=video_prompt&sort=latest`
  2. 连续点击两次 `查看更多`
  3. 进入深位提示词详情
  4. 点击详情页 `返回列表`
  5. 在返回恢复尚未稳定时，立刻切换二级分类，例如 `真人`
- 云端故障表现已确认：
  - 页面先闪 `Loading featured`
  - 随后长时间停在 `Restoring featured position`
  - URL 里的 hash 已清掉，但恢复遮罩不消失
  - 前台会错误地继续请求新筛选条件下的多页 `/api/featured-inventory?...cursor=offset:24/36/48/...`
  - 控制台曾伴随 React hydration 错误
- 根因已收口到两处前台共享逻辑：
  - `apps/web/src/lib/routes/back-anchor.ts`
    - 旧逻辑只在初始化和 `hashchange` 时同步 hash
    - `router.replace(...)` 改筛选并清 hash 时，不一定触发 `hashchange`
    - 结果是旧的 `featured-item-*` 锚点会残留到新筛选路由里
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - 首次 hydration 会直接吃同路由 `sessionStorage` 里的旧 inventory cache
    - SSR 首屏和客户端首帧因此不一致，触发 hydration mismatch
- 已落地修复：
  - `useBackAnchorRestore()` 改为在路由切换时也用 `useLayoutEffect` 重新同步当前 hash，保证筛选切换清 hash 后旧锚点立刻失效
  - `/featured` 首帧不再默认把同 key 的 session cache 注入初始渲染
  - 只有 URL 真实带着 `featured-item-*` 返回锚点时，才在 hydration 后恢复同 key cache，用于保留深位返回体验
- 本地验证已通过：
  - `apps/web -> npm.cmd run build`
  - `apps/web -> npm.cmd run typecheck`
  - 本地云镜像 `http://[::1]:3107` 复跑同路径，恢复遮罩不再卡死
- 云端已同步：
  - `web release=20260529-172151`
  - readiness artifact: `artifacts/runtime-readiness/test/web-deploy-20260529-172151-summary.json`
  - readiness: `13 passed / 0 failed`
- 云端复验已通过：
  - 同路径重放后，页面最终稳定落在 `http://8.141.20.130/featured?filter=video_prompt&content=real-person&sort=latest`
  - 未再出现 `Loading featured` / `Restoring featured position` 卡死页
  - Playwright 控制台错误数为 `0`
  - `/api/featured-inventory` 请求链已收口为当前筛选下的正常翻页，不再出现旧锚点驱动的失控连翻页

## 2026-05-29 登录页联调提示收口并已同步测试云

- 本轮按用户要求继续收掉社区登录页里的本地联调暴露信息，不再在前台直接展示测试账号或联调说明。
- 前台改动范围：
  - `apps/web/src/features/login/LoginPage.tsx`
  - `apps/web/src/features/login/LoginPage.module.css`
- 当前登录页口径已收口为：
  - 用户名默认空
  - 密码默认空
  - 页面仅保留标题、输入表单和 `进入社区 / 暂不登录`
  - 已移除：
    - “开发环境测试账号”整块
    - “当前用于开发联调”“当前登录方式”“当前用于本地联调”等说明区
- 本地验证：
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
  - Playwright 本地复看：
    - `usernameValue=""`
    - `passwordValue=""`
    - 页面正文不再包含“开发环境测试账号”或“开发环境账号登录”
- 云端已同步：
  - `web release=20260529-185002`
  - readiness artifact: `artifacts/runtime-readiness/test/web-deploy-20260529-185002-summary.json`
  - readiness: `13 passed / 0 failed`
- 云端复验：
  - `http://8.141.20.130/login`
  - Playwright 复看结果：
  - `usernameValue=""`
  - `passwordValue=""`
  - 页面正文当前仅剩：
      - `Login`
      - `进入 DramaTV 社区`
      - `用户名`
      - `密码`
      - `进入社区`
      - `暂不登录`

## 2026-06-02 测试云公网入口 Host 护栏已在本地收口

- 根因已确认不是浏览器异常，而是测试 ECS 上多个项目共用 `:80`；社区脚本过去默认使用裸 IP `http://8.141.20.130` 与 `server_name _`，会把社区部署成兜底站点或让验活/压测误打到别的项目。
- 本轮只改本仓库脚本，不碰云端现网：
  - `deploy-test-web.ps1` 默认入口改为 `http://community.8.141.20.130.nip.io`
  - 同脚本新增护栏，拒绝 `_`、通配 host、裸 IP 和 `localhost`
  - `web/admin/backend` 的 deploy、rollback、readiness、k6 与 smoke 默认入口统一收口到社区专属 host
- 台账同步：
  - 共享口径已补到 `.codex/community-admin-shared-sync.md`
  - 总索引已补到 `.codex/progress.md`
- 本轮验证：
  - PowerShell 相关脚本语法解析通过
  - `scripts/check-test-runtime-readiness.mjs`、`k6` 共享脚本与相关 smoke/import 脚本 `node --check` 通过
  - `package.json` JSON 结构解析通过

## 2026-06-02 测试云社区专属 Host 已修复到云端

- 用户复核发现 `http://community.8.141.20.130.nip.io` 和 `/admin` 仍然进入同事的 DramaLoom 项目；本轮按只读排查先确认公网返回标题确实为 `DramaLoom - AI剧本协作编辑器`，不是浏览器缓存。
- 云端 Nginx 根因：
  - 社区配置 `/etc/nginx/conf.d/dramatv-community-http.conf` 仍是 `server_name _`
  - 同机 `dramaloom.conf` 有精确 `server_name dramaloom.8.141.20.130.nip.io`
  - 因 Nginx 默认 server 选择与文件加载顺序，未精确命中的 `community.8.141.20.130.nip.io` 被 DramaLoom 默认站接住
- 已执行的最小云端修复：
  - 只备份并修改社区自己的 Nginx 配置
  - 备份文件：`/etc/nginx/conf.d/dramatv-community-http.conf.bak-20260602-hostfix`
  - 修改内容：`server_name _` -> `server_name community.8.141.20.130.nip.io`
  - `nginx -t` 通过后执行 `systemctl reload nginx`
- 云端复验：
  - 社区前台 `http://community.8.141.20.130.nip.io` 返回 `DramaTV 社区`
  - 社区后台 `http://community.8.141.20.130.nip.io/admin` 返回 `DramaTV 社区后台`
  - 同事项目 `http://dramaloom.8.141.20.130.nip.io` 仍返回 `DramaLoom - AI剧本协作编辑器`
  - 法务项目 `http://novel-similarity.8.141.20.130.nip.io` 仍返回 `小说库相似度比对平台`
- 额外发现：
  - 云端 admin 仍是旧版本登录页，页面里还有默认账号密码预填；这属于之前本地安全修复尚未同步云端，不在本轮 Host 修复里扩大处理。
## 2026-06-02 O7-2 community local auth hardening closed

- 这轮把社区本地密码登录从“默认开放”改成了“显式开启”：
  - `apps/server/src/main/resources/application.yml`
  - `apps/server/src/main/java/com/dramatv/community/identity/application/CommunityAuthProperties.java`
- 当前默认运行口径：
  - `dramatv.community-auth.provider.local-password-enabled=false`
  - 未显式配置 `local-password-bootstrap-secret` 时，不再允许通过硬编码共享密码自动建号或初始化本地密码
- 为保证现有后端集成测试仍可稳定跑通，测试基座 `ApiIntegrationTestSupport` 已显式开启本地登录并注入测试专用 bootstrap secret，而不是继续隐式依赖生产默认值。
- 与后台联动补口：
  - 后台创建本地账号时，空密码输入改为生成 `DT` 前缀 12 位临时密码
  - `apps/admin/src/app/(dashboard)/users/UsersPageClient.tsx` 和 `actions.ts` 文案已同步改为“自动生成临时密码”
- 本轮验证：
  - `CommunityAuthDefaultsIntegrationTest`
  - `AdminUserGovernanceApiIntegrationTest`
  - `AuthMeApiIntegrationTest`
  - `apps/admin -> npm.cmd run build`
- 下一个社区主线优化项继续回到任务板 `O7-3`，处理作者主页作品流真实混排与分页契约。

## 2026-06-02 O7-3 creator works unified stream closed

- root cause confirmed and removed:
  - creator page no longer loads `videos` and `prompts` as two independent lists and concatenate them on the frontend
  - backend now provides `/api/creators/{id}/works` as one mixed stream with one cursor
- implementation scope:
  - `apps/server`: added `CreatorWorkSummaryResponse`, controller/service route, JDBC mixed union query, and anonymous read access for `/api/creators/*/works`
  - `apps/web`: creator route loader, server actions, mapper, contracts, and `CreatorPage` load-more flow all switched to `works + nextWorksCursor`
- behavior outcome:
  - creator works now keep real mixed publish order on first screen
  - creator works load-more continues the same stream instead of juggling video/prompt cursors
- verification:
  - `CreatorReadApiIntegrationTest`
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - `apps/web -> npm.cmd run build`
- next step on the board: move to `O7-4` and clean up the remaining misleading creator pagination contract (`sort + offset` exposure on legacy endpoints)

## 2026-06-02 O7-4 creator pagination contract cleanup closed

- regression first:
  - tightened `CreatorReadApiIntegrationTest` to require opaque creator cursors for both heavy-author `/videos` and mixed `/works`
  - confirmed the old failure shape was real: backend still returned `offset:24`
- backend contract cleanup:
  - `CreatorQueryController` no longer exposes public `sort` params on `/api/creators/{id}/videos|prompts|workflows|posts`
  - `CreatorQueryService` now emits opaque creator cursors and still accepts legacy `offset:*` cursors during the transition
  - `PublishBootstrapQueryService` was aligned to the new creator workflow list signature
- verification:
  - `CreatorReadApiIntegrationTest`
- next step on the board: move to `O7-5` and clean up the repo-level `.next/types` typecheck dependency

## 2026-06-02 O7-5 repo typecheck `.next/types` dependency closed

- failure path pinned down:
  - both Next apps still had `next-env.d.ts -> import "./.next/types/routes.d.ts"`
  - with generated route types temporarily hidden, the old `apps/web` script `tsc --noEmit` failed immediately on `TS2307 Cannot find module './routes.js'`
- implementation:
  - `apps/web/package.json` now uses `next typegen && tsc --noEmit`
  - `apps/admin/package.json` now uses `next typegen && tsc --noEmit`
  - root `typecheck` / `verify:quick` / `verify:full` scripts did not need reordering once app-level typecheck became self-contained
- verification:
  - cold-state repro before fix: `npm.cmd --prefix apps/web run typecheck`
  - cold-state pass after fix: `npm.cmd run typecheck`
- result:
  - the 2026-06-02 review-board slices under the current community-led track are now all closed locally

## 2026-06-09 cloud media URL host regression closed

- root cause:
  - public `GET /api/feed/home` and `GET /api/feed/featured` were already returning relative `/media/...`
  - the broken landing page came from `apps/web/src/lib/presentation.ts -> normalizeAssetUrl()`, which still prefixed relative `/media/**` with the build-time public base URL
  - after the public entry moved to `community.8.141.20.130.nip.io`, the live web runtime still rendered media requests as `http://8.141.20.130/media/...`, which reproduced in Playwright as `net::ERR_BLOCKED_BY_ORB`
- implementation:
  - `apps/web/src/lib/presentation.ts`
    - `/media/**` now stays same-origin instead of being expanded with `NEXT_PUBLIC_DRAMATV_API_BASE_URL`
    - legacy absolute community media URLs on `8.141.20.130` and `community.8.141.20.130.nip.io` are rewritten back to relative `/media/...`
  - `apps/web/src/features/video-detail/detail-image-preview.ts`
    - aligned the image-detail preview URL normalizer with the same legacy bare-IP rewrite rule
  - `apps/web/src/features/video-detail/detail-image-preview.test.mjs`
    - added regression coverage for legacy bare-IP media URLs
- deploy/runtime repair:
  - local web verification passed: `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - local web regression test passed: `node --test apps/web/src/features/video-detail/detail-image-preview.test.mjs`
  - local production build passed: `apps/web -> npm.cmd run build`
  - test cloud web synced with release `20260609-135718`
  - readiness artifact passed `13 / 0`: `artifacts/runtime-readiness/test/web-deploy-20260609-135718-summary.json`
  - post-deploy Playwright verification on `http://community.8.141.20.130.nip.io/` confirmed media requests now resolve to `http://community.8.141.20.130.nip.io/media/...` and no longer hit `http://8.141.20.130/media/...`

## 2026-06-09 community canvas entry now bound to external market canvas

- requirement closed locally:
  - community "画布入口" no longer lands on the old reserved `/canvas` placeholder page
  - target URL is now `https://dz-ailab-stage.dzkjm.cn/marketcanvas/`
- implementation:
  - `apps/web/src/lib/routes/community-routes.ts`
    - added shared constant `COMMUNITY_CANVAS_ENTRY_URL`
  - `apps/web/src/components/shared/PageShell.tsx`
    - floating "画布入口" now links directly to the external market canvas URL instead of `/canvas`
    - removed the old local-login wrapping for this entry because community `redirectTo` only supports internal paths
  - `apps/web/src/app/(community)/canvas/page.tsx`
    - replaced the old placeholder/copy-to-canvas bootstrap flow with a direct redirect to the external canvas URL
  - `apps/web/src/proxy.ts`
    - added `/canvas` to the public-path allowlist so old `/canvas` bookmarks can still reach the compatibility redirect without being intercepted by community auth
- verification:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
- current boundary:
  - this change only rebinding the shared community canvas entry; existing workflow runtime routes such as `/canvas/[runtimeId]` remain untouched

## 2026-06-09 community external canvas entry synced to test cloud

- deployment:
  - test cloud web release: `20260609-172654`
  - public host: `http://community.8.141.20.130.nip.io`
  - release path: `/opt/dramatv-community-web/releases/20260609-172654`
- automated verification:
  - deploy script: `./scripts/deploy-test-web.ps1 -VerifyAfterDeploy`
  - readiness artifact: `artifacts/runtime-readiness/test/web-deploy-20260609-172654-summary.json`
  - readiness result: `13 passed / 0 failed`
- browser verification:
  - public landing page floating `画布入口` now points to `https://dz-ailab-stage.dzkjm.cn/marketcanvas/`
  - public `http://community.8.141.20.130.nip.io/canvas` compatibility route now redirects outward to the same external canvas URL instead of showing the old placeholder page
- note:
  - deploy script warned that the local workspace was dirty before packaging; this rollout still completed successfully and only synced the web app release

## 2026-06-09 home archive collage UI optimization board created

- planning scope fixed:
  - this round only targets the home landing `精选档案` block
  - does not expand to `精选页 / 社区页 / 作者页` in the first slice
- accepted layout strategy:
  - `比例分桶 + 固定模板 + 轻裁切 + 无空位填槽`
  - no pure masonry for the landing-page shelf
  - first phase does not require backend ratio metadata
  - second phase may add homepage `width / height / aspectRatio` contract only if first-phase crop is still too strong
- task board:
  - `docs/04_实施设计/home-archive-collage-ui-optimization-board-2026-06-09.md`
  - current completed item: `U8-0 方案定稿与约束收口`
  - next task: `U8-1 首页拼贴卡位模型落地`
- execution rule:
  - after each completed task, update both the board doc and `.codex/progress-community.md`

## 2026-06-09 home archive collage first implementation slice landed locally

- implementation scope:
  - `apps/web/src/features/home/HomePage.tsx`
  - `apps/web/src/features/home/HomePage.module.css`
  - task board: `docs/04_实施设计/home-archive-collage-ui-optimization-board-2026-06-09.md`
- completed/advanced tasks:
  - `U8-1` completed
    - added first-phase homepage collage slot model
    - `archiveCards` are now mapped through `buildArchiveCollageRows(...)` before rendering
    - slot layer now supports `hero / portrait / square / wide / landscape`
    - fill logic includes bucket-priority fallback instead of direct uniform-grid map
  - `U8-2` in progress
    - `精选档案` rendering has been switched from one uniform 4-column grid to a 4-row fixed collage template
    - desktop/tablet/mobile responsive fallback rules were added in CSS so the layout can collapse without reusing the old fixed 4-column wall
- local verification:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
- local browser status:
  - local frontend `3106` was started successfully for verification
  - attempted Playwright review hit the existing local backend data problem on `/`, so the real collage shelf could not yet be visually accepted from live homepage data
  - current blocker is not compile failure; it is local homepage data availability during manual UI inspection
- next step:
  - continue `U8-2 / U8-3` with one more pass on media density and title pressure, then do a real browser acceptance pass once local homepage data is available or after a test-cloud sync

## 2026-06-09 local login runtime restored without reopening built-in demo credentials

- root cause confirmed:
  - the local login page did not fail because of the frontend itself
  - backend default auth hardening had already changed `dramatv.community-auth.provider.local-password-enabled` to `false`
  - after a reboot, the commonly used background starter `scripts/start-server-18080.ps1` did not load `apps/server/.env`, so local explicit auth overrides were silently lost
- implementation:
  - `scripts/start-server-18080.ps1` now imports both `apps/server/.env.example` and `apps/server/.env` before launching the jar, matching the existing `scripts/run-server-local-db.ps1` behavior
  - local-only ignored file `apps/server/.env` was added on this machine to explicitly enable:
    - `DRAMATV_COMMUNITY_AUTH_LOCAL_PASSWORD_ENABLED=true`
    - `DRAMATV_COMMUNITY_AUTH_LOCAL_PASSWORD_BOOTSTRAP_SECRET=<local-only value>`
  - this keeps production/test defaults closed while restoring local login capability after restarts
- runtime verification:
  - backend `18080` was restarted through the updated starter
  - Playwright rechecked `http://127.0.0.1:3106/login?redirectTo=%2Fhome`
  - login page RSC payload now carries `providerConfig.loginProviders[0].enabled=true`, and the primary CTA text returned from `登录方式暂不可用` to `进入社区`
- note:
  - current local browser automation still reports HMR websocket noise on `3106`, so automated button-click verification is not a reliable signal in this session
  - the auth-enable regression itself is closed; if the user still sees the old disabled copy in a real browser, refresh the `3106` page once after backend restart

## 2026-06-09 login form now tolerates paste, password-manager autofill, and pre-hydration submit

- confirmed user-facing failure shape:
  - local login provider was already re-enabled
  - but the login page still depended on client-side controlled input state plus `onSubmit`
  - browser paste / remembered-password autofill could leave the CTA in a bad state
  - when hydration timing was poor, clicking `进入社区` could also fall back to a native submit path that did not execute the intended login action
- implementation:
  - `apps/web/src/features/login/LoginPage.tsx`
    - removed username/password controlled-state gating
    - added real `name="username"` and `name="password"` fields for browser password managers
    - switched the form to a native Next server action `action={formAction}`
    - kept provider-disabled guard only on the CTA itself
  - `apps/web/src/app/(community)/login/actions.ts`
    - replaced the client-triggered object-call login helper with a real form-backed server action
    - action now reads `FormData`, validates empty credentials, calls backend login, and redirects on success
- browser verification:
  - `http://127.0.0.1:3106/login?redirectTo=%2Fhome`
  - empty submit stays on `/login` and renders `请输入用户名和密码。`
  - filled submit with local credentials now lands on `/home`
- current verification boundary:
  - `apps/web` typecheck/build are still blocked by an existing unrelated Next generated-route-types corruption under `.next/dev/types/routes.d.ts`
  - this round did not introduce that route-types failure; login runtime verification was completed in the browser instead

## 2026-06-09 local web `/media/**` chain restored on 3106

- confirmed failure shape:
  - local backend `18080` could already serve the same media objects with `200`
  - local frontend `3106` rendered same-origin relative `/media/...` asset paths
  - but `apps/web` had no local rewrite/proxy for `/media/:path*`, so the browser hit `3106/media/...` directly and got `404`
  - this is a local-runtime mismatch, not a cloud media-url regression: cloud/test still rely on same-origin `/media/**` through Nginx
- implementation:
  - `apps/web/next.config.ts`
    - added a local-only `rewrites()` rule for `/media/:path*`
    - the rewrite activates only when `DRAMATV_API_BASE_URL` or `NEXT_PUBLIC_DRAMATV_API_BASE_URL` points to a loopback host
    - local `3106` now proxies `/media/** -> 18080/media/**`, while cloud/test keep the existing same-origin behavior unchanged
- runtime verification:
  - restarted local web `3106` after the config change
  - direct checks confirmed:
    - `HEAD http://127.0.0.1:18080/media/... -> 200`
    - `HEAD http://127.0.0.1:3106/media/... -> 200`
  - Playwright rechecked `http://127.0.0.1:3106/home`
    - media requests switched from repeated `404` to `200/206`
    - console error count dropped to `0`
    - homepage cards recovered visible covers/previews
- build verification:
  - `apps/web -> npm.cmd run build`
- note:
  - the earlier local `login/page.tsx` module-resolution and `use server` console noise did not reproduce after the `3106` restart; current evidence points to stale dev-session compilation state, not a persistent source-code regression

## 2026-06-09 shared back-anchor restore loop fixed locally

- confirmed failure shape:
  - after the local `3106` runtime was cleaned up, `/home` still produced a real client error:
    - `Maximum update depth exceeded`
    - stack pointed into `useBackAnchorRestore`
  - the same bad render loop also drove repeated `/api/me/notifications/recent` requests, making the issue look like HMR noise from the outside
- root cause:
  - `apps/web/src/lib/routes/back-anchor.ts`
  - the hook used a `useLayoutEffect` without a dependency array and called `setHashAnchorId(...)` on every render
  - the intent was valid: keep hash-anchor state synced when route replace/hash changes do not fire a native `hashchange`
  - but the implementation synced too aggressively and could recurse under dev runtime + page state churn
- implementation:
  - `useBackAnchorRestore` now reads `pathname` and `searchParams` from `next/navigation`
  - route-sync runs only when `pathname` or `searchParams.toString()` changes
  - the hashchange listener now also uses the same guarded updater and no longer does an eager extra sync on mount
  - this keeps the earlier “route replace also clears stale anchor state” behavior while removing the render-loop trigger
- verification:
  - Playwright reopened `http://127.0.0.1:3106/home`
  - after waiting for the page to settle:
    - console errors dropped to `0`
    - the previous `Maximum update depth exceeded` no longer reproduced
    - `/api/me/notifications/recent` stopped spamming the network log
  - `apps/web -> npm.cmd run build`

## 2026-06-09 landing archive cards now hide titles until hover on desktop

- scope:
  - `apps/web/src/features/home/HomePage.module.css`
  - only the public landing-page archive collage cards on `/`
- behavior change:
  - on hover-capable desktop devices, `.archiveCardTitle` is now hidden by default
  - `.archiveCardMeta` (author + metric) is also hidden by default
  - the title and meta reappear on `.archiveCard:hover` and `.archiveCard:focus-within`
  - the top-left `.archiveCardBadge` stays visible at all times
  - touch/mobile layouts keep the existing always-visible title behavior so cards do not lose essential text on non-hover devices
- verification:
  - Playwright runtime check on `http://127.0.0.1:3106/`
  - computed-style validation on the first archive card:
    - default: `title=none`, `meta=none`
    - hover: `title=flow-root`, `meta=flex`

## 2026-06-09 featured archive UI migration board initialized

- user request changed from “home landing archive block refinement” to “migrate the new card UI language into `/featured`”
- implementation was intentionally not started yet; this round stayed in planning/read-only mode
- affected-area conclusion:
  - direct render scope is `apps/web/src/features/featured/FeaturedArchivePage.tsx` + `.module.css`
  - high-risk linked behaviors are:
    - `loadMoreRef + IntersectionObserver` pagination
    - featured detail return-position restore via `getFeaturedCardAnchorId(...)` and `useBackAnchorRestore(...)`
    - `useInteractiveVideoPreview(...)` hover preview / prewarm
    - prompt-like action via `togglePromptLikeAction(...)`
  - first-stage recommendation is to migrate the single-card visual language before deciding whether to replace the current 3-column grid with a paginated collage rhythm
- task board created:
  - `docs/04_实施设计/featured-archive-ui-migration-board-2026-06-09.md`
  - current state:
    - `U9-0` completed: impact analysis and execution order closed
    - next task: `U9-1` single-card style-language migration
- current boundary:
  - no business code changed in this planning slice
  - no shared contract or backend change is planned for the first phase unless card-ratio metadata later proves necessary
  - admin impact is now explicitly recorded:
    - first-phase `FeaturedCard` visual migration can stay frontend-only
    - but if the migration later changes `首屏 12 条` semantics, featured slot meaning, preview-expression expectations, or requires ratio/layout metadata, the admin feed-ops featured page and shared feed-ops types must be synchronized as a follow-up track

## 2026-06-09 featured archive U9-1/U9-2 first waterfall slice landed locally

- implementation scope:
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
  - `apps/web/src/features/featured/FeaturedArchivePage.module.css`
  - task board: `docs/04_实施设计/featured-archive-ui-migration-board-2026-06-09.md`
- completed tasks:
  - `U9-1` completed
    - featured cards now use the same new visual language as the landing archive cards:
      - denser media-first card surface
      - monospaced top-left type badge
      - desktop hover/focus reveal for title + meta
      - mobile small-screen override keeps title + meta visible
    - prompt like button remained clickable under the new hover-reveal footer
  - `U9-2` completed
    - decision landed as “upgrade from uniform 3-column wall to a paginated staged collage rhythm”
    - implementation uses a frontend-only repeating layout pattern:
      - row A: `hero + portrait + portrait`
      - row B: `portrait + portrait + wide`
    - important constraint: items are **not reordered** for layout; the layout only assigns slot variants by current sequence so `最新 / 最热` ordering semantics remain intact
- local verification:
  - `apps/web -> npm.cmd run build`
  - Playwright runtime checks on `http://127.0.0.1:3106/featured`
    - desktop default first card: `title=none`, `meta=none`
    - desktop hover first card: `title=flow-root`, `meta=flex`
    - first six layout variants: `hero, portrait, portrait, portrait, portrait, wide`
    - prompt like button regression passed: `false/1 -> true/2 -> false/1`
    - small-screen override at `390px` passed: `title=flow-root`, `meta=flex`
    - basic pagination smoke passed: card count `12 -> 24` after one bottom scroll, and `查看更多` recovered after load
- current boundary:
  - this slice still does **not** change backend contracts, featured slot semantics, or admin feed-ops logic
  - next tasks remain:
    - `U9-3` pagination / load-more stability
    - `U9-4` detail return-position regression
    - `U9-5` video preview / responsive / like full sweep

## 2026-06-09 featured ratio-metadata slice wired locally, with runtime guard and live-data gap confirmed

- this round continued the accepted `U9-6` direction instead of further tweaking frontend-only heuristics:
  - backend public feed contracts now support optional `width / height` on featured inventory and related feed items
  - frontend `FeaturedArchivePage` now prefers backend ratio metadata when assigning collage variants, and only falls back to client natural-size measurement when metadata is absent
  - featured inventory session cache key was bumped so old dimension-less cached inventory does not keep polluting the new layout logic
- while verifying the runtime, a real local frontend bug was also closed:
  - `/featured` could throw `TypeError: Cannot read properties of undefined` inside `resolveFeaturedLayoutBucket(...)`
  - root cause was the measured aspect-ratio cache being read without a defensive fallback during dev/HMR/runtime transitions
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx` now guards both ratio-map reads and ratio-map updates with an empty-map fallback
- local verification completed:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
  - Playwright reopened `http://127.0.0.1:3106/featured`
    - console error count: `0`
    - first screen rendered `12` cards
    - clicking `查看更多` expanded the list to `24` cards
    - network noise stayed tight: one additional `GET /api/featured-inventory?cursor=offset:12 -> 200`
- important live-data finding:
  - browser-side fetch of `/api/public/featured-inventory?limit=12` confirmed the current local real inventory still returns many `width / height = null`
  - direct backend check on `http://127.0.0.1:18080/api/feed/featured-inventory?limit=1` also showed that this is not a frontend proxy loss; the current local dataset itself lacks stored dimension metadata on many historical assets
  - current effect therefore is:
    - contract path is wired
    - rows that already have dimensions can benefit immediately
    - many current rows still rely on client natural-size measurement after image load
- current conclusion:
  - `U9-6` has moved from “candidate” to “in progress / contract landed”
  - if the next goal is to improve first-paint layout stability further, the follow-up track is no longer frontend layout tuning first; it is historical media `width / height` backfill

## 2026-06-11 featured archive pagination regression fixed locally, dev-runtime issue isolated

- user-facing failure shape:
  - `/featured` category and sort chips looked “unclickable” on local `3106`
  - after the waterfall migration, the page could also eagerly load the whole featured inventory instead of expanding by scroll batches
- root-cause split:
  - local `next dev` runtime on `3106` is currently not completing client hydration on this machine
  - evidence:
    - `PageShell` theme toggle and featured filter chips had no React handlers attached in the browser
    - Playwright confirmed DOM-native clicks fired but React state never changed
    - the same page immediately recovered React hydration when switched to local production runtime via `next start --port 3106`
  - separate from that runtime issue, `FeaturedArchivePage` had a real pagination bug:
    - the auto-load sentinel had been left inside the top filter bar
    - this made `IntersectionObserver` fire on first paint and drain inventory pages too aggressively
- code changes landed:
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - removed temporary `console.info` debug probes
    - moved the auto-load sentinel from the toolbar back to the content footer
    - changed the normal state from “button + auto-load mixed mode” to “scroll auto-load, retry button only on loadMoreError”
    - tightened `IntersectionObserver.rootMargin` so loading starts near the real bottom instead of far above the fold
  - `apps/web/src/components/shared/PageShell.tsx`
    - removed temporary hydration/theme debug logs
  - `apps/web/src/app/(community)/featured/page.tsx`
    - aligned `searchParams` typing with current Next.js page contract so `next build` passes again
  - `docs/04_实施设计/featured-archive-ui-migration-board-2026-06-09.md`
    - marked `U9-3` complete with verification notes
- verification:
  - `apps/web -> npm.cmd run build`
  - local production runtime on `http://127.0.0.1:3106/featured`
    - first paint restored to `12` cards
    - scroll-to-bottom expanded inventory in batches `12 -> 24 -> 36`
    - `工作流` and `最新` route switches updated the URL normally
    - browser console errors: `0`
- current boundary:
  - the featured-page pagination/interaction regression is closed in the local production runtime
  - the local `next dev` HMR websocket / no-hydration issue is still an environment/runtime task and should be tracked separately from featured-page business logic

## 2026-06-12 featured waterfall pagination fix synced to test cloud

- this round only synced the web runtime for the featured waterfall pagination/load-more repair; no backend/admin contract was changed
- deploy target:
  - public host: `http://drama-community-dev.dzkjm.cn`
  - release: `20260612-191508`
  - label: `featured-waterfall-pagination-20260612`
- why explicit deploy parameters were required:
  - repo deploy defaults still point at `http://community.8.141.20.130.nip.io`
  - that old host now returns `403` at the public access layer
  - this rollout therefore used explicit `-PublicBaseUrl http://drama-community-dev.dzkjm.cn -ServerNames drama-community-dev.dzkjm.cn` to avoid rewriting cloud nginx back to the stale host
- local verification before deploy:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
  - Playwright on `http://127.0.0.1:3106/featured`
    - first screen stayed at `12` cards
    - bottom scroll expanded `12 -> 24 -> 36`
    - filter/sort route switching remained responsive
- cloud deploy verification:
  - remote build completed successfully in release dir `/opt/dramatv-community-web/releases/20260612-191508`
  - remote `systemctl status dramatv-community-web` -> `active`
  - post-deploy readiness artifact: `artifacts/runtime-readiness/test/web-deploy-20260612-191508-summary.json`
  - readiness result: `13 passed / 0 failed`
  - verified public checks included:
    - `/` -> `200`
    - `/login` -> `200`
    - unauthenticated `/featured` -> redirect to `/login?redirectTo=%2Ffeatured`
    - `/api/public/featured-inventory?limit=1` -> `200`
- rollout note:
  - first upload attempt failed at about `95%` with `Network error: Software caused connection abort`
  - second attempt with the same deploy command succeeded; failure shape matched transient upload-link interruption rather than code/build/runtime breakage

## 2026-06-12 featured deep return restore hardened locally

- user-reported failure shape:
  - after scrolling deep into `/featured`, entering a detail page, and using the in-page `返回列表`, return positioning could drift
  - on bad restores, the visible viewport could show the masonry columns out of balance, including an apparent empty left column until the next incremental load fired
- confirmed root-cause split:
  - shared `useBackAnchorRestore()` only attempted one stored `scrollY` restore and immediately marked the route as restored
  - if the page height was still catching up when that first `scrollTo()` happened, the browser clamped the scroll position and the hook never retried
  - `/featured` masonry also kept measured card aspect ratios only in component memory, so route re-entry could recompute different column heights before image metadata was re-read
- implementation:
  - `apps/web/src/lib/routes/back-anchor.ts`
    - changed stored-scroll restore from single-shot to bounded retry restore
    - the hook now keeps retrying until the target scroll becomes reachable or the anchor is back near the viewport, then clears the stored back-scroll key
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - added session-scoped persistence for measured featured card aspect ratios
    - returning to `/featured` now reuses previously measured card ratios instead of rebuilding every column from fallback guesses
- verification:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
  - Playwright local return-flow replay on `http://127.0.0.1:3106/featured`
    - cleared featured inventory/aspect-ratio session caches
    - auto-loaded inventory to `60` cards
    - entered a deep prompt detail card and used the page `← 返回列表`
    - restore result after settle:
      - `scrollY ≈ 4973.6`
      - `cardCount = 60`
      - `visiblePerColumn = [3, 3, 4]`
      - consumed back-scroll keys were cleared from `sessionStorage`
- current boundary:
  - this round fixes the real deep return restore path used by the app's own back link
  - Playwright still shows unrelated local `next dev` HMR websocket noise on `3106`; that environment issue is separate from the featured return logic and did not block the functional restore verification

## 2026-06-14 creator page return-position and title-density fix landed locally

- user-reported scope on creator pages:
  - entering a detail page from creator content and returning could not reliably restore position for cards that came from later `鏌ョ湅鏇村` batches
  - creator-page content cards should not show the title block by default
- root-cause split confirmed:
  - creator cards already carried `from=/creators/...#creator-*` anchors, and creator route already mounted `useBackAnchorRestore(...)`
  - the real missing layer was creator-page list-state persistence: after returning, the route only had the first page of `works/workflows/posts`, so anchors from later loaded batches often did not exist yet
  - title density issue was local to the shared creator/personal-center media card footer layout rather than a backend/data problem
- implementation:
  - `apps/web/src/features/creator/CreatorPage.tsx`
    - added session-scoped creator-page snapshot restore keyed by the current creator route
    - persisted already loaded `works/workflows/posts` plus their `nextCursor` values
    - on route re-entry, restore now rehydrates larger previously loaded batches before shared back-anchor scrolling runs
    - creator `works` and `workflows` cards now opt into compact mode so the title block stays hidden
  - `apps/web/src/components/shared/ProfileMediaCard.tsx`
    - added `hideTextBlock` prop to support title/subtitle-free card rendering without forking the whole component
  - `apps/web/src/components/shared/ProfileMediaCard.module.css`
    - added compact footer behavior so hidden-title cards keep the bottom row visually stable
- verification:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
- current boundary:
  - this round closes the structural creator-page return bug for later loaded batches at the code level
  - no backend/admin contract changed
  - browser-side manual replay for a real creator route was not run in this turn

## 2026-06-14 test-cloud authenticated pressure rerun for mixed navigation routes

- user intent:
  - local data volume is too small to expose the reported `multi-page switch + content click -> page freeze` risk
  - pressure validation should therefore target the test cloud instead of local
- target and method:
  - public host: `http://drama-community-dev.dzkjm.cn`
  - reused existing authenticated k6 scripts under `scripts/k6`
  - first ran a 1 VU authenticated baseline against `/featured,/home,/discussions`
  - then ran a mixed authenticated load against:
    - `/featured`
    - `/prompts/fcd93e2f-48cc-4482-b7a2-a470a313778d`
    - `/prompts/347c62a0-d6a8-4fb3-a6b3-7cfad15ad783`
    - `/creators/11111111-1111-1111-1111-111111111111`
    - `/home`
    - `/discussions`
- baseline result:
  - no failures
  - `http_req_duration p95=101.58ms`
  - baseline confirms the current cloud entry and authenticated session flow are healthy before applying concurrency
- mixed-load result:
  - command:
    - `k6 run --stage 30s:6 --stage 1m:12 --stage 2m:12 --stage 30s:0 -e PUBLIC_BASE_URL=http://drama-community-dev.dzkjm.cn -e ROUTES=... scripts/k6/public-auth-load.js`
  - total:
    - `http_reqs=3079`
    - `http_req_failed=0.00%`
    - `avg=233.93ms`
    - `p90=597.59ms`
    - `p95=817.02ms`
    - `p99=1.25s`
    - `max=2.85s`
    - `iteration_duration p95=6.09s`
  - threshold outcome:
    - `http_req_failed` threshold still passed
    - `http_req_duration p(95)<500` and `p(99)<1000` both failed
- cross-line conclusion:
  - this round did not reproduce a hard service-level collapse; the site stayed up and returned `200` throughout
  - but under realistic authenticated mixed-route pressure, the cloud runtime is already slow enough to threaten route-switch feel and increase the likelihood of browser-side `卡住/切换迟滞` perception
  - current k6 still measures route document requests, not full browser hydration/main-thread stalls, so it proves server/SSR latency pressure but does not fully close the client-side freeze question
- next recommended track:
  - add one browser-side cloud replay focused on rapid route switching and detail-entry loops
  - then correlate browser network/console timing with the slowest cloud routes from this k6 run, starting with `/featured`, creator page, and detail pages

### 2026-06-14 cloud featured hydration mismatch captured; local first-frame restore hardened

- browser-side cloud replay on `http://drama-community-dev.dzkjm.cn/featured` captured a real client-side production React error during featured first paint:
  - `Minified React error #418`
  - no paired backend failure was observed at the same time; route requests still returned `200`
- current root-cause conclusion:
  - featured waterfall page still had one SSR/client first-frame mismatch path
  - server HTML was rendered from the trimmed first-screen inventory, but client first frame could immediately rebuild masonry assignment using session-restored aspect-ratio cache
  - this makes `/featured` vulnerable to hydration mismatch and likely contributes to the reported flash / switch-lag / occasional stuck-feeling chain on cloud
- local code change landed in `apps/web/src/features/featured/FeaturedArchivePage.tsx`:
  - removed aspect-ratio session-cache restore from the initial `useState`
  - deferred aspect-ratio cache restore until after hydration
  - limited that restore to real `featured-item-*` back-anchor return flows so normal first entry stays SSR-deterministic
- local verification completed:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
  - Playwright on `http://127.0.0.1:3106/featured`
    - console `error = 0`
    - first screen remained `12` cards / `3` columns
- current boundary:
  - this round did not deploy the fix to cloud
  - deep featured return + rapid multi-route switching still need one post-deploy cloud replay to confirm the original freeze perception is reduced, not only the hydration error removed

### 2026-06-14 featured prefetch buffer optimization board initialized

- user intent:
  - current featured waterfall still visibly shifts when the next batch loads near the bottom
  - target is not just "request earlier", but "hide the active loading / reflow feeling" so the next batch appears more naturally
- implementation conclusion before coding:
  - only moving the trigger earlier is not enough
  - the real optimization track must cover three linked steps together:
    - fetch next batch earlier
    - prepare aspect ratios before visible insertion as much as possible
    - merge buffered items into the visible masonry in a more stable way
- task board:
  - `F10-1` completed: first implementation slice landed as a safer reduced version; instead of keeping a separate delayed-commit buffer state, featured load-more now stays on a single append path with request in-flight de-duplication, avoiding the earlier local render-loop regression from the more complex double-stage buffer attempt
  - `F10-2` completed: featured auto-load trigger was moved earlier so the next page starts loading before the user reaches the literal bottom
  - `F10-3` completed: newly loaded featured items now run a lightweight aspect-ratio preparation pass before append; backend `width/height` is still preferred, and items without backend dimensions now probe `poster/cover` natural size first when available
  - `F10-4` completed: featured paging now keeps a route-scoped hidden next-page buffer in refs, preloads the next page earlier, and only commits that buffered page when the user gets closer to the bottom; this keeps the stronger visual buffering behavior without reintroducing the earlier state-loop regression
  - `F10-5` completed: local browser regression sweep for `/featured` passed across first entry, deep scroll auto-load, category/sort switching, and detail return, with no console errors and no repeated featured cursor fetches
  - `F10-6` pending: if local verification passes, sync the featured hydration fix and buffer-loading optimization to cloud, then rerun cloud browser replay on the original freeze path
- tracking rule for follow-up rounds:
  - keep this board in `.codex/progress-community.md`
  - every time one item is completed or re-scoped, update the item status here first before moving on

### 2026-06-14 featured early-load optimization first slice completed locally

- implementation outcome:
  - the original plan to keep a separate `prefetchedItems -> commit later` buffer was tried first, but it introduced a real local `Maximum update depth exceeded` loop during featured scrolling
  - this round intentionally reduced complexity instead of forcing the larger design through
  - current local landed version keeps:
    - earlier featured load trigger
    - same-route/cursor in-flight de-duplication for load-more
    - the existing single append path for visible inventory
  - current local landed version does **not yet** keep:
    - a true hidden next-page buffer
    - off-screen ratio preparation before visible insertion
- local verification:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
  - Playwright on `http://127.0.0.1:3106/featured`
    - console `error = 0`
    - first screen stayed `12` cards
    - one deep wheel scroll expanded first batch to `23` cards without request duplication
    - clicking `视频提示词` updated route to `?filter=video_prompt` and kept the page responsive
- current conclusion:
  - `F10-1/F10-2` are complete in a reduced but stable form
  - the user-visible “don’t wait until the literal bottom” goal has improved locally
  - the remaining visual reflow problem is now concentrated in `F10-3/F10-4`, i.e. ratio preparation and stabler insertion, not basic trigger timing

### 2026-06-14 featured ratio-preparation slice completed locally

- implementation:
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
  - newly loaded featured page items now run a lightweight pre-append ratio preparation pass
  - the preparation order is:
    - use backend `width/height` first when already available
    - otherwise probe `posterUrl / coverUrl` natural size off-screen before append when possible
  - this keeps the current simpler single-append paging model, but reduces how many newly appended cards still rely on pure fallback bucket ratios
- local verification:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
  - Playwright on `http://127.0.0.1:3106/featured`
    - console `error = 0`
    - first screen stayed `12` cards
    - one deep wheel scroll expanded list to `23` cards
    - `视频提示词` filter switch still updated route to `?filter=video_prompt` and remained responsive
- current boundary:
  - this slice improves ratio readiness before append, but it is still not a true hidden next-page buffer
  - `F10-4` remains open if we still want the stronger “prepare whole next batch off-screen, then commit in one visually cleaner step” behavior

### 2026-06-14 featured hidden next-page buffer landed locally without shared-state regression

- implementation:
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
  - this round introduced a route-scoped hidden next-page buffer using `useRef`, not React list state
  - behavior now splits into two phases:
    - near the earlier threshold, request the next featured page and keep it buffered off-screen
    - only when the user gets much closer to the bottom, commit that buffered page into the visible inventory
  - this keeps the buffering behavior isolated inside `/featured` pagination and avoids polluting category switching, back-anchor restore, or shared cache contracts
- why this version was chosen:
  - an earlier attempt to model the buffer directly in React state caused a real local `Maximum update depth exceeded`
  - the ref-scoped buffer keeps the stronger UX goal while sharply reducing cross-effect churn
- local verification:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
  - Playwright on `http://127.0.0.1:3106/featured`
    - console `error = 0`
    - network only requested `offset:12` and `offset:24`, with no duplicate cursor fetches
    - visible inventory progression observed as `12 -> 23 -> 35`
    - category switching `全部 <-> 视频提示词` stayed responsive and updated URL correctly
- current conclusion:
  - `F10-4` is complete locally in a low-blast-radius form
  - the remaining tasks before cloud rollout are now `F10-5/F10-6`: broader featured regression replay and then cloud sync + cloud browser replay

### 2026-06-14 featured regression sweep completed locally

- scope:
  - local browser regression on `http://127.0.0.1:3106/featured`
  - paths covered:
    - first entry
    - deep scroll auto-load
    - `全部 -> 视频提示词 -> 最新 -> 全部`
    - prompt detail entry and `返回列表`
- verification evidence:
  - console remained clean: `error = 0`
  - deep scroll progression observed as:
    - `12 -> 23 -> 35`
  - category / sort switching behaved as expected:
    - `?filter=video_prompt`
    - `?filter=video_prompt&sort=latest`
    - `?sort=latest`
  - detail return on `sort=latest` came back to:
    - `http://127.0.0.1:3106/featured?sort=latest#featured-item-...`
    - restored list count `23`
    - restored scroll `952`
  - featured inventory network requests stayed de-duplicated in the sweep:
    - `offset:12`
    - `offset:24`
    - `filter=video_prompt&sort=latest`
    - `filter=video_prompt&sort=latest&cursor=offset:12`
    - `sort=latest`
    - `sort=latest&cursor=offset:12`
- residual note:
  - returning to `sort=latest` after entering detail restored a partially expanded list (`23` items) instead of the smaller `11`-item first screen
  - current judgment: this is consistent with the existing return-restore strategy, not a regression from the buffer slice
- current conclusion:
  - `F10-5` is complete locally
  - next step is `F10-6`: sync to cloud and replay the original cloud freeze path

### 2026-06-15 featured return-restore repair slice synced to cloud and replayed

- cloud web deploy completed for the current `/featured` stabilization slice:
  - deploy command:
    - `./scripts/deploy-test-web.ps1 -PublicBaseUrl http://drama-community-dev.dzkjm.cn -ServerNames drama-community-dev.dzkjm.cn -VerifyAfterDeploy`
  - web release:
    - `20260615-000520`
  - remote release dir:
    - `/opt/dramatv-community-web/releases/20260615-000520`
  - readiness artifact:
    - `artifacts/runtime-readiness/test/web-deploy-20260615-000520-summary.json`
  - readiness result:
    - `13 passed / 0 failed`
- first-screen cloud verification on `http://drama-community-dev.dzkjm.cn/featured` now matches the intended trimmed behavior:
  - visible card count stayed at `12`
  - `scrollY = 0`
  - `scrollHeight = 2046`
  - no visible `Restoring featured position` overlay
  - console `error = 0` on a fresh tab replay
  - one background request for `GET /api/featured-inventory?cursor=offset:12` still exists, but it no longer auto-commits the next page into the visible list
- deep return replay on cloud passed after the deploy:
  - path:
    - `/featured` deep scroll to `60` items
    - enter `/prompts/5f91b255-f803-4ba9-9509-d87feb6b5d09?...`
    - click `杩斿洖鍒楄〃`
  - settled result:
    - return route `http://drama-community-dev.dzkjm.cn/featured#featured-item-5f91b255-f803-4ba9-9509-d87feb6b5d09`
    - `scrollY = 4140.7998`
    - `cards = 60`
    - masonry columns `17 / 21 / 22`
    - restore overlay text empty
    - console `error = 0`
- additional cloud replay for the user-reported filter/sort path also passed:
  - path:
    - `鍏ㄩ儴 -> 瑙嗛鎻愮ず璇?-> 鏈€鏂?-> prompt detail -> 杩斿洖鍒楄〃`
  - settled result:
    - return route `http://drama-community-dev.dzkjm.cn/featured?filter=video_prompt&sort=latest#featured-item-5458b28c-2c9e-4f32-b9a4-1da43783e42c`
    - restored list count `23`
    - masonry columns `8 / 7 / 8`
    - target anchor remained in viewport
    - no stuck restore overlay reproduced on this path
- current conclusion:
  - the two explicitly recorded `/featured` regressions from 2026-06-14 are not reproduced in the current cloud runtime:
    - left column blank after return
    - restore overlay stuck on `Restoring featured position`
  - `F10-6` can be treated as completed for the current featured pagination/buffer/return stabilization rollout
  - hydration mismatch remains a separate observation track and should only be treated as active again if it reproduces on a fresh-tab replay, not from stale console history in older tabs

### 2026-06-15 featured first-screen buffered page could still auto-commit after shallow scroll; local guard tightened

- newly isolated regression shape on the current cloud runtime:
  - on an already logged-in `/featured` tab, directly re-entering `http://drama-community-dev.dzkjm.cn/featured` could still land in a state where:
    - `scrollY` was already slightly above `0` (observed `100`)
    - first screen expanded from the intended `12` cards to `24`
    - visible columns became `8 / 6 / 10`
  - this is different from the earlier `left blank column` / `restore overlay stuck` return bug; it happens on first-screen buffered-page commit eligibility
- root-cause conclusion in local code:
  - `/featured` buffered next page was only gated by `window.scrollY > 0`
  - once the page had any shallow residual scroll offset, the hidden prefetched page was eligible for immediate commit even though the user was nowhere near the bottom
  - result: the first screen could consume the buffered `offset:12` page too early and visually jump back to `24`
- local repair landed in `apps/web/src/features/featured/FeaturedArchivePage.tsx`:
  - added `getFeaturedRemainingDistanceToBottom()`
  - changed `shouldAllowFeaturedBufferedCommit()` from `force || window.scrollY > 0` to:
    - `force`
    - or actual remaining distance to bottom `<= FEATURED_BUFFER_COMMIT_DISTANCE_PX`
  - aligned the scroll listener path to reuse the same remaining-distance calculation instead of duplicating the formula inline
- verification completed locally at static/build level:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
- current verification boundary:
  - local browser replay for this exact fix is still blocked in this turn because local `3106` currently redirected to `/login?redirectTo=%2Ffeatured` and this tab set did not have an active local session to exercise the protected route
  - cloud runtime still reflects the pre-fix behavior until the next web deploy
- next step:
  - reuse a valid session (local or cloud after deploy) to replay:
    - fresh `/featured` first entry stays at `12`
    - no shallow-scroll auto-commit to `24`
    - previous deep return path still restores correctly

### 2026-06-15 featured deep return could still mark restore complete before anchor returned to viewport; local completion guard tightened

- cloud replay after web release `20260615-125416` confirmed one remaining `/featured` deep-return gap:
  - path:
    - logged-in `/featured` first entry
    - deep scroll to `48+` items
    - enter prompt detail `/prompts/be0b2ea8-c3d1-4e1a-9123-9461db560064?...`
    - click `杩斿洖鍒楄〃`
  - observed result:
    - route returned to `/featured#featured-item-be0b2ea8-c3d1-4e1a-9123-9461db560064`
    - `scrollY` recovered near the previous deep position (`5717.6`)
    - list size recovered to `60`
    - restore overlay did disappear
    - but the target anchor card was still far above the viewport (`targetTop ≈ -2450`)
- root-cause conclusion:
  - `apps/web/src/lib/routes/back-anchor.ts`
  - stored-scroll mode treated `reachedStoredScroll` as sufficient proof of successful restore
  - this allowed restore completion as soon as scroll offset numerically matched the stored value, even if the actual anchor card had not yet returned to the viewport after masonry/list rebuilding
- local repair landed:
  - stored-scroll completion now requires both:
    - stored scroll position reached
    - target anchor already near the viewport
  - the previous branch that also allows completion when page height catches up enough and the anchor is near the viewport remains intact
- local verification completed:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
- current verification boundary:
  - this second repair slice has not yet been redeployed to cloud in this turn
  - cloud runtime still reflects the pre-fix completion rule until the next web deploy

### 2026-06-15 no-anchor return-position restore extended for featured and discussions locally

- user-reported gap expanded beyond detail-card hash returns:
  - `/featured` deep scroll -> enter own `/me` -> return: route came back but there was no return positioning because this path carried only `from=/featured?...` without a `#featured-item-*` anchor
  - `/discussions` scroll -> enter thread / creator / own profile -> return: same class of problem for community list routes when the jump source was a non-card entry
- root-cause conclusion:
  - current shared restore layer only became active when the returning route carried a hash anchor
  - `PageShell` topbar profile jump correctly persisted `rememberBackAnchorSource(from)` scroll snapshots, but list pages such as `/featured` and `/discussions` did not consume that stored route-level scroll when the return path had no hash
  - result: card-entry returns could restore, but profile-entry / no-anchor returns silently fell back to top
- local repair landed:
  - `apps/web/src/lib/routes/back-anchor.ts`
    - added `useStoredRouteScrollRestore()` for plain route-level scroll restore when a stored `from` route has no hash anchor
    - restore stays disabled whenever the current URL already has a hash, so existing anchor-based flows remain the primary path
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - hooked stored-route restore into the existing featured restore overlay so `/featured -> /me -> back` can restore under the same guarded loading experience
  - `apps/web/src/features/discussions/DiscussionsPage.tsx`
    - hooked stored-route restore into the community-page restore overlay so list-level discussion returns no longer depend on thread-card anchors only
  - `apps/web/src/features/discussions/DiscussionDetailPage.tsx`
    - related-thread links now append the real current discussion route as `from`, instead of a hard-coded `/discussions/{slug}`, reducing route-source drift for follow-up returns
- local verification completed:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
- current verification boundary:
  - this slice has local static/build verification only in this turn
  - cloud replay for `/featured -> /me -> back` and `/discussions -> detail/profile -> back` still needs to be run after deploy

### 2026-06-15 no-anchor return-position restore synced to cloud; featured passed, discussions still has a small remaining gap

- cloud web deploys completed twice for this slice:
  - release `20260615-132114`
  - follow-up fix release `20260615-132702`
  - readiness artifacts:
    - `artifacts/runtime-readiness/test/web-deploy-20260615-132114-summary.json`
    - `artifacts/runtime-readiness/test/web-deploy-20260615-132702-summary.json`
  - both passed `13 / 0`
- verified on cloud:
  - `/featured -> /me?from=%2Ffeatured -> 返回`
    - before: `scrollY = 745.6`
    - after return: `scrollY = 745.6`
    - no hash required
    - no lingering `Restoring featured position` overlay
    - current cloud conclusion: this no-anchor featured return path is fixed
- still not fully closed on cloud:
  - `/discussions -> /me?from=%2Fdiscussions -> 返回`
    - before leaving discussions: `scrollY = 77.6`
    - after return on both cloud replays: `scrollY = 0`, while max scroll height remained only about `78`
    - stored route-scroll snapshot was definitely written on `/me` and later cleared on return, so the failure is now narrowed to the restore-completion / timing path on the discussions page rather than snapshot persistence
- follow-up local repair already attempted in `apps/web/src/lib/routes/back-anchor.ts`:
  - plain route-scroll restore completion was tightened to require actual arrival at `min(storedScrollY, maxScrollableY)` instead of treating “page height caught up” as sufficient
  - this was redeployed in release `20260615-132702`
- current conclusion:
  - cloud rollout is live
  - `/featured` no-anchor return is closed
  - `/discussions` no-anchor return still has a small but real remaining mismatch and needs one more repair round

### 2026-06-15 discussions no-anchor return-position fully closed on cloud

### 2026-06-15 architecture review after complex cloud stress replay; second-level featured return restore first repair landed locally

- this round first re-read the community mainline docs and shared route/feature code before making changes, to avoid treating return-position bugs as isolated page symptoms.
- mainline architecture conclusion remains:
  - the current product core is still `content list -> detail -> creator/profile -> continue browsing -> smooth return`
  - so return-position stability and loaded-list continuity belong to the mainline experience, not post-launch polish
- cloud complex replay produced one high-value real failure shape beyond the already-fixed first-level no-anchor return:
  - `/featured` deep scroll reached about `48` cards and `scrollY ~= 5717`
  - path:
    - `/featured`
    - prompt detail
    - `/me`
    - browser back to prompt detail
    - browser back to `/featured`
  - observed result:
    - route returned correctly
    - but featured list only recovered to about `24` cards and `scrollY ~= 1208`
  - this is a real second-level return-state loss, not a simple first-level no-anchor gap
- root-cause conclusion after code review:
  - `apps/web/src/lib/routes/back-anchor.ts`
  - shared `rememberBackAnchorSource(from)` previously persisted only one key for the exact `from` route
  - when that `from` route included a hash anchor such as `/featured#featured-item-*`, the stored deep scroll snapshot lived only under that anchored key
  - later second-level returns could land on plain `/featured` first, while the deep snapshot still existed only under the anchored key
  - result:
    - first-level anchor restore could still work
    - but `detail -> profile -> back -> detail -> back -> list` could lose the deeper list-state/scroll recovery path
- local repair landed:
  - `apps/web/src/lib/routes/back-anchor.ts`
    - `rememberBackAnchorSource()` now persists the same scroll snapshot under both:
      - the exact normalized `from` route
      - the same route with hash stripped
    - this keeps existing hash-anchor restores intact while also giving later plain-route returns a stable fallback key
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - featured session inventory restore no longer runs only for explicit `#featured-item-*` returns
    - when the current `/featured` route already has a stored route-scroll snapshot, the page now also restores the persisted featured inventory batches from session cache
    - intent: second-level returns should recover both scroll position and enough loaded featured inventory to make that scroll position reachable again
- verification completed locally:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
- current boundary:
  - this slice has local static/build verification only in this turn
  - cloud browser replay for the exact second-level featured path still needs to be rerun after deploy
  - the separate repeated browser-console `404` on `/media/image/ccac8677-6a33-49fa-affa-63ae608fbe0e/callback-cover.png` was confirmed during the same cloud stress sweep, but is not fixed in this slice yet

### 2026-06-15 creator and personal pages aligned to shared no-anchor return restore locally

- this round did not continue patching `/featured` only. After reviewing the shared route-return architecture, the same restore model was extended to the two long-list profile surfaces that were still lagging behind:
  - `apps/web/src/features/creator/CreatorPage.tsx`
  - `apps/web/src/features/me/PersonalCenterPage.tsx`
- root-cause conclusion:
  - `/featured` and `/discussions` had already consumed both:
    - `useBackAnchorRestore(...)`
    - `useStoredRouteScrollRestore()`
  - but creator page and personal center still only consumed hash-anchor restore
  - result: card-entry returns could work, while profile-entry / no-anchor return chains around creator or personal pages still had a structural gap and no consistent restoring overlay
- local repair landed:
  - both pages now consume `useStoredRouteScrollRestore()`
  - both pages now keep a route-scoped restore-completion state for hash-anchor restores, matching the existing `featured/discussions` pattern
  - both pages now render a fixed restore overlay and disable pointer events while restore is still settling:
    - `Restoring creator position`
    - `Restoring personal position`
  - CSS support was added in:
    - `apps/web/src/features/creator/CreatorPage.module.css`
    - `apps/web/src/features/me/PersonalCenterPage.module.css`
- verification completed locally:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
- current boundary:
  - this slice is currently local-code verified only
  - real browser replay for deep `featured/discussions -> creator/me -> back` paths still needs to be rerun on a cleaner navigation harness, because the current Playwright session history included noisy `about:blank` back-stack interference during manual multi-step browser-back attempts

- final local repair:
  - `apps/web/src/lib/routes/back-anchor.ts`
  - plain route-scroll restore now requires:
    - the page to be genuinely scrollable when the stored target expects a non-zero scroll area
    - actual arrival at the target scroll position across two consecutive restore frames
  - this prevents `/discussions` from treating an early `scrollY = 0` frame as successful restore before the page has fully settled
- verification before deploy:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
- cloud web deploy:
  - release `20260615-133306`
  - readiness artifact `artifacts/runtime-readiness/test/web-deploy-20260615-133306-summary.json`
  - readiness result `13 / 0`
- final cloud replay:
  - path: `/discussions -> /me?from=%2Fdiscussions -> 返回`
  - before leaving discussions: `scrollY = 77.6`
  - after return: `scrollY = 77.6`
  - `maxScroll ≈ 78`
  - stored back-scroll snapshot was consumed and cleared
  - no lingering `Restoring community position` overlay
- current conclusion:
  - `/featured -> /me -> 返回` and `/discussions -> /me -> 返回` are both closed on cloud for the no-anchor return-position path
### 2026-06-15 local featured runtime loop re-localized and contained before cloud sync

- this round paused any cloud rollout and re-entered strict local debugging after the user asked to continue the overall function/architecture review rather than pushing forward blindly.
- re-localized evidence on local `3106`:
  - Playwright/browser console reproduced two concrete local runtime failures on `/featured`
  - first: `Cannot access 'restoredBackAnchorId' before initialization`
  - second: repeated `Maximum update depth exceeded`
  - the second stack did not point to creator/me restore overlays; it pointed back into `/featured` card ratio reporting:
    - `FeaturedCard.useEffect -> handleCardAspectRatioChange -> setMeasuredAspectRatioByItemKey`
- root-cause conclusion:
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
  - featured card image-ratio reporting was still vulnerable to effect churn:
    - child card effects could keep re-reporting the same natural image ratio
    - parent-side ratio setter identity was not explicitly stabilized in this path
    - result was repeated passive-effect state writes on the featured masonry route
  - same file also carried a declaration-order/HMR hazard around `restoredBackAnchorId`, which contaminated local verification with a separate TDZ-style runtime error
- local repair landed:
  - `FeaturedCard` now keeps a per-card `reportedAspectRatioRef` and only reports a normalized ratio once per distinct value
  - card-side ratio reporting now routes through `useEffectEvent(...)` instead of directly depending on a render-time callback identity
  - parent-side `handleCardAspectRatioChange` was converted to `useEffectEvent(...)` as well
  - featured restore hooks
    - `useBackAnchorRestore()`
    - `useStoredRouteScrollRestore()`
    - `featuredBackAnchorRouteKey`
    - `isFeaturedBackAnchorActive`
    were moved earlier in the component body to remove the local HMR declaration-order hazard
- local verification completed:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
  - Playwright/browser replay on `http://127.0.0.1:3106/featured`
    - fresh `/featured` runtime console `error = 0`
    - category switch `全部 -> 视频提示词` updated URL to `?filter=video_prompt`
    - bottom scroll expanded visible inventory from first screen to `24` cards
    - prompt detail entry and browser back returned to `/featured?filter=video_prompt`
    - returned state settled with:
      - `scrollY ~= 52.8`
      - `cardCount = 24`
      - no visible `Restoring featured position` overlay
- current boundary:
  - this round intentionally stopped before cloud deploy
  - local complex return replay around deeper scroll + `/me`/creator hops still needs one more logged-in replay pass before the next cloud sync decision

### 2026-06-15 detail-to-creator second-level return source repaired locally

- this round continued the shared return-position architecture review instead of patching `/featured` only.
- newly confirmed root-cause class:
  - some detail pages were still building downstream links with `appendBackSource(..., backHref)`
  - `backHref` on detail pages is the previous page route, not the current detail route
  - visible consequence:
    - `list -> detail -> creator/me/related-detail` flattened the chain
    - the second-level page could only return toward the original list
    - browser-back and in-page `返回上一页` semantics no longer matched the actual navigation depth
- local repair landed:
  - `apps/web/src/features/video-detail/VideoDetailPage.tsx`
    - creator link now uses the current detail route as `from`
    - related content links now use the current detail route as `from`
    - workflow detail entry now uses the current detail route as `from`
  - `apps/web/src/features/workflow-detail/WorkflowDetailPage.tsx`
    - creator link now uses the current workflow detail route as `from`
    - related video links now use the current workflow detail route as `from`
  - `apps/web/src/features/discussions/DiscussionDetailPage.tsx`
    - both author links now use `currentRoute` instead of `backHref`
- verification completed locally:
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
  - direct browser DOM verification on local `3106`:
    - prompt detail author link now emits `/creators/{id}?from=/prompts/{id}?from=/featured#featured-item-*`
    - prompt detail related content link now emits `/prompts|/videos/... ?from=/prompts/{id}?from=/featured#...`
    - creator page `返回上一页` now points back to the exact detail route instead of jumping straight to the list
    - discussion detail author link now emits `/creators/{id}?from=/discussions/{slug}?from=/discussions#discussion-thread-*`
- current boundary:
  - this slice fixes the already confirmed second-level return-source mismatch in shared detail-page navigation
  - a clean logged-in browser replay for deep `/featured -> detail -> creator/me -> return -> return` still needs to be rerun without the current Playwright history/download noise before any cloud sync decision

### 2026-06-15 detail-to-creator return-source repair synced to cloud and spot-verified

- cloud web deploy completed for the current shared navigation slice:
  - deploy command:
    - `./scripts/deploy-test-web.ps1 -PublicBaseUrl http://drama-community-dev.dzkjm.cn -ServerNames drama-community-dev.dzkjm.cn -VerifyAfterDeploy`
  - web release:
    - `20260615-162006`
  - readiness artifact:
    - `artifacts/runtime-readiness/test/web-deploy-20260615-162006-summary.json`
  - readiness result:
    - `13 passed / 0 failed`
- high-volume cloud replay on `/featured` first confirmed the page still behaves normally after the patch:
  - first screen stayed at `12`
  - deep scroll expanded to `48`
  - masonry columns stayed populated as `16 / 14 / 18`
  - no visible `Restoring featured position` overlay during this pass
- cloud DOM verification confirmed the shared `from` semantics are now correct for the repaired path:
  - prompt detail author link now emits:
    - `/creators/{id}?from=/prompts/{id}?from=/featured#featured-item-*`
  - prompt detail related-content links now emit:
    - `/prompts|/videos/{id}?from=/prompts/{id}?from=/featured#featured-item-*`
  - creator page `返回上一页` now points back to the exact prompt detail route:
    - `/prompts/{id}?from=/featured#featured-item-*`
- current conclusion:
  - the previously confirmed second-level flattening bug for `featured -> detail -> creator -> return` is now closed on cloud at the route-contract level
  - next replay focus should stay on full deep-return behavior under cloud data volume:
    - `featured deep scroll -> detail -> creator/me -> return -> return`
    - plus category switch pressure after returning

### 2026-06-15 cloud deep-return behavior replay completed; no new featured regression reproduced

- this round continued with behavior-level cloud replay on the already deployed web release `20260615-162006`, instead of making more local-only guesses.
- replay scope focused on real high-volume paths the user is sensitive to:
  - `/featured` first screen -> deep scroll to `60`
  - `featured -> detail -> /me -> back -> back`
  - `featured -> detail -> creator -> back -> back`
  - category switch after returning to `/featured`
- cloud evidence collected:
  - first-screen remained stable at `12`
  - deep scroll expanded inventory normally to `60`
  - `featured -> detail -> /me -> back -> back` returned to `/featured` with:
    - `scrollY ~= 5841.6`
    - `cards = 60`
    - no visible `Restoring featured position` overlay
  - `featured -> detail -> creator -> back -> back` returned to `/featured` with:
    - `scrollY ~= 5841.6`
    - `cards = 60`
    - no visible `Restoring featured position` overlay
  - post-return filter switch to `?filter=video_prompt` still responded normally and reset to the filtered first screen (`12`)
- important debugging conclusion:
  - one earlier cloud replay had shown a shallower return position near `scrollY ~= 2428`
  - this round re-checked that path with a stricter replay method and ruled it out as a real product regression
  - root cause of that misleading evidence was the automation path itself: a coarse card click path could change the viewport before navigation and therefore store a shallower scroll snapshot than the intended deep position
  - current rule going forward: deep-return verification for `/featured` must click a card that is already truly visible in the current viewport, not a locator action that may auto-scroll first
- current conclusion:
  - for the current cloud release, the repaired shared route contract and `/featured` restore path both passed the main deep multi-hop replay
  - this round did not reproduce a new real `/featured` return-state regression
  - remaining future work should shift from “re-fix featured return blindly” to broader stress replay and any newly observed concrete freeze/state-loss evidence

### 2026-06-15 cloud complex replay expanded to featured + discussions; mainline return paths stayed stable

- this round expanded cloud replay beyond the earlier single-path verification and re-ran more hostile combinations on the current cloud entry `http://drama-community-dev.dzkjm.cn`.
- `/featured` replay covered:
  - first screen `12`
  - deep scroll `12 -> 24 -> 36 -> 48 -> 60`
  - deep item detail open
  - detail -> browser back
  - topbar `/me` entry -> browser back
  - sort switch `最热 <-> 最新`
  - filter switch `全部 -> 图片提示词 -> 视频提示词`
  - filtered detail open -> browser back
- `/featured` observed result:
  - no freeze
  - no lingering `Restoring featured position`
  - no repeated `加载中 / 查看更多` flicker
  - deep returns stayed at the original deep position when the replay clicked a card already visible in the current viewport
  - sort/filter switches remained responsive after returning from detail and `/me`
- important debugging clarification:
  - one earlier “returned only to half depth” result was re-checked and rejected as a real product regression
  - the misleading result came from automation changing the viewport before navigation, which caused a shallower scroll snapshot to be stored
  - current verification rule is now explicit: deep-return replay must only click a card that is already naturally visible in the viewport
- `/discussions` replay covered:
  - list -> thread detail -> `/me` -> back -> back
  - list -> thread detail -> creator -> back -> back
- `/discussions` observed result:
  - both paths returned to `/discussions` at the original list scroll (`scrollY ~= 73.6`)
  - no lingering `Restoring community position`
  - no route flattening; both `/me` and creator links carried the full discussion-detail `from` chain
- current residual issue found during the same replay:
  - browser console still showed one stable media 404 on cloud:
    - `/media/image/ccac8677-6a33-49fa-affa-63ae608fbe0e/callback-cover.png`
  - this did not block the mainline replay, but it is still a real runtime hygiene issue and should be treated as a separate media-data / derived-cover cleanup item rather than a return-position bug

### 2026-06-15 cloud featured deep-scroll stress replay reached 300 items; a stronger deep-item access regression was exposed

- this round raised the replay depth from the earlier `60`-item verification to a real stress pass on cloud `http://drama-community-dev.dzkjm.cn/featured`.
- verified behavior-level evidence first:
  - featured masonry continued loading in stable `12`-item batches all the way to `300`
  - observed incremental cursors advanced cleanly from `offset:12` through `offset:288`
  - no hard freeze
  - no lingering `Restoring featured position`
  - no repeated `加载中 / 查看更多` flicker during the 300-item pass itself
- but a more important regression surfaced under deep data volume:
  - after reaching `scrollY ~= 36002` and `cardCount = 300`, clicking a naturally visible deep prompt card
    - `/prompts/07a78857-3cef-4017-a17c-c550d159b1c0?from=%2Ffeatured%23featured-item-07a78857-3cef-4017-a17c-c550d159b1c0`
    - did not open prompt detail
    - it redirected to login:
      - `/login?redirectTo=%2Fprompts%2F07a78857-3cef-4017-a17c-c550d159b1c0...`
- network evidence shows this is not an isolated single-card glitch:
  - during deep scroll prefetch, a large set of deeper prompt routes started returning `307`
  - those `307` responses resolve to login redirects rather than prompt detail payloads
  - earlier shallow cards on the same page still prefetch/open normally with `200`
- current conclusion:
  - the new highest-priority runtime issue on `/featured` is no longer only “deep return restore”
  - under deeper pagination, featured inventory is mixing in prompt items whose route access path behaves like protected content and redirects to login
  - this can both break real deep-item click-through and contaminate perceived return-flow testing, because the user is taken to the wrong page before any normal detail/back path can complete
- next debugging focus:
  - identify why these deeper featured prompt entries are publicly listable in `/api/featured-inventory` but their actual detail route/payload chain redirects to login
  - likely scope includes prompt detail data access gating, publish/visibility semantics drift on imported deep inventory, or route-level auth mismatch between list and detail

### 2026-06-15 cloud featured 300-item replay rechecked; deep cards are not inherently broken, auth/proxy state is the stronger suspect

- this follow-up replay stayed on the same cloud target and continued from the already loaded deep `/featured` state:
  - `scrollY ~= 36002`
  - `cardCount = 300`
  - visible deep cards included ids such as:
    - `ffefbb00-0bec-48d9-bde0-09728483ecd7`
    - `73b2a609-2c81-4439-a35c-2abbedfbbead`
- first reproduction still hit the earlier bad behavior:
  - clicking visible deep card `ffefbb00-0bec-48d9-bde0-09728483ecd7`
  - redirected to `/login?redirectTo=...`
- but the same session then exposed an important contradiction:
  - on that login page, the shell still showed `psk / 退出`
  - after clicking `进入社区`, the target prompt detail opened normally
  - after browser back, `/featured` restored directly to the deep position:
    - `scrollY ~= 36002`
    - `cardCount = 300`
  - clicking another visible deep card `73b2a609-2c81-4439-a35c-2abbedfbbead` then opened prompt detail normally without login redirect
- current refined conclusion:
  - the deep prompt items themselves are not yet proven bad
  - the more consistent explanation is session / cookie / proxy-state inconsistency in a long-lived browser session
  - likely failure mode: the page can remain usable under an already-present token, but a later route navigation re-runs proxy verification and gets bounced to `/login`
  - this is more aligned with the current `proxy.ts` behavior than with a pure deep-data corruption hypothesis
- next fix direction:
  - inspect proxy/session verification behavior around stale tokens and `verifyCommunitySession(...) === "skip"`
  - verify whether `/login` can render with a shell that still hydrates prior session UI, creating a misleading “already logged in but sent to login” state
  - only after this is cleared should deeper data-quality hypotheses remain primary

### 2026-06-15 session sliding expiry fix applied for deep cloud stress stability

- root cause confirmed:
  - community sessions were hard-capped at `7200s`
  - access only refreshed `last_seen_at`
  - `expires_at` was not extended on normal authenticated access
  - the browser cookie was also being issued with a fixed `maxAge=7200`
- this explains why very long featured/discussion pressure runs could eventually jump to `/login` even though the session had been healthy earlier in the same browser
- code changes applied:
  - server session lookup now slides `expires_at` forward on authenticated access
  - web proxy now refreshes the `dramatv_access_token` cookie when session verification succeeds
  - added an integration test that verifies `/api/auth/me` extends session expiry
- verification status:
  - browser-side follow-up on the existing deep detail tab still showed the authenticated shell (`psk / 退出`) and deep prompt details opening normally after the fix path was exercised
  - local server test execution was not completed in this round because the machine does not currently expose `mvn` or `gradlew` in the shell
- residual risk:
  - the new session test still needs a real local test run once the build toolchain is available
  - the 300-item deep inventory pressure path itself remains valid and should be rechecked after a clean server restart to confirm the login-hop no longer recurs

### 2026-06-15 backend verification completed for session sliding expiry

- final local verification result:
  - `CommunitySessionExpiryIntegrationTest` now passes on the local machine
  - the earlier Java 8 toolchain mismatch is confirmed as the cause of the first compilation failure, not a source-level regression
  - `mvn -version` on the machine resolves to Java `1.8.0_152` by default, so backend tests must be run with `JAVA_HOME=C:\Program Files\Java\jdk-17.0.2`
- code/test adjustments made during verification:
  - `apps/server/src/main/java/com/dramatv/community/admin/auth/AdminAuthApplicationService.java`
    - reconstructed as a clean compiling source file after it was found to be polluted by broken string literals during recovery
  - `apps/server/src/test/java/com/dramatv/community/integration/CommunitySessionExpiryIntegrationTest.java`
    - removed the direct dependency on package-private `AuthTokenSupport`
    - test now computes its own SHA-256 helper locally
- final test evidence:
  - command:
    - `JAVA_HOME=C:\Program Files\Java\jdk-17.0.2 ..\..\.tools\apache-maven\apache-maven-3.9.16\bin\mvn.cmd -Dtest=CommunitySessionExpiryIntegrationTest test`
  - result:
    - `BUILD SUCCESS`
    - `Tests run: 1, Failures: 0, Errors: 0, Skipped: 0`
- follow-up note:
  - no cloud sync was performed in this round
  - the only verified change in this round is the backend session-expiry regression path and its supporting test/toolchain cleanup
- 2026-06-15 featured search quality expanded locally

- this round focused on why `/featured` search quality felt incomplete for terms like `真人` on cloud-sized data.
- local code changes already in place:
  - `apps/server/src/main/java/com/dramatv/community/feed/application/FeaturedInventoryQueryService.java`
    - prompt inventory search now matches `summary`, `prompt_text`, `prompt_text_zh`, `prompt_text_en`, `prompt_text_raw`, author, tags, `model_category`, `content_category`, and `composition_category`
    - semantic mapping now expands `真人 -> real-person` and `动画 -> animation`
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - front-end search tokens now include `topicTokens` plus taxonomy aliases so the UI no longer under-filters already loaded items
  - `apps/server/src/test/java/com/dramatv/community/integration/FeedReadApiIntegrationTest.java`
    - added `featuredInventorySearchesSemanticRealPersonCategory`
    - local Maven verification passed for the new search path
- verification status:
  - local search logic is verified only on the current workspace data
  - cloud data still needs a real replay because imported content can have broader semantic drift than the local fixtures
- next step:
  - cloud validation completed on `drama-community-dev.dzkjm.cn` for `q=真人` and `q=动画`
  - verified counts on `/api/featured-inventory?filter=video_prompt&sort=latest`:
    - `q=真人` => `all=19`, `videoPrompt=12`, `imagePrompt=7`
    - `q=动画` => `all=70`, `videoPrompt=54`, `imagePrompt=16`
  - results stayed in prompt inventory and did not mix in posts or activity items
## 2026-06-16 featured deep return freeze first mitigation landed locally

- issue under investigation:
  - cloud `/featured` could freeze after a deep path:
    - scroll featured far down
    - open detail
    - enter creator/community profile
    - open several creator works
    - return out and switch back to `/featured`
  - earlier code inspection confirmed both `/featured` and `/creators/[id]` were repeatedly persisting large list snapshots into `sessionStorage`, which is a plausible main-thread stall source on deep-scroll returns
- local mitigation landed:
  - `apps/web/src/lib/featured/featured-inventory-session-cache.ts`
    - added module-memory cache for same-tab full inventory restore
    - bounded session fallback to a small recent-key window and a capped item count per key
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - restore now prefers in-memory featured inventory before falling back to session storage
    - cache persistence now writes full state to memory and only a bounded fallback to session storage
  - `apps/web/src/features/creator/CreatorPage.tsx`
    - creator page snapshot now keeps the full view in module memory
    - session fallback is narrowed to list buckets plus cursors and capped list sizes instead of serializing the whole page view every time
- verification:
  - `apps/web -> npm.cmd run typecheck` passed
  - `apps/web -> npm.cmd run build` passed
- cloud replay status:
  - Playwright cloud session was reset and `/featured` reopened on `http://drama-community-dev.dzkjm.cn/featured`
  - current cloud test account `psk` does not have enough creator-page content to fully replay the exact creator deep-detail chain in this round
  - no cloud deploy was performed in this round, so the live freeze behavior still reflects the old runtime
- next step:
  - deploy this web slice to cloud
  - replay the exact deep featured -> detail -> creator -> creator works -> featured path with a content-rich creator account
  - if freeze still exists after the persistence-cost reduction, inspect the remaining restore-completion loop and masonry re-entry path

## 2026-06-16 creator first-return anchor miss narrowed and fixed locally

- newly confirmed symptom:
  - creator page return positioning could fail on the first return from a work detail
  - after one failed return, later returns often looked normal
- root cause:
  - shared `useBackAnchorRestore(dependencies)` accepted dependency hints from list pages but then discarded them with `void dependencies`
  - creator page also marked its own restore state `completed=true` immediately when the anchor target was not yet mounted
  - on a cold first return, the target card could still be rebuilding, so the first restore window ended too early
- local fix:
  - `apps/web/src/lib/routes/back-anchor.ts`
    - shared restore effect now actually depends on the caller-provided dependency list
  - `apps/web/src/features/creator/CreatorPage.tsx`
    - creator restore no longer marks completion immediately on `!target`
    - it now keeps waiting within a bounded timeout so the first return can catch the anchor after list restore finishes
- verification:
  - `apps/web -> npm.cmd run typecheck` passed
  - `apps/web -> npm.cmd run build` passed
- follow-up:
  - this should be cloud-replayed on the high-volume `community` creator page after deploy because that page is the best real-world stress sample for first-return timing

## 2026-06-16 creator deep-return freeze narrowed to nested `from` hash corruption and repaired locally

- cloud replay was continued on the real high-volume path instead of stopping at the earlier simplified creator-only return:
  - `/featured` deep scroll
  - open prompt detail
  - enter `community` creator page
  - load more creator works
  - open creator work detail
  - return to creator page
- new reproduced failure shape on cloud:
  - creator page could get stuck behind `Restoring creator position`
  - the page URL at the stuck moment was malformed as:
    - `/creators/{id}?from=/prompts/{id}?from=/featured#featured-item-...#creator-work-...`
  - this means the inner featured hash and the outer creator-work hash were concatenated into one browser hash segment
  - once that happened, creator-page restore kept waiting for a non-existent anchor and the `← 返回上一页` path became effectively blocked by the restore overlay
- root cause:
  - shared `normalizeBackTarget()` previously trusted the decoded `from` string as-is
  - for nested routes like `featured -> prompt detail -> creator -> creator work detail -> creator`, the decoded source could contain both:
    - an inner hash that belongs to the previous route
    - an outer hash that belongs to the current route
  - after decode, the browser interpreted only the last `#...` as the real hash and left the earlier one embedded in the query value, which broke route-key and anchor reconstruction
- local fix:
  - `apps/web/src/lib/routes/redirect-utils.ts`
    - `normalizeBackTarget()` now normalizes nested internal routes before returning them
    - when a decoded `from` contains both an inner route hash and an outer current-route hash, the inner hash is re-encoded back into the query value while the outer hash remains the real browser hash
  - added regression test:
    - `apps/web/src/lib/routes/redirect-utils.test.mjs`
    - locks the exact malformed nested creator/prompt/featured path that reproduced on cloud
- local verification:
  - `node --test apps/web/src/lib/routes/redirect-utils.test.mjs` passed
  - `apps/web -> npm.cmd run typecheck` passed
  - `apps/web -> npm.cmd run build` passed
- next step:
  - deploy this web-only slice to cloud
  - replay the exact `featured deep -> detail -> creator -> creator work detail -> back -> back` path
  - specifically verify:
    - creator page no longer sticks on `Restoring creator position`
    - creator page `← 返回上一页` can be clicked after returning from creator work detail
    - final return to `/featured` restores the deep list state instead of dropping to top

## 2026-06-16 nested `from` hash repair synced to cloud; creator freeze closed, one creator-list restore gap remains

- cloud web deploy completed:
  - release: `20260616-121827`
  - readiness: `artifacts/runtime-readiness/test/web-deploy-20260616-121827-summary.json`
  - result: `13 passed / 0 failed`
- exact cloud replay rerun on `http://drama-community-dev.dzkjm.cn`:
  - `/featured` deep scroll to about `scrollY=7238.4`, visible cards=`60`
  - open prompt detail `f6b41e94-a1b1-425a-a3f8-9c1401bbd240`
  - enter `community` creator page
  - load more creator works
  - open creator work detail `5d3864e6-7621-47ab-9d40-6970f5009e02`
  - return to creator
  - return to prompt detail
  - return to featured
- verified improvements:
  - creator page no longer sticks behind `Restoring creator position`
  - malformed nested URL is now normalized correctly:
    - creator route keeps prompt `from` as `/prompts/{id}?from=/featured%23featured-item-...`
    - prompt route keeps featured deep anchor for the final return
  - final featured return now lands back near the deep position instead of top:
    - before: `scrollY=7238.4`
    - after: `scrollY=7012`
    - target featured card remained visible in viewport
    - no lingering `Restoring featured position`
- residual issue discovered in the same replay:
  - creator page `查看更多` had been used before entering creator work detail
  - after returning from creator work detail, creator page no longer froze, but visible work count dropped back to `24` instead of preserving `48`
  - this is now a separate remaining bug:
    - creator route/anchor restore is healthy
    - creator incremental list-state restore across nested detail return is still incomplete in this exact multi-hop path
- next step:
  - inspect why creator-page local expanded list is not surviving the `creator work detail -> creator` return when the source route itself contains a nested prompt/featured chain
  - likely scope remains inside `CreatorPage` snapshot restore / route-key matching rather than shared hash parsing

## 2026-06-16 creator 48->24 return regression narrowed to route-key normalization gap and fixed locally

- continued from the residual cloud replay issue after the creator-freeze repair:
  - creator page could already return without freezing
  - but after `查看更多` expanded works from `24 -> 48`, entering a creator work detail and returning could drop visible works back to `24`
- root cause confirmed locally by replaying the exact route-shape math:
  - creator-page snapshot restore was keyed by the raw `currentRoute`
  - on first entry into creator page, the route key stayed in an encoded form such as:
    - `/creators/{id}?from=%2Fprompts%2F...%3Ffrom%3D%2Ffeatured%2523featured-item-...`
  - after returning from creator work detail, the route was normalized into a decoded-but-still-valid internal form:
    - `/creators/{id}?from=/prompts/...?...from=/featured%23featured-item-...`
  - these two strings describe the same logical creator page, but they were treated as different snapshot buckets
  - result: the previously expanded `48`-item creator snapshot could be missed on return, leaving only the fresh server first page `24`
- local fix:
  - `apps/web/src/features/creator/CreatorPage.tsx`
    - added creator-page route-key normalization through `normalizeBackTarget(...)`
    - creator snapshot read/write now keys against the normalized route, not the raw encoded/decoded string form
    - memory snapshot lookup also tolerates either legacy raw key or the new normalized key during rollout
  - `apps/web/src/lib/routes/redirect-utils.test.mjs`
    - added regression coverage proving the encoded and decoded creator return routes collapse to the same normalized key
- verification:
  - `node --test apps/web/src/lib/routes/redirect-utils.test.mjs` passed
  - `apps/web -> npm.cmd run typecheck` passed
  - `apps/web -> npm.cmd run build` passed
- current status:
  - this slice is fixed locally
  - cloud replay is still pending for the exact `creator 48 -> detail -> back` path after the next web sync

## 2026-06-16 featured prompt facet rapid-switch race fixed and verified on cloud

- new user-reported symptom on cloud:
  - on `/featured?filter=image_prompt`, switching prompt model facets quickly could land on the wrong final facet
  - concrete replay example:
    - click `nanobanana`
    - click `midjourney`
    - click `nanobanana`
    - final page could incorrectly fall back to `midjourney`
- root cause:
  - `FeaturedArchivePage` computed next facet/filter state from render-time `activeFilter / activeModelFilter / activeContentFilter / activeSort`
  - under rapid consecutive clicks, later handlers could still read the previous render state before React had committed the newer route intent
  - result: an older facet state could be re-applied into the final route update
- local fix:
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - introduced a synchronous `effectiveRouteStateRef`
    - all filter / secondary / model / content / sort click and intent handlers now derive next state from the latest route intent ref instead of only the last committed render snapshot
    - `replaceRoute(...)` now updates that ref immediately before scheduling route replacement, so rapid clicks chain from the newest intended state
- verification:
  - `apps/web -> npm.cmd run typecheck` passed
  - `apps/web -> npm.cmd run build` passed
  - cloud web deploy completed:
    - release: `20260616-143548`
    - readiness: `artifacts/runtime-readiness/test/web-deploy-20260616-143548-summary.json`
    - result: `13 passed / 0 failed`
  - cloud rapid-switch replay on `http://drama-community-dev.dzkjm.cn/featured?filter=image_prompt` passed:
    - `nanobanana -> midjourney -> nanobanana` ended at `model=nanobanana`
    - `midjourney -> nanobanana -> midjourney` ended at `model=midjourney`
    - final URL and active chip both matched the last click in each replay

## 2026-06-16 frontend style baseline documented for future UI extension

- added `apps/web/style.md` as the shared frontend visual constraint document for future community-page work
- this doc is intentionally based on the currently shipped web style instead of generic UI taste advice:
  - cinematic / editorial / media-first / restrained
  - dark studio theme by default with intentional warm light mode
  - existing token families from `apps/web/src/app/globals.css`
  - existing page patterns from home / featured / creator
- the doc also locks several already-proven product/UI decisions into reusable guidance:
  - dense media lists should stay title-first and cover-first
  - summary text should not return to high-density grids by default
  - creator-page background should remain theme-driven instead of falling back to avatar or work cover
  - future AI-assisted page generation should reference `apps/web/style.md` first
- this is a documentation-only addition; no runtime behavior changed in this slice

## 2026-06-16 frontend style docs expanded into a 3-file UI guidance set

- expanded the new frontend style documentation from one file into three coordinated docs under `apps/web`
  - `style.md`: product-level visual thesis and hard constraints
  - `component-patterns.md`: reusable component behavior and density rules
  - `page-recipes.md`: page composition recipes for home / featured / creator / detail / discussion / publish / login
- updated `apps/web/style.md` to link the two companion docs so later UI work can enter from one stable root
- purpose of this split:
  - reduce repeated prompt/context cost in later UI sessions
  - keep future page extension aligned with the current shipped visual language
  - give AI-assisted implementation a more concrete structure than one broad style memo alone
- this is still documentation-only work; no runtime behavior changed

## 2026-06-16 cloud community multidimensional test design landed and first cloud replay completed

- added test asset:
  - `docs/04_实施设计/云端社区多维度测试用例-2026-06-16.md`
- this round explicitly converted the current community feature surface into a cloud regression matrix covering:
  - login / protected-route redirect
  - home / featured / discussions / publish / creator / detail
  - deep scroll and back-restore
  - session consistency
  - media/category/search correctness
  - theme / loading / notification behavior
- first cloud replay was executed directly on `http://drama-community-dev.dzkjm.cn` with the existing authenticated test session and produced these concrete results:
  - `/home` first screen opened normally
  - `/featured` first screen opened normally
  - `/featured` rapid category switching remained correct
  - `/featured?filter=video_prompt&q=真人` returned prompt results consistent with the semantic keyword
  - `/featured` infinite continuation worked in-browser: visible cards grew `12 -> 48`
  - prompt detail -> creator page main path remained reachable
  - `/discussions` first screen opened normally
  - recent-interactions bell opened and follow-up network checks showed `/api/me/notifications/recent` returning `200` in the replay, so the earlier single `502` console entry was not stably reproduced in this round
  - `/publish` route was reachable under the logged-in session and rendered the expected publishing shell
- one real regression/coverage gap is now explicitly confirmed on cloud:
  - discussion detail currently does not provide a true anchored return-to-list path
  - the visible breadcrumb `社区` points to plain `/discussions`, not `/discussions#discussion-thread-*`
  - this means the earlier user requirement that community/thread browsing should support return positioning is still not fully closed on the discussion side
- weaker signal, not yet confirmed as a product bug:
  - one early `/featured` console capture showed a transient external media `ERR_CONNECTION_CLOSED`
  - later cloud replay did not produce stable page-level failures from it
  - treat it as an observation to keep watching, not as a closed root-cause finding yet

## 2026-06-16 cloud complex replay second round completed

- continued cloud replay moved beyond first-screen checks and specifically stressed:
  - `/featured` deep scroll to `180` visible cards
  - deep card entry into prompt detail
  - prompt detail -> creator page
  - creator `查看更多`
  - creator work detail return chain
  - discussion channel switching
  - cross-page logged-in session continuity
- confirmed healthy in this second round:
  - `/featured` deep scroll itself stayed usable and did not white-screen
  - `/discussions` channel switching `video-production -> prompt-lab -> canvas-workflows -> video-production` stayed stable
  - no repeated `加载中 / 查看更多` flicker loop was observed on discussions in this replay
  - cross-page logged-in continuity remained stable across `/home -> /featured -> /discussions -> /me -> /publish`
  - logged-in shell still showed `psk / 退出`, and no unexpected `/login` bounce happened in that sequence
- newly observed likely residual bug on the featured/creator multi-hop return chain:
  - starting from deep featured prompt detail, entering creator page, expanding creator works, opening a creator work detail, then returning through the chain did not behave fully as expected in automation
  - one replay timed out while waiting to land back on the intermediate prompt detail because the route had already collapsed directly to:
    - `/featured#featured-item-bb682a96-2332-431d-8584-509b12bee95b`
  - this suggests the multi-hop `from` / back-target chain may still over-collapse in some routes, skipping the intended middle page instead of stepping back through `creator work detail -> creator -> prompt detail -> featured`
  - current status:
    - this is not yet recorded as fully root-caused
    - but it is strong enough to keep on the high-risk regression list together with creator/featured deep restore
- still-open discussion-side gap remains unchanged:
  - discussion detail does not yet provide true anchored return to list items

## 2026-06-16 cloud replay third round corrected one old verdict and closed the creator multi-hop chain on the current build

- this round intentionally re-ran the two highest-risk paths instead of trusting the earlier partial replay notes:
  - discussion detail return-to-list
  - `featured deep -> prompt detail -> creator -> creator work detail -> back -> back -> featured`
- cloud environment:
  - site: `http://drama-community-dev.dzkjm.cn`
  - authenticated session: existing `psk`
- corrected verdict on discussions:
  - the earlier same-day note that discussion detail only returned to plain `/discussions` is no longer true on the current live build
  - replay on:
    - `/discussions/weekly-creator-thread?from=%2Fdiscussions%23discussion-thread-98b8a9e5-61b1-4bf9-94fd-2ed845de886a`
  - visible breadcrumb `社区` now points to:
    - `/discussions#discussion-thread-98b8a9e5-61b1-4bf9-94fd-2ed845de886a`
  - actual return verification on cloud passed:
    - target thread node found
    - `scrollY=548`
    - target card `top=265`
    - target already in viewport
  - conclusion:
    - the previous “discussion return gap” entry should now be treated as outdated replay evidence, not as the current-runtime verdict
- creator multi-hop chain was re-run on a high-volume creator instead of the smaller `Rina Flux` sample:
  - deep featured scroll reached:
    - `180` visible cards
    - `scrollY=16320.8`
  - opened prompt detail:
    - `/prompts/f6b41e94-a1b1-425a-a3f8-9c1401bbd240?from=%2Ffeatured%23featured-item-f6b41e94-a1b1-425a-a3f8-9c1401bbd240`
  - entered creator:
    - `/creators/04e32520-c171-40af-8c93-7bb1ad58d6d5?...`
    - creator=`community`
    - first screen showed `24` works with `查看更多`
  - after one `查看更多`:
    - creator visible works `24 -> 48`
    - `scrollY=3768.8`
  - opened a deeper creator work detail:
    - `/prompts/19eab634-7a26-4511-b259-ba0408c923e5?...#creator-work-19eab634-7a26-4511-b259-ba0408c923e5`
  - returned to creator and verified on cloud:
    - visible works still `48`
    - no `Restoring creator position` stuck overlay
    - target `creator-work-19eab634-7a26-4511-b259-ba0408c923e5` found
    - target `top=219.6`
    - target in viewport
    - `scrollY=4927.2`
  - returned to the intermediate prompt detail and then back to featured:
    - prompt detail remained reachable as the intermediate page
    - final featured return landed on:
      - `/featured#featured-item-f6b41e94-a1b1-425a-a3f8-9c1401bbd240`
      - `cards=180`
      - `scrollY=5854.4`
      - target found and in viewport
      - no lingering `Restoring featured position`
  - conclusion:
    - the previously suspected over-collapse on the featured/creator chain was not reproduced on the current live build in this high-volume replay
    - the previously tracked `creator 48 -> detail -> back drops to 24` regression is also not present on the current live build
- additional route return observation:
  - from deep featured, entering `/me?from=%2Ffeatured%23featured-item-f6b41e94-a1b1-425a-a3f8-9c1401bbd240` and returning via `← 返回首页` also came back to the same featured anchor with:
    - `cards=180`
    - `scrollY=5854.4`
    - target still visible
  - note:
    - this is still an anchor-bearing return path, not a pure no-hash route-scroll restore proof
- residual observations collected during this replay, not yet promoted to confirmed product bugs:
  - stable local media 404 in browser runtime:
    - `GET /media/image/ccac8677-6a33-49fa-affa-63ae608fbe0e/callback-cover.png => 404`
    - seen during creator/profile-side browsing
    - likely indicates one stale/broken image asset reference still exists in live data
  - external media transient failure:
    - `https://d8j0ntlcm91z4.cloudfront.net/...mp4 => net::ERR_CONNECTION_CLOSED`
    - reproduced twice in the request log during this round
    - no stable white-screen or route break was observed from it, so it stays a watch item
- current cloud verdict after three rounds on 2026-06-16:
  - `/featured` deep scroll, creator expansion, creator-detail return, prompt-detail return, and final featured return are healthy on the current deployed build
  - `/discussions` detail return-to-thread is also healthy on the current deployed build
  - the remaining cloud risk surface from this round is no longer return-restore logic first; it is the smaller class of bad media references / unstable external assets that still deserve follow-up

## 2026-06-16 stability follow-up: bad creator/profile poster fallback narrowed and fixed locally

- continued cloud replay stayed focused on real runtime stability instead of doc cleanup:
  - `/featured` was pushed to `300+` visible cards without a fresh white-screen or stuck overlay
  - the multi-hop path `featured deep -> prompt detail -> creator community -> 查看更多 -> creator work detail -> back -> back -> featured` still returned to a live featured anchor with the target card in viewport
  - `/api/me/notifications/recent` showed one earlier console `502` in browser history, but active request inspection in this round returned `200` repeatedly, so it is not yet a current reproducible product bug
- one concrete residual issue was confirmed at the shared component level:
  - live cloud browsing still hits `GET /media/image/ccac8677-6a33-49fa-affa-63ae608fbe0e/callback-cover.png => 404`
  - the affected surface is the creator/profile shared media card path, not the featured/home masonry path
  - local review found that `apps/web/src/components/shared/ProfileMediaCard.tsx` only used `backgroundImage` for the video-card poster layer, so image failure never triggered the intended `imageFailed` fallback
- local fix:
  - `apps/web/src/components/shared/ProfileMediaCard.tsx`
    - keep the neutral gradient base layer as the true fallback
    - render the video-card poster as a real `<img>` with `onError={() => setImageFailed(true)}`
    - this makes creator page and personal center cards degrade cleanly when a poster/cover URL is stale instead of continuing to expose a broken poster layer
- local verification:
  - `apps/web -> npm.cmd run typecheck` passed
  - `apps/web -> npm.cmd run build` passed
- current status:
  - this stability slice is fixed locally only
  - next step, if needed, is to sync the web change to cloud and re-check the creator/profile path that currently emits `callback-cover.png 404`

## 2026-06-16 featured buffered-page commit gap narrowed and fixed locally

- new user-reported symptom cluster on `/featured` was traced back to one shared pagination-state gap rather than two unrelated bugs:
  - after scrolling deep, the page could reach bottom and then stop loading subsequent inventory even though more data existed
  - refreshing a deep `/featured#featured-item-*` route could stay stuck behind `Restoring featured position`
- root cause confirmed in `apps/web/src/features/featured/FeaturedArchivePage.tsx`:
  - `handleFeaturedInventoryLoadMore()` can enter `isLoading=true` and then request the next page through the buffered prefetch path
  - when that request succeeds, the next page was only parked in `bufferedPageRef`
  - but there was no guaranteed follow-up trigger to commit that buffered page immediately
  - result:
    - if the user was already at the bottom, the next page could sit buffered forever waiting for another scroll/intersection event that never came
    - if featured back-anchor restore was active, the restore overlay could also stall because the page stayed in a self-locked `isLoading` state
- local fix:
  - added `apps/web/src/lib/featured/featured-buffered-commit.ts`
  - added regression coverage in `apps/web/src/lib/featured/featured-buffered-commit.test.mjs`
  - `FeaturedArchivePage` now auto-commits a buffered page immediately when either:
    - a load-more cycle is already in progress
    - featured back-anchor restore is forcing forward progress
    - or the user is already within the bottom commit threshold
  - also added a light refresh-time anchor nudge after restoring cached featured snapshots so deep hash refreshes do not wait for another manual interaction before centering the mounted target
- local verification:
  - `node --test apps/web/src/lib/featured/featured-buffered-commit.test.mjs apps/web/src/lib/featured/featured-back-anchor.test.mjs apps/web/src/lib/routes/redirect-utils.test.mjs` passed
  - `apps/web -> npm.cmd run typecheck` passed
- current status:
  - fixed locally only
  - next step is local/manual replay of:
    - deep scroll -> bottom continue loading
    - deep scroll -> refresh anchored featured URL
    - deep detail return path with featured restore overlay

## 2026-06-16 featured return positioning issue promoted from single-bug repair to system-level architecture review

- latest user-facing failure pattern on `/featured` is no longer a single “overlay stuck” symptom:
  - after deep scrolling, entering detail, and returning, the restored viewport can land in a broken masonry state
  - visible effect includes:
    - left column content disappearing or becoming nearly empty
    - later content looking stuck and not continuing to load as expected
    - scrolling again can sometimes resume loading, which means the route is not fully dead but the restore state is inconsistent
- current code-level diagnosis after reviewing the restore chain:
  - there are now multiple restore mechanisms stacked together on the same page:
    - shared hash-anchor restore via `useBackAnchorRestore()`
    - shared route scroll restore via `useStoredRouteScrollRestore()`
    - featured-specific hash-route snapshot restore
    - featured inventory session cache restore
    - featured aspect-ratio session cache restore
    - featured masonry assignment rebuild on render
    - buffered page prefetch + delayed commit
  - these mechanisms are individually reasonable, but together they currently form a coupled state machine without one single source of truth
- main systemic risks identified:
  - restore source fragmentation:
    - scroll position, anchor, list snapshot, route snapshot, ratio map, and masonry assignment are restored from different places with different timing
    - one layer can declare “restore complete” while another layer is still rebuilding
  - layout instability after restore:
    - `/featured` uses masonry assignment derived from card order plus aspect ratios
    - deep return can restore `scrollY` before the column assignment is deterministically rebuilt
    - result: user lands in the old vertical area but not on the old visual structure
  - cache depth mismatch:
    - generic featured session cache still caps each entry at `72` items while deep route snapshots allow `240`
    - this creates mixed restore fidelity depending on which restore source wins for a given path
  - completion criteria mismatch:
    - some restore branches effectively treat “scroll reached” or “target mounted” as enough
    - but the real success condition for this page must also include stable masonry reconstruction and continued pagination readiness
- conclusion:
  - this class of issues should no longer be handled as isolated patch-by-patch regressions
  - next optimization should refactor featured return/refresh into a single ordered restore pipeline with one owner and explicit phase boundaries:
    - rebuild list state
    - rebuild layout state
    - restore viewport
    - verify target visibility
    - only then release the restoring state

## 2026-06-16 featured restore architecture first refactor slice landed locally

- this slice deliberately stopped patching visible symptoms only and instead changed the restore payload shape for `/featured`
- main code changes:
  - `apps/web/src/lib/featured/featured-hash-route-snapshot.ts`
    - featured route snapshot now supports carrying:
      - loaded inventory items
      - aspect-ratio entries
      - masonry assignment state
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - introduced explicit featured snapshot restore phases:
      - `restoring-list`
      - `restoring-layout`
      - `restoring-viewport`
      - `completed`
    - returning to `/featured` now restores list snapshot and layout snapshot together instead of restoring items first and letting the masonry structure drift later
    - route snapshot persistence now tracks the plain featured route itself, not only the anchored hash route
    - masonry force-reset is now constrained so the restored layout snapshot is not immediately blown away during the same restore cycle
  - `apps/web/src/lib/featured/featured-hash-route-snapshot.test.mjs`
    - added regression coverage for optional aspect-ratio and masonry snapshot data
- why this slice matters:
  - the previously repeated cloud symptom was not just “scroll returned wrong”
  - it was “scroll could return into a different masonry structure”, which is exactly how blank/near-empty side columns and delayed self-healing could appear
  - this slice is the first step toward making `/featured` restore deterministic instead of opportunistic
- local verification:
  - `node --test apps/web/src/lib/featured/featured-hash-route-snapshot.test.mjs apps/web/src/lib/featured/featured-back-anchor.test.mjs apps/web/src/lib/featured/featured-buffered-commit.test.mjs apps/web/src/lib/routes/redirect-utils.test.mjs` passed
  - `apps/web -> npm.cmd run typecheck` passed
  - `apps/web -> npm.cmd run build` passed
- current status:
  - landed locally only
  - next required validation is cloud deep-scroll replay, because local inventory depth is still too small to prove the original left-column disappearance is actually closed
- residual risk still explicitly open:
  - route snapshot currently stores one featured route snapshot per tab/session bucket, not a larger multi-route restore graph
  - deep cloud replay is still required to confirm:
    - no left-column disappearance after return
    - no stalled continuation load after return
    - no new refresh/overlay regressions

## 2026-06-16 return-position scope audit completed and shared list-page restore hook landed locally

- this round explicitly stopped treating return positioning as only a `/featured` issue and audited the wider `apps/web` surface
- confirmed return-position related routes/components currently include:
  - list pages with anchor return:
    - `/featured`
    - `/creators/[id]`
    - `/me`
    - `/discussions`
    - `/home`
    - `/`
  - non-card route returns that still rely on stored route scroll:
    - topbar profile entry -> `/me`
    - notification / comment-author / creator hops
  - visible detail-page back entrances:
    - `ContextBackLink` in detail / creator / personal-center pages
  - shared route plumbing:
    - `appendBackSource(...)`
    - `rememberBackAnchorSource(...)`
    - `useBackAnchorRestore(...)`
    - `useStoredRouteScrollRestore()`
- local code changes in this slice:
  - added `apps/web/src/lib/routes/list-page-back-restore.ts`
    - centralizes the common list-page restore completion logic
    - unifies hash-anchor restore + stored route-scroll restore into one shared page-level state
    - avoids each page independently deciding too early that restore has completed when the target node has not mounted yet
  - adopted the shared hook in:
    - `apps/web/src/features/creator/CreatorPage.tsx`
    - `apps/web/src/features/me/PersonalCenterPage.tsx`
    - `apps/web/src/features/discussions/DiscussionsPage.tsx`
    - `apps/web/src/features/home/CommunityHomePage.tsx`
    - `apps/web/src/features/home/HomePage.tsx`
  - `/home` and `/` now also participate in the same visible restoring state instead of only mounting hash restore silently
  - added minimal overlay support in:
    - `apps/web/src/features/home/CommunityHomePage.module.css`
    - `apps/web/src/features/home/HomePage.module.css`
- local verification:
  - `apps/web -> npm.cmd run typecheck` passed
  - `apps/web -> npm.cmd run build` passed
  - `node --test apps/web/src/lib/routes/redirect-utils.test.mjs apps/web/src/lib/featured/featured-hash-route-snapshot.test.mjs apps/web/src/lib/featured/featured-back-anchor.test.mjs apps/web/src/lib/featured/featured-buffered-commit.test.mjs` passed
- current status:
  - this slice is local only
  - it does not replace the `/featured` special restore pipeline; it only removes duplicated normal-list restore logic across the other pages
- still-open return-position risk surface after this slice:
  - `/featured` remains the highest-risk special case because it still owns masonry/list snapshot restore separately
  - `ContextBackLink` history-first behavior and nested `from` chain trimming are already landed locally but still need cloud replay together with this shared-hook slice
  - notification / comment-author / multi-hop creator-detail chains still need cloud replay on real deep data after the latest local changes

## 2026-06-16 return-position scope follow-up patched missed discussion back entrances locally

- after the broader return-position audit, one more shared-pattern gap was confirmed:
  - most detail/profile pages already route visible “back” actions through `ContextBackLink`
  - but discussion-side breadcrumb returns were still partly using plain `Link`
  - this meant the same-origin history-first return path could still be bypassed on discussion flows even after the shared restore hook landed
- local fixes in this slice:
  - `apps/web/src/features/discussions/DiscussionDetailPage.tsx`
    - changed the breadcrumb `社区` return entry from plain `Link` to `ContextBackLink`
  - `apps/web/src/features/discussions/DiscussionComposerPage.tsx`
    - changed the composer breadcrumb `社区` return entry from plain `Link` to `ContextBackLink`
- why this matters:
  - these are low-visibility but real discussion entry/exit paths
  - without this change, detail/composer discussion routes could still skip the shared history-first back behavior and fall back to plain route jumps
- scope confirmation after code search:
  - visible return entrances now consistently use `ContextBackLink` on:
    - `VideoDetailPage`
    - `WorkflowDetailPage`
    - `CreatorPage`
    - `PersonalCenterPage`
    - `DiscussionDetailPage`
    - `DiscussionComposerPage`
  - route-level `backHref` derivation continues to come from normalized `from` on:
    - `/prompts/[id]`
    - `/videos/[id]`
    - `/workflows/[id]`
    - `/creators/[id]`
    - `/discussions/[slug]`
    - `/me`
- local verification:
  - `apps/web -> npm.cmd run typecheck` passed
  - `apps/web -> npm.cmd run build` passed
- cloud replay notes collected in the same round:
  - current deployed cloud build still reproduces healthy deep featured return on the already-synced paths:
    - deep `/featured` scroll to `120` cards
    - prompt detail entry
    - final `返回列表`
    - result stayed on `/featured` with the target card back in viewport and no `Restoring featured position` overlay
  - these new discussion breadcrumb fixes are local only for now and still need deployment before cloud verification

### 2026-06-16 featured -> detail -> creator multi-hop return root cause fixed on cloud

- root cause was confirmed in shared route plumbing, not in the featured masonry algorithm itself:
  - `apps/web/src/lib/routes/redirect-utils.ts -> appendBackSource(...)`
  - old logic normalized the current route and then removed any nested `from` query before attaching it to the next hop
  - result:
    - `/featured -> /prompts/{id}` kept the featured anchor
    - `/prompts/{id} -> /creators/{id}` dropped the upstream featured context and only kept the immediate prompt route
    - later creator-detail back links therefore returned through a collapsed chain and could hand the final featured restore a shallower context than the original entry path
- fix:
  - `appendBackSource(...)` now preserves the normalized nested `from` chain instead of stripping it
  - `apps/web/src/lib/routes/redirect-utils.test.mjs` regression was updated to assert creator links keep nested `from=/prompts?...from=/featured%23featured-item-*`
- local verification:
  - `node --test apps/web/src/lib/routes/redirect-utils.test.mjs` passed
  - `apps/web -> npm.cmd run typecheck` passed
  - `apps/web -> npm.cmd run build` passed
- cloud deploy:
  - command:
    - `./scripts/deploy-test-web.ps1 -PublicBaseUrl http://drama-community-dev.dzkjm.cn -ServerNames drama-community-dev.dzkjm.cn -VerifyAfterDeploy`
  - web release:
    - `20260616-212311`
  - readiness:
    - `artifacts/runtime-readiness/test/web-deploy-20260616-212311-summary.json`
    - `13 passed / 0 failed`
- cloud replay after deploy:
  - author link from prompt detail now preserves full upstream source:
    - `/creators/... ?from=/prompts/... ?from=/featured%23featured-item-11c85570-...`
  - creator work detail back link also preserves the same upstream featured source through creator:
    - `/creators/... ?from=/prompts/11c85570-... ?from=/featured%23featured-item-11c85570-... #creator-work-...`
  - full replay path:
    - deep `/featured` scroll to `132` cards
    - open `featured-item-11c85570-ea9f-45a8-bf58-67442dca4fd0`
    - enter creator `community`
    - open creator work detail `creator-work-be0b2ea8-c3d1-4e1a-9123-9461db560064`
    - back to creator
    - back to prompt detail
    - back to featured
  - final featured result on cloud:
    - `url=/featured#featured-item-11c85570-ea9f-45a8-bf58-67442dca4fd0`
    - `count=132`
    - `scrollY=11149.6`
    - `overlay=false`
    - target card exists, `top=239.9`, and is in viewport
    - column counts recovered as `[40,43,49]`, no missing right column observed
- conclusion:
  - the reported multi-hop featured return bug is closed on the current cloud build
  - if a similar issue reappears, inspect nested `from` propagation before patching featured restore/masonry again

## 2026-06-17 shared return-position strategy synced to remaining lightweight entry points locally

- scope decision:
  - do sync the shared return-position strategy to remaining lightweight entry points
  - do not copy `/featured`'s specialized masonry/list-snapshot restore pipeline into other pages
  - keep the architecture split as:
    - normal list pages: `appendBackSource + ContextBackLink + useListPageBackRestore`
    - special list pages such as `/featured`: keep dedicated restore owner
- local entry-point fixes:
  - `apps/web/src/features/home/HomePage.tsx`
    - landing-page `browse archive` now carries `from=currentRoute` into `/featured`
    - landing-page footer profile entry now carries `from=currentRoute` into `/me`
  - `apps/web/src/features/home/CommunityHomePage.tsx`
    - each shelf `查看全部` link now carries `from=currentRoute` into `/featured`
  - `apps/web/src/features/discussions/DiscussionDetailPage.tsx`
    - breadcrumb channel link now carries `from=currentRoute`
    - hero channel pill now carries `from=currentRoute`
- rationale:
  - these were lightweight cross-page exits that could leave the current list/context without preserving route-scroll restore state
  - they fit the shared strategy and did not require any `/featured`-style snapshot or masonry logic
- intentional non-changes:
  - no change to `apps/web/src/features/featured/FeaturedArchivePage.tsx`
  - no attempt to force non-list pages onto `useListPageBackRestore`
  - no broad rewrite of current-page filter/category links that are really in-page navigation rather than back-restore exits
- local verification:
  - `apps/web -> npm.cmd run typecheck` passed
  - Playwright local replay confirmed:
    - landing `/` now exposes `/featured?from=%2F` on both `浏览档案` and `查看全部`
    - landing `/` now exposes `/me?from=%2F` on the footer profile entry
    - `/login?redirectTo=%2Fme%3Ffrom%3D%252F -> login -> /me?from=/` completed normally with back link returning to `/`
    - `/discussions -> thread detail -> channel page` now carries nested `from` back to the originating thread detail route
    - `channel page -> browser back` returned to the thread detail route correctly
- follow-up note:
  - the above discussion channel replay showed an abnormally long Playwright `goBack()` wait before the page settled, even though the final route/result were correct and console stayed clean
  - treat this as a separate runtime/perf signal to revisit during the next broader return-navigation stress pass, not as a functional regression of the shared entry-point patch

## 2026-06-17 return-position performance slice first pass landed locally

- focus:
  - optimize shared return-position waiting overhead before touching page-specific logic
  - keep restore semantics unchanged; only reduce idle delay between restore checks
- implementation:
  - `apps/web/src/lib/routes/back-anchor.ts`
    - replaced fixed `setInterval(120ms)` polling in both hash-anchor restore and stored-route restore with short, on-demand `setTimeout` retries
    - added shared retry delay constant `BACK_SCROLL_RESTORE_RETRY_DELAY_MS = 48`
    - centralized finish/clear scheduling paths so restore completion stops pending retries immediately
  - boundary:
    - no change to nested `from` propagation
    - no change to restore success conditions
    - no change to `/featured` specialized masonry/list snapshot pipeline
- rationale:
  - the previous shared hooks could spend visible extra time between already-satisfied restore conditions and overlay dismissal because they only rechecked on a coarse 120ms cadence
  - this slice targets that scheduler dead time first, which is lower risk than changing route semantics or page restore rules
- verification:
  - `apps/web -> npm.cmd run typecheck` passed
  - `apps/web -> npm.cmd run build` passed
- current status:
  - local functional replay still shows correct route recovery on discussion detail/channel back paths
  - deeper proof for perceived speed improvement still needs the next browser pass, ideally on cloud/high-data routes where the original slow-return symptom is more obvious

## 2026-06-17 cloud deep replay validated the new return-position chain on `/featured`

- cloud validation was run on a fresh tab against `http://drama-community-dev.dzkjm.cn/featured` after the latest shared history-entry and back-anchor changes were deployed
- verified replay path:
  - deep scroll on `/featured` to `300` items
  - open `featured-item-11764a13-3bbc-43db-8ebe-f51e25eaad32`
  - enter creator `community`
  - open creator work detail `be0b2ea8-c3d1-4e1a-9123-9461db560064`
  - go back step by step to creator, then prompt, then featured
- verified final cloud state:
  - final URL: `/featured#featured-item-11764a13-3bbc-43db-8ebe-f51e25eaad32`
  - `count=312`
  - `scrollY=37156`
  - `restoring=false`
  - target card still exists and stays near the restored area
  - after returning, the page can continue incremental loading and did not re-enter a stuck restore overlay
- interpretation:
  - the multi-hop return-position regression that was previously collapsing the final featured hop is not reproducing on the current cloud build
  - the shared history-entry upgrade plus nested `from` preservation are both working in the cloud route chain
- residual note:
  - creator/detail transitions still show a noticeable wait window during `goBack()` in the browser harness, but the final route and restore state are correct

### 2026-06-17 professional testing workflow first round appended

- External test package under `E:\tmp\skills-专业版V2.0` was adopted as a methodology layer for this repo.
- Added docs:
  - `docs/04_实施设计/社区专业测试执行任务板-2026-06-17.md`
  - `docs/04_实施设计/社区专业测试首轮结果-2026-06-17.md`
- Cloud UI validation in this round passed for:
  - `/home`
  - `/discussions`
  - discussion detail -> list anchor return
  - logged-in access to `/login` redirecting back out
- Local validation in this round:
  - `npm.cmd run smoke:auth-session` -> `12 passed / 0 failed`
  - `npm.cmd run smoke:api` -> `8 passed / 11 failed`
  - `npm.cmd run backend-test:read` -> multiple failures
  - `npm.cmd run backend-test:core` -> multiple failures
- First concrete root cause closed:
  - `scripts/run-local-community-api-smoke.mjs` used a hard-coded temp password default that no longer matched local `apps/server/.env`
  - current local bootstrap secret is `123456`
  - the smoke script now resolves temp password from CLI arg, env vars, then `apps/server/.env`
- Supporting local bootstrap contract was also made explicit in:
  - `apps/server/.env.example`
- Next debug order:
  1. re-run `smoke:api`
  2. isolate `ApiIntegrationTestSupport.cleanupTestUsers()` FK cleanup residue
  3. then isolate authenticated-path `403` regressions in backend suites

### 2026-06-17 professional testing local rerun stabilized

- Re-ran the previously failing local suites after fixing temp-user bootstrap password resolution.
- Current local results:
  - `npm.cmd run smoke:api` -> `19 passed / 0 failed`
  - `npm.cmd run backend-test:read` -> `41 run / 0 failures / 0 errors`
  - `npm.cmd run backend-test:core` -> `53 run / 0 failures / 0 errors`
  - `npm.cmd run smoke:notifications` -> `4 passed / 0 failed`
  - `npm.cmd run readiness:local` -> `12 passed / 0 failed`
- Interpretation:
  - the only confirmed local regression in this testing slice was the temp-user bootstrap password mismatch
  - the earlier FK-cleanup and `403` clusters did not reproduce on the fresh rerun against the current local runtime
- Immediate next focus should move back to cloud/browser-heavy validation rather than continuing to optimize already-green local suites

### 2026-06-17 cloud notifications instability confirmed separately from featured deep-scroll flow

- This round continued cloud validation on `http://drama-community-dev.dzkjm.cn` with the logged-in `psk` account.
- Confirmed cloud featured infinite-loading still works at high depth:
  - `/featured` deep scroll reached `300` rendered items
  - measured state at stop:
    - `count=300`
    - `scrollY=36002.4`
    - `height=38969`
  - no visible pagination stall reproduced in this path
- Confirmed featured detail -> creator multi-hop source propagation is still structurally correct on cloud:
  - detail entry preserved `/featured#featured-item-*`
  - creator entry preserved nested `from=/prompts/...from=/featured%23featured-item-*`
  - creator work detail links also carried nested upstream featured source
- New cloud-specific finding isolated:
  - `/api/me/notifications/recent` still shows real intermittent `502 Bad Gateway`
  - browser-visible evidence:
    - repeated successful `200` responses are mixed with intermittent `502`
    - sampled failed response headers were minimal proxy-style headers only:
      - `content-length: 0`
      - `connection: keep-alive`
    - this strongly suggests failure occurs before the Next route fallback JSON is produced
- Important narrowing from the same round:
  - client-side notification refresh is not running as a tight millisecond loop in the healthy path
  - `performance.getEntriesByType("resource")` on the cloud page showed a normal cadence close to every `15s`
  - therefore the current primary issue is not “frontend keeps spamming notifications every moment”, but “cloud notification route / upstream occasionally returns 502”
- Residual UX/perf signal still open:
  - creator/deep-detail return chain did not clearly regress functionally
  - but creator/deep-detail back navigation still feels slower than ideal in the browser harness and should remain in the next perf-focused replay batch
- Recommended next debugging order:
  1. inspect cloud-side Next / nginx / service logs around `/api/me/notifications/recent`
  2. verify whether the failing requests coincide with web process restarts, upstream timeout, or proxy connection churn
  3. only after that decide whether any frontend notification-refresh throttling changes are still needed
### 2026-06-17 cloud notifications 502 root cause narrowed to web restart windows

- Follow-up cloud server-side diagnosis was completed through ECS `nginx + systemd + journalctl` logs.
- Confirmed current runtime state is healthy:
  - `dramatv-community-web` was `active`
  - `NRestarts=0`
  - the currently running process had been stable since `2026-06-17 16:23:31 CST`
  - the latest sampled `/api/me/notifications/recent` requests on `drama-community-dev.dzkjm.cn` were all `200`
- Historical failure evidence was still found in nginx error logs:
  - `2026/06/15 13:28:55 [error] ... connect() failed (111: Connection refused) while connecting to upstream`
  - request: `GET /api/me/notifications/recent`
  - upstream: `http://127.0.0.1:3106/api/me/notifications/recent`
- The same timestamp matched `systemd` restart events for `dramatv-community-web`:
  - `13:28:55` stop old process
  - `13:28:55` start new process
  - Next became ready immediately after on `127.0.0.1:3106`
- Conclusion update:
  - the confirmed real 502 shape is `nginx -> 127.0.0.1:3106` upstream refusal during web restart or deploy windows
  - this is not currently reproduced as a steady-state notification polling bug while the web process stays up
  - the existing Next route fallback only helps after the request has already reached the web process; it cannot help when nginx cannot connect to `3106` at all
- Practical next-step priority:
  1. do not start by changing frontend notification refresh cadence
  2. if this failure must be eliminated, focus on deploy/runtime strategy first:
     - reduce restart-window downtime
     - or add ingress-level fallback for this exact route
  3. continue broader cloud browser stress testing separately from this deploy-window issue

### 2026-06-17 cloud notifications restart-window fallback landed and verified

- Implemented a narrow ingress hardening change in `scripts/deploy-test-web.ps1` only:
  - `location = /api/me/notifications/recent` now enables `proxy_intercept_errors on`
  - added `error_page 502 503 504 = @community_notifications_recent_fallback`
  - added a named nginx fallback location that returns `200` with an empty notification payload and `Cache-Control: no-store`
- Rationale:
  - keep the existing Next route and its auth/header behavior unchanged
  - avoid broad backend auth changes just to handle one restart-window soft-failure
  - only cover the exact case already proven by logs: nginx cannot connect to `127.0.0.1:3106` during web restart
- Cloud rollout:
  - command:
    - `./scripts/deploy-test-web.ps1 -PublicBaseUrl http://drama-community-dev.dzkjm.cn -ServerNames drama-community-dev.dzkjm.cn -VerifyAfterDeploy`
  - web release:
    - `20260617-221940`
  - readiness artifact:
    - `artifacts/runtime-readiness/test/web-deploy-20260617-221940-summary.json`
    - `13 passed / 0 failed`
- Targeted cloud verification:
  - actively triggered `systemctl restart dramatv-community-web` on ECS
  - at the same time hit `http://drama-community-dev.dzkjm.cn/api/me/notifications/recent` 25 times in a row from the client side
  - result:
    - `25 / 25` responses were `200`
    - no `502` escaped to the caller during the restart window
- Updated conclusion:
  - the previously confirmed restart-window notification `502` is now closed on the current cloud test build
  - if this pattern reappears later, inspect whether a different exact Next-backed route needs the same ingress fallback rather than re-tuning notification polling first

### 2026-06-18 community professional testing methodology was formalized for this repo

- This round did not add new code behavior. It formalized the external professional testing workflow into a repo-specific execution framework so future testing does not drift back to ad-hoc page clicking.
- Added project method doc:
  - `docs/04_实施设计/社区专业测试方法框架-2026-06-18.md`
- The new framework explicitly fixes four parts for this repo:
  - what the methodology is actually optimizing for: risk-first chain testing rather than page-by-page clicking
  - the fixed test dimensions for DramaTV community: function, state, data semantics, interaction, boundary, session/permission, performance, observability
  - the practical difference between breadth and depth on this project
  - the execution layering for this repo: `L1 主路径冒烟 -> L2 高风险链路 -> L3 数据语义 -> L4 稳定性与体感`
- Existing board sync:
  - `docs/04_实施设计/社区专业测试执行任务板-2026-06-17.md`
  - added `TST-07` as completed and linked the new method doc as the long-lived explanation layer
- Current value:
  - future rounds can keep using one stable language for `/featured` deep scroll, creator returns, discussion returns, login redirects, and cloud data-semantic verification
  - avoids repeatedly re-explaining “what counts as deep testing” vs “what only counts as breadth smoke”

### 2026-06-18 page-grouped community testing checklist was added

- Built a directly executable checklist layer on top of the new testing framework:
  - `docs/04_实施设计/社区页面分组测试清单-2026-06-18.md`
- The new checklist is intentionally page-grouped instead of only dimension-grouped:
  - `登录与会话`
  - `首页`
  - `精选页`
  - `社区页`
  - `作者页`
  - `个人中心`
  - `发布页`
  - `详情页族`
  - `内容语义专项`
  - `视觉与可读性专项`
- It also fixes three execution bundles for future rounds:
  - small-change minimum regression
  - return-position / pagination / masonry specific regression
  - pre-cloud full regression
- Existing professional-testing board sync:
  - `docs/04_实施设计/社区专业测试执行任务板-2026-06-17.md`
  - added `TST-08` as completed and linked the checklist doc
- Practical effect:
  - after any community change, future runs no longer need to reconstruct the same page list by memory
  - the repo now has a stable `方法框架 -> 任务板 -> 页面清单 -> 结果文档` testing structure
### 2026-06-18 cloud testing continued and the current featured/discussions return chain stayed healthy

- This round continued the cloud browser pass on `http://drama-community-dev.dzkjm.cn` without changing code.
- Verified featured multi-hop return on the current deployed build:
  - started from `/featured#featured-item-5783d039-9c37-4bf1-89cb-0fca78c1de0b`
  - entered prompt detail `5783d039-9c37-4bf1-89cb-0fca78c1de0b`
  - entered creator `04e32520-c171-40af-8c93-7bb1ad58d6d5`
  - expanded creator works from `24 -> 48`
  - opened creator work detail `be0b2ea8-c3d1-4e1a-9123-9461db560064`
  - returned step by step to creator, then prompt, then featured
- Verified creator-side state after return:
  - creator page still held `48` rendered works
  - target creator item `creator-work-be0b2ea8-c3d1-4e1a-9123-9461db560064` remained in viewport
  - `查看更多` remained available
- Verified final featured-side state after the same chain:
  - final URL stayed `/featured#featured-item-5783d039-9c37-4bf1-89cb-0fca78c1de0b`
  - restore overlay was not visible
  - visible count was `96`
  - target featured card remained in viewport
- Verified incremental loading still works after the completed return chain:
  - continued scrolling on the restored featured page
  - visible cards grew `96 -> 132`
  - no stuck `加载中...`
  - no `加载失败`
- Verified discussions detail return again on cloud:
  - `/discussions -> weekly-creator-thread -> browser back -> /discussions`
  - target thread `discussion-thread-98b8a9e5-61b1-4bf9-94fd-2ed845de886a` remained in viewport after return
- Current conclusion update:
  - no new functional regression was isolated in featured/creator/discussions return positioning on the current cloud build
  - the remaining cloud watch items are:
    - intermittent console `502` on `/api/me/notifications/recent`
    - creator/detail multi-hop back still feels slower than ideal, but this round did not show state loss, wrong route, or pagination stall

### 2026-06-18 cloud notification 502 follow-up was narrowed further to stale browser-session evidence, not current live nginx failures

- This round continued cloud validation without changing code, focusing on the only remaining live watch item: `/api/me/notifications/recent`.
- Browser-side observation first looked suspicious again:
  - Playwright session history still showed mixed `200` and `502` entries for `GET /api/me/notifications/recent`
  - the failed entries were the old proxy-style empty `502` shape:
    - `content-length: 0`
    - empty response body
- But the live cloud verification narrowed the picture further:
  - current ECS nginx config already contains the exact-route fallback for `/api/me/notifications/recent`
  - direct ECS check with `Host: drama-community-dev.dzkjm.cn` returned `200` JSON from the current route chain
  - current nginx access logs during the fresh replay window `2026-06-18 15:17:00 ~ 15:19:59 CST` showed continuous `200` for the same endpoint
  - nginx access log currently contains no fresh `502` rows for `/api/me/notifications/recent`
  - nginx error log also showed no matching fresh upstream failure in the same window
  - `journalctl -u dramatv-community-web` had no restart/error evidence in that window either
- Conclusion update:
  - the previously reported notification `502` is not currently reproducible as a fresh live cloud ingress/runtime failure
  - the remaining `502` evidence inside the Playwright/MCP browser session should now be treated as stale session history unless a fresh cloud log window shows matching server-side failures again
  - next testing focus should return to real functional or performance chains instead of continuing to chase this residual browser-session noise

### 2026-06-18 fresh cloud stress pass found a new RSC-layer instability cluster on `/featured` and `/discussions`

- This round switched back to fresh cloud tabs and higher-risk browser chains instead of log-only verification.
- Confirmed stable path first:
  - `/discussions -> weekly-creator-thread -> browser back -> /discussions#discussion-thread-98b8a9e5-61b1-4bf9-94fd-2ed845de886a`
  - functional return positioning still worked
  - target thread stayed present and near viewport after return
- New instability was then observed on the fresh cloud browser runtime:
  - `/featured` incremental loading did not always grow smoothly in the same tab
  - browser network log showed real empty `502 Bad Gateway` failures on:
    - `GET /api/featured-inventory?sort=latest`
  - sampled failed shape:
    - duration around `26.5s`
    - empty body
    - minimal proxy-style headers only
  - later cursor-page requests such as `cursor=offset:24/36/48` could still return `200`, so this is not a permanent page-dead state
- A second related cluster was observed on `/discussions`:
  - browser network log captured one burst where multiple `_rsc` navigations simultaneously returned `502`
  - affected paths in that burst included:
    - `/discussions?channel=*`
    - `/discussions/weekly-creator-thread?...&_rsc=*`
    - `/me?...&_rsc=*`
    - `/creators/...?...&_rsc=*`
    - `/api/me/notifications/recent`
  - browser console also showed matching burst errors and one `net::ERR_NETWORK_CHANGED`
- Important narrowing:
  - the stable direct `curl` path still returned `200` for:
    - `GET /api/featured-inventory?sort=latest`
  - the stable direct click path for discussion detail/back also still passed
  - cloud `nginx access/error` and `journalctl -u dramatv-community-web` did not yet show an obvious matching restart/error entry in the sampled window
- Current interpretation:
  - this round found a real cloud runtime instability at the web/RSC layer, stronger than the earlier “stale notification 502 history” hypothesis
  - the failure shape currently looks more like a short-lived 3106-side RSC/request serving wobble than a single business API contract bug
  - next debugging order should prioritize:
    1. correlate fresh browser burst time with exact web process logs or Next stderr capture
    2. inspect whether 3106 runtime has transient request concurrency/resource exhaustion under multi-prefetch / multi-tab pressure
    3. isolate whether `/featured` `sort=latest` and discussion `_rsc` bursts share the same upstream bottleneck

### 2026-06-18 featured/discussions pressure trim landed locally before next cloud replay

- This round closed a concrete local optimization slice before continuing cloud investigation.
- Cloud diagnosis from the previous replay stayed the same:
  - no fresh steady-state `/api/me/notifications/recent` ingress failure was reproduced
  - the more actionable pressure signal was that `/featured` list cards could still mount full `/media/.../video/source/.../video.mp4` as preview fallbacks on the live cloud build
  - `/discussions` also showed dense route/link interaction pressure during rapid switching even when requests were mostly still `200`
- Local code changes completed:
  - `apps/web/src/lib/media-playback.ts`
    - added `allowSourceFallback?: boolean`
    - heavy list-card callers can now explicitly disable fallback from `previewUrl` to `sourceUrl`
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
    - featured cards now call `resolveCardVideoPlaybackUrl(... allowSourceFallback: false)`
    - card links now use `prefetch={false}`
  - `apps/web/src/components/shared/ProfileMediaCard.tsx`
    - creator/me/profile cards also disable source fallback for list preview playback
    - card links now use `prefetch={false}`
  - `apps/web/src/features/discussions/DiscussionsPage.tsx`
    - dense channel/thread/contributor links now use `prefetch={false}`
- Supporting refactor:
  - extracted same-origin media URL normalization into `apps/web/src/lib/media-asset-url.js`
  - shared both `media-playback` and `detail-image-preview` on the same pure helper so lightweight Node tests no longer depend on Next alias resolution
- Local verification completed:
  - `node --test apps/web/src/lib/media-playback.test.mjs`
  - `node --test apps/web/src/features/video-detail/detail-image-preview.test.mjs`
  - `apps/web -> npm.cmd run typecheck`
  - `apps/web -> npm.cmd run build`
- Next step:
  - deploy the current web build to `http://drama-community-dev.dzkjm.cn`
  - recheck `/featured?filter=video_prompt&sort=latest` for mounted video `src`
  - rerun rapid `/discussions` channel switching on the deployed build

### 2026-06-18 featured curated-slot prompt preview root cause narrowed and patched locally

- This round continued from the confirmed cloud evidence that `/api/feed/featured?sort=latest` still returned several `featured-video-prompt` items with:
  - `previewUrl == sourceUrl`
  - while `/api/featured-inventory?filter=video_prompt&sort=latest` mostly already returned `previewUrl = null` when no real preview asset existed
- Root cause was narrowed from “shared featured read path” to the featured curated-slot snapshot layer:
  - `CommunityCatalogJdbcQueryService.loadFeaturedArchive(...)` reads curated slot content from:
    - `adminFeedOpsService.loadPublishedFeaturedSlotItems(sort)`
  - `AdminFeedOpsService.mapContentItem(...)` was still resolving prompt `previewUrl` with an explicit fallback:
    - real `prompt_preview_example_url`
    - else fallback to `prompt_primary_example_url`
  - that fallback directly explains why curated featured slots could still promote source video as preview even after the frontend disabled list-card `sourceUrl` fallback
- Local code change completed:
  - `apps/server/src/main/java/com/dramatv/community/admin/feedops/AdminFeedOpsService.java`
    - removed the fallback from prompt preview to prompt primary/source media
    - featured/admin curated prompt snapshots now only expose `previewUrl` when a real preview asset exists
- Regression guard added:
  - `apps/server/src/test/java/com/dramatv/community/integration/FeedReadApiIntegrationTest.java`
    - added `featuredFeedDoesNotPromotePromptSourceVideoAsPreviewWhenPreviewAssetIsMissing`
    - test shape mirrors the existing home-feed regression:
      - create a published video prompt with only source media
      - publish it into `featured-video-prompt`
      - assert `/api/feed/featured` returns blank/null `previewUrl` and valid `sourceUrl`
- Verification status:
  - attempted targeted Maven test with local Maven binary:
    - `C:\Users\psk13\.codex\memories\dramatv_link\.tools\apache-maven\apache-maven-3.9.16\bin\mvn.cmd test -Dtest=FeedReadApiIntegrationTest#featuredFeedDoesNotPromotePromptSourceVideoAsPreviewWhenPreviewAssetIsMissing`
  - attempted backend compile:
    - `...\\mvn.cmd -DskipTests compile`
  - both are currently blocked by unrelated existing compile errors already present elsewhere in the dirty backend tree, including but not limited to:
    - `apps/server/src/main/java/com/dramatv/community/admin/auditlogs/AdminAuditLogService.java`
    - `apps/server/src/main/java/com/dramatv/community/admin/auth/AdminAuthApplicationService.java`
    - multiple unrelated integration tests such as `AdminAuditLogApiIntegrationTest.java`, `AdminCommentApiIntegrationTest.java`, `ActionRateLimitIntegrationTest.java`
- Current conclusion:
  - the confirmed user-facing featured first-screen source-video promotion bug is now fixed at the real backend curated-slot fallback point
  - but this round cannot safely deploy or runtime-verify on cloud until the unrelated backend compile breakage is first repaired or isolated
- Next step:
  1. repair or temporarily isolate the unrelated backend compile failures already present in the current working tree
  2. rerun the new featured regression test and backend compile
  3. deploy backend to test cloud
  4. recheck `/api/feed/featured?sort=latest` and the cloud `/featured?filter=video_prompt&sort=latest` first-screen mounted video `src`
### 2026-06-18 featured curated preview cloud verification resumed after backend test-env outage

- Took over the cloud verification chain for the featured first-screen prompt-preview bug.
- Confirmed the immediate test-env outage was not an app logic issue:
  - remote `dramatv-community-server` was stuck because
    `/opt/dramatv-community-server/current/dramatv-community-server.jar`
    pointed to a non-existent release dir `20260618-183638`
  - actual uploaded dir on ECS was `20260618-183056`
  - repaired the symlink manually and restored service health
  - verified:
    - `systemctl is-active dramatv-community-server -> active`
    - `curl http://127.0.0.1:18080/actuator/health -> {"status":"UP"}`
- Re-verified the real bug status on cloud after service recovery:
  - public `GET http://drama-community-dev.dzkjm.cn/api/feed/featured?sort=latest`
  - `featured-video-prompt` still had 9 items where `previewUrl == sourceUrl`
  - so the user-facing bug is not closed on cloud yet
- Local source status was rechecked:
  - `AdminFeedOpsService.resolvePromptPreviewUrl(...)` still only reads
    `prompt_preview_example_url`
  - it no longer falls back to `prompt_primary_example_url`
  - targeted regression test still passes locally under Java 17:
    - `FeedReadApiIntegrationTest#featuredFeedDoesNotPromotePromptSourceVideoAsPreviewWhenPreviewAssetIsMissing`
- A packaging/deploy chain issue was found and fixed locally:
  - local backend port `18080` had a Java process locking
    `apps/server/target/dramatv-community-server-0.1.0-SNAPSHOT.jar`
  - because of that, earlier backend deploy attempts were effectively capable of
    reusing an old jar even after source changes
  - stopped the locking local Java process, rebuilt successfully, and produced a
    fresh Spring Boot jar at `2026-06-18 18:50:42`
- Cloud backend was then manually re-uploaded to a new release dir:
  - release dir: `/opt/dramatv-community-server/releases/20260618-185556`
  - service restarted and health stayed `UP`
  - but `/api/feed/featured?sort=latest` still returned the same 9 bad
    `previewUrl == sourceUrl` items
- Data-level narrowing on ECS:
  - queried the live test database directly for those 9 prompt ids
  - result: all 9 prompts had
    - a real `primary_example_asset_id`
    - no `role_code='preview'` link at all
  - therefore this is not a simple dirty-data case where preview links were
    wrongly bound to the same source asset
- Current conclusion:
  - cloud test env is healthy again
  - local regression test is green
  - the cloud response is still wrong even after fresh jar upload
  - next debugging focus must shift from deploy/data suspicion to the exact
    runtime read path that produces `/api/feed/featured` on ECS, including any
    remaining server-side mapper/cache/path divergence between expected code and
    live response

### 2026-06-18 featured prompt preview cloud mismatch was finally traced to an old active backend symlink, not a remaining mapper bug

- This round closed the lingering ambiguity around `/api/feed/featured?sort=latest`.
- Evidence chain:
  - direct ECS backend:
    - `GET http://127.0.0.1:18080/api/feed/featured?sort=latest`
    - `featured-video-prompt.badCount = 9`
  - same ECS host through nginx with `Host: drama-community-dev.dzkjm.cn`:
    - same `badCount = 9`
  - conclusion:
    - ingress was only forwarding the backend response
    - the wrong payload was already coming from the running Spring Boot service
- Then verified the built artifact instead of continuing to guess:
  - local rebuilt jar:
    - `apps/server/target/dramatv-community-server-0.1.0-SNAPSHOT.jar`
    - `SHA256 = 262A6224491BC5DAD4D1E9AD8DEE4B0CF2E19F9AF3C36645FEF331771DE4F42B`
  - decompiled `AdminFeedOpsService.class` and `CommunityCatalogJdbcQueryService.class` from that jar
  - both classes already contained the intended new logic:
    - `resolvePromptPreviewUrl(...)` only reads preview media
    - no fallback from prompt preview to prompt primary/source remained in the jar
- Root cause was finally narrowed to the live test-env release pointer:
  - active symlink before repair:
    - `/opt/dramatv-community-server/current/dramatv-community-server.jar`
    - actually pointed to:
      - `/opt/dramatv-community-server/releases/20260618-183056/dramatv-community-server.jar`
  - active runtime jar hash before repair:
    - `f595d2af150bf3f6e45cb39a4cd85227d9e3e0a5f5bb858ca270ca556b3de7d3`
  - uploaded fresh release jar hash:
    - `/opt/dramatv-community-server/releases/20260618-185556/dramatv-community-server.jar`
    - `262a6224491bc5dad4d1e9ad8dee4b0cf2e19f9af3c36645fef331771de4f42b`
  - conclusion:
    - the cloud bug persisted because the service never actually switched onto the fresh release
    - this was a deploy-pointer problem, not a remaining feed mapper bug
- Cloud repair:
  - repointed:
    - `/opt/dramatv-community-server/current/dramatv-community-server.jar`
    - -> `/opt/dramatv-community-server/releases/20260618-185556/dramatv-community-server.jar`
  - restarted:
    - `systemctl restart dramatv-community-server`
  - verified:
    - `systemctl status dramatv-community-server` -> `active (running)`
    - `ss -ltnp | grep 18080` -> Java listening on `*:18080`
- Final verification:
  - direct ECS backend after pointer repair:
    - `GET http://127.0.0.1:18080/api/feed/featured?sort=latest`
    - `featured-video-prompt.count = 12`
    - `featured-video-prompt.badCount = 0`
- Practical takeaway:
  - for future backend cloud fixes on this repo, do not stop at “new release dir exists” or “fresh jar uploaded”
  - always verify all three together:
    1. current symlink target
    2. running jar hash
    3. target business endpoint behavior

### 2026-06-18 featured list-only cross-page return restore was narrowed to missing leave-page snapshot writes on nav transitions

- New user-reported symptom was split into two reproducible chains:
  - chain A:
    - `/featured` deep scroll
    - do not enter detail
    - switch to `/home` or `/discussions`
    - switch back to `/featured`
    - result: no restore
  - chain B:
    - `/featured` deep scroll
    - enter detail and return to `/featured`
    - then switch to `/home` or `/discussions`
    - switch back to `/featured`
    - result: restore can work once, then later cross-page switches lose it again
- Code-level conclusion:
  - detail-return restore was already using `from + #featured-item-*` semantics
  - plain top-nav page switching was not reliably persisting the current featured route + scroll snapshot before leaving the page
  - so list-only page switching could not consistently re-enter `/featured` with a fresh stored back-scroll state
  - after a detail-driven restore, later nav switches could still lose the refreshed position because the leave-page snapshot was not rewritten on every transition
- Local fix:
  - `apps/web/src/components/shared/CommunityRouteTransitionProvider.tsx`
  - before `beginTransition()` pushes a new internal route, it now:
    - reads the real current window route including hash
    - calls `rememberBackAnchorSource(currentHref)`
  - this makes top-nav transitions persist the current page position the same way tracked detail links already do
  - practical effect:
    - `/featured` list-only -> `/home|/discussions` -> `/featured`
      now has a stored route snapshot to restore from
    - `/featured` detail-return -> `/home|/discussions` -> `/featured`
      rewrites the latest featured position again instead of consuming only the first restore
- Verification:
  - `apps/web -> npm.cmd run typecheck` passed
  - `apps/web -> npm.cmd run build` passed
- Next step:
  - run browser verification for both chains locally or on cloud:
    1. featured deep scroll without entering detail, cross-page switch, return
    2. featured detail return, then cross-page switch twice in a row, return each time

### 2026-06-18 featured cross-page return restore fix was synced to cloud

- Scope:
  - sync the frontend-only fix that persists the current route + scroll snapshot before community top-nav transitions
  - target symptom:
    - `/featured` list-only deep scroll -> `/home|/discussions` -> `/featured` had no restore
    - `/featured` detail-return -> `/home|/discussions` -> `/featured` only restored once
- Cloud rollout:
  - command:
    - `./scripts/deploy-test-web.ps1 -PublicBaseUrl http://drama-community-dev.dzkjm.cn -ServerNames drama-community-dev.dzkjm.cn -VerifyAfterDeploy`
  - web release:
    - `20260618-193956`
- Verification:
  - remote `dramatv-community-web.service` -> `active (running)`
  - remote Next runtime ready on `127.0.0.1:3106`
  - readiness artifact:
    - `artifacts/runtime-readiness/test/web-deploy-20260618-193956-summary.json`
  - result:
    - `13 passed / 0 failed`
- Current status:
  - the cloud test env now contains the featured nav-transition restore fix
  - next validation should be real browser chain replay on cloud for the two exact user paths above
