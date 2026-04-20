# YouMind Seedance素材库执行与进度记录

## 1. 当前任务目标

当前任务目标已经明确为：

- 持续提取 YouMind Seedance 页面中的公开视频与对应提示词
- 只保留“视频 + 提示词”成对素材
- 优先提取好提取、能批量跑通的部分
- 将素材整理为后续社区可直接复用的资产库

当前策略：

- 先大量提取 `A级` 与稳定 `B级`
- 暂不为少量 `B级` 条目单独返工补原文
- 优先扩大总资产池，再回头精修

## 2. 入库标准

### A级

- 视频已落地
- 提示词已落地
- 能确认视频与提示词配套
- 拿到原始语言提示词

### B级

- 视频已落地
- 提示词已落地
- 视频与提示词配套关系可信
- 但当前只有翻译版或非原始语言版本提示词

### 跳过

- 只有视频，没有对应提示词
- 只有提示词，没有对应视频
- 无法确认视频与提示词是否配套

## 3. 当前方法论

当前已经形成两条稳定提取路径：

### 路径A：本地保存 HTML 提取

适用于首屏与已保存内容。

步骤：

1. 解析 `youmind-seedance-page.html`
2. 提取结构化条目
3. 必要时用 `source-overrides.json` 修正提示词
4. 下载视频
5. 构建正式素材库

### 路径B：官方分页 API 批量提取

已确认页面后续内容通过分页 API 获取：

- `POST https://youmind.com/youhome-api/video-prompts`

请求参数：

- `model: seedance-2.0`
- `page: 分页页码`
- `limit: 12`
- `locale: zh-CN`

当前这条路径已经验证通过，可持续扩展。

## 4. 当前脚本与职责

### `extract-youmind-seedance.js`

- 从保存的 HTML 中提取首批条目
- 输出全量 JSON 与兼容版 top10 JSON

### `fetch-youmind-seedance-api.js`

- 从 YouMind 分页 API 抓取指定页范围
- 输出分页原始 JSON
- 输出标准化后的批次 JSON

### `download-youmind-videos.js`

- 根据输入 JSON 批量下载视频
- 自动跳过已存在文件

### `build-youmind-library.js`

- 根据输入 JSON 构建正式素材库目录
- 自动生成 `library-manifest.json`
- 自动生成 `library-skip-report.json`
- 自动标记 `A/B` 级

### `filter-youmind-items.js`

- 根据已存在素材集合对新批次去重
- 去掉历史重复条目

### `merge-youmind-items.js`

- 合并多个 JSON 批次
- 用于构建排除集

## 5. 当前目录说明

### 中间产物

- `youmind-seedance-extracted/`

用途：

- 保存分页原始响应
- 保存标准化后的批次 JSON
- 保存临时与正式下载视频
- 保存排除集和去重结果

### 正式素材库

- `youmind-seedance-library/`
- `youmind-seedance-library-p002-p005/`
- `youmind-seedance-library-p006-p009/`

说明：

- 当前按批次单独入库，避免新旧素材混写
- 后续如有需要，可再做总库合并

## 6. 当前累计成果

截至 2026-04-08，本轮已经推进到：

- 首屏 + API 第 2 到第 9 页

累计结果：

- 累计正式入库：`102 条`
- `A级：93 条`
- `B级：9 条`
- 当前累计跳过：`0 条`

## 7. 各批次结果

### 批次1：首批 12 条

目录：

- `youmind-seedance-library/`

结果：

- 总数：`12`
- `A：11`
- `B：1`

### 批次2：第 2 到第 5 页去重新增

来源文件：

- `youmind-seedance-extracted/seedance-items.api.p002-p005.unique.json`

目录：

- `youmind-seedance-library-p002-p005/`

结果：

- 原始抓取：`48`
- 去重后新增：`43`
- `A：40`
- `B：3`

### 批次3：第 6 到第 9 页去重新增

来源文件：

- `youmind-seedance-extracted/seedance-items.api.p006-p009.unique.json`

目录：

- `youmind-seedance-library-p006-p009/`

结果：

- 原始抓取：`48`
- 去重后新增：`47`
- `A：42`
- `B：5`

## 8. 当前已验证的关键事实

