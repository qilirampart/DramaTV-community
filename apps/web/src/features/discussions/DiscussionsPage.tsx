"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { PageShell } from "@/components/shared/PageShell";
import type { DiscussionHubPageView, DiscussionThreadCardView } from "@/lib/contracts/view-models";
import {
  formatDiscussionDisplayExcerpt,
  formatDiscussionDisplayTag,
  formatDiscussionDisplayTitle,
  normalizeAssetUrl,
  normalizeText
} from "@/lib/presentation";
import { buildBackAnchorSource, buildCurrentRoute, createBackAnchorId, useBackAnchorRestore } from "@/lib/routes/back-anchor";
import { appendBackSource } from "@/lib/routes/redirect-utils";

type DiscussionsPageProps = {
  view: DiscussionHubPageView;
  requestedChannelSlug?: string;
};

type SidebarCategory = {
  id: string;
  label: string;
  href: string;
  description: string;
  active: boolean;
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

type DiscussionThreadStreamProps = {
  currentRoute: string;
  threads: DiscussionThreadCardView[];
  className: string;
};

const PINNED_THREAD_LABEL = "置顶讨论";

function getAvatarFallback(name?: string) {
  return normalizeText(name)?.charAt(0).toUpperCase() ?? "D";
}

function formatCount(value: number) {
  return value.toLocaleString("zh-CN");
}

function formatTopicLabel(value?: string) {
  const display = formatDiscussionDisplayTag(value) ?? formatDiscussionDisplayTitle(value) ?? normalizeText(value);
  if (!display) {
    return "\u7075\u611f\u5171\u521b";
  }

  return display.length > 8 ? `${display.slice(0, 8)}\u2026` : display;
}

function buildSidebarCategories(
  channels: DiscussionHubPageView["channels"],
  requestedChannelSlug?: string
): SidebarCategory[] {
  return [
    {
      id: "all",
      label: "\u5168\u90e8",
      href: "/discussions",
      description: "\u6d4f\u89c8\u5168\u90e8\u8ba8\u8bba",
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
      metaLabel: `${count} \u6761\u8ba8\u8bba`
    }));

  if (dynamicTopics.length > 0) {
    return dynamicTopics;
  }

  return [
    {
      id: "empty-topics",
      label: "# \u7b49\u4f60\u6765\u5b9a\u4e49",
      metaLabel: "\u9996\u6279\u9ad8\u8d28\u91cf\u8ba8\u8bba\u4f1a\u6c89\u6dc0\u5230\u8fd9\u91cc"
    }
  ];
}

function buildContributors(threads: DiscussionHubPageView["featuredThreads"], threadCount: number): ContributorCard[] {
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

  for (const thread of threads) {
    const current = aggregate.get(thread.author.id);
    if (current) {
      current.count += 1;
      continue;
    }

    aggregate.set(thread.author.id, {
      id: thread.author.id,
      name: thread.author.displayName,
      role: "\u8ba8\u8bba\u53d1\u8d77\u8005",
      avatarUrl: thread.author.avatarUrl,
      href: thread.author.href,
      count: 1
    });
  }

  const contributors = Array.from(aggregate.values())
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      name: item.name,
      role: `${item.count} \u6761\u8ba8\u8bba`,
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
      name: "\u793e\u533a\u5148\u884c\u8005",
      role: `${threadCount} \u6761\u8ba8\u8bba\u6b63\u5728\u642d\u5efa\u4e2d`,
      avatarFallback: "\u793e",
      badge: "1"
    },
    {
      id: "placeholder-2",
      name: "Prompt Scout",
      role: "\u7b49\u5f85\u7b2c\u4e00\u6279\u7ecf\u9a8c\u6c89\u6dc0",
      avatarFallback: "P",
      badge: "1"
    },
    {
      id: "placeholder-3",
      name: "Workflow Archivist",
      role: "\u7b49\u5f85\u7b2c\u4e00\u6279\u65b9\u6cd5\u6574\u7406",
      avatarFallback: "W",
      badge: "1"
    }
  ];
}

