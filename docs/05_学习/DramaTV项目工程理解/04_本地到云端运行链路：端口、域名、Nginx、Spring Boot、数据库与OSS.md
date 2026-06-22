# DramaTV 项目工程理解 - 第 4 课：本地到云端运行链路：端口、域名、Nginx、Spring Boot、数据库与 OSS

## 学习目标

本节结束后，你应该能做到：

- 说清楚本地开发环境每个端口分别是什么。
- 说清楚云端请求从域名进入后，大概经过哪些层。
- 区分“入口层故障”和“应用层故障”。
- 理解为什么同一个页面，本地正常、云端异常，不一定是代码逻辑问题。
- 看懂部署脚本、readiness、回滚文档时不再只觉得是一堆命令。

## 1. 先建立整体地图

DramaTV 不是只有一个前端页面，它现在至少有三类运行对象：

```text
apps/web      社区前台
apps/admin    管理后台
apps/server   Spring Boot 后端
```

再往下还有：

```text
PostgreSQL    主业务数据库
Redis         会话、短状态、限流、缓存
OSS           图片、视频、封面、预览等媒体文件
Nginx         公网入口、域名分流、反向代理
```

所以用户看到一个页面，本质上不是“浏览器打开一个 HTML”这么简单，而是：

```text
浏览器
-> 前台 Next.js
-> 后端 Spring Boot
-> PostgreSQL / Redis / OSS
-> 返回数据和媒体资源
```

云端还要再加一层：

```text
浏览器
-> 域名 / 公网 IP
-> Nginx
-> 前台 / 后台 / 后端服务
-> 数据库 / Redis / OSS
```

## 2. 本地标准运行链路

本地开发时，最重要的端口是：

| 对象 | 地址 / 端口 | 作用 |
| --- | --- | --- |
| 社区前台 | `http://127.0.0.1:3106/` | 用户侧页面 |
| 管理后台 | `http://127.0.0.1:3206/login` | 后台运营与治理 |
| 后端健康检查 | `http://127.0.0.1:18080/actuator/health` | Spring Boot 是否启动 |
| PostgreSQL | `5432` | 本地主数据库 |
| Redis | `6379` | 本地缓存和短状态 |
| 云镜像前台 | `http://localhost:3107/` | 本地跑一个接近云构建的前台 |

本地标准启动顺序：

```text
Docker Desktop
-> PostgreSQL / Redis
-> Spring Boot 后端 18080
-> 社区前台 3106
-> 管理后台 3206
-> 需要时再起云镜像 3107
```

对应命令在：

```text
docs/04_实施设计/本地手动启动操作指南-2026-05-21.md
```

你可以先记住本地主链路：

```text
浏览器 3106
-> 本地 Next.js 前台
-> 本地 Spring Boot 18080
-> 本地 PostgreSQL 5432
-> 本地 Redis 6379
-> 本地媒体或静态资源
```

## 3. 本地为什么还会有 3107

`3106` 和 `3107` 容易混。

它们不是同一个用途：

```text
3106 = 本地正式开发前台
3107 = 本地云镜像前台
```

`3106` 主要用于：

- 本地开发页面。
- 本地联调后端。
- 快速看交互效果。

`3107` 主要用于：

- 本地跑接近云构建版本的前台。
- 用本地浏览器访问云后端、云数据库、云 OSS 链路。
- 验证“页面代码 + 云资源”的组合。

之前多次出现“服务启动方式不对导致分类点不了、下滑不加载”等问题，就是因为前端运行方式、构建模式、环境变量和目标后端没有对齐。

所以以后遇到本地前台异常，第一步不是改代码，而是确认：

```text
我现在打开的是 3106 还是 3107？
这个前端连的是本地后端还是云后端？
当前启动方式是不是项目规定的脚本？
```

## 4. 云端运行链路

云端测试环境不是一个单独页面服务，而是共享 ECS 上的一套链路。

当前云端核心对象：

| 对象 | 说明 |
| --- | --- |
| ECS | 公网机器，IP 曾为 `8.141.20.130` |
| Nginx | 监听公网入口，按 Host 和路径分流 |
| `dramatv-community-web.service` | 社区前台服务 |
| `dramatv-community-admin.service` | 管理后台服务 |
| `dramatv-community-server.service` | Spring Boot 后端服务 |
| PostgreSQL / RDS | 云端业务数据 |
| Redis | 云端缓存、会话、短状态 |
| OSS | 云端媒体资源 |

云端典型请求链路：

```text
浏览器访问 drama-community-dev.dzkjm.cn
-> Nginx 接收 80 端口请求
-> / 页面转发到前台 3106
-> /admin 转发到后台 3206
-> /api/** 转发到后端 18080
-> /media/** 转发到后端 18080
-> 后端访问 PostgreSQL / Redis / OSS
```

这里要特别注意：

```text
/media/** 不是普通静态目录。
它通常是后端代理读取 OSS 私有资源，再返回给浏览器。
```