- YouMind 首屏并不是总量上限
- 页面后续内容通过分页 API 加载
- API 当前可稳定批量抓取
- 视频可通过 `Imported from URL` 还原原始 mp4
- 当前流程已经能稳定批量生产“视频 + 提示词”配套素材

## 9. 当前待处理问题

### B级条目暂不处理

当前累计 `B级 9 条`。

这些条目不是坏数据，而是：

- 视频完整
- 提示词也有
- 但缺少原始语言版本提示词

按当前策略，这些条目先保留，不优先返工。

### 视频目录存在部分重复命名文件

由于早期试跑和后续正式批量下载并存，`videos/` 目录中存在个别同 stream 的不同 rank 文件名。

当前不影响批次入库，但后续可以做安全去重。

## 10. 下一步计划

下一轮继续按同一流程推进：

1. 抓取 API 第 10 到第 13 页
2. 下载视频
3. 用已有总排除集去重
4. 生成下一批独立素材库
5. 继续累计总量

## 11. 当日进度日志

### 2026-04-08

- 明确以“素材库建设”替代单纯页面复刻为当前优先级
- 固定 A / B / 跳过 三类判断标准
- 将首批 12 条稳定入库
- 通过浏览器抓包确认分页接口 `youhome-api/video-prompts`
- 新增 `fetch-youmind-seedance-api.js`，打通 API 批量抓取
- 新增 `filter-youmind-items.js`，打通批次去重
- 新增 `merge-youmind-items.js`，打通排除集合并
- 让下载与入库脚本支持指定输入文件
- 完成第 2 到第 5 页提取、下载、去重、入库
- 完成第 6 到第 9 页提取、下载、去重、入库
- 当前累计正式素材提升到 `102 条`

## 12. 后续记录规则

后续每轮继续记录：

- 抓取页范围
- 原始抓取条数
- 去重后新增条数
- A/B 数量
- 新增脚本或流程变化
- 是否出现新的失败类型

这样后续扩展到更大规模时，依然能保持过程清楚、结果可追溯。
## 13. 2026-04-08 晚间追加进展

### p010-p013 批次已修复并完成入库

- 原始抓取文件：`youmind-seedance-extracted/seedance-items.api.p010-p013.json`
- 去重文件：`youmind-seedance-extracted/seedance-items.api.p010-p013.unique.json`
- 累计排重集：`youmind-seedance-extracted/seedance-items.exclude.p001-p013.json`
- 正式素材库：`youmind-seedance-library-p010-p013/`

本批次一度出现 `selectedCount: 0`，原因不是视频没下载，而是 `unique.json` 中的 `localVideoPath` 曾被清空，导致构建脚本把全部样本判定为 `missing video`。

已做处理：
- 重新生成 `p010-p013.unique.json`，确认 `localVideoPath` 保留且文件存在
- 修复 `build-youmind-library.js`，增加按 `streamId` 在 `youmind-seedance-extracted/videos/` 目录中自动回补本地视频路径的兜底逻辑
- 重新构建 `youmind-seedance-library-p010-p013/`

本批次最终结果：
- 入库 48 条
- `A级` 40 条
- `B级` 8 条
- `SKIP` 0 条

截至当前累计结果：
- 已入库总数：150 条
- `A级`：133 条
- `B级`：17 条
- `SKIP`：0 条

下一步继续：
1. 抓取 `p014-p017`
2. 下载配套视频
3. 基于 `seedance-items.exclude.p001-p013.json` 去重
4. 构建新一批正式素材库

### p014-p017 批次已完成

- 原始抓取文件：`youmind-seedance-extracted/seedance-items.api.p014-p017.json`
- 去重文件：`youmind-seedance-extracted/seedance-items.api.p014-p017.unique.json`
- 累计排重集：`youmind-seedance-extracted/seedance-items.exclude.p001-p017.json`
- 正式素材库：`youmind-seedance-library-p014-p017/`

本批次结果：
- 入库 48 条
- `A级` 46 条
- `B级` 2 条
- `SKIP` 0 条

为了让“提示词和视频配套存储”在原始批次 JSON 层面也成立，已补充：
- 更新 `download-youmind-videos.js`
- 下载或跳过已存在视频后，会把 `localVideoPath` 与 `localVideoFileName` 回写到输入 JSON

