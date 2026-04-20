# YouMind 资源抓取与复刻对接总结

更新时间：2026-04-10

## 1. 目的

本文档用于给当前社区开发做资源对接说明，覆盖以下内容：

- YouMind `Seedance` 视频提示词库的抓取成果
- YouMind `Nano Banana Pro` 图片提示词库的抓取成果
- 两类资源的抓取方法论
- 当前资源实际落盘位置
- 两个复刻页面的位置与可复用入口
- 后续接入社区时建议优先使用的资源层

## 2. 当前成果总览

### 2.1 视频类：Seedance

- 视频提示词与视频资源抓取已基本完成
- 已形成一套可重复执行的 API 抓取 + 去重 + 下载 + 建库流程
- 已沉淀为结构化资源库，单条资源内视频与提示词配套存储
- 已有社区内复刻页面，可直接作为后续社区视频提示词板块的前端参考

### 2.2 图片类：Nano Banana Pro

- 图片提示词与图片资源已抓取一部分，且已形成标准化目录结构
- 已通过 API 批量拉取到完整索引层数据
- 已建立整理后的图片素材库主目录
- 已有图片提示词页面复刻版本，可继续作为社区图片提示词板块前端参考
- 当前图片类资源属于“已形成主库、仍可继续扩抓和补图”的状态

## 3. 建议按四层理解现有资产

后续对接时，建议把现有内容按四层使用：

### 3.1 原始抽取层

用途：保留 API 原始响应、分页抓取结果、排重中间件产物，便于追溯和重跑。

主要目录：

- [youmind-video-assets](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-video-assets)
- [youmind-nano-banana-extracted](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-nano-banana-extracted)

### 3.2 整理后的资源层

用途：作为后续社区入库、脚本消费、二次加工的主来源。

主要目录：

- 视频主库： [youmind-video-assets\youmind-seedance-library](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-video-assets\youmind-seedance-library)
- 视频分批库： [youmind-video-assets](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-video-assets)
- 图片主库： [youmind-image-assets\nano-banana-library-p001-p190](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\nano-banana-library-p001-p190)

### 3.3 社区可直接消费层

用途：给社区前端页面、静态资源访问、演示页面直接使用。

主要目录：

- 视频静态资源： [apps/web/public/seedance-videos](E:\点众\DramaTV社区搭建\apps\web\public\seedance-videos)
- 图片静态资源： [apps/web/public/nano-banana-images](E:\点众\DramaTV社区搭建\apps\web\public\nano-banana-images)
- 图片数据索引： [apps/web/public/nano-banana-data.json](E:\点众\DramaTV社区搭建\apps\web\public\nano-banana-data.json)

### 3.4 页面复刻层

用途：给社区前端开发直接参考 UI、交互与内容组织形式。

主要位置：

- 视频复刻页代码： [apps/web/src/app/(community)/seedance/page.tsx](E:\点众\DramaTV社区搭建\apps\web\src\app\(community)\seedance\page.tsx)
- 视频复刻页组件： [apps/web/src/features/seedance-replica/SeedanceReplicaPage.tsx](E:\点众\DramaTV社区搭建\apps\web\src\features\seedance-replica\SeedanceReplicaPage.tsx)
- 视频复刻页样式： [apps/web/src/features/seedance-replica/SeedanceReplicaPage.module.css](E:\点众\DramaTV社区搭建\apps\web\src\features\seedance-replica\SeedanceReplicaPage.module.css)
- 视频复刻页样本数据： [apps/web/src/features/seedance-replica/seedance-samples.ts](E:\点众\DramaTV社区搭建\apps\web\src\features\seedance-replica\seedance-samples.ts)
- 图片复刻页代码： [apps/web/src/app/(community)/nano-banana/page.tsx](E:\点众\DramaTV社区搭建\apps\web\src\app\(community)\nano-banana\page.tsx)
- 图片复刻页组件： [apps/web/src/features/nano-banana-replica/NanoBananaReplicaPage.tsx](E:\点众\DramaTV社区搭建\apps\web\src\features\nano-banana-replica\NanoBananaReplicaPage.tsx)
- 图片复刻页样式： [apps/web/src/features/nano-banana-replica/NanoBananaReplicaPage.module.css](E:\点众\DramaTV社区搭建\apps\web\src\features\nano-banana-replica\NanoBananaReplicaPage.module.css)
- 图片复刻页样本数据： [apps/web/src/features/nano-banana-replica/nano-banana-samples.ts](E:\点众\DramaTV社区搭建\apps\web\src\features\nano-banana-replica\nano-banana-samples.ts)

