import type { ReactNode } from "react";
import { signOutAction } from "@/app/auth-actions";
import type { AdminSession } from "@/lib/admin-auth";
import { getVisibleNavGroups } from "@/lib/admin-nav";
import { AdminSidebarNav } from "./AdminSidebarNav";
import styles from "./AdminShell.module.css";

type AdminShellProps = {
  session: AdminSession;
  children: ReactNode;
};

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 20 20" width="18">
      <circle cx="9" cy="9" r="5.75" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 20 20" width="18">
      <path
        d="M10 3.25A3.75 3.75 0 0 0 6.25 7v1.15c0 .8-.23 1.58-.66 2.26l-.77 1.19a1 1 0 0 0 .84 1.55h8.68a1 1 0 0 0 .84-1.55l-.77-1.19a4.13 4.13 0 0 1-.66-2.26V7A3.75 3.75 0 0 0 10 3.25Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path d="M8 15.25a2 2 0 0 0 4 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 20 20" width="16">
      <path d="M5.5 7.75L10 12.25l4.5-4.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

export function AdminShell({ session, children }: AdminShellProps) {
  const navGroups = getVisibleNavGroups(session.role);
  const avatarLetter = (session.displayName || session.username).slice(0, 1).toUpperCase();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <div className={styles.brandMark}>D</div>
          <div className={styles.brandText}>
            <strong className={styles.brandTitle}>DramaTV</strong>
            <span className={styles.brandSub}>社区后台</span>
          </div>
        </div>

        <AdminSidebarNav groups={navGroups} />

        <div className={styles.sidebarFooter}>© 2026 DramaTV</div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <label className={styles.searchShell}>
            <span className={styles.searchIcon}>
              <SearchIcon />
            </span>
            <input className={styles.searchInput} placeholder="搜索内容、用户、工单..." type="search" />
            <span className={styles.searchShortcut}>⌘ K</span>
          </label>

          <div className={styles.topbarSide}>
            <span className={styles.environmentBadge}>
              <span className={styles.environmentDot} />
              测试环境
            </span>

            <button aria-label="查看通知" className={styles.iconButton} type="button">
              <BellIcon />
              <span className={styles.iconBadge}>8</span>
            </button>

            <div className={styles.accountBlock}>
              <div className={styles.avatar}>{avatarLetter}</div>
              <div className={styles.accountText}>
                <strong>{session.username}</strong>
                <span>{session.roleLabel}</span>
              </div>
              <span className={styles.accountChevron}>
                <ChevronDownIcon />
              </span>
            </div>

            <form action={signOutAction}>
              <button className={styles.logoutButton} type="submit">
                退出
              </button>
            </form>
          </div>
        </header>

        <main className={styles.workspaceContent}>{children}</main>
      </div>
    </div>
  );
}
