# YouMind Nano Banana 漫画故事版图片提示词抓取记录

更新时间：2026-04-24

## 1. 本轮目标

目标页面：

- `https://youmind.com/zh-CN/nano-banana-pro-prompts?utm_source=nav&categories=comic-storyboard`

本轮数据归类：

- 模型：`nano-banana-pro`
- 内容类型：图片类 / 生图提示词
- 分类：`comic-storyboard`
- 中文业务理解：`漫画 / 故事版`

这批资产后续应作为研究资产保留，不直接并入正式社区主站代码。

## 2. 分页接口确认

已确认接口：

- `POST https://youmind.com/youhome-api/prompts`

本页对应请求体：

```json
{
  "model": "nano-banana-pro",
  "page": 2,
  "limit": 18,
  "locale": "zh-CN",
  "campaign": "nano-banana-pro-prompts",
  "filterMode": "imageCategories",
  "categories": "comic-storyboard"
}
```

分页规模：

- `total = 410`
- `totalPages = 23`
- `limit = 18`

## 3. 产物目录

### 3.1 原始抽取层

- 抽取目录：
  [youmind-image-assets\nano-banana-comic-storyboard-extracted](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\nano-banana-comic-storyboard-extracted)
- 主索引：
  [nano-banana-items.api.p001-p023.json](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\nano-banana-comic-storyboard-extracted\nano-banana-items.api.p001-p023.json)
- 图片下载目录：
  [images](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\nano-banana-comic-storyboard-extracted\images)

### 3.2 整理后的标准库

- 图片库目录：
  [youmind-image-assets\nano-banana-comic-storyboard-library-p001-p023](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\nano-banana-comic-storyboard-library-p001-p023)
- 清单：
  [library-manifest.json](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\nano-banana-comic-storyboard-library-p001-p023\library-manifest.json)
- 跳过报告：
  [library-skip-report.json](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\nano-banana-comic-storyboard-library-p001-p023\library-skip-report.json)

## 4. 分类记录落点

这次已按“资源需要有分类记录”的要求保留分类信息。

分类字段写入位置包括：

- 原始抽取 JSON 的每条记录
- 标准库 `library-manifest.json` 的每条记录
- 每个条目目录下的 `meta.json`

当前使用字段：

```json
{
  "model": "nano-banana-pro",
  "campaign": "nano-banana-pro-prompts",
  "filterMode": "imageCategories",
  "locale": "zh-CN",
  "categories": "comic-storyboard"
}
```

示例条目：

- [000001-14706\meta.json](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\nano-banana-comic-storyboard-library-p001-p023\000001-14706\meta.json)

## 5. 统计结果

基于原始抽取 JSON 统计：

- 条目总数：`410`
- 含图片条目：`382`
- 图片总数：`614`
- 多图条目：`127`
- `needReferenceImages = true`：`138`
- 语言覆盖：`en`、`ja`、`zh`

基于建库结果统计：

- 标准库条目数：`382`
- 跳过条目数：`28`
- 跳过原因均为：`missing image`

首尾样本：

- 第 1 条：`000001-14706` `电影级动作拼贴分屏`
- 第 2 条：`000002-14703` `动漫情侣矢量插画`
- 第 3 条：`000003-14294` `忧郁的艺术概念`
- 第 408 条：`000408-289` `YouTube 缩略图创作者的工作流程五格漫画`
- 第 409 条：`000409-279` `关于生成式 AI 的四格讽刺漫画`
- 第 410 条：`000410-277` `将漫画翻译成日文并重新渲染为图像`

## 6. 执行命令

### 6.1 抓取索引

```powershell
node .\fetch-youmind-nano-banana-api.js 1 23 18 zh-CN nano-banana-pro nano-banana-pro-prompts imageCategories comic-storyboard nano-banana-comic-storyboard-extracted
```

### 6.2 下载图片

```powershell
node .\download-youmind-images.js .\youmind-image-assets\nano-banana-comic-storyboard-extracted\nano-banana-items.api.p001-p023.json
```

### 6.3 建标准库

```powershell
node .\build-youmind-image-library.js .\youmind-image-assets\nano-banana-comic-storyboard-extracted\nano-banana-items.api.p001-p023.json .\youmind-image-assets\nano-banana-comic-storyboard-library-p001-p023
```

## 7. 备注

虽然脚本文件名还沿用了历史命名 `fetch-youmind-nano-banana-api.js`，但当前脚本已经是通用图片抓取管线，可通过参数切换：

- `model`
- `campaign`
- `categories`

因此后续如果继续扩抓：

- `nano-banana-pro` 其它图片分类
- `gpt-image-2` 其它图片分类

可以沿用同一套流程，只需要替换参数和输出目录。