function DiscussionThreadStream({ threads, className, currentRoute }: DiscussionThreadStreamProps) {
  return (
    <section className={className}>
      {threads.length > 0 ? (
        threads.map((thread, index) => {
          const threadAuthorAvatarUrl = normalizeAssetUrl(thread.author.avatarUrl);
          const excerpt =
            formatDiscussionDisplayExcerpt(thread.excerpt) ??
            "\u56f4\u7ed5\u521b\u4f5c\u65b9\u6cd5\u3001\u63d0\u793a\u8bcd\u62c6\u89e3\u4e0e\u5b9e\u6218\u7ecf\u9a8c\u5c55\u5f00\u66f4\u5b8c\u6574\u7684\u8ba8\u8bba\u3002";
          const bindingLabel = thread.binding?.label ?? "\u72ec\u7acb\u5e16\u5b50";
          const anchorId = createBackAnchorId("discussion-thread", thread.id);

          return (
            <article className="discussion-replica-thread-card" id={anchorId} key={`${className}-${thread.id}`}>
              <Link
                aria-label={formatDiscussionDisplayTitle(thread.title) ?? thread.title}
                className="discussion-replica-thread-overlay"
                href={appendBackSource(thread.href, buildBackAnchorSource(currentRoute, anchorId))}
              />

              <div className="discussion-replica-thread-body">
                <div className="discussion-replica-thread-head">
                  <span className="discussion-replica-thread-chip">{thread.channelTitle}</span>
                  {index === 0 ? <span className="discussion-replica-thread-pin">{PINNED_THREAD_LABEL}</span> : null}
                  <span className="discussion-replica-thread-time">{thread.publishedAtLabel}</span>
                </div>

                <h2 className="discussion-replica-thread-title">
                  {formatDiscussionDisplayTitle(thread.title) ?? thread.title}
                </h2>
                <p className="discussion-replica-thread-excerpt">{excerpt}</p>

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
                        {getAvatarFallback(thread.author.displayName)}
                      </span>
                    )}
                  </span>

                  <div className="discussion-replica-thread-author-copy">
                    <strong>{thread.author.displayName}</strong>
                    <span>{bindingLabel}</span>
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
        <div className="discussion-replica-empty">
          {"\u8fd8\u6ca1\u6709\u8ba8\u8bba\u5185\u5bb9\uff0c\u7b2c\u4e00\u6279\u53d1\u8d77\u7684\u5e16\u5b50\u4f1a\u5c55\u793a\u5728\u8fd9\u91cc\u3002"}
        </div>
      )}
    </section>
  );
}

export function DiscussionsPage({ view, requestedChannelSlug }: DiscussionsPageProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const visibleThreadCount = view.featuredThreads.length;
  const categories = buildSidebarCategories(view.channels, requestedChannelSlug);
  const trendingTopics = buildTrendingTopics(view);
  const contributors = buildContributors(view.featuredThreads, visibleThreadCount);
  const currentRoute = buildCurrentRoute(pathname, searchParams);
  const composerHref = requestedChannelSlug
    ? `/discussions/new?channel=${encodeURIComponent(requestedChannelSlug)}`
    : "/discussions/new";

  useBackAnchorRestore([view.featuredThreads.length, contributors.length]);

  return (
    <PageShell showHomeFloatingDock topNavActive="community" variant="home">
      <div className="discussion-replica-page">
        <div className="discussion-replica-layout">
          <aside className="discussion-replica-sidebar">
            <div className="discussion-replica-sidebar-block">
              <span className="discussion-replica-caption">{"\u8bdd\u9898\u680f\u76ee"}</span>
              <nav className="discussion-replica-category-list">
                {categories.map((category) => (
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
                ))}
              </nav>
            </div>

            <section className="discussion-replica-rules-card">
              <h3>{"\u793e\u533a\u8ba8\u8bba\u89c4\u5219"}</h3>
              <p>
                {
                  "\u56f4\u7ed5\u63d0\u793a\u8bcd\u3001\u5de5\u4f5c\u6d41\u3001\u753b\u9762\u62c6\u89e3\u548c\u521b\u4f5c\u7ecf\u9a8c\u5c55\u5f00\u8ba8\u8bba\uff0c\u95ee\u9898\u5c3d\u91cf\u5177\u4f53\uff0c\u8868\u8fbe\u5c3d\u91cf\u514b\u5236\uff0c\u8ba9\u771f\u6b63\u6709\u4ef7\u503c\u7684\u65b9\u6cd5\u6c89\u6dc0\u4e0b\u6765\u3002"
                }
              </p>
              <div className="discussion-replica-divider" />
              <div className="discussion-replica-rule-stats">
                <div>
                  <span>{"\u680f\u76ee\u6570"}</span>
                  <strong>{formatCount(view.channels.length)}</strong>
                </div>
                <div>
                  <span>{"\u8ba8\u8bba\u6570"}</span>
                  <strong>{formatCount(visibleThreadCount)}</strong>
                </div>
              </div>
            </section>
          </aside>

          <div className="discussion-replica-content-shell">
            <main className="discussion-replica-main">
              <header className="discussion-replica-hero">
                <div>
                  <h1>{"\u8d85\u80fd\u793e\u533a"}</h1>
                  <p>
                    {
                      "\u56f4\u7ed5\u521b\u4f5c\u65b9\u6cd5\u3001\u63d0\u793a\u8bcd\u62c6\u89e3\u3001\u5de5\u4f5c\u6d41\u5b9e\u6218\u53d1\u8d77\u8ba8\u8bba\u3002"
                    }
                  </p>
                </div>
                <Link className="discussion-replica-cta" href={composerHref}>
                  {"\u53d1\u8d77\u8ba8\u8bba"}
                </Link>
              </header>
            </main>

            <DiscussionThreadStream className="discussion-replica-thread-stream" currentRoute={currentRoute} threads={view.featuredThreads} />
          </div>

          <aside className="discussion-replica-rail">
            <section className="discussion-replica-rail-block">
              <span className="discussion-replica-caption">{"\u70ed\u95e8\u8bdd\u9898"}</span>
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
              <span className="discussion-replica-caption">{"\u6d3b\u8dc3\u8d21\u732e\u8005"}</span>
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
                    <Link
                      className="discussion-replica-contributor-row"
                      href={appendBackSource(
                        contributor.href,
                        buildBackAnchorSource(currentRoute, createBackAnchorId("discussion-contributor", contributor.id))
                      )}
                      id={createBackAnchorId("discussion-contributor", contributor.id)}
                      key={contributor.id}
                    >
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