所以如果图片或视频加载失败，可能的问题有：

- 前端资源 URL 不对。
- Nginx 没把 `/media/**` 转给后端。
- 后端媒体代理异常。
- OSS 权限或对象路径异常。
- 历史导入数据的 `media_assets` 记录不规范。

## 5. 当前入口口径：一定要区分历史入口和现行入口

这个项目经历过几轮入口变化：

| 类型 | 地址 | 当前理解 |
| --- | --- | --- |
| 当前测试环境前台入口 | `http://drama-community-dev.dzkjm.cn` | 当前优先口径 |
| 当前测试环境后台入口 | `http://drama-community-dev.dzkjm.cn/admin` | 当前优先口径 |
| 历史入口 | `http://community.8.141.20.130.nip.io` | 历史口径，不应默认作为当前验收入口 |
| 临时端口前台 | `http://8.141.20.130:8086/login` | 备案/入口异常时的应急链路 |
| 临时端口后台 | `http://8.141.20.130:8206/admin/login` | 备案/入口异常时的应急链路 |
| 裸 IP | `http://8.141.20.130` | 机器级探活，不是社区正式业务入口 |

这件事非常重要。

之前出现过“打开社区历史地址却跳到同事项目”的问题，本质上不是社区页面代码错，而是：

```text
共享 ECS
-> 多项目共用 80 端口
-> Nginx Host 分流或兜底配置异常
-> 请求被打到其他项目
```

所以以后看到“页面不对”，第一问应该是：

```text
我访问的是不是当前正确域名？
Host 有没有被 Nginx 分到社区项目？
裸 IP 是不是被其他项目兜底吃掉了？
```

## 6. 共享 ECS 会让故障伪装成代码问题

当前测试 ECS 上曾经同时承载三个项目：

| 项目 | 大概内容 |
| --- | --- |
| DramaTV 社区 | AI 视频 / 图片 / 工作流社区 |
| DramaLoom | 同事部署的剧本协作相关项目 |
| 小说相似度项目 | 法务相似度检测项目 |

三者共享同一台 ECS，主要共享 `:80` 公网入口，通过 Nginx `server_name` 分流。

这会带来一个风险：

```text
入口层错了，看起来像页面错了。
```

典型表现：

- 访问社区域名却进入同事项目。
- 后台入口跳到其他系统。
- 裸 IP 打开不是社区。
- `nip.io` 域名被阿里云备案/接入校验拦截。
- 服务器内部 curl 正常，外部浏览器访问失败。

这类问题不能先查 React，也不能先查 Spring Boot，要先查：

```text
域名
DNS
阿里云备案/接入
安全组
firewalld
Nginx server_name
Nginx location
systemd 服务状态
```

## 7. Nginx 在项目里做什么

Nginx 可以先理解成“云端门卫 + 分流器”。

它主要做：

- 监听公网 80 端口。
- 根据域名判断请求属于哪个项目。
- 根据路径判断请求转给前台、后台还是后端。
- 处理静态资源和反向代理。

对社区项目来说，常见分流是：

```text
/          -> 社区前台 3106
/admin     -> 管理后台 3206
/api/**    -> Spring Boot 18080
/media/**  -> Spring Boot 18080
```

因此：

```text
前台能打开，但接口 404/502，可能是 /api/** 代理错。
页面能打开，但图片全挂，可能是 /media/** 代理错。
后台打不开，但前台正常，可能是 /admin 代理或后台服务错。
裸 IP 不对，不一定影响正式 Host。
```

## 8. Spring Boot 后端在云端的位置

Spring Boot 后端不是直接暴露给用户页面操作的唯一入口，而是在 Nginx 后面。

云端大概是：

```text
Nginx :80
-> 127.0.0.1:18080 或 0.0.0.0:18080
-> dramatv-community-server.service
-> PostgreSQL / Redis / OSS
```

后端健康检查：

```text
/actuator/health
```

后端主要负责：

- `/api/**` 业务接口。
- `/media/**` 媒体代理。
- 鉴权、会话、权限。
- 发布、举报、审核、互动、运营配置。
- 数据库读写。

所以如果前台报错，要区分：

```text
前端页面服务没起来
后端 API 没起来
Nginx 没转过去
后端起来了但数据库/Redis/OSS 出问题
```

## 9. PostgreSQL、Redis、OSS 分别承担什么

### PostgreSQL

PostgreSQL 是业务真相层。

它保存：

- 用户
- 内容
- 作者
- 提示词
- 工作流
- 帖子
- 评论
- 点赞收藏关注
- 后台运营配置
- 审核举报记录
- 媒体元数据

### Redis

Redis 更偏短状态。

常见用途：

- 登录会话
- 短期缓存
- 限流
- 临时状态

### OSS

OSS 保存媒体文件本体。

比如：

- 图片
- 视频
- 封面
- poster
- preview
- source

数据库通常只保存媒体元数据和对象路径，不直接保存大文件本体。

