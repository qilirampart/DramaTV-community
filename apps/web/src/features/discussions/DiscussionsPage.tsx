import Link from "next/link";
import { PageShell } from "@/components/shared/PageShell";
import type { DiscussionHubPageView } from "@/lib/contracts/view-models";
import {
  formatDiscussionDisplayExcerpt,
  formatDiscussionDisplayTag,
  formatDiscussionDisplayTitle,
  normalizeAssetUrl,
  normalizeText
} from "@/lib/presentation";

type DiscussionAuthorMeta = {
  slug: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    href: string;
  };
  publishedAtLabel: string;
};

type DiscussionsPageProps = {
  view: DiscussionHubPageView;
  requestedChannelSlug?: string;
  authorMeta: DiscussionAuthorMeta[];
};

type SidebarCategory = {
  id: string;
  label: string;
  href?: string;
  description: string;
  active: boolean;
  placeholder?: boolean;
};

type TrendingTopic = {
  id: string;
  label: string;
  metaLabel: string;
};

type ContributorCard = {
  id: string;
  name: string;
  role: string;
  avatarFallback: string;
  href?: string;
  avatarUrl?: string;
  badge: string;
};

function FlashIcon() {
  return (
    <svg aria-hidden="true" className="discussion-replica-topic-icon-svg" fill="none" viewBox="0 0 24 24">
      <path
        d="M13.5 3.5 6.8 13.1h4L10.5 20.5l6.7-9.6h-4.1L13.5 3.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function BubbleIcon() {
  return (
    <svg aria-hidden="true" className="discussion-replica-topic-icon-svg" fill="none" viewBox="0 0 24 24">
      <path
        d="M6.5 7.5a3 3 0 0 1 3-3h5a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-2.2l-3.5 2.6v-2.6H9.5a3 3 0 0 1-3-3v-4Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" className="discussion-replica-topic-icon-svg" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="8.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6.4 18.4A6.6 6.6 0 0 1 12 15.4a6.6 6.6 0 0 1 5.6 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function getAvatarFallback(name?: string) {
  return normalizeText(name)?.charAt(0).toUpperCase() ?? "D";
}

function formatCount(value: number) {
  return value.toLocaleString("zh-CN");
}

function formatTopicLabel(value?: string) {
  const display = formatDiscussionDisplayTag(value) ?? formatDiscussionDisplayTitle(value) ?? normalizeText(value);
  if (!display) {
    return "讨论精选";
  }

  return display.length > 8 ? `${display.slice(0, 8)}…` : display;
}

function buildSidebarCategories(
  channels: DiscussionHubPageView["channels"],
  requestedChannelSlug?: string
): SidebarCategory[] {
  const primaryCategories = [
    {
      id: "all",
      label: "全部",
      href: "/discussions",
      description: "查看全部讨论",
      active: !requestedChannelSlug
    },
    ...channels.map((channel) => ({
      id: channel.slug,
      label: channel.title,
      href: channel.href,
      description: channel.description,
      active: channel.slug === requestedChannelSlug
    }))
  ];

  const placeholderCategories: SidebarCategory[] = [
    {
      id: "official-placeholder",
      label: "官方动态",
      description: "前端占位，后续补齐频道数据",
      active: false,
      placeholder: true
    },
    {
      id: "chat-placeholder",
      label: "闲聊广场",
      description: "前端占位，后续补齐频道数据",
      active: false,
      placeholder: true
    }
  ];

  return [...primaryCategories, ...placeholderCategories].slice(0, 6);
}

function buildTrendingTopics(view: DiscussionHubPageView): TrendingTopic[] {
  const tagFrequency = new Map<string, number>();

  for (const thread of view.featuredThreads) {
    if (thread.tags.length === 0) {
      const fallback = formatTopicLabel(thread.title);
      tagFrequency.set(fallback, (tagFrequency.get(fallback) ?? 0) + 1);
      continue;
    }

    for (const tag of thread.tags) {
      const normalized = normalizeText(tag);
      if (!normalized) {
        continue;
      }

      const label = formatTopicLabel(normalized);
      tagFrequency.set(label, (tagFrequency.get(label) ?? 0) + 1);
    }
  }

  const dynamicTopics = Array.from(tagFrequency.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map(([tag, count]) => ({
      id: `trend-${tag}`,
      label: `# ${tag}`,
      metaLabel: `${count} 个可见讨论命中`
    }));

  if (dynamicTopics.length > 0) {
    return dynamicTopics;
  }

  return [
    {
      id: "empty-topics",
      label: "# 热门话题待累积",
      metaLabel: "真实讨论数据积累后，这里再展示实际热度"
    }
  ];
}

function buildContributors(authorMeta: DiscussionAuthorMeta[], threadCount: number): ContributorCard[] {
  const aggregate = new Map<
    string,
    {
      id: string;
      name: string;
      role: string;
      avatarUrl?: string;
      href?: string;
      count: number;
    }
  >();

  for (const item of authorMeta ?? []) {
    const current = aggregate.get(item.author.id);
    if (current) {
      current.count += 1;
      continue;
    }

    aggregate.set(item.author.id, {
      id: item.author.id,
      name: item.author.displayName,
      role: "讨论作者",
      avatarUrl: item.author.avatarUrl,
      href: item.author.href,
      count: 1
    });
  }

  const contributors = Array.from(aggregate.values())
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      name: item.name,
      role: item.role,
      avatarUrl: item.avatarUrl,
      href: item.href,
      avatarFallback: getAvatarFallback(item.name),
      badge: String(item.count)
    }));

  if (contributors.length > 0) {
    return contributors;
  }

  return [
    {
      id: "placeholder-1",
      name: "Community Pilot",
      role: `${threadCount} 条讨论已接入`,
      avatarFallback: "C",
      badge: "1"
    },
    {
      id: "placeholder-2",
      name: "Prompt Scout",
      role: "作者数据占位中",
      avatarFallback: "P",
      badge: "1"
    },
    {
      id: "placeholder-3",
      name: "Workflow Archivist",
      role: "等待作者接口补齐",
      avatarFallback: "W",
      badge: "1"
    }
  ];
}

