import type { ReactNode } from "react";
import { normalizeAssetUrl, normalizeText } from "@/lib/presentation";

type CreatorHeaderProps = {
  profile: {
    displayName: string;
    avatarUrl?: string;
    headline?: string;
    bio?: string;
  };
  stats: {
    videoCount: number;
    workflowCount: number;
    followerCount: number;
  };
  actions?: ReactNode;
  notice?: ReactNode;
};

function getAvatarFallback(name: string) {
  return name.trim().charAt(0) || "创";
}

export function CreatorHeader({ profile, stats, actions, notice }: CreatorHeaderProps) {
  const avatarUrl = normalizeAssetUrl(profile.avatarUrl);
  const displayName = normalizeText(profile.displayName) ?? "匿名创作者";
  const headline = normalizeText(profile.headline);
  const bio = normalizeText(profile.bio);
  const summary = headline ?? bio ?? "发布作品与工作流";
  const secondaryLine = headline && bio && bio !== headline ? bio : undefined;

  return (
    <div className="glass-panel creator-header">
      <span
        className="creator-avatar"
        style={avatarUrl ? { backgroundImage: `url(${avatarUrl})`, backgroundSize: "cover" } : undefined}
      >
        {avatarUrl ? null : <span className="creator-avatar-fallback">{getAvatarFallback(displayName)}</span>}
      </span>

      <div className="creator-header-main">
        <div className="creator-header-copy">
          <h1 className="section-title creator-name">{displayName}</h1>
          <p className="creator-header-summary">{summary}</p>
          {secondaryLine ? <p className="muted creator-header-bio">{secondaryLine}</p> : null}
        </div>

        <div className="stats-row creator-stat-row">
          <span className="meta-pill">{stats.videoCount} 个作品</span>
          <span className="meta-pill">{stats.workflowCount} 个工作流</span>
          <span className="meta-pill">{stats.followerCount.toLocaleString("zh-CN")} 位关注者</span>
        </div>
      </div>

      {actions || notice ? (
        <div className="creator-header-toolbar">
          {actions ? <div className="creator-header-actions">{actions}</div> : null}
          {notice ? <div className="creator-header-notice">{notice}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