所以媒体链路通常是：

```text
media_assets 表保存元信息
-> object_key 指向 OSS 对象
-> 后端 /media/** 代理读取
-> 浏览器展示
```

## 10. 本地正常、云端异常时怎么判断

遇到“本地正常，云端异常”，不要直接认为是代码错。

优先按这个顺序问：

```text
1. 访问入口对不对？
2. Nginx Host 有没有打到社区？
3. 前台/后台/后端 systemd 服务是否 active？
4. 后端 /actuator/health 是否正常？
5. 云端数据库、Redis、OSS 是否正常？
6. 云端运行的是不是最新 release？
7. 脚本默认域名是否还是历史 nip.io？
8. 浏览器缓存或前端 sessionStorage 是否污染？
```

如果只有云端出问题，常见原因包括：

- 没部署到正确服务。
- 部署了前台但没部署后端。
- Nginx 配置没 reload。
- 当前访问的是旧域名。
- 云数据库数据和本地不一致。
- OSS 资源路径或权限不一致。
- 云端环境变量和本地不同。
- release 没切换成功。

## 11. 部署脚本在整个链路里的位置

当前项目不是完整 CI/CD，而是脚本化半自动部署。

常用命令：

| 场景 | 命令 |
| --- | --- |
| 前台发布 | `npm run deploy:test:web` |
| 后端发布 | `npm run deploy:test:backend` |
| 后台发布 | `npm run deploy:test:admin` |
| 部署前验证 | `npm run deploy:verify:pre` |
| 部署后验证 | `npm run deploy:verify:post:test` |
| 列出 release | `npm run release:list:test` |
| 前台回滚 | `npm run rollback:test:web -- -ReleaseName <release> -VerifyAfterRollback` |
| 后端回滚 | `npm run rollback:test:backend -- -ReleaseName <release> -VerifyAfterRollback` |
| 后台回滚 | `npm run rollback:test:admin -- -ReleaseName <release> -VerifyAfterRollback` |

部署脚本大概做的事情：

```text
本地验证
-> 构建或打包
-> 上传到云端 releases/<timestamp>
-> 远端安装依赖或放置 jar
-> 切换 current
-> 重启 systemd 服务
-> readiness / smoke 验证
```

这里的关键是：

```text
部署不是“把文件复制到云上”这么简单。
部署是把一个新 release 变成 current，并让服务重启到这个版本。
```

## 12. 回滚不是万能撤销

当前项目具备的是代码 release 级回滚能力。

可以回滚：

- 前台代码。
- 后台代码。
- 后端 jar。

不能简单回滚：

- 已执行的数据库 migration。
- 已修改的后台运营配置。
- 已写入的举报、审核、导入数据。
- 已上传到 OSS 的文件。

所以以后做大同步前必须有这个意识：

```text
代码能回滚，不代表所有数据状态都能回滚。
```

这也是为什么大更新前要备份、记录 release、跑验证、保留回滚点。

## 13. 最短排障路径

### 页面打不开

先查：

```text
域名是否正确
-> Nginx 是否命中社区
-> 前台 service 是否 running
-> 3106 是否可访问
```

### 页面能开但接口报错

先查：

```text
/api/** 是否被 Nginx 转到 18080
-> 后端 service 是否 running
-> /actuator/health 是否正常
-> 数据库/Redis 是否正常
```

### 媒体资源挂了

先查：

```text
/media/** 是否被 Nginx 转到 18080
-> 后端媒体代理是否正常
-> media_assets 记录是否正确
-> OSS object_key 是否存在
-> 权限是否允许后端读取
```

### 部署后没变化

先查：

```text
部署的是 web/admin/backend 哪一个
-> current 是否切到新 release
-> systemd 是否重启成功
-> 访问入口是否是当前域名
-> 浏览器缓存是否影响
```

## 14. 本节小结

- 本地主要是 `3106 -> 18080 -> PostgreSQL/Redis/本地媒体`。
- 云端主要是 `域名 -> Nginx -> web/admin/server -> PostgreSQL/Redis/OSS`。
- Nginx 是云端入口分流层，很多“页面不对”其实是入口分流问题。
- `/api/**` 和 `/media/**` 都需要正确转到后端。
- OSS 保存媒体本体，数据库保存媒体元数据和对象路径。
- 部署是 release 切换和服务重启，不是简单复制文件。
- 回滚主要回滚代码 release，不等于回滚数据库和 OSS 状态。

---

## 检查站

请你不用翻文档，直接回答：

1. 本地 `3106`、`3107`、`18080` 分别是什么？
2. 云端用户访问 `drama-community-dev.dzkjm.cn/featured`，大概会经过哪些层？
3. 为什么裸 IP `http://8.141.20.130` 打开不是社区，不一定说明社区服务挂了？
4. 如果页面能打开但图片和视频都挂了，你会优先查哪几层？
5. 为什么代码 release 能回滚，不代表数据库和 OSS 状态也能完整回滚？