function resolveThreadIcon(index: number) {
  if (index % 3 === 0) {
    return <FlashIcon />;
  }

  if (index % 3 === 1) {
    return <BubbleIcon />;
  }

  return <UserIcon />;
}

function resolveAuthorMeta(authorMeta: DiscussionAuthorMeta[], slug: string) {
  return authorMeta.find((item) => item.slug === slug);
}

export function DiscussionsPage({ view, requestedChannelSlug, authorMeta }: DiscussionsPageProps) {
  const visibleThreadCount = view.featuredThreads.length;
  const categories = buildSidebarCategories(view.channels, requestedChannelSlug);
  const featuredTopics = view.featuredThreads.slice(0, 3);
  const trendingTopics = buildTrendingTopics(view);
  const contributors = buildContributors(authorMeta, visibleThreadCount);

  return (
    <PageShell showHomeFloatingDock topNavActive="community" variant="home">
      <div className="discussion-replica-page">
        <div className="discussion-replica-layout">
          <aside className="discussion-replica-sidebar">
            <div className="discussion-replica-sidebar-block">
              <span className="discussion-replica-caption">板块分类</span>
              <nav className="discussion-replica-category-list">
                {categories.map((category) =>
                  category.href ? (
                    <Link
                      className={`discussion-replica-category-link${
                        category.active ? " discussion-replica-category-link-active" : ""
                      }`}
                      href={category.href}
                      key={category.id}
                      title={category.description}
                    >
                      <span>{category.label}</span>
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="discussion-replica-category-link discussion-replica-category-link-placeholder"
                      key={category.id}
                      title={category.description}
                    >
                      <span>{category.label}</span>
                    </span>
                  )
                )}
              </nav>
            </div>

            <section className="discussion-replica-rules-card">
              <h3>社区准则</h3>
              <p>先把讨论区的视觉壳子复刻出来。当前这一版以前端展示对齐为主，后续再继续补齐频道、作者和发帖能力。</p>
              <div className="discussion-replica-divider" />
              <div className="discussion-replica-rule-stats">
                <div>
                  <span>频道数</span>
                  <strong>{formatCount(view.channels.length)}</strong>
                </div>
                <div>
                  <span>可见话题</span>
                  <strong>{formatCount(visibleThreadCount)}</strong>
                </div>
              </div>
            </section>
          </aside>

          <main className="discussion-replica-main">
            <header className="discussion-replica-hero">
              <div>
                <h1>超能社区</h1>
                <p>与全球 50,000+ 创作者交流灵感</p>
              </div>
              <Link className="discussion-replica-cta" href="/discussions/new">
                发起讨论
              </Link>
            </header>

            <section className="discussion-replica-topic-grid">
              {featuredTopics.length > 0 ? (
                featuredTopics.map((thread, index) => (
                  <Link className="discussion-replica-topic-card" href={thread.href} key={thread.id}>
                    <div className="discussion-replica-topic-card-head">
                      <span className="discussion-replica-topic-icon">{resolveThreadIcon(index)}</span>
                      <span className="discussion-replica-topic-kind">{thread.channelTitle}</span>
                    </div>
                    <strong className="discussion-replica-topic-title">
                      {formatDiscussionDisplayTitle(thread.title) ?? thread.title}
                    </strong>
                    <span className="discussion-replica-topic-meta">{thread.replyCountLabel}</span>
                  </Link>
                ))
              ) : (
                <div className="discussion-replica-empty">讨论区还没有可展示的话题卡片。</div>
              )}
            </section>

            <section className="discussion-replica-thread-stream">
              {view.featuredThreads.length > 0 ? (
                view.featuredThreads.map((thread, index) => {
                  const meta = resolveAuthorMeta(authorMeta, thread.slug);
                  const threadAuthorAvatarUrl = normalizeAssetUrl(meta?.author.avatarUrl);

                  return (
                    <article className="discussion-replica-thread-card" key={thread.id}>
                      <Link
                        aria-label={formatDiscussionDisplayTitle(thread.title) ?? thread.title}
                        className="discussion-replica-thread-overlay"
                        href={thread.href}
                      />

                      <div className="discussion-replica-thread-body">
                        <div className="discussion-replica-thread-head">
                          <span className="discussion-replica-thread-chip">{thread.channelTitle}</span>
                          {index === 0 ? <span className="discussion-replica-thread-pin">置顶视觉位</span> : null}
                          <span className="discussion-replica-thread-time">
                            {meta?.publishedAtLabel ?? thread.lastActivityLabel}
                          </span>
                        </div>

                        <h2 className="discussion-replica-thread-title">
                          {formatDiscussionDisplayTitle(thread.title) ?? thread.title}
                        </h2>
                        <p className="discussion-replica-thread-excerpt">
                          {formatDiscussionDisplayExcerpt(thread.excerpt) ??
                            "帖子摘要暂未补齐，后续会在接口对接时继续完善。"}
                        </p>

                        {thread.tags.length > 0 ? (
                          <div className="discussion-replica-thread-tags">
                            {thread.tags.map((tag) => (
                              <span className="discussion-replica-thread-tag" key={`${thread.id}-${tag}`}>
                                #{formatDiscussionDisplayTag(tag) ?? tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="discussion-replica-thread-side">
                        <div className="discussion-replica-thread-author">
                          <span className="discussion-replica-thread-author-avatar">
                            {threadAuthorAvatarUrl ? (
                              <span
                                className="discussion-replica-thread-author-avatar-image"
                                style={{ backgroundImage: `url(${threadAuthorAvatarUrl})` }}
                              />
                            ) : (
                              <span className="discussion-replica-thread-author-avatar-fallback">
                                {getAvatarFallback(meta?.author.displayName)}
                              </span>
                            )}
                          </span>
                          <div className="discussion-replica-thread-author-copy">
                            <strong>{meta?.author.displayName ?? "讨论作者"}</strong>
                            <span>{thread.binding ? "已绑定内容对象" : "独立话题"}</span>
                          </div>
                        </div>

                        <div className="discussion-replica-thread-stats">
                          <span>{thread.replyCountLabel}</span>
                          <span>{thread.likeCountLabel}</span>
                          <span>{thread.favoriteCountLabel}</span>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="discussion-replica-empty">当前筛选条件下没有可展示的讨论。</div>
              )}
            </section>
          </main>

          <aside className="discussion-replica-rail">
            <section className="discussion-replica-rail-block">
              <span className="discussion-replica-caption">热门话题</span>
              <div className="discussion-replica-trend-list">
                {trendingTopics.map((topic) => (
                  <div className="discussion-replica-trend-row" key={topic.id}>
                    <div>
                      <strong>{topic.label}</strong>
                      <span>{topic.metaLabel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="discussion-replica-rail-block">
              <span className="discussion-replica-caption">活跃贡献者</span>
              <div className="discussion-replica-contributor-list">
                {contributors.map((contributor) => {
                  const contributorAvatarUrl = normalizeAssetUrl(contributor.avatarUrl);
                  const content = (
                    <>
                      <span className="discussion-replica-contributor-avatar">
                        {contributorAvatarUrl ? (
                          <span
                            className="discussion-replica-contributor-avatar-image"
                            style={{ backgroundImage: `url(${contributorAvatarUrl})` }}
                          />
                        ) : (
                          <span className="discussion-replica-contributor-avatar-fallback">
                            {contributor.avatarFallback}
                          </span>
                        )}
                        <span className="discussion-replica-contributor-badge">{contributor.badge}</span>
                      </span>
                      <span className="discussion-replica-contributor-copy">
                        <strong>{contributor.name}</strong>
                        <span>{contributor.role}</span>
                      </span>
                    </>
                  );

                  return contributor.href ? (
                    <Link className="discussion-replica-contributor-row" href={contributor.href} key={contributor.id}>
                      {content}
                    </Link>
                  ) : (
                    <div className="discussion-replica-contributor-row" key={contributor.id}>
                      {content}
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>

        <div className="discussion-replica-floating-dot" />
      </div>
    </PageShell>
  );
}