补充：

- 图片页还保留了一套独立静态预览版，用于快速调样式，不依赖主站复杂构建：
  [nano-banana-replica-preview](E:\点众\DramaTV社区搭建\docs\02_研究\nano-banana-replica-preview)

## 4. 视频类资源位置说明

### 4.1 视频抓取主资源目录

- 主目录： [youmind-video-assets](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-video-assets)
- 当前包含 `27` 个库目录
- 当前已整理资产条目约 `1531` 条

其中包括：

- 总样例库： [youmind-video-assets\youmind-seedance-library](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-video-assets\youmind-seedance-library)
- 分页批次库：如
  [youmind-video-assets\youmind-seedance-library-p002-p005](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-video-assets\youmind-seedance-library-p002-p005)
  [youmind-video-assets\youmind-seedance-library-p090-p097](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-video-assets\youmind-seedance-library-p090-p097)
  [youmind-video-assets\youmind-seedance-library-p130-p135](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-video-assets\youmind-seedance-library-p130-p135)

### 4.2 单条视频资源标准结构

示例目录结构：

```text
youmind-video-assets/
  youmind-seedance-library-p130-p135/
    1610-639-1fa2bed6034039d22e005da9e60ddb75/
      meta.json
      prompt.en.txt
      prompt.zh.txt
      source.txt
      video.mp4
```

说明：

- `video.mp4`：本地视频文件
- `prompt.zh.txt`：中文提示词
- `prompt.en.txt`：英文或原始提示词
- `source.txt`：来源链接
- `meta.json`：结构化元数据

### 4.3 社区中已经可直接使用的视频静态文件

- 目录： [apps/web/public/seedance-videos](E:\点众\DramaTV社区搭建\apps\web\public\seedance-videos)
- 当前是复刻页面直接使用的视频样本目录
- 当前目录下为精选样本，文件名已压缩成前端友好格式，例如：
  - `01-c007545cd29d97289934e0a92459e57a.mp4`
  - `02-a369712bc4a2ae44035e09341da4eeed.mp4`

## 5. 图片类资源位置说明

### 5.1 图片抓取主资源目录

- 原始抽取层： [youmind-nano-banana-extracted](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-nano-banana-extracted)
- 整理主库： [youmind-image-assets\nano-banana-library-p001-p190](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\nano-banana-library-p001-p190)

当前主库目录下已有 `3282` 个条目目录，对应当前已整理完成的图片提示词资源主集。

### 5.2 单条图片资源标准结构

示例目录：

- [youmind-image-assets\nano-banana-library-p001-p190\003208-10022](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\nano-banana-library-p001-p190\003208-10022)

标准结构：

```text
nano-banana-library-p001-p190/
  003208-10022/
    meta.json
    prompt.raw.txt
    prompt.zh.txt
    source.txt
    summary.txt
    images/
      01.jpg
```

说明：

- `prompt.raw.txt`：原始提示词
- `prompt.zh.txt`：中文提示词
- `summary.txt`：摘要或描述
- `source.txt`：来源链接
- `meta.json`：结构化元数据
- `images/`：该提示词对应的图片结果

### 5.3 社区中已经可直接使用的图片静态资源

- 图片目录： [apps/web/public/nano-banana-images](E:\点众\DramaTV社区搭建\apps\web\public\nano-banana-images)
- 数据索引： [apps/web/public/nano-banana-data.json](E:\点众\DramaTV社区搭建\apps\web\public\nano-banana-data.json)

当前 `nano-banana-data.json` 已可直接给社区图片提示词页读取，前端可以通过：

- 文字信息读取 `nano-banana-data.json`
- 图片文件读取 `/nano-banana-images/<item-id>/01.jpg`

## 6. 抓取方法论

## 6.1 共通原则

核心原则只有一条：

- 视频类或图片类都必须“资源与提示词配套存储”

也就是说：

- 只有视频没有提示词，不入主库
- 只有提示词没有视频，不入视频主库
- 只有图片没有提示词，不入图片主库
- 只有提示词没有图片，不入图片主库

