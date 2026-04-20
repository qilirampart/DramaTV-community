import { Link } from 'react-router-dom'
import { getCreatorByName } from '../data/communityData'
import {
  creatorLineup,
  heroStories,
  pulseTopics,
  spotlightVideos,
  workflowDeck,
} from '../data/homepageData'
import HoverVideo from '../shared/HoverVideo'

export default function HomePage() {
  const activeStory = heroStories[0]

  return (
    <div className="page-shell">
      <div className="page-noise" />

      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">DT</div>
          <div>
            <p className="brand-name">DramaTV Community</p>
            <p className="brand-subtitle">AI Video + Workflow Scene</p>
          </div>
        </div>

        <nav className="topnav" aria-label="站点导航">
          <a href="#discover">热映</a>
          <a href="#workflows">工作流</a>
          <a href="#pulse">讨论</a>
          <a href="#creators">创作者</a>
        </nav>

        <div className="top-actions">
          <button className="ghost-button" type="button">
            登录社区
          </button>
          <Link className="primary-button" to="/publish">
            发布作品
          </Link>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Screening Room 01</p>
            <h1>让作品、工作流与讨论在同一张片场地图里发生</h1>
            <p className="hero-text">
              这不是只会滚动播放视频的首页，而是一条从“看成片”回到“看方法”、再回到“看作者”的社区主线。当前阶段先把 PGC
              内容闭环跑通，再把画布联动接深。
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#discover">
                进入推荐流
              </a>
              <a className="secondary-button" href="#workflows">
                浏览工作流广场
              </a>
            </div>

            <div className="signal-strip">
              <div>
                <strong>540+</strong>
                <span>预设作品样片</span>
              </div>
              <div>
                <strong>120</strong>
                <span>公开工作流</span>
              </div>
              <div>
                <strong>18</strong>
                <span>今日讨论主题</span>
              </div>
            </div>
          </div>

          <div className="hero-stage">
            <div className="hero-stage-frame">
              <div className="hero-stage-copy">
                <span className="story-badge">{activeStory.badge}</span>
                <h2>{activeStory.title}</h2>
                <p>{activeStory.subtitle}</p>
                <p className="story-description">{activeStory.description}</p>

                <div className="story-metrics">
                  {activeStory.metrics.map((metric) => (
                    <span key={metric}>{metric}</span>
                  ))}
                </div>
              </div>

              <video
                key={activeStory.id}
                className="hero-video"
                src={activeStory.video}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
              <div className="hero-video-glow" />
            </div>

            <div className="story-selector">
              {heroStories.map((story) => (
                <div
                  key={story.id}
                  className={story.id === activeStory.id ? 'story-chip story-chip-active' : 'story-chip'}
                >
                  <span>{story.badge}</span>
                  <strong>{story.title}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="discover" className="content-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Today In The Feed</p>
              <h2>热映中的片段，不只是被看见，也能被接着做</h2>
            </div>
            <p className="section-text">
              首页优先服务内容发现。作品卡片直接暴露题材、作者和关联工作流信号，帮助用户顺着结果、方法、作者三条线继续往下走。
            </p>
          </div>

          <div className="discover-grid">
            {spotlightVideos.map((entry, index) => (
              <article
                key={entry.id}
                className={index === 0 ? 'video-card video-card-featured' : 'video-card'}
              >
                <HoverVideo src={entry.video} title={entry.title} className="video-surface" />
                <div className="video-overlay" />
                <div className="video-card-body">
                  <span className="video-category">{entry.category}</span>
                  <h3>{entry.title}</h3>
                  <p>{entry.note}</p>
                  <div className="video-card-footer">
                    <span>{entry.author}</span>
                    <Link to={`/videos/${entry.slug}`}>进入详情</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="workflows" className="content-section workflow-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Workflow Corridor</p>
              <h2>把方法做成一级内容对象，而不是埋在幕后</h2>
            </div>
            <p className="section-text">
              每个工作流都应该能独立被浏览、被讨论、被复用。当前可以先作为详情页和画布入口存在，后续再补强复制和派生链路。
            </p>
          </div>

          <div className="workflow-grid">
            {workflowDeck.map((workflow, index) => (
              <article
                key={workflow.id}
                className={index === 1 ? 'workflow-card workflow-card-highlight' : 'workflow-card'}
              >
                <div className="workflow-ruler" />
                <span className="workflow-status">{workflow.status}</span>
                <h3>{workflow.title}</h3>
                <p>{workflow.summary}</p>
                <div className="workflow-tags">
                  {workflow.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="workflow-actions">
                  <Link className="secondary-button" to={`/workflows/${workflow.slug}`}>
                    查看详情
                  </Link>
                  <Link className="ghost-button" to={`/canvas/${workflow.defaultRuntimeId}`}>
                    在画布中打开
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="pulse" className="pulse-section">
          <div className="pulse-board">
            <div className="section-heading section-heading-compact">
              <div>
                <p className="eyebrow">Community Pulse</p>
                <h2>社区不止有作品，还要有正在发酵的方法和争论</h2>
              </div>
            </div>

            <div className="pulse-columns">
              {pulseTopics.map((column) => (
                <div key={column.title} className="pulse-card">
                  <h3>{column.title}</h3>
                  <ul>
                    {column.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <aside className="challenge-banner">
            <span className="challenge-kicker">Open Call</span>
            <h3>本周主题：一镜入戏</h3>
            <p>发布一条 15 秒以内的 AI 视频，并绑定一个公开工作流。优秀作品将进入首页精选，并开放“继续创作”入口。</p>
            <Link className="primary-button" to="/publish">
              参加挑战
            </Link>
          </aside>
        </section>

        <section id="creators" className="content-section creators-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Creator Map</p>
              <h2>把作者也做成一个值得进入的地方</h2>
            </div>
            <p className="section-text">
              作者主页当前已经回到 P0 主线中，它需要同时承接作品、工作流和讨论，而不是只展示一张头像名片。
            </p>
          </div>

          <div className="creator-grid">
            {creatorLineup.map((creator) => (
              <Link
                key={creator.name}
                className="creator-card"
                to={`/creators/${getCreatorByName(creator.name)?.slug ?? 'jing-chuan'}`}
              >
                <div className="creator-avatar">{creator.name.slice(0, 1)}</div>
                <div>
                  <h3>{creator.name}</h3>
                  <span>{creator.role}</span>
                  <p>{creator.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
