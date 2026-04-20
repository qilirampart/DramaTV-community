import { Link, useParams } from 'react-router-dom'
import { getCreatorByName } from '../data/communityData'
import { getSpotlightVideoBySlug, spotlightVideos, videoComments } from '../data/homepageData'
import { getWorkflowById } from '../data/workflowCanvasData'
import HoverVideo from '../shared/HoverVideo'

export default function VideoDetailPage() {
  const params = useParams()
  const entry = params.videoId ? getSpotlightVideoBySlug(params.videoId) : undefined

  if (!entry) {
    return (
      <main className="detail-shell detail-shell-empty">
        <div className="detail-empty-card">
          <p className="eyebrow">Video Missing</p>
          <h1>这个视频详情页还没有准备好</h1>
          <Link to="/" className="primary-button">
            返回社区首页
          </Link>
        </div>
      </main>
    )
  }

  const related = spotlightVideos.filter((item) => item.id !== entry.id).slice(0, 3)
  const workflow = getWorkflowById(entry.workflowId)
  const creator = getCreatorByName(entry.author)

  return (
    <div className="detail-shell">
      <div className="page-noise" />

      <header className="detail-topbar">
        <Link to="/" className="detail-backlink">
          返回社区首页
        </Link>
        <div className="detail-top-actions">
          <button className="ghost-button" type="button">
            收藏作品（前端占位）
          </button>
          {workflow ? (
            <Link className="primary-button" to={`/workflows/${workflow.slug}`}>
              继续查看方法
            </Link>
          ) : null}
        </div>
      </header>

      <main className="detail-main">
        <section className="detail-hero">
          <div className="detail-video-panel">
            <video
              className="detail-video"
              src={entry.video}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
            <div className="detail-video-shade" />
          </div>

          <div className="detail-summary-panel">
            <span className="video-category">{entry.category}</span>
            <h1>{entry.title}</h1>
            <p className="detail-lead">{entry.note}</p>
            <p className="detail-discussion">{entry.discussion}</p>

            <div className="detail-tag-row">
              {entry.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>

            <div className="detail-stats-row">
              {entry.stats.map((stat) => (
                <div key={stat} className="detail-stat-pill">
                  {stat}
                </div>
              ))}
            </div>

            <div className="detail-creator-card">
              <div className="creator-avatar creator-avatar-small">{entry.author.slice(0, 1)}</div>
              <div>
                <strong>{entry.author}</strong>
                <p>这条作品当前挂载在社区精选流中，后续会继续绑定工作流和作者主页沉淀。</p>
                {creator ? (
                  <Link className="detail-inline-link" to={`/creators/${creator.slug}`}>
                    进入作者主页
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="detail-grid">
          <article className="detail-block workflow-link-block">
            <p className="eyebrow">Linked Workflow</p>
            <h2>{entry.workflowTitle}</h2>
            <p>这里是作品和方法重新接上的地方。当前阶段优先保证从作品能回到工作流详情，再从工作流继续进入画布入口。</p>
            <div className="detail-block-actions">
              {workflow ? (
                <>
                  <Link className="primary-button" to={`/workflows/${workflow.slug}`}>
                    查看工作流详情
                  </Link>
                  <Link className="secondary-button" to={`/canvas/${workflow.defaultRuntimeId}`}>
                    {entry.workflowAction}
                  </Link>
                </>
              ) : null}
            </div>
          </article>

          <article className="detail-block comment-block">
            <p className="eyebrow">Discussion</p>
            <h2>围绕这条作品的制作讨论</h2>
            <div className="comment-list">
              {videoComments.map((comment) => (
                <div key={comment.id} className="comment-card">
                  <div className="creator-avatar creator-avatar-mini">{comment.author.slice(0, 1)}</div>
                  <div>
                    <strong>{comment.author}</strong>
                    <span>{comment.role}</span>
                    <p>{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="content-section detail-related-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Related Screening</p>
              <h2>继续往下看，但别离开方法线索</h2>
            </div>
            <p className="section-text">
              相关推荐不仅是同类作品堆叠，还要保留“这条内容为什么值得你继续点”的上下文线索。
            </p>
          </div>

          <div className="related-grid">
            {related.map((item) => (
              <article key={item.id} className="related-card">
                <HoverVideo src={item.video} title={item.title} className="related-video" />
                <div className="related-body">
                  <span className="video-category">{item.category}</span>
                  <h3>{item.title}</h3>
                  <p>{item.note}</p>
                  <Link to={`/videos/${item.slug}`}>查看详情</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
