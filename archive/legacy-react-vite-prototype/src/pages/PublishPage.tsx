import { Link } from 'react-router-dom'
import { workflowCatalog } from '../data/workflowCanvasData'

const publishStatusBoard = [
  { label: '视频上传', state: '前端占位', tone: 'placeholder' },
  { label: '草稿保存', state: '接口预留', tone: 'planned' },
  { label: '提交审核', state: '接口预留', tone: 'planned' },
  { label: '工作流绑定', state: '原型已建模', tone: 'ready' },
] as const

const publishTracks = [
  { title: '剧情短片', summary: '适合首页推荐流和作者主页代表作。' },
  { title: '方法演示', summary: '适合展示提示词、镜头语言或工作流打法。' },
  { title: '挑战投稿', summary: '适合当前社区活动和轻运营主题。' },
] as const

const tagSuggestions = ['冷月', '动作镜头', '机甲压迫感', '赛博夜景', '角色锚定', '群像调度'] as const

const publishChecklist = [
  '先发布视频，再绑定来源工作流，是当前 P0 主线。',
  '封面、preview、source 需要分层，避免大视频直接进入列表流。',
  '未接通能力必须显式标记，不伪装成已可用。',
  '发布页最终要服务 PGC 冷启动，而不是一开始追求超复杂 UGC。',
] as const

export default function PublishPage() {
  const recommendedWorkflows = workflowCatalog.slice(0, 3)

  return (
    <div className="detail-shell publish-shell">
      <div className="page-noise" />

      <header className="detail-topbar">
        <Link to="/" className="detail-backlink">
          返回社区首页
        </Link>
        <div className="detail-top-actions">
          <button className="ghost-button" type="button">
            保存草稿（接口预留）
          </button>
          <button className="primary-button" type="button">
            提交审核（接口预留）
          </button>
        </div>
      </header>

      <main className="detail-main publish-main">
        <section className="publish-hero">
          <article className="detail-summary-panel">
            <p className="eyebrow">Publishing Console</p>
            <h1>先把 PGC 内容稳定发出来，再把社区链路接深</h1>
            <p className="detail-lead">
              当前发布页优先服务“发布视频并绑定工作流”这条主线，后续再逐步补强工作流单独发布、审核流转和运营位。
            </p>

            <div className="status-chip-row">
              {publishStatusBoard.map((item) => (
                <span key={item.label} className={`status-chip status-chip-${item.tone}`}>
                  {item.label}：{item.state}
                </span>
              ))}
            </div>
          </article>

          <aside className="workflow-side-panel">
            <div className="workflow-side-card workflow-side-card-accent">
              <p className="eyebrow">Mainline Rule</p>
              <h2>当前先打通视频发布闭环</h2>
              <p>这版页面先确保“上传视频、填写信息、绑定工作流、进入审核”结构完整。复杂权限、运营活动和高级编辑先不抢排期。</p>
            </div>
          </aside>
        </section>

        <section className="publish-layout">
          <div className="publish-form-stack">
            <article className="detail-block publish-form-card">
              <p className="eyebrow">Step 01</p>
              <h2>基础信息</h2>
              <div className="publish-form-grid">
                <label className="publish-field">
                  <span>作品标题</span>
                  <input defaultValue="冷月竹林对峙" type="text" />
                </label>

                <label className="publish-field">
                  <span>发布分区</span>
                  <select defaultValue="剧情短片">
                    {publishTracks.map((track) => (
                      <option key={track.title} value={track.title}>
                        {track.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="publish-field publish-field-wide">
                  <span>作品简介</span>
                  <textarea
                    defaultValue="强调冷雾、刀光和出招前停顿的 14 秒武侠短片，后续会继续绑定公开工作流供社区回看方法。"
                    rows={5}
                  />
                </label>

                <label className="publish-field publish-field-wide">
                  <span>封面 / poster / preview</span>
                  <div className="publish-upload-card">
                    <strong>媒体分层提示</strong>
                    <p>当前原型只演示结构，正式版需要拆分 cover、preview、source，避免大视频直接进入首页列表流。</p>
                  </div>
                </label>
              </div>
            </article>

            <article className="detail-block publish-form-card">
              <p className="eyebrow">Step 02</p>
              <h2>绑定来源工作流</h2>
              <p className="section-text publish-intro">
                当前主线是“发布视频并绑定工作流”，所以这里优先展示推荐工作流，而不是先做复杂工作流编辑器。
              </p>

              <div className="publish-workflow-list">
                {recommendedWorkflows.map((workflow, index) => (
                  <label key={workflow.id} className="publish-option-card">
                    <input defaultChecked={index === 0} name="workflow" type="radio" />
                    <div>
                      <strong>{workflow.title}</strong>
                      <p>{workflow.summary}</p>
                      <span>{workflow.status}</span>
                    </div>
                  </label>
                ))}
              </div>
            </article>

            <article className="detail-block publish-form-card">
              <p className="eyebrow">Step 03</p>
              <h2>标签与制作线索</h2>

              <div className="creator-focus-list">
                {tagSuggestions.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <div className="publish-form-grid">
                <label className="publish-field publish-field-wide">
                  <span>提示词经验 / 制作备注</span>
                  <textarea
                    defaultValue="这里后续要承接创作者解释：这条片子的镜头节奏、提示词重点、工作流变体和踩坑记录。"
                    rows={6}
                  />
                </label>
              </div>
            </article>
          </div>

          <aside className="publish-side-panel">
            <article className="workflow-side-card">
              <p className="eyebrow">Publish Tracks</p>
              <div className="publish-track-list">
                {publishTracks.map((track) => (
                  <div key={track.title} className="publish-track-card">
                    <strong>{track.title}</strong>
                    <p>{track.summary}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="workflow-side-card">
              <p className="eyebrow">Checklist</p>
              <ul className="publish-checklist">
                {publishChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </aside>
        </section>
      </main>
    </div>
  )
}
