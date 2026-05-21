# Awesome GPT-Image-2 仓库图片资产抓取记录

更新时间：2026-04-28

## 1. 目标

本轮目标仓库：

- `https://github.com/EvoLinkAI/awesome-gpt-image-2-prompts`

本轮目标不是只做分析，而是把该仓库里的案例图片、提示词、分类、来源作者信息，整理成可供社区后续接入的本地研究资产。

## 2. 本轮实际完成内容

本轮实际完成了以下工作：

1. 分析仓库内容结构，确认其核心价值是 `README` 中的案例库，而不是可直接消费的应用工程
2. 以 `README.md` 为主源，解析出每条案例的：
   - 分类
   - 标题
   - 示例图片地址
   - Prompt
   - 来源链接
   - 作者与作者主页
3. 补充一套本地脚本，把 GitHub 仓库内容转换成研究资产
4. 批量下载仓库里的 `290` 张示例图片到本地
5. 按当前项目已有的研究资产风格，整理成标准库目录
6. 生成 OSS 上传清单，供主项目后续上传自有对象存储时使用
7. 在元数据中固化来源和作者信息，便于后续审计、替换和正式接入

## 3. 采用的数据源

本轮以仓库 `README.md` 为主数据源，而不是只使用仓库里的 `gpt_image2_prompts.json`。

原因：

- `README.md` 覆盖的案例数更多
- 单条案例天然包含：
  - 分类栏目
  - 标题
  - 示例图片
  - Prompt
  - 来源链接
  - 作者
- `gpt_image2_prompts.json` 只覆盖一部分案例，适合作为补充统计源

## 4. 提取方法

本轮采用的是“解析 GitHub README + 下载仓库输出图 + 本地建库”的方式，而不是直接抓 X/Twitter 原图。

具体方法：

1. 读取仓库 `README.md`
2. 按 `## 分类栏目` 和 `### Case` 结构解析案例
3. 提取每个案例里的：
   - `sectionTitle`
   - `title`
   - `Prompt`
   - `./images/.../output.jpg`
   - `sourceLink`
   - `authorName`
   - `authorLink`
4. 将 README 中的相对图片路径转成 GitHub Raw 图片地址
5. 批量下载这些 Raw 图片到本地
6. 生成标准化 JSON 索引
7. 复制图片并写出 `meta.json / prompt.raw.txt / source.txt / summary.txt`
8. 输出适合后续上传到自有 OSS 的 `oss-upload-manifest.json`

这样做的好处是：

- 不依赖 X/Twitter 图床稳定性
- 每条案例天然带分类和标题
- 生成后的本地结构和当前 `docs/02_研究` 其他资产库风格一致

## 5. 资源形式

本轮最终整理出的资源，不是一份单一 JSON，而是四层形式：

### 5.1 原始抽取索引

用途：

- 保留解析后的结构化案例数据
- 作为后续重建标准库的中间层

内容包括：

- 分类
- 标题
- Prompt
- 来源
- 作者
- GitHub Raw 图片地址

### 5.2 原始图片下载层

用途：

- 保留从 GitHub 仓库批量下载的本地图片
- 作为后续建库和 OSS 上传的图片源

### 5.3 标准库层

用途：

- 供主项目未来抽取、导入或转换为正式内容资产
- 单条条目可独立查看

单条目录包含：

- `meta.json`
- `prompt.raw.txt`
- `summary.txt`
- `source.txt`
- `images/*`

### 5.4 OSS 上传清单层

用途：

- 给主项目后续上传自有 OSS 时直接使用
- 保留每张图片本地路径、对象 key、来源作者、分类信息

## 6. 产物目录

### 6.1 原始抽取层

- 抽取目录：
  [github-image-assets\awesome-gpt-image-2-prompts-extracted](E:\点众\DramaTV社区搭建\docs\02_研究\github-image-assets\awesome-gpt-image-2-prompts-extracted)
- 主索引：
  [awesome-gpt-image-2-prompts.items.json](E:\点众\DramaTV社区搭建\docs\02_研究\github-image-assets\awesome-gpt-image-2-prompts-extracted\awesome-gpt-image-2-prompts.items.json)
- 图片下载目录：
  [images](E:\点众\DramaTV社区搭建\docs\02_研究\github-image-assets\awesome-gpt-image-2-prompts-extracted\images)

### 6.2 标准库层

- 资产库目录：
  [github-image-assets\awesome-gpt-image-2-prompts-library](E:\点众\DramaTV社区搭建\docs\02_研究\github-image-assets\awesome-gpt-image-2-prompts-library)
- 清单文件：
  [library-manifest.json](E:\点众\DramaTV社区搭建\docs\02_研究\github-image-assets\awesome-gpt-image-2-prompts-library\library-manifest.json)
- OSS 上传清单：
  [oss-upload-manifest.json](E:\点众\DramaTV社区搭建\docs\02_研究\github-image-assets\awesome-gpt-image-2-prompts-library\oss-upload-manifest.json)
