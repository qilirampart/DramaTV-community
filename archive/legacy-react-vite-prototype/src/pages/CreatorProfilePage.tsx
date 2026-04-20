import { Link, useParams } from 'react-router-dom'
import {
  getCreatorBySlug,
  getCreatorVideos,
  getCreatorWorkflows,
} from '../data/communityData'
import HoverVideo from '../shared/HoverVideo'

export default function CreatorProfilePage() {
  const params = useParams()
  const creator = params.creatorSlug ? getCreatorBySlug(params.creatorSlug) : undefined

  if (!creator) {
    return (
      <main className="detail-shell detail-shell-empty">
        <div className="detail-empty-card">
          <p className="eyebrow">Creator Missing</p>
          <h1>这个作者主页还没有准备好</h1>
          <Link to="/" className="primary-button">
            返回首页
          </Link>
        </div>
      </main>
    )
  }

  const videos = getCreatorVideos(creator.slug)
  const workflows = getCreatorWorkflows(creator.slug)

  return (
    <div className="detail-shell creator-profile-shell">
      <div className="page-noise" />

      <header className="detail-topbar">
        <Link to="/" className="detail-backlink">
          返回社区首页
        </Link>
        <div className="detail-top-actions">
          <button className="ghost-button" type="button">
            关注作者（前端占位）
          </button>
          <Link className="primary-button" to="/publish">
            发布关联作品
          </Link>
        </div>
      </header>

      <main className="detail-main creator-profile-main">
        <section className="creator-hero">
          <article className="detail-summary-panel creator-profile-card">
            <div className="creator-profile-heading">
              <div className="creator-avatar creator-avatar-large">{creator.name.slice(0, 1)}</div>
              <div>
                <p className="eyebrow">{creator.headline}</p>
                <h1>{creator.name}</h1>
                <p className="creator-role-line">
                  {creator.role} · {creator.location}
                </p>
              </div>
            </div>

            <p className="detail-lead">{creator.bio}</p>
            <p className="detail-discussion">“{creator.featuredQuote}”</p>

            <div className="creator-metrics">
              {creator.stats.map((stat) => (
                <span key={stat} className="detail-stat-pill">
                  {stat}
                </span>
              ))}
            </div>

            <div className="creator-focus-list">
              {creator.focus.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>

          <aside className="workflow-side-panel">
            <div className="workflow-side-card">
              <p className="eyebrow">Current Focus</p>
              <h2>{creator.currentProjectTitle}</h2>
              <p>{creator.currentProjectSummary}</p>
            </div>

            <div className="workflow-side-card workflow-side-card-accent">
              <p className="eyebrow">Profile State</p>
              <h2>作者页已经回到主线里</h2>
              <p>当前主页优先承接“作品、工作流、讨论”三条信息线。关注和收藏仍明确标记为占位，不伪装成已接通能力。</p>

              <div className="status-chip-row">
                {creator.statusSignals.map((signal) => (
                  <span key={`${signal.label}-${signal.state}`} className="status-chip status-chip-planned">
                    {signal.label}：{signal.state}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="content-section detail-related-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Works</p>
              <h2>这位作者当前挂在社区主线里的作品</h2>
            </div>
            <p className="section-text">
              作者主页不是头像卡，而是要把作者的作品风格、方法资产和社区讨论重新编回同一条阅读链里。
            </p>
          </div>

          <div className="creator-video-grid">
            {videos.map((video) => (
              <article key={video.id} className="related-card">
                <HoverVideo src={video.video} title={video.title} className="related-video" />
                <div className="related-body">
                  <span className="video-category">{video.category}</span>
                  <h3>{video.title}</h3>
                  <p>{video.note}</p>
                  <Link to={`/videos/${video.slug}`}>查看作品详情</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="creator-bottom-grid">
          <article className="detail-block">
            <p className="eyebrow">Workflows</p>
            <h2>这位作者公开的方法资产</h2>
            <div className="creator-workflow-grid">
              {workflows.map((workflow) => (
                <article key={workflow.id} className="workflow-summary-card">
                  <span className="workflow-status">{workflow.status}</span>
                  <h3>{workflow.title}</h3>
                  <p>{workflow.summary}</p>
                  <div className="workflow-tags">
                    {workflow.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="detail-block-actions">
                    <Link className="secondary-button" to={`/workflows/${workflow.slug}`}>
                      查看工作流
                    </Link>
                    <Link className="ghost-button" to={`/canvas/${workflow.defaultRuntimeId}`}>
                      在画布中打开
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="detail-block">
            <p className="eyebrow">Forum Notes</p>
            <h2>作者现在最值得跟进的讨论线</h2>
            <div className="creator-note-list">
              {creator.forumNotes.map((note) => (
                <div key={note} className="creator-note-card">
                  <p>{note}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}
