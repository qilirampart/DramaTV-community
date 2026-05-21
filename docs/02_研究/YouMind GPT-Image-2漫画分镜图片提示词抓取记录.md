# YouMind GPT-Image-2 漫画分镜图片提示词抓取记录

更新时间：2026-04-24

## 1. 本轮结论

目标页面：

- `https://youmind.com/zh-CN/gpt-image-2-prompts?utm_source=nav&categories=comic-storyboard`

本轮数据应归类为：

- `gpt-image-2`
- 图片类
- 生图提示词
- 分类：`comic-storyboard`

明确不应归入：

- `Seedance` 视频提示词
- `Nano Banana Pro` 图片提示词主库

虽然当前复用的脚本文件名里仍保留了 `nano-banana` 历史命名，但本轮实际抓取、下载、建库的数据内容已经按 `gpt-image-2 + comic-storyboard` 单独落盘，并在条目元数据中保留了模型和分类字段。

## 2. 页面与接口确认

已确认分页接口：

- `POST https://youmind.com/youhome-api/prompts`

已确认本页对应请求体：

```json
{
  "model": "gpt-image-2",
  "page": 2,
  "limit": 18,
  "locale": "zh-CN",
  "categories": "comic-storyboard",
  "campaign": "gpt-image-2-prompts",
  "filterMode": "imageCategories"
}
```

已确认分页规模：

- `total = 252`
- `totalPages = 14`
- `limit = 18`

结论：

- 这是可稳定脚本化抓取的图片 prompt 列表页
- 可以直接复用现有图片版 API 抓取管线
- 后续如需扩抓 `gpt-image-2` 其它分类，只需要替换 `categories`

## 3. 本轮产物位置

### 3.1 原始抽取层

- 抽取目录：
  [youmind-image-assets\gpt-image-2-comic-storyboard-extracted](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\gpt-image-2-comic-storyboard-extracted)
- 主索引文件：
  [nano-banana-items.api.p001-p014.json](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\gpt-image-2-comic-storyboard-extracted\nano-banana-items.api.p001-p014.json)
- 下载图片目录：
  [images](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\gpt-image-2-comic-storyboard-extracted\images)

说明：

- 文件名沿用了旧图片抓取管线的 `nano-banana-items...json` 命名
- 但目录层、条目字段和值都已经是 `gpt-image-2 / comic-storyboard`

### 3.2 整理后的图片库

- 图片库目录：
  [youmind-image-assets\gpt-image-2-comic-storyboard-library-p001-p014](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\gpt-image-2-comic-storyboard-library-p001-p014)
- 清单文件：
  [library-manifest.json](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\gpt-image-2-comic-storyboard-library-p001-p014\library-manifest.json)
- 跳过报告：
  [library-skip-report.json](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\gpt-image-2-comic-storyboard-library-p001-p014\library-skip-report.json)

单条条目目录内已包含：

- `meta.json`
- `prompt.raw.txt`
- `prompt.zh.txt`
- `summary.txt`
- `source.txt`
- `images/*`

## 4. 统计结果

基于原始抽取 JSON 统计：

- 条目数：`252`
- 图片总数：`283`
- 多图条目数：`20`
- `needReferenceImages = true`：`230`
- `featured = true`：`1`
- 语言覆盖：`en`、`zh`、`ja`、`ko`

首尾样本：

- 第 1 条：`000001-13467` `动漫武术对决`
- 第 2 条：`000002-14858` `复古迈阿密艺术约会漫画页`
- 第 3 条：`000003-14857` `雨夜黑色电影风格漫画页面`
- 第 250 条：`000250-13617` `音乐视频制作分镜蓝图`
- 第 251 条：`000251-13601` `动漫风格奇幻夜间城堡`
- 第 252 条：`000252-13609` `视觉小说截图样机`

基于建库目录核对：

- 已落盘图片条目目录数：`252`
- 已建库条目目录数：`252`
- `library-skip-report.json` 为空，说明本轮没有被过滤掉的条目

## 5. 本轮脚本调整

本轮没有新开一套 `gpt-image-2` 专用脚本，而是把现有图片抓取管线改成了可复用版本：

- [fetch-youmind-nano-banana-api.js](E:\点众\DramaTV社区搭建\docs\02_研究\fetch-youmind-nano-banana-api.js)
- [download-youmind-images.js](E:\点众\DramaTV社区搭建\docs\02_研究\download-youmind-images.js)
- [build-youmind-image-library.js](E:\点众\DramaTV社区搭建\docs\02_研究\build-youmind-image-library.js)

已支持的能力：

- 通过参数切换 `model`
- 通过参数切换 `campaign`
- 通过参数切换 `categories`
- 自动生成对应输出目录
- 下载时按条目元数据动态构建 `referer`
- 在抽取 JSON、`meta.json`、`library-manifest.json` 中保留：
  - `model`
  - `campaign`
  - `filterMode`
  - `locale`
  - `categories`

当前遗留点：

- 脚本文件名仍带 `nano-banana`，属于历史命名，不影响使用
- 如果后续会继续扩抓多个图片模型，建议下一轮统一重命名为更中性的 `fetch-youmind-image-api.js` 一类

## 6. 可复用命令

### 6.1 抓取分页数据

```powershell
node .\fetch-youmind-nano-banana-api.js 1 14 18 zh-CN gpt-image-2 gpt-image-2-prompts imageCategories comic-storyboard gpt-image-2-comic-storyboard-extracted
```

### 6.2 下载图片

```powershell
node .\download-youmind-images.js .\youmind-image-assets\gpt-image-2-comic-storyboard-extracted\nano-banana-items.api.p001-p014.json
```

### 6.3 建库

```powershell
node .\build-youmind-image-library.js .\youmind-image-assets\gpt-image-2-comic-storyboard-extracted\nano-banana-items.api.p001-p014.json .\youmind-image-assets\gpt-image-2-comic-storyboard-library-p001-p014
```

## 7. 与当前项目的关系

结合当前项目主线，这批数据更适合作为以下用途：

- 社区中“图片提示词 / 生图案例”内容池研究素材
- 工作流详情页里“关联作品”与“关联提示词”样例来源
- 首页或专题页里的 `PGC` 内容预置素材
- 后续图片类工作流栏目、作者页图片作品区的假数据或种子库

当前不建议直接把这批目录原样并入正式前端主站代码。更稳妥的做法是：

1. 先把它视为 `docs/02_研究` 下的研究资产
2. 后续按社区页面契约提炼统一字段
3. 再决定是否同步到 `apps/web/public` 或服务端种子数据

