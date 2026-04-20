# DramaTV 社区仓库入口

当前正式工程已经固定为：

- 前端：`apps/web`
- 后端：`apps/server`

根目录里最早期的 `React + Vite` 页面原型已经迁移到：

- `archive/legacy-react-vite-prototype`

默认开发和后续迭代都以 `apps/web` 这套正式社区工程为准，不再以旧原型作为主线。

## 常用命令

- 启动正式前端：`npm run dev:web`
- 构建正式前端：`npm run build:web`
- 启动归档原型：`npm run dev:prototype`
- 构建归档原型：`npm run build:prototype`

## 说明

- 旧原型保留仅用于回看早期页面思路，不再承接新需求。
- 页面美化、交互优化、真实接口联调都继续在 `apps/web` 中完成。