截至当前累计结果：
- 已入库总数：198 条
- `A级`：179 条
- `B级`：19 条
- `SKIP`：0 条

下一步继续：
1. 抓取 `p018-p021`
2. 下载视频并回写本地路径
3. 基于 `seedance-items.exclude.p001-p017.json` 去重
4. 构建下一批正式素材库

### p050-p053 批次已完成

- 原始抓取文件：`youmind-seedance-extracted/seedance-items.api.p050-p053.json`
- 去重文件：`youmind-seedance-extracted/seedance-items.api.p050-p053.unique.json`
- 累计排重集：`youmind-seedance-extracted/seedance-items.exclude.p001-p053.json`
- 正式素材库：`youmind-seedance-library-p050-p053/`

本批次结果：
- 抓取 48 条
- 成功入库 48 条
- `A级` 44 条
- `B级` 4 条
- `SKIP` 0 条

截至当前累计结果：
- 已入库总数：629 条
- `A级`：576 条
- `B级`：52 条
- `SKIP`：1 条

下一步继续：
1. 抓取 `p054-p057`
2. 下载视频并记录单条失败
3. 基于 `seedance-items.exclude.p001-p053.json` 去重
4. 构建下一批正式素材库

### p054-p057 批次已完成

- 原始抓取文件：`youmind-seedance-extracted/seedance-items.api.p054-p057.json`
- 去重文件：`youmind-seedance-extracted/seedance-items.api.p054-p057.unique.json`
- 累计排重集：`youmind-seedance-extracted/seedance-items.exclude.p001-p057.json`
- 正式素材库：`youmind-seedance-library-p054-p057/`

本批次结果：
- 抓取 48 条
- 成功入库 48 条
- `A级` 48 条
- `B级` 0 条
- `SKIP` 0 条

截至当前累计结果：
- 已入库总数：677 条
- `A级`：624 条
- `B级`：53 条
- `SKIP`：1 条

下一步继续：
1. 抓取 `p058-p061`
2. 下载视频并记录单条失败
3. 基于 `seedance-items.exclude.p001-p057.json` 去重
4. 构建下一批正式素材库

### p058-p061 批次已完成

- 原始抓取文件：`youmind-seedance-extracted/seedance-items.api.p058-p061.json`
- 去重文件：`youmind-seedance-extracted/seedance-items.api.p058-p061.unique.json`
- 累计排重集：`youmind-seedance-extracted/seedance-items.exclude.p001-p061.json`
- 正式素材库：`youmind-seedance-library-p058-p061/`

本批次结果：
- 抓取 48 条
- 成功入库 47 条
- `A级` 45 条
- `B级` 2 条
- `SKIP` 1 条

本批次跳过说明：
- `rank 688`
- `streamId: 1bd6a00edac137d02153570c0c05c280`
- 原因：源视频地址返回 `404 Not Found`
- `sourceLink: https://x.com/jigschat/status/2034532826146644013`

截至当前累计结果：
- 已入库总数：724 条
- `A级`：669 条
- `B级`：55 条
- `SKIP`：2 条

下一步继续：
1. 抓取 `p062-p065`
2. 下载视频并记录单条失败
3. 基于 `seedance-items.exclude.p001-p061.json` 去重
4. 构建下一批正式素材库

### p062-p065 批次已完成

- 原始抓取文件：`youmind-seedance-extracted/seedance-items.api.p062-p065.json`
- 去重文件：`youmind-seedance-extracted/seedance-items.api.p062-p065.unique.json`
- 累计排重集：`youmind-seedance-extracted/seedance-items.exclude.p001-p065.json`
- 正式素材库：`youmind-seedance-library-p062-p065/`

本批次结果：
- 抓取 48 条
- 成功入库 47 条
- `A级` 47 条
- `B级` 0 条
- `SKIP` 1 条

本批次跳过说明：
- `rank 771`
- `streamId: b1200696b493a9ebd6aa472d9df6e20c`
- 原因：源视频地址返回 `403 Forbidden`
- `sourceLink: https://x.com/nomastudioai/status/2033291090032234691`

截至当前累计结果：
- 已入库总数：771 条
- `A级`：716 条
- `B级`：55 条
- `SKIP`：3 条