这样做的原因是后续社区要做内容展示、二次生成、检索、推荐，必须保证一条内容是完整资产，而不是零散素材。

## 6.2 视频类方法论

视频类最终跑通的是：

1. 先通过 YouMind 接口拿到提示词列表页 JSON
2. 提取每条内容的结构化字段
3. 按规则去重
4. 过滤掉无法形成“视频 + 提示词”完整配对的条目
5. 下载可落盘的视频文件
6. 将视频、提示词、来源、元数据打包进单条资源目录
7. 输出 `library-manifest.json` 与 `library-skip-report.json` 方便追踪

视频类抓取主脚本：

- [fetch-youmind-seedance-api.js](E:\点众\DramaTV社区搭建\docs\02_研究\fetch-youmind-seedance-api.js)
- [download-youmind-videos.js](E:\点众\DramaTV社区搭建\docs\02_研究\download-youmind-videos.js)
- [build-youmind-library.js](E:\点众\DramaTV社区搭建\docs\02_研究\build-youmind-library.js)
- [filter-youmind-items.js](E:\点众\DramaTV社区搭建\docs\02_研究\filter-youmind-items.js)
- [merge-youmind-items.js](E:\点众\DramaTV社区搭建\docs\02_研究\merge-youmind-items.js)
- [sync-seedance-assets.js](E:\点众\DramaTV社区搭建\docs\02_研究\sync-seedance-assets.js)

视频类优点：

- 结构稳定
- 可分批执行
- 可追踪 A/B/跳过原因
- 对社区后续批量入库最友好

## 6.3 图片类方法论

图片类最终跑通的是：

1. 先通过 `Nano Banana Pro` 页面对应 API 抓取分页列表
2. 保留分页原始 JSON，作为追溯层
3. 从 API 条目中抽出标题、作者、来源、提示词、翻译提示词、图片地址、分类等字段
4. 对条目去重并整理为统一结构
5. 下载图片文件
6. 按单条目录落盘为 `meta + prompt + source + summary + images`
7. 同步一份前端可消费的数据与图片目录到 `apps/web/public`

图片类抓取主脚本：

- [fetch-youmind-nano-banana-api.js](E:\点众\DramaTV社区搭建\docs\02_研究\fetch-youmind-nano-banana-api.js)
- [download-youmind-images.js](E:\点众\DramaTV社区搭建\docs\02_研究\download-youmind-images.js)
- [build-youmind-image-library.js](E:\点众\DramaTV社区搭建\docs\02_研究\build-youmind-image-library.js)
- [sync-nano-banana-assets.js](E:\点众\DramaTV社区搭建\docs\02_研究\sync-nano-banana-assets.js)
- [filter-youmind-items.js](E:\点众\DramaTV社区搭建\docs\02_研究\filter-youmind-items.js)
- [merge-youmind-items.js](E:\点众\DramaTV社区搭建\docs\02_研究\merge-youmind-items.js)

图片类当前建议：

- 主库继续以 [youmind-image-assets\nano-banana-library-p001-p190](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\nano-banana-library-p001-p190) 为准
- 社区前端展示可优先读 [apps/web/public/nano-banana-data.json](E:\点众\DramaTV社区搭建\apps\web\public\nano-banana-data.json)
- 图片页展示时，只保留每条资源的 `Nano Banana` 首图即可，不必复刻 YouMind 原站“多模型多图滑动”

## 7. 复刻页面说明

## 7.1 视频提示词复刻页

主站路由：

- `/seedance`

代码位置：

- [apps/web/src/app/(community)/seedance/page.tsx](E:\点众\DramaTV社区搭建\apps\web\src\app\(community)\seedance\page.tsx)
- [apps/web/src/features/seedance-replica/SeedanceReplicaPage.tsx](E:\点众\DramaTV社区搭建\apps\web\src\features\seedance-replica\SeedanceReplicaPage.tsx)
- [apps/web/src/features/seedance-replica/seedance-samples.ts](E:\点众\DramaTV社区搭建\apps\web\src\features\seedance-replica\seedance-samples.ts)

当前用途：

- 展示精选视频提示词样本
- 验证视频播放、提示词复制、详情交互
- 给社区视频提示词页面提供设计和交互参考

## 7.2 图片提示词复刻页

主站路由：

- `/nano-banana`

代码位置：

