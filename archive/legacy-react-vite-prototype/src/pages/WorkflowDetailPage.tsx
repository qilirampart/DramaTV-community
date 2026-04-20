import { startTransition, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getCreatorByName } from '../data/communityData'
import { spotlightVideos } from '../data/homepageData'
import { getWorkflowBySlug, startMockWorkflowCopy } from '../data/workflowCanvasData'
import HoverVideo from '../shared/HoverVideo'

export default function WorkflowDetailPage() {
  const params = useParams()
  const navigate = useNavigate()
  const workflow = params.workflowId ? getWorkflowBySlug(params.workflowId) : undefined
  const [isCopying, setIsCopying] = useState(false)

  if (!workflow) {
    return (
      <main className="detail-shell detail-shell-empty">
        <div className="detail-empty-card">
          <p className="eyebrow">Workflow Missing</p>
          <h1>这个工作流详情页还没有准备好</h1>
          <Link to="/" className="primary-button">
            返回首页
          </Link>
        </div>
      </main>
    )
  }

  const currentWorkflow = workflow
  const relatedVideos = spotlightVideos.filter((video) => video.workflowId === workflow.id).slice(0, 3)
  const creator = getCreatorByName(workflow.authorName)

  async function handleCopy() {
    if (isCopying) {
      return
    }

    setIsCopying(true)

    try {
      const result = await startMockWorkflowCopy(currentWorkflow.id)

      startTransition(() => {
        navigate(result.openUrl)
      })
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <div className="detail-shell workflow-detail-shell">
      <div className="page-noise" />

      <header className="detail-topbar">
        <Link to="/" className="detail-backlink">
          返回社区首页
        </Link>
        <div className="detail-top-actions">
          <Link to={`/canvas/${workflow.defaultRuntimeId}`} className="ghost-button">
            {workflow.canvasLabel}
          </Link>
          <button className="primary-button" type="button" onClick={handleCopy} disabled={isCopying}>
            {isCopying ? '正在创建副本...' : workflow.copyLabel}
          </button>
        </div>
      </header>

      <main className="detail-main workflow-detail-main">
        <section className="workflow-hero">
          <article className="workflow-hero-copy detail-summary-panel">
            <span className="workflow-status">{workflow.status}</span>
            <h1>{workflow.title}</h1>
            <p className="detail-lead">{workflow.summary}</p>
            <p className="detail-discussion">{workflow.description}</p>

            <div className="detail-tag-row">
              {workflow.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>

            <div className="detail-stats-row">
              {workflow.stats.map((stat) => (
                <div key={stat} className="detail-stat-pill">
                  {stat}
                </div>
              ))}
            </div>

            <div className="workflow-bestfor">
              {workflow.bestFor.map((item) => (
                <div key={item} className="workflow-bestfor-card">
                  <strong>{item}</strong>
                </div>
              ))}
            </div>
          </article>

          <aside className="workflow-side-panel">
            <div className="workflow-side-card">
              <p className="eyebrow">Author Signal</p>
              <h2>{workflow.authorName}</h2>
              <p>{workflow.authorRole}</p>
              {creator ? (
                <Link className="detail-inline-link" to={`/creators/${creator.slug}`}>
                  查看作者主页
                </Link>
              ) : null}
            </div>

            <div className="workflow-side-card workflow-side-card-accent">
              <p className="eyebrow">Copy Runtime</p>
              <h2>先秒开结构，再按视口补素材</h2>
              <p>点击复制后，前端先进入一份新的 runtime 副本。首屏只消费 light snapshot，缩略图、poster 和少量 preview 再随着视口继续请求。</p>
            </div>
          </aside>
        </section>

        <section className="workflow-detail-grid">
          <article className="detail-block">
            <p className="eyebrow">Stage Breakdown</p>
            <h2>这条工作流是怎么被拆开的</h2>
            <div className="workflow-stage-list">
              {workflow.featuredStages.map((stage) => (
                <div key={stage.id} className="workflow-stage-card">
                  <span>{stage.signal}</span>
                  <h3>{stage.title}</h3>
                  <p>{stage.summary}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="detail-block">
            <p className="eyebrow">Node Signals</p>
            <h2>复制后首批会被看见的节点</h2>
            <div className="workflow-node-signal-grid">
              {workflow.featuredNodes.map((node) => (
                <div key={node.id} className="workflow-node-signal-card">
                  <span>{node.badge}</span>
                  <h3>{node.title}</h3>
                  <p>{node.summary}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="content-section detail-related-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Linked Videos</p>
              <h2>从工作流回看成片，确认方法怎样落到结果</h2>
            </div>
            <p className="section-text">
              工作流不是附件，所以详情页要反向把成片带回来。这样用户才会理解“作品、方法、作者”三条线在社区里怎样接起来。
            </p>
          </div>

          <div className="related-grid">
            {relatedVideos.map((item) => (
              <article key={item.id} className="related-card">
                <HoverVideo src={item.video} title={item.title} className="related-video" />
                <div className="related-body">
                  <span className="video-category">{item.category}</span>
                  <h3>{item.title}</h3>
                  <p>{item.note}</p>
                  <Link to={`/videos/${item.slug}`}>查看作品详情</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