下一步继续：
1. 抓取 `p066-p069`
2. 下载视频并记录单条失败
3. 基于 `seedance-items.exclude.p001-p065.json` 去重
4. 构建下一批正式素材库

### p066-p073 批次已完成

- 原始抓取文件：`youmind-seedance-extracted/seedance-items.api.p066-p073.json`
- 去重文件：`youmind-seedance-extracted/seedance-items.api.p066-p073.unique.json`
- 累计排重集：`youmind-seedance-extracted/seedance-items.exclude.p001-p073.json`
- 正式素材库：`youmind-seedance-library-p066-p073/`

本批次结果：
- 抓取 96 条
- 成功入库 96 条
- `A级` 94 条
- `B级` 2 条
- `SKIP` 0 条

本批次说明：
- `8` 页大批次验证成功
- 视频下载 `96/96` 全量成功
- 本批没有出现源视频失效条目

截至当前累计结果：
- 已入库总数：867 条
- `A级`：810 条
- `B级`：57 条
- `SKIP`：3 条

下一步继续：
1. 抓取 `p074-p081`
2. 下载视频并记录单条失败
3. 基于 `seedance-items.exclude.p001-p073.json` 去重
4. 构建下一批正式素材库

### p074-p081 批次已完成

- 原始抓取文件：`youmind-seedance-extracted/seedance-items.api.p074-p081.json`
- 去重文件：`youmind-seedance-extracted/seedance-items.api.p074-p081.unique.json`
- 累计排重集：`youmind-seedance-extracted/seedance-items.exclude.p001-p081.json`
- 正式素材库：`youmind-seedance-library-p074-p081/`

本批次结果：
- 抓取 96 条
- 去重后新增 48 条
- 成功入库 47 条
- `A级` 43 条
- `B级` 4 条
- `SKIP` 1 条

本批次说明：
- 站点新增内容导致分页漂移，`p074-p081` 中前 48 条与既有排重集重复
- 视频下载结果为 `95/96`
- 实际新增素材集中在本批后半段

本批次跳过说明：
- `rank 928`
- `streamId: 388e09d3cbcf9e9b0bd8fd1973212baa`
- 原因：源视频地址返回 `403 Forbidden`
- `sourceLink: https://x.com/AIwithSanchit/status/2031669104848089173`

截至当前累计结果：
- 已入库总数：914 条
- `A级`：853 条
- `B级`：61 条
- `SKIP`：4 条

下一步继续：
1. 抓取 `p082-p089`
2. 下载视频并记录单条失败
3. 基于 `seedance-items.exclude.p001-p081.json` 去重
4. 构建下一批正式素材库

### p082-p089 批次已完成

- 原始抓取文件：`youmind-seedance-extracted/seedance-items.api.p082-p089.json`
- 去重文件：`youmind-seedance-extracted/seedance-items.api.p082-p089.unique.json`
- 累计排重集：`youmind-seedance-extracted/seedance-items.exclude.p001-p089.json`
- 正式素材库：`youmind-seedance-library-p082-p089/`

本批次结果：
- 抓取 96 条
- 去重后新增 96 条
- 成功入库 95 条
- `A级` 91 条
- `B级` 4 条
- `SKIP` 1 条

本批次说明：
- 本批没有出现分页重复
- 视频下载结果为 `95/96`
- 当前累计正式入库总数已突破 `1000`

本批次跳过说明：
- `rank 1034`
- `streamId: dcfd9253cd455507d6b4e876df252a83`
- 原因：下载过程中连接中断，最终未形成配套视频
- `sourceLink: https://x.com/liyue_ai/status/2029186278395396561`

截至当前累计结果：
- 已入库总数：1009 条
- `A级`：944 条
- `B级`：65 条
- `SKIP`：5 条

下一步继续：
1. 抓取 `p090-p097`
2. 下载视频并记录单条失败
3. 基于 `seedance-items.exclude.p001-p089.json` 去重
4. 构建下一批正式素材库

### p046-p049 批次已完成

- 原始抓取文件：`youmind-seedance-extracted/seedance-items.api.p046-p049.json`
- 去重文件：`youmind-seedance-extracted/seedance-items.api.p046-p049.unique.json`
- 累计排重集：`youmind-seedance-extracted/seedance-items.exclude.p001-p049.json`
- 正式素材库：`youmind-seedance-library-p046-p049/`

