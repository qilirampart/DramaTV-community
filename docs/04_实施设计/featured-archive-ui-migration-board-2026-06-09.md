# 精选页新卡片 UI 迁移任务板
状态: `进行中`
创建日期: `2026-06-09`
适用范围: `apps/web`
目标页面: `精选页 /featured`

## 1. 背景

首页落地页 `精选档案` 区块已经完成一轮新的资源卡片视觉收口：

- 卡片媒体层更强
- 角标、标题、作者信息层级更清晰
- 桌面端支持 hover 才展开文案
- 整体更接近目标参考站的资源展示气质

现在需要把这套新的卡片 UI 语言迁移到 `精选页 /featured`，但精选页不是首页静态档案区的简单复刻。它还承担：

- 大分类 / 小分类切换
- 搜索
- 最热 / 最新切换
- 运营编排 + 实时库存混排
- 滚动分页 / 查看更多
- 详情返回定位
- 提示词点赞
- 视频 hover 预览与首屏预热

所以这轮不能按“直接复制首页 CSS”处理，必须先按精选页的真实行为链路拆分。

## 2. 影响面分析

### 2.1 直接受影响的前端渲染层

- `apps/web/src/features/featured/FeaturedArchivePage.tsx`
- `apps/web/src/features/featured/FeaturedArchivePage.module.css`

原因:

- 当前精选页卡片 `FeaturedCard` 仍是统一 `16:9` 三列网格
- 新样式迁移至少会改动：
  - 卡片结构层级
  - 卡片媒体容器
  - 卡片 footer 信息展开方式
  - 网格/拼贴布局规则

### 2.2 高风险交互链路

- `详情返回定位`
  - 依赖 `getFeaturedCardAnchorId(...)`
  - 依赖 `useBackAnchorRestore(...)`
  - 依赖“目标卡片未挂载时继续自动加载更多”的逻辑
- `滚动分页 / 查看更多`
  - 依赖 `loadMoreRef + IntersectionObserver`
  - 新布局一旦改成异形或不等高，sentinel 触发时机会变化
- `视频 hover 预览`
  - 依赖 `useInteractiveVideoPreview`
  - 新布局如果改变卡片尺寸、遮罩层和 hover 信息层，容易出现闪烁、预览层露底或遮挡问题
- `提示词点赞`
  - 依赖 `togglePromptLikeAction`
  - 如果把底部信息改成 hover 才显示，点赞按钮的可达性和移动端行为必须重新验证

### 2.3 数据组装与排序链路

- `精选运营编排 + 库存混排`
  - `mergeCuratedFeaturedItems(...)`
  - `shouldUseCuratedFeaturedItems(...)`
- `首屏视频预热`
  - `FEATURED_PREWARM_VIDEO_CARD_LIMIT`
  - 当前是按渲染顺序预热前 6 张有视频能力的卡
- `活动 / 工作流 / 提示词混排`
  - `getInventoryFilterGroup(...)`
  - `toFeaturedArchiveItem(...)`

原因:

- 新 UI 如果只是换皮，不改数据层，第一阶段可以保持前端内消化
- 但一旦引入“主卡 / 次卡 / 竖卡 / 宽卡”之类的异形槽位，卡片排序和预热优先级可能需要跟着收口

### 2.4 可能需要被动波及的共享层

第一阶段预计不改共享契约，但下列共享层需要留意：

- `apps/web/src/lib/featured/featured-back-anchor.ts`
- `apps/web/src/lib/routes/back-anchor.ts`
- `apps/web/src/lib/media-playback.ts`
- `apps/web/src/lib/contracts/community-api.ts`
- `apps/web/src/lib/contracts/view-models.ts`

当前判断:

- 第一阶段先不动后端、不动 API 契约
- 如果后续发现精选页也需要真实 `width / height / aspectRatio` 元数据，再单独起第二阶段任务

### 2.5 后台运营页影响判断

当前结论分两层：

1. `第一阶段仅迁移前台精选页单卡视觉语言`
   - 不会直接影响 Spring Boot 后台接口
   - 也不会直接影响后台运营配置的槽位读写
2. `如果进入布局语义变更或契约变更`
   - 后台必须同步考虑

当前已确认的后台耦合点：