- 跳过报告：
  [library-skip-report.json](E:\点众\DramaTV社区搭建\docs\02_研究\github-image-assets\awesome-gpt-image-2-prompts-library\library-skip-report.json)

## 7. 统计结果

本轮最终结果：

- 解析案例总数：`290`
- 成功下载图片条目：`290`
- 成功建库条目：`290`
- 跳过条目：`0`
- OSS 上传对象数：`290`

分类分布：

- `portrait-and-photography`：`51`
- `poster-and-illustration`：`123`
- `character-design`：`11`
- `ui-and-social-media-mockup`：`58`
- `comparison-and-community`：`47`

补充：

- 每条案例当前都只有 `1` 张 repo 输出图
- 解析结果中 `290/290` 条都带 prompt 和图片

## 8. 单条资产结构

单条目录示例：

- [000001-2045167461147042202](E:\点众\DramaTV社区搭建\docs\02_研究\github-image-assets\awesome-gpt-image-2-prompts-library\000001-2045167461147042202)

目录结构：

```text
000001-2045167461147042202/
  meta.json
  prompt.raw.txt
  summary.txt
  source.txt
  images/
    01.jpg
```

字段说明：

- `meta.json`：主元数据，包含分类、标题、作者、来源、repo 地址等
- `prompt.raw.txt`：原始 prompt
- `summary.txt`：简要说明
- `source.txt`：来源帖链接
- `images/01.jpg`：本地下载图片

## 9. 来源与作者保留方案

本轮已按“注明来源和作者”的要求保留以下字段：

```json
{
  "sourceRepo": "EvoLinkAI/awesome-gpt-image-2-prompts",
  "repoUrl": "https://github.com/EvoLinkAI/awesome-gpt-image-2-prompts",
  "sourceLink": "https://x.com/BubbleBrain/status/2045167461147042202",
  "authorName": "BubbleBrain",
  "authorLink": "https://x.com/BubbleBrain",
  "categories": "portrait-and-photography",
  "sectionTitle": "Portrait & Photography Cases"
}
```

这些信息当前会同时存在于：

- 原始抽取 JSON
- 单条 `meta.json`
- `library-manifest.json`
- `oss-upload-manifest.json`

## 10. OSS 上传清单规则

当前生成的 OSS 对象 key 前缀为：

- `community-assets/github-awesome-gpt-image-2-prompts`

示例对象：

```text
community-assets/github-awesome-gpt-image-2-prompts/portrait-and-photography/000001-2045167461147042202/images/01.jpg
```

上传清单条目示例字段：

- `title`
- `categories`
- `sectionTitle`
- `authorName`
- `authorLink`
- `sourceLink`
- `localPath`
- `objectKey`

## 11. 本轮新增脚本

本轮新增脚本：

- [fetch-awesome-gpt-image-2-repo.js](E:\点众\DramaTV社区搭建\docs\02_研究\fetch-awesome-gpt-image-2-repo.js)
- [download-awesome-gpt-image-2-repo-images.js](E:\点众\DramaTV社区搭建\docs\02_研究\download-awesome-gpt-image-2-repo-images.js)
- [build-awesome-gpt-image-2-repo-library.js](E:\点众\DramaTV社区搭建\docs\02_研究\build-awesome-gpt-image-2-repo-library.js)

对应执行命令：

```powershell
node .\fetch-awesome-gpt-image-2-repo.js
node .\download-awesome-gpt-image-2-repo-images.js .\github-image-assets\awesome-gpt-image-2-prompts-extracted\awesome-gpt-image-2-prompts.items.json
node .\build-awesome-gpt-image-2-repo-library.js .\github-image-assets\awesome-gpt-image-2-prompts-extracted\awesome-gpt-image-2-prompts.items.json .\github-image-assets\awesome-gpt-image-2-prompts-library community-assets/github-awesome-gpt-image-2-prompts
```

## 12. 对主项目侧的对接建议

主项目侧如果只关注“怎么接”，建议优先使用以下两个入口：

1. [library-manifest.json](E:\点众\DramaTV社区搭建\docs\02_研究\github-image-assets\awesome-gpt-image-2-prompts-library\library-manifest.json)
2. [oss-upload-manifest.json](E:\点众\DramaTV社区搭建\docs\02_研究\github-image-assets\awesome-gpt-image-2-prompts-library\oss-upload-manifest.json)

推荐接法：

1. 先按 `categories` 做内部分类映射
2. 按 `library-manifest.json` 选择要接入的案例
3. 按 `oss-upload-manifest.json` 上传图片到自有 OSS
4. 用单条目录下的 `meta.json + prompt.raw.txt + source.txt` 组装正式内容记录

## 13. 备注

这批图片当前技术上已经可以上传到自有 OSS。

但在正式对外分发前，仍建议主项目侧单独确认第三方来源图片的再分发边界。当前这批资产已经把来源链接和作者固化下来，便于后续做权限审计和替换。