本批次结果：
- 抓取 48 条
- 成功入库 48 条
- `A级` 47 条
- `B级` 1 条
- `SKIP` 0 条

截至当前累计结果：
- 已入库总数：581 条
- `A级`：532 条
- `B级`：49 条
- `SKIP`：1 条

下一步继续：
1. 抓取 `p050-p053`
2. 下载视频并记录单条失败
3. 基于 `seedance-items.exclude.p001-p049.json` 去重
4. 构建下一批正式素材库

### p042-p045 批次已完成

- 原始抓取文件：`youmind-seedance-extracted/seedance-items.api.p042-p045.json`
- 去重文件：`youmind-seedance-extracted/seedance-items.api.p042-p045.unique.json`
- 累计排重集：`youmind-seedance-extracted/seedance-items.exclude.p001-p045.json`
- 正式素材库：`youmind-seedance-library-p042-p045/`

本批次结果：
- 抓取 48 条
- 成功入库 48 条
- `A级` 48 条
- `B级` 0 条
- `SKIP` 0 条

截至当前累计结果：
- 已入库总数：533 条
- `A级`：485 条
- `B级`：48 条
- `SKIP`：1 条

下一步继续：
1. 抓取 `p046-p049`
2. 下载视频并记录单条失败
3. 基于 `seedance-items.exclude.p001-p045.json` 去重
4. 构建下一批正式素材库

### p038-p041 批次已完成

- 原始抓取文件：`youmind-seedance-extracted/seedance-items.api.p038-p041.json`
- 去重文件：`youmind-seedance-extracted/seedance-items.api.p038-p041.unique.json`
- 累计排重集：`youmind-seedance-extracted/seedance-items.exclude.p001-p041.json`
- 正式素材库：`youmind-seedance-library-p038-p041/`

本批次结果：
- 抓取 48 条
- 成功入库 48 条
- `A级` 48 条
- `B级` 0 条
- `SKIP` 0 条

截至当前累计结果：
- 已入库总数：485 条
- `A级`：437 条
- `B级`：48 条
- `SKIP`：1 条

下一步继续：
1. 抓取 `p042-p045`
2. 下载视频并记录单条失败
3. 基于 `seedance-items.exclude.p001-p041.json` 去重
4. 构建下一批正式素材库

### p034-p037 批次已完成

- 原始抓取文件：`youmind-seedance-extracted/seedance-items.api.p034-p037.json`
- 去重文件：`youmind-seedance-extracted/seedance-items.api.p034-p037.unique.json`
- 累计排重集：`youmind-seedance-extracted/seedance-items.exclude.p001-p037.json`
- 正式素材库：`youmind-seedance-library-p034-p037/`

本批次结果：
- 抓取 48 条
- 成功入库 48 条
- `A级` 46 条
- `B级` 2 条
- `SKIP` 0 条

截至当前累计结果：
- 已入库总数：437 条
- `A级`：389 条
- `B级`：48 条
- `SKIP`：1 条

下一步继续：
1. 抓取 `p038-p041`
2. 下载视频并记录单条失败
3. 基于 `seedance-items.exclude.p001-p037.json` 去重
4. 构建下一批正式素材库

### p030-p033 批次已完成

- 原始抓取文件：`youmind-seedance-extracted/seedance-items.api.p030-p033.json`
- 去重文件：`youmind-seedance-extracted/seedance-items.api.p030-p033.unique.json`
- 累计排重集：`youmind-seedance-extracted/seedance-items.exclude.p001-p033.json`
- 正式素材库：`youmind-seedance-library-p030-p033/`

本批次结果：
- 抓取 48 条
- 成功入库 48 条
- `A级` 45 条
- `B级` 3 条
- `SKIP` 0 条

执行备注：
- 这批在并行阶段出现过一次 `build` 找不到 `unique.json` 的路径问题
- 原因是并行执行时 `filter` 输出路径命中了临时沙箱路径
- 实际数据未丢失，已在正式工作目录串行补跑 `build-youmind-library.js`

截至当前累计结果：
- 已入库总数：389 条
- `A级`：343 条
- `B级`：46 条
- `SKIP`：1 条