- `apps/admin/src/app/(dashboard)/feed-ops/featured/page.tsx`
  - 后台精选运营页入口本身不感知前台卡片 CSS，但依赖相同的运营页数据源
- `apps/admin/src/app/(dashboard)/feed-ops/shared/feed-ops-page.ts`
  - 对 `featured-all / featured-workflow / featured-video-prompt / featured-image-prompt / featured-activity` 有硬编码说明
  - 这里还写死了“各 tab 首屏 12 条”的运营语义
- `apps/admin/src/app/(dashboard)/feed-ops/shared/feed-ops-types.ts`
  - 后台预览与候选池当前只消费 `coverUrl / posterUrl / previewUrl / sourceUrl`
  - 还没有 `aspectRatio / width / height / layoutVariant` 这类字段
- `apps/admin/src/app/(dashboard)/feed-ops/shared/page.module.css`
  - 后台右侧预览卡现在是通用预览，不是前台精选页 1:1 视觉镜像

这意味着：

- 如果本轮只是改前台 `FeaturedCard` 外观
  - 后台可以先不动
- 如果本轮后续要改这些东西
  - `首屏可见数量`
  - `槽位语义`
  - `卡片布局分档规则`
  - `需要后台预览接近前台真实效果`
  - `需要新增比例元数据`
  - 那后台运营页、共享类型和说明文案都要同步更新

## 3. 本轮目标与非目标

### 3.1 本轮目标

- 把首页新卡片 UI 语言迁移到精选页
- 保留精选页现有筛选、分页、返回定位、点赞、hover 预览能力
- 优先做成“视觉风格统一”，不先做后端契约扩容
- 迁移后桌面端卡片信息密度更低，封面主体更突出

### 3.2 本轮非目标

- 不重写精选页数据接口
- 不动后端分页协议
- 不在第一步就把精选页改成首页同款固定 12 张静态拼贴
- 不把社区页、作者页一起同步改版
- 不默认同步上云，先本地验证

## 4. 实施策略

### 4.1 第一阶段策略

先迁移“卡片视觉语言”，暂不直接迁移“首页固定拼贴模板”：

- 保留精选页现有分页流式列表能力
- 先把单卡视觉、hover 行为、信息显隐方式统一
- 再决定内容区是：
  - 保留规则网格，只做新卡片样式
  - 还是升级成支持分页的异形拼贴/分档布局

原因:

- 首页是固定数量档案区，适合写死模板
- 精选页是持续加载的长列表，直接套首页模板很容易把 `查看更多`、返回定位和滚动稳定性打坏

### 4.2 第二阶段候选

如果第一阶段完成后仍觉得精选页视觉差距大，再进入第二阶段：

- 给精选页引入“分档布局”或“异形节奏布局”
- 但必须保证分页追加时布局稳定，不出现大面积回流和定位跳动

## 5. 任务拆分

### U9-0 精选页 UI 迁移方案收口
状态: `已完成`

说明:

已确认精选页迁移不能按“直接复制首页样式”处理，需要把分页、返回定位、hover 预览、点赞一起纳入影响面。

验收标准:

- [x] 已识别精选页直接受影响文件
- [x] 已识别精选页高风险交互链路
- [x] 已明确第一阶段先不改后端契约

### U9-1 单卡样式语言迁移
状态: `已完成`

说明:

先把 `FeaturedCard` 从当前统一 16:9 老卡片样式迁移到首页新卡片视觉语言，但不先重构分页布局。

验收标准:

- [x] 左上角资源类型角标风格与首页新卡片一致
- [x] 标题 / 作者 / 指标的字体层级、遮罩层、封面优先级与首页风格一致
- [x] 桌面端可支持“默认弱信息、hover 展开”，但不破坏移动端可读性
- [x] 点赞按钮仍可正常点击

验证方式:

- [x] `apps/web -> npm.cmd run build`
- [x] 浏览器检查提示词卡、工作流卡、活动卡各至少 1 张
- [x] 浏览器检查 hover、focus、点赞按钮不冲突

可能涉及文件:

- `apps/web/src/features/featured/FeaturedArchivePage.tsx`
- `apps/web/src/features/featured/FeaturedArchivePage.module.css`

### U9-2 精选页内容区布局迁移决策
状态: `已完成`

说明:

