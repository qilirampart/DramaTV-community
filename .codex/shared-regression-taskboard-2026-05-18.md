# DramaTV 共享链路回归任务板

日期：`2026-05-18`

## 先解释一个概念

“后台治理修改，不影响前台展示”的意思，不是说后台不能改前台展示。

恰恰相反：

- 像 `feed-ops / 运营配置 / 分类管理 / 审核 / 举报处理` 这些后台功能，本来就是为了影响前台展示和前台内容状态

这里真正要防的是另一类问题：

- 后台改了 A，应该影响前台的 `目标区域`
- 但却意外把前台 `不该变的区域` 也带坏了
- 或者后台保存的是 `draft`，却提前影响了前台已发布页面
- 或者后台接口字段调整后，前台读链路直接报错/空白/错位

所以更准确的说法是：

- **后台的“预期影响”要生效**
- **后台的“非预期影响”要被回归测试挡住**

例子：

- 正确：后台把首页运营位从作品 A 改成作品 B，前台首页对应位置跟着变
- 错误：后台改了首页运营位，结果精选页排序、作者信息、详情页卡片也一起错了
- 正确：后台保存 `draft` 配置，不影响前台；点击 `发布` 后才影响前台
- 错误：后台还没发布，前台就提前读到了未发布配置

## 当前任务目标

把现在已经修过一次、靠经验记住的问题，逐步变成“自动防回归”的任务板。

---

## R1 后台改前台展示的共享回归

状态：`进行中`

### R1-1 Home feed-ops 发布生效 / draft 不生效

状态：`已完成一轮`

目标：

- 后台发布 `home` 编排后，前台 `/api/feed/home` 按新配置展示
- 后台只保存 `draft` 时，前台首页不提前受影响

当前情况：

- 这条已经补过集成测试

### R1-2 Featured feed-ops 发布生效 / draft 不生效

状态：`已完成一轮`

目标：

- 后台发布 `featured` 编排后，前台精选页对应 tab 正确变化
- draft 配置不提前影响前台精选

当前情况：

- 这条已经补过集成测试

### R1-3 Discussions feed-ops 发布生效 / draft 不生效

状态：`已完成一轮`

目标：

- 后台讨论区顺序、置顶、频道焦点发布后，前台 `/discussions` 按配置变化
- draft 不提前影响前台讨论区

当前情况：

- 这条已经补过集成测试

### R1-4 后台修改前台展示时，不带坏作者 / 媒体 / 跳转信息

状态：`待做`

目标：

- 后台编排内容后，前台仍返回真实 `authorId / authorAvatar / slug / 媒体封面`
- 不再出现“槽位改了，但作者 ID 被错误映射成 feed 配置 ID”这类共享层问题

说明：

- 这类问题之前真实出现过，后面应继续扩成更系统的保护

### R1-5 浏览器级运营回归

状态：`待做`

目标：

- 不是只测 API
- 还要补一轮浏览器级验收：
  - 首页运营位
  - 精选页 tab
  - 讨论区频道与置顶

---

## R2 发布链路契约回归

状态：`待做`

### R2-1 视频提示词发布闭环回归

目标：

- 上传素材
- 填写 prompt
- 发布成功
- 跳转精选页
- 首屏可见
- 详情页可打开

### R2-2 图片提示词发布闭环回归

目标：

- 上传图片
- 填写 prompt
- 发布成功
- 跳转精选页
- 首屏可见

### R2-3 工作流发布闭环回归

目标：

- 发布成功
- 前台卡片可见
- 详情页可打开
- 画布入口保持占位而不报错

### R2-4 帖子发布闭环回归

目标：

- 发帖成功
- 跳转讨论区
- 首屏或对应频道可见
- 帖子详情页可打开

### R2-5 草稿 / submitted / 可编辑态契约回归

目标：

- draft 可编辑
- submitted 后不可再编辑/删除/重提
- 前后端状态文案一致

---

## R3 评论 / 通知 / 举报 / 审核共享链路回归

状态：`进行中`

### R3-1 评论与两层回复回归

目标：

- 根评论正常
- 两层回复正常
- 回复目标显示正确
- 不回退成无限楼中楼

### R3-2 通知生成与定位回归

目标：

- 评论通知正确生成
- 回复通知正确生成
- 打开铃铛可见
- 点击通知能跳到正确评论锚点

### R3-3 点赞 / 收藏 / 评论数联动回归

目标：

- 点赞收藏后，详情页和个人主页统计一致
- 评论新增/删除后，`commentCount / replyCount` 一致

### R3-4 举报提交流程回归

目标：

- 前台举报入口可用
- 举报成功提示正确
- 不再错绑到评论/回复数量按钮

### R3-5 举报到后台工单联动回归
状态：`已完成一轮`