下一步继续：
1. 抓取 `p034-p037`
2. 下载视频并记录单条失败
3. 基于 `seedance-items.exclude.p001-p033.json` 去重
4. 构建下一批正式素材库

### p026-p029 批次已完成

- 原始抓取文件：`youmind-seedance-extracted/seedance-items.api.p026-p029.json`
- 去重文件：`youmind-seedance-extracted/seedance-items.api.p026-p029.unique.json`
- 累计排重集：`youmind-seedance-extracted/seedance-items.exclude.p001-p029.json`
- 正式素材库：`youmind-seedance-library-p026-p029/`

本批次结果：
- 抓取 48 条
- 成功入库 48 条
- `A级` 44 条
- `B级` 4 条
- `SKIP` 0 条

截至当前累计结果：
- 已入库总数：341 条
- `A级`：298 条
- `B级`：43 条
- `SKIP`：1 条

下一步继续：
1. 抓取 `p030-p033`
2. 下载视频并记录单条失败
3. 基于 `seedance-items.exclude.p001-p029.json` 去重
4. 构建下一批正式素材库

### p022-p025 批次已完成

- 原始抓取文件：`youmind-seedance-extracted/seedance-items.api.p022-p025.json`
- 去重文件：`youmind-seedance-extracted/seedance-items.api.p022-p025.unique.json`
- 累计排重集：`youmind-seedance-extracted/seedance-items.exclude.p001-p025.json`
- 正式素材库：`youmind-seedance-library-p022-p025/`

本批次结果：
- 抓取 48 条
- 成功入库 47 条
- `A级` 38 条
- `B级` 9 条
- `SKIP` 1 条

本批次新增处理：
- `download-youmind-videos.js` 已升级为“单条失败不拖垮整批”
- 当前确认有 1 条视频源直接返回 `403`，因此被跳过：
  - `rank 259`
  - `streamId: b914f88a1999096947e0d24641c1226e`
  - `sourceLink: https://x.com/simple__dev/status/2039935077912826240`

截至当前累计结果：
- 已入库总数：293 条
- `A级`：254 条
- `B级`：39 条
- `SKIP`：1 条

下一步继续：
1. 抓取 `p026-p029`
2. 下载视频并记录单条失败
3. 基于 `seedance-items.exclude.p001-p025.json` 去重
4. 构建下一批正式素材库

### p018-p021 批次已完成

- 原始抓取文件：`youmind-seedance-extracted/seedance-items.api.p018-p021.json`
- 去重文件：`youmind-seedance-extracted/seedance-items.api.p018-p021.unique.json`
- 累计排重集：`youmind-seedance-extracted/seedance-items.exclude.p001-p021.json`
- 正式素材库：`youmind-seedance-library-p018-p021/`

本批次结果：
- 入库 48 条
- `A级` 37 条
- `B级` 11 条
- `SKIP` 0 条

截至当前累计结果：
- 已入库总数：246 条
- `A级`：216 条
- `B级`：30 条
- `SKIP`：0 条

下一步继续：
1. 抓取 `p022-p025`
2. 下载视频并回写本地路径
3. 基于 `seedance-items.exclude.p001-p021.json` 去重
4. 构建下一批正式素材库
### p090-p097 批次已完成

- 原始抓取文件：`youmind-seedance-extracted/seedance-items.api.p090-p097.json`
- 去重文件：`youmind-seedance-extracted/seedance-items.api.p090-p097.unique.json`
- 累计排重集：`youmind-seedance-extracted/seedance-items.exclude.p001-p097.json`
- 正式素材库：`youmind-seedance-library-p090-p097/`

执行结果：
- API 抓取：`96` 条
- 视频下载成功：`96/96`
- 去重后新增：`96`
- 正式入库：`96`
- `A级`：`95`
- `B级`：`1`
- `SKIP`：`0`

截至当前累计结果：
- 已入库总数：`1105` 条
- `A级`：`1039` 条
- `B级`：`66` 条
- `SKIP`：`5` 条

下一步：
1. 抓取 `p098-p105`
2. 下载本批视频并回写本地路径
3. 基于 `seedance-items.exclude.p001-p097.json` 去重
4. 建正式库并合并新的累计排重集