基于 U9-1 完成后的效果，决定精选页内容区是否继续保留规则三列网格，还是升级成“可分页的分档布局”。

验收标准:

- [x] 已给出“保留规则网格”还是“升级为分档布局”的结论
- [x] 已明确该结论对分页、返回定位和加载稳定性的影响
- [x] 如果进入分档布局，已限制为前端可控、不依赖后端新字段的第一阶段方案

验证方式:

- [x] 本地浏览器对比桌面端视觉效果
- [x] 明确记录结论到本任务板与 `.codex/progress-community.md`

### U9-3 分页流与查看更多稳定性回归
状态: `已完成`

说明:

无论内容区是否改成分档布局，都要重新回归精选页的无限滚动和 `查看更多` 稳定性。

验收标准:

- [x] 下拉加载过程中不出现 `加载中 / 查看更多` 闪烁抖动
- [x] `IntersectionObserver` 不会因为新布局频繁误触发
- [x] 连续追加多批数据后卡片顺序稳定

验证方式:

- [x] 本地浏览器滚动至少加载 3 批数据
- [x] 控制台无新的重复请求噪音

完成说明:

- 根因确认不是筛选/排序逻辑本身，而是自动加载 sentinel 被误放进了顶部筛选栏，导致一进页就命中观察区，分页被一口气拉空。
- 已把 sentinel 挪回内容区底部，正常态改成纯滚动触发；底部按钮只在 `loadMoreError` 时保留为重试兜底。
- `IntersectionObserver` 的 `rootMargin` 已从大范围预触发收紧，避免首屏直接把全部库存拉完。
- 本地生产态浏览器回归已确认 `全部` 首屏恢复为 `12` 条，滚动后按批次扩展为 `24 -> 36`，分类和 `最热 / 最新` 切换不再受分页逻辑干扰。

可能涉及文件:

- `apps/web/src/features/featured/FeaturedArchivePage.tsx`
- `apps/web/src/features/featured/FeaturedArchivePage.module.css`

### U9-4 返回定位与详情往返回归
状态: `待开始`

说明:

精选页已经有“从详情返回后回到进入位置”的链路，新布局必须保证这条链路不退化。

验收标准:

- [ ] 前 24 条以内返回定位正常
- [ ] 超过首批数据后，返回时仍能自动补齐分页直到目标卡出现
- [ ] 返回后不出现“先闪顶部再跳回去”的明显体感恶化

验证方式:

- [ ] 浏览器验证：首屏卡片进入详情再返回
- [ ] 浏览器验证：第 2~3 批卡片进入详情再返回

可能涉及文件:

- `apps/web/src/features/featured/FeaturedArchivePage.tsx`
- `apps/web/src/lib/featured/featured-back-anchor.ts`
- `apps/web/src/lib/routes/back-anchor.ts`

### U9-5 视频预览、点赞与响应式回归
状态: `待开始`

说明:

在新 UI 下补回精选页卡片的三条核心交互：视频预览、点赞、移动端退化。

验收标准:

- [ ] 视频卡 hover 预览正常，不闪烁、不露底
- [ ] `FEATURED_PREWARM_VIDEO_CARD_LIMIT` 仍然合理
- [ ] 点赞按钮在 hover 显隐方案下仍可稳定点击
- [ ] `320px / 768px / 1024px` 下信息可读、点击可用

验证方式:

- [ ] 浏览器检查视频提示词卡至少 3 张
- [ ] 浏览器检查点赞动作至少 2 次
- [ ] 浏览器检查移动端和中屏断点

可能涉及文件:

- `apps/web/src/features/featured/FeaturedArchivePage.tsx`
- `apps/web/src/features/featured/FeaturedArchivePage.module.css`
- `apps/web/src/lib/media-playback.ts`

### U9-6 二阶段比率元数据补强
状态: `进行中`

说明:

这一轮已经启动真实比例元数据接入，但当前进度要拆成两层看：

- 契约层与前端消费层已落地
- 历史库存数据的真实 `width / height` 覆盖率仍不足

当前实现状态:

- 后端 `featured-inventory` 与相关 feed DTO 已支持可选 `width / height`
- 前端 `/featured` 布局分档现在会优先使用后端比例元数据
- 当后端元数据缺失时，仍回退到客户端图片自然尺寸测量，避免布局直接退化
- 已补一处运行时防御，避免比例缓存未初始化时在 `resolveFeaturedLayoutBucket(...)` 触发前端报错

