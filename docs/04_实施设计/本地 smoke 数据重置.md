# 本地 smoke 数据重置

## 目的

前端真实联调已经开始直接写本地 PostgreSQL。

这样做是对的，但也会带来一个问题：

- 评论会越来越多
- 点赞、收藏、关注会把演示计数带偏
- 后续 Playwright 回归很难再判断当前页面是不是“基线状态”

这个文档对应的脚本，就是把本地社区数据恢复到当前固定 smoke 基线。

## 当前基线

脚本会保留以下固定演示内容：

- 视频：`3d82413b-1036-4c1b-93dd-3a102e0b4683`
- 工作流：`dd715ee9-189b-4450-a4ca-fdf71fb8aafb`
- 关注 smoke 作者：`33333333-3333-3333-3333-333333333333`
- 保留的基线评论：
  - 视频根评论 `41ec18fd-e074-4138-a287-9e48aa754949`
  - 视频回复 `115ab7c9-88b4-4cd6-b881-f9929d0df36d`
  - 工作流评论 `a69124df-7fdc-4c09-81ea-e439dc931525`

脚本会清理以下联调残留：

- Demo 身份在上述 smoke 视频、工作流上的点赞与收藏
- Demo 身份对 smoke 评论的点赞
- Demo 身份对 smoke 作者的关注关系
- Demo 身份后来新增的 smoke 评论

## 脚本位置

- SQL: `scripts/reset-local-browser-smoke-state.sql`
- 一键入口: `scripts/reset-local-browser-smoke-state.ps1`

## 使用方式

在项目根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\reset-local-browser-smoke-state.ps1
```

如果你改过本地容器名或数据库账号，也可以显式传参：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\reset-local-browser-smoke-state.ps1 `
  -ContainerName dramatv-postgres `
  -Database dramatv `
  -Username dramatv `
  -Password dramatv
```

## 依赖

这个入口默认通过 `docker exec` 进入本地 `dramatv-postgres` 容器执行 `psql`，所以要求：

- 本地 Docker 已启动
- `dramatv-postgres` 容器正在运行
- 本地数据库仍使用当前仓库默认账号，或者你在脚本参数里手动传入新值

脚本会优先读取：

1. PowerShell 当前环境变量
2. `infra/local/.env`
3. `infra/local/.env.example`
4. 默认值 `dramatv`

## 执行结果

脚本执行结束后会输出一行汇总结果，包含：

- 视频评论数
- 视频点赞数
- 视频收藏数
- 工作流评论数
- 工作流点赞数
- 工作流收藏数
- smoke 作者粉丝数
- 本次隐藏的额外评论数量

目标状态是：

- 视频恢复到基线评论数
- 工作流恢复到基线评论数
- 视频/工作流点赞与收藏回到 `0`
- smoke 作者粉丝数回到 `0`

## 注意

这个脚本只面向本地联调环境。

不要把它当成正式运营清理工具，也不要对线上或共享环境直接执行。