- [apps/web/src/app/(community)/nano-banana/page.tsx](E:\点众\DramaTV社区搭建\apps\web\src\app\(community)\nano-banana\page.tsx)
- [apps/web/src/features/nano-banana-replica/NanoBananaReplicaPage.tsx](E:\点众\DramaTV社区搭建\apps\web\src\features\nano-banana-replica\NanoBananaReplicaPage.tsx)
- [apps/web/src/features/nano-banana-replica/nano-banana-samples.ts](E:\点众\DramaTV社区搭建\apps\web\src\features\nano-banana-replica\nano-banana-samples.ts)

静态预览版位置：

- [nano-banana-replica-preview](E:\点众\DramaTV社区搭建\docs\02_研究\nano-banana-replica-preview)

当前用途：

- 独立进行样式复刻和交互调试
- 用于快速对齐 YouMind 图片提示词页的结构和视觉
- 验证图片提示词列表、提示词固定高度滚动框、复制按钮、单图预览等交互

## 8. 社区对接建议

## 8.1 后端或数据接入建议

建议优先接“整理后的资源层”，不要直接接原始分页 JSON。

推荐优先使用：

- 视频： [youmind-video-assets\youmind-seedance-library](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-video-assets\youmind-seedance-library)
- 图片： [youmind-image-assets\nano-banana-library-p001-p190](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\nano-banana-library-p001-p190)

原因：

- 目录结构统一
- 一条资源就是一个完整单元
- 易于后续做导库脚本
- 适合建立社区自己的素材表

## 8.2 前端接入建议

如果社区需要先快速上线前台，可直接使用 `apps/web/public` 下的资源层：

- 视频资源：
  [apps/web/public/seedance-videos](E:\点众\DramaTV社区搭建\apps\web\public\seedance-videos)
- 图片资源：
  [apps/web/public/nano-banana-images](E:\点众\DramaTV社区搭建\apps\web\public\nano-banana-images)
- 图片索引：
  [apps/web/public/nano-banana-data.json](E:\点众\DramaTV社区搭建\apps\web\public\nano-banana-data.json)

适合做法：

- 视频提示词页：参考现有 `/seedance`
- 图片提示词页：参考现有 `/nano-banana`
- 后续正式社区页上线后，再把展示层从“样本页”切到“正式素材库查询”

## 8.3 推荐的社区素材表字段

无论视频还是图片，建议至少保留以下字段：

- `id`
- `type`：`video` / `image`
- `title`
- `summary`
- `prompt_raw`
- `prompt_zh`
- `author_name`
- `author_link`
- `source_link`
- `source_published_at`
- `featured`
- `results_count`
- `need_reference_images`
- `cover_path`
- `asset_paths`
- `meta_json_path`
- `source_library`

## 9. 当前已知限制

### 9.1 视频类

- 少量视频会因为源站、鉴权、403、原始地址失效等原因无法落盘
- 这类内容应保留在 `skip-report` 中，不建议手工硬补进主库

### 9.2 图片类

- 当前图片库已经形成主库，但仍可继续扩抓、补抓
- 图片类若后续继续抓取，建议继续沿用“必须图片与提示词配套”的原则
- 图片页复刻目前可作为展示和交互参考，但后续若接正式社区，还应继续做检索、标签、分页和收藏体系

## 10. 结论

目前这套工作已经沉淀出可直接复用的三类资产：

1. 可追溯的原始抽取层
2. 可用于正式入库的结构化资源层
3. 可给社区前端直接参考或复用的复刻页面层

其中最适合后续社区直接对接的核心目录是：

- 视频主库： [youmind-video-assets\youmind-seedance-library](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-video-assets\youmind-seedance-library)
- 图片主库： [youmind-image-assets\nano-banana-library-p001-p190](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\nano-banana-library-p001-p190)
- 视频复刻页： [apps/web/src/app/(community)/seedance/page.tsx](E:\点众\DramaTV社区搭建\apps\web\src\app\(community)\seedance\page.tsx)
- 图片复刻页： [apps/web/src/app/(community)/nano-banana/page.tsx](E:\点众\DramaTV社区搭建\apps\web\src\app\(community)\nano-banana\page.tsx)

如果后续要继续推进，最顺的路线是：

1. 先把两类资源导入社区正式数据表
2. 让现有两个复刻页逐步演化成正式社区素材页
3. 再继续追加图片类增量抓取与标签体系整理
