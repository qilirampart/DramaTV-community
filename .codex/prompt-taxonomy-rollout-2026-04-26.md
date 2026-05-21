# 分类体系统一任务清单（2026-04-26）

来源：本次会话中用户明确提出，需要把统一后的分类体系同步到精选页、发布页和历史资源。

使用规则：
- 当前文件只用于记录和跟踪本轮“分类体系统一”任务，不代表已经完成代码改动。
- 后续每完成一个任务，同时更新本文件和 `.codex/progress.md`。
- 状态规则：`[ ]` 未完成，`[x]` 已完成。
- 本轮分类任务只维护这一份主清单，防止后续压缩后上下文丢失。

## 分类目标

本轮统一分类先按以下结构落地：

1. 内容类型
   - `image_prompt`
   - `video_prompt`
   - `workflow`

2. 模型分类
   - 图片模型：`gpt-image-2` / `nanobanana` / `midjourney` / `other-image-model`
   - 视频模型：`seedance` / `kling` / `happyhorse` / `wan` / `other-video-model`

3. 组合分类
   - `single-model`
   - `multi-model`

4. 内容母类
   - 图片提示词：`real-person` / `animation` / `scene` / `prop` / `other`
   - 视频提示词：`real-person` / `animation` / `other`

说明：
- `other` 是正式兜底分类，不是临时补丁。
- 当前已知资源里：
  - 视频基本归在 `seedance`
  - 图片主要归在 `gpt-image-2` 和 `nanobanana`
- 后续有新模型接入时，只扩模型分类，不改母类结构。

## 当前待办

- [x] C1 统一分类字典与映射规则
  - 目标：在前后端共识层明确“内容类型 / 模型分类 / 组合分类 / 内容母类”的唯一标准。
  - 范围：
    - 精选页筛选所需分类常量
    - 发布页标签选择所需分类常量
    - 历史资源回填所需映射规则
  - 约束：
    - 不再继续使用“原始 tag 平铺即分类”的方式
    - 所有兜底项必须明确落到 `other`

- [x] C2 精选页筛选同步到正式分类体系
  - 目标：把 `/featured` 的现有筛选升级为正式分类，不再只是临时前端归类。
  - 范围：
    - 图片提示词模型分类
    - 视频提示词模型分类
    - 图片提示词母类
    - 视频提示词母类
  - 约束：
    - 标签面板要稳定，不能继续随着原始 tag 发散
    - 没有命中的分类也要有明确兜底

- [x] C3 发布页增加标准标签选择区
  - 目标：发布时由用户点击标准标签，系统自动写入规范标签，而不是完全依赖自由输入。
  - 范围：
    - 视频提示词发布
    - 图片提示词发布
    - 工作流发布的预留兼容
  - 交互要求：
    - 用户可选择模型分类
    - 用户可选择内容母类
    - 用户可选择是否为模型组合
    - 选择结果自动进入结构化标签/字段

- [x] C4 导入脚本与历史资源归类规则升级
  - 目标：让已有导入脚本和后续导入流程都按统一分类标准写入数据。
  - 范围：
    - 现有 YouMind 视频资源
    - 现有 YouMind 图片资源
    - 已有 `modelName / sourceCampaign / tagNames` 的映射修正
  - 约束：
    - 已能确定模型的内容优先精确归类
    - 无法精确判断的内容必须进入 `other`

- [x] C5 历史资源批量回填与验收
  - 目标：把当前库里已经导入的 prompt 资源按新标准补齐分类，并验证前台表现。
  - 范围：
    - 云端现有 prompt 数据
    - 精选页筛选命中情况
    - 发布后新内容的分类落库情况
  - 验收重点：
    - 分类字段真实可用
    - 前台筛选不再依赖临时猜测
    - 发布和导入走同一套分类口径

## 建议处理顺序

1. 先做 `C1`
   - 先把分类字典定成正式标准，避免后面边做边改口径。

2. 再做 `C3`
   - 发布链路先接入标准分类，避免新增内容继续污染旧数据。

3. 再做 `C4 + C5`
   - 统一回填历史资源，让已有数据跟上新口径。

4. 最后收口 `C2`
   - 让精选页最终读取正式分类结果，而不是继续只靠前端猜。
## C6 Follow-up

- [x] Remove visible `youmind` tag from prompt tags everywhere.
- [x] Stop preserving `youmind` in import and backfill scripts.
- [x] Add frontend tag filtering in the community data adapter as a safety net.
- [x] Clean cloud test data: `matchedCount=794`, `updatedCount=794`, `outOfSyncCountAfter=0`.
