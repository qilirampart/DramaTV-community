# YouMind 漫画故事版图片提示词资产补充交接说明

更新时间：2026-04-24

## 1. 文档目的

本文用于给主项目侧同步本轮在 `docs/02_研究` 下完成的工作，重点说明：

- 当前项目主线判断
- `docs/02_研究` 目录的实际角色
- 本轮新增的两批漫画故事版图片提示词资产
- 资产分类字段如何保留
- 后续接入正式社区工程时的建议

## 2. 当前项目现状判断

结合仓库代码和既有文档，本项目当前正式开发主线没有变化：

- 前端正式主线：`apps/web`
- 前端技术栈：`Next.js + React + TypeScript`
- 当前实际版本：`Next.js 16.2.2`、`React 19.2.0`
- 后端正式主线：`apps/server`
- 后端技术栈：`Spring Boot`
- 当前实际基线：`Spring Boot 3.5.13 + Java 17`

当前阶段判断仍然是：

- `PGC 冷启动阶段`
- 优先跑通社区主线闭环
- 研究目录里的外部素材、提示词抓取、复刻页面，只作为研究和种子资产，不直接代表正式生产接入方式

## 3. `docs/02_研究` 当前角色

本目录当前承担的是研究资产层，不是正式业务代码层。

当前已承接的职责包括：

- YouMind 外部素材抓取
- 图片 / 视频提示词索引整理
- 本地素材下载与标准化建库
- 复刻页面视觉参考
- 后续社区内容池、假数据、种子素材准备

因此本轮新增内容也统一落在这里，没有直接写入：

- `apps/web/public`
- `apps/web/src`
- `apps/server`

## 4. 本轮完成内容总览

本轮完成了三件事：

1. 校验项目当前正式工程状态，确认仍以 `apps/web + apps/server` 为准
2. 将现有图片抓取管线从“只能服务 Nano Banana”改成“可按模型和分类复用”
3. 新增两批 `comic-storyboard` 图片提示词研究资产

本轮新增的两批数据分别是：

- `gpt-image-2 / comic-storyboard`
- `nano-banana-pro / comic-storyboard`

这两批数据的业务归类统一是：

- 图片类
- 生图提示词
- 分类：`comic-storyboard`
- 中文理解：`漫画 / 故事版`

## 5. 图片抓取管线本轮改动

本轮没有另起新脚本，而是在现有图片抓取脚本上做了通用化改造。

涉及脚本：

- `fetch-youmind-nano-banana-api.js`
- `download-youmind-images.js`
- `build-youmind-image-library.js`

已经支持的能力：

- 通过参数切换 `model`
- 通过参数切换 `campaign`
- 通过参数切换 `categories`
- 自动按参数落到不同输出目录
- 下载图片时按条目元数据动态构建页面 `referer`
- 在抽取索引、标准库清单、单条 `meta.json` 中保留分类字段

当前仍保留的历史痕迹：

- 脚本文件名里还有 `nano-banana` 字样
- 这是命名遗留，不影响实际支持多模型分类抓取

如果后续准备长期维护多模型图片库，建议下一步统一重命名为更中性的图片抓取脚本名。

## 6. 新增资产一：`gpt-image-2 / comic-storyboard`

目标页面：

- `https://youmind.com/zh-CN/gpt-image-2-prompts?utm_source=nav&categories=comic-storyboard`

分页规模：

- `252` 条
- `14` 页

资产落点：

- 原始抽取层：`docs/02_研究/youmind-image-assets/gpt-image-2-comic-storyboard-extracted`
- 标准库：`docs/02_研究/youmind-image-assets/gpt-image-2-comic-storyboard-library-p001-p014`

结果统计：

- 原始条目数：`252`
- 图片总数：`283`
- 多图条目数：`20`
- `needReferenceImages = true`：`230`
- `featured = true`：`1`
- 语言覆盖：`en`、`zh`、`ja`、`ko`
- 建库条目数：`252`
- 跳过条目数：`0`

这批资产已经完成：

- API 抓取
- 图片下载
- 标准库整理

## 7. 新增资产二：`nano-banana-pro / comic-storyboard`

目标页面：

- `https://youmind.com/zh-CN/nano-banana-pro-prompts?utm_source=nav&categories=comic-storyboard`

分页规模：

- `410` 条
- `23` 页

资产落点：

- 原始抽取层：`docs/02_研究/youmind-image-assets/nano-banana-comic-storyboard-extracted`
- 标准库：`docs/02_研究/youmind-image-assets/nano-banana-comic-storyboard-library-p001-p023`

结果统计：

- 原始条目数：`410`
- 含图片条目：`382`
- 图片总数：`614`
- 多图条目数：`127`
- `needReferenceImages = true`：`138`
- 语言覆盖：`en`、`ja`、`zh`
- 建库条目数：`382`
- 跳过条目数：`28`
- 跳过原因：全部为 `missing image`

这批资产也已经完成：

- API 抓取
- 图片下载
- 标准库整理

## 8. 分类记录方案

考虑到后续社区资源会引入分类，本轮已经把分类字段固化到条目级别，而不是只写在目录名里。

当前统一保留的分类相关字段为：

```json
{
  "model": "nano-banana-pro",
  "campaign": "nano-banana-pro-prompts",
  "filterMode": "imageCategories",
  "locale": "zh-CN",
  "categories": "comic-storyboard"
}
```

这些字段当前会同时出现在：

- 原始抽取 JSON 的每条记录
- `library-manifest.json` 的每条记录
- 每个条目目录下的 `meta.json`

这意味着后续主项目侧无论从哪一层读取，都能识别：

- 这条资产属于哪个模型
- 来自哪个页面活动
- 属于哪个业务分类

## 9. 标准库目录结构

单条条目当前统一按以下结构存储：

```text
{library-root}/
  000001-14706/
    meta.json
    prompt.raw.txt
    prompt.zh.txt
    summary.txt
    source.txt
    images/
      01.jpg
      02.jpg
```

关键文件说明：

- `meta.json`：主索引元数据，含模型、分类、来源、作者、语言等字段
- `prompt.raw.txt`：原始提示词
- `prompt.zh.txt`：中文提示词
- `summary.txt`：摘要说明
- `source.txt`：来源链接
- `images/*`：本地下载图片

## 10. 对主项目侧的建议

当前更稳妥的接入方式不是把整份研究资产直接搬到主工程，而是分两步做。

第一步：

- 继续把 `docs/02_研究` 视为研究资产源
- 主项目侧先确定正式的图片提示词内容契约
- 明确是否需要统一字段名、枚举值、分类字典

第二步：

- 从标准库或 `library-manifest.json` 抽取正式入库字段
- 再决定同步到 `apps/web/public`、服务端种子数据，或独立内容导入脚本

建议主项目侧重点关注以下问题：

- `categories` 是否直接沿用外部来源分类名，还是映射成内部分类字典
- 多模型图片提示词是否要落到统一内容表
- `needReferenceImages` 是否需要成为正式展示标签
- 跳过条目是否需要保留为“索引存在但资源缺失”的审计记录

## 11. 本轮新增文档

本轮已补充的说明文档包括：

- `docs/02_研究/YouMind GPT-Image-2漫画分镜图片提示词抓取记录.md`
- `docs/02_研究/YouMind Nano Banana漫画故事版图片提示词抓取记录.md`
- `docs/02_研究/YouMind漫画故事版图片提示词资产补充交接说明.md`

如果主项目侧只看一份文档，优先看本文即可。