当前结果：
- 已补 `apps/server/src/test/java/com/dramatv/community/integration/AdminReportApiIntegrationTest.java` 端到端回归
- 覆盖链路：前台 `POST /api/reports` -> 后台 `GET /api/admin/reports` / `GET /api/admin/reports/{reportId}` -> `POST /processing` -> `POST /close`
- 已验证通过：
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminReportApiIntegrationTest test`
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite admin`

目标：

- 前台提交举报后
- 后台 `reports` 能查到
- 状态流转正常

### R3-6 审核动作到前台展示联动回归

状态：`已完成一轮`

当前结果：

- 已补 `apps/server/src/test/java/com/dramatv/community/integration/AdminModerationApiIntegrationTest.java` 共享回归
- 当前覆盖链路：
  - 后台 `approve / reject / offline / restore`
  - `prompt` 目标在公共 `GET /api/prompts` 列表与 `GET /api/prompts/{id}` 详情上的可见性变化
  - `workflow` 目标在公共 `GET /api/workflows/{id}` 详情上的可见性变化
  - `post` 目标在公共 `GET /api/discussions/threads/{slug}` 详情上的可见性变化
- 已验证通过：
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminModerationApiIntegrationTest test`

目标：

- 后台 `approve / reject / offline / restore`
- 前台内容可见性与状态符合预期

当前剩余缺口：

- 还没有扩到 `/moderation` 直连 `video` 页面级 runtime 证据，`workflow / post` 也还没补页面级 runtime
- 后台 `moderation` 页面级 runtime 写动作证据还没统一补齐

### R3-7 评论治理到前台展示联动回归

状态：`已完成一轮`

当前结果：

- 已补 `apps/server/src/test/java/com/dramatv/community/integration/AdminCommentApiIntegrationTest.java` 共享回归
- 当前覆盖链路：
  - 后台 `comments hide / restore`
  - 公共 `GET /api/comments` 列表可见性变化
  - `videoCommentCount` 聚合数同步变化
- 已验证通过：
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite admin`

目标：

- 后台隐藏评论后，前台评论列表同步隐藏
- 后台恢复评论后，前台评论列表同步恢复

当前剩余缺口：

- 还没有扩到 `prompt / workflow / post` 等其他 targetType
- 后台 `/comments` 页面级 runtime 写动作证据还没统一补齐

### R3-8 举报治理到前台展示联动回归

状态：`已完成一轮`

当前结果：

- 已补 `apps/server/src/test/java/com/dramatv/community/integration/AdminReportApiIntegrationTest.java` 共享回归
- 当前覆盖链路：
  - `reports/offline-target -> public GET /api/videos/{id}`
  - `reports/hide-comment -> public GET /api/comments`
- 已验证通过：
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminReportApiIntegrationTest test`
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite admin`

目标：

- 举报驱动的治理动作，不只改后台工单状态
- 还要真实改变前台公共读链路上的内容可见性

当前剩余缺口：

- 还没有扩到更多 targetType 和更多公共读面
- 后台 `/reports` 页面级 runtime 写动作证据还没统一补齐

---

## R4 登录 / 会话 / 权限回归

状态：`待做`

### R4-1 未登录拦截回归

目标：

- 未登录只能稳定访问允许页面
- 点击受保护入口触发登录
- 登录成功后跳回原目标页

### R4-2 多浏览器 / 多账号隔离回归

目标：

- Chrome / Edge 不串登录态
- 本地 / 公网行为一致

### R4-3 后台角色边界回归

目标：

- 普通社区账号不能访问后台治理接口
- 后台管理员登录态正常

---

## R5 共享层性能与稳定性回归

状态：`待做`

### R5-1 精选页分类切换压力回归

目标：

- 连续切换 20 次左右
- 不循环跳转
- 不明显卡死

### R5-2 详情页多次进出压力回归

目标：

- 多次进入/返回详情页
- 不持续重复加载视频导致卡死

### R5-3 评论区操作性能回归

目标：

- 评论、回复、删除、开关评论区
- 不再触发整页重拉

### R5-4 通知轮询噪音回归

目标：

- 铃铛打开后请求数受控
- 不出现短时间请求风暴

---

## 优先级建议

### P0 先做

- `R1-4`
- `R1-5`
- `R2-1`
- `R2-4`
- `R3-2`
- `R3-5`
- `R3-6`

### P1 接着做

- `R2-2`
- `R2-3`
- `R2-5`
- `R3-1`
- `R3-3`
- `R3-4`
- `R4-1`
- `R4-2`

### P2 稳定化继续做

- `R4-3`
- `R5-1`
- `R5-2`
- `R5-3`
- `R5-4`

## 当前结论

这份任务板不是新增需求，而是把当前项目已经进入高频共享风险区的几条链路，整理成可逐项勾销的回归板。

后续原则固定为：

- 修过一次的共享问题，尽量补成自动回归
- 后台预期影响前台，这是功能
- 后台非预期影响前台，这是要被回归测试拦住的问题