当前观察到的现实限制:

- 本地真实库存前 12 条数据里，`width / height` 仍大量为空
- 这说明“契约已通”不等于“首屏已经普遍吃到真实比例”
- 如果要把收益从“部分命中 + 客户端兜底”提升到“首屏稳定命中”，还需要后续补历史媒体维度回填

验收标准:

- [x] 已证明仅靠前端样式无法稳定表达真实素材比例
- [x] 已明确并落地需要补的契约字段：`width / height`
- [x] 已单独评估并落地后端与前端 shared mapper 影响
- [x] `/featured` 运行时在新布局下无新增 console error，分页与查看更多仍可用
- [ ] 历史库存真实数据已有足够 `width / height` 覆盖，首屏不再主要依赖客户端测量

验证方式:

- [x] 前后端契约变更审查
- [x] 本地 `apps/web -> npm.cmd run typecheck`
- [x] 本地 `apps/web -> npm.cmd run build`
- [x] 浏览器复验 `/featured`：console error `0`，首屏 `12` 条，点击 `查看更多` 后 `24` 条
- [x] 浏览器抓取 `/api/public/featured-inventory?limit=12`，确认当前真实库存仍存在大量 `width / height = null`

### U9-7 后台运营页同步审查
状态: `待开始`

说明:

如果前台精选页迁移最终不止是“换卡片皮肤”，而是改到首屏数量、槽位意义、后台预览表达或共享字段，就必须补做后台同步审查。

验收标准:

- [ ] 已明确本轮前台改动是否影响后台运营配置语义
- [ ] 如果影响 `首屏 12 条` 或 tab 槽位定义，后台文案与限制已同步
- [ ] 如果前台需要真实比例或布局字段，后台共享类型已同步扩展
- [ ] 如果运营需要所见即所得预览，后台预览区方案已补充或立项

验证方式:

- [ ] 审查 `feed-ops-page.ts / feed-ops-types.ts / page.module.css`
- [ ] 如发生共享语义变更，同步更新 `.codex/community-admin-shared-sync.md`

## 6. 执行顺序

固定顺序如下:

1. `U9-1` 单卡样式语言迁移
2. `U9-2` 内容区布局迁移决策
3. `U9-3` 分页流与查看更多稳定性回归
4. `U9-4` 返回定位与详情往返回归
5. `U9-5` 视频预览、点赞与响应式回归
6. `U9-6` 比率元数据补强，按需启动
7. `U9-7` 后台运营页同步审查，按需启动

## 7. 风险与处理

### 风险 1: 首页模板直接照搬会打坏精选页分页流

影响:

精选页不是固定 12 张卡的静态区块，直接套首页模板可能导致追加布局回流过大、sentinel 抖动。

处理:

第一阶段先迁移单卡视觉语言，不先硬套首页固定模板。

### 风险 2: hover 才显示信息会影响点赞和移动端可达性

影响:

提示词卡的点赞按钮在 hover 隐藏方案下可能变得不可点，移动端也没有 hover。

处理:

桌面端和移动端分开处理；点赞按钮必须作为专项回归项验证。

### 风险 3: 返回定位依赖卡片真实挂载顺序

影响:

如果布局节奏变化太大，返回时追锚点的自动加载可能更慢或更容易闪屏。

处理:

把 `U9-4` 作为必做回归项，不把它当“样式外问题”跳过。

### 风险 4: 前台改了首屏语义，后台运营页仍按旧规则展示

影响:

运营同学会在后台看到一套“12 条首屏 / 通用预览”的旧规则，但前台真实展示已经变成另一套规则，后续配置和排障都会混乱。

处理:

第一阶段只改前台卡片外观时不动后台；一旦进入布局语义、首屏数量或比例字段变更，立即触发 `U9-7`。

## 8. 完成记录规则

- 每完成一个任务，立即更新:
  - 本文档对应任务状态
  - `.codex/progress-community.md`
- 如果后续确认需要改共享契约，再同步:
  - `.codex/community-admin-shared-sync.md`
- 本轮规划阶段不修改业务代码，只记录影响面与执行顺序
