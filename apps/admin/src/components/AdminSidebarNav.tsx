"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminNavGroup } from "@/lib/admin-nav";
import styles from "./AdminShell.module.css";

type AdminSidebarNavProps = {
  groups: readonly AdminNavGroup[];
};

function NavIcon({ href }: { href: string }) {
  if (href === "/dashboard") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M3.75 10.5L10 5l6.25 5.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        <path d="M5.75 9.25v5h8.5v-5" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    );
  }

  if (href === "/users") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <circle cx="10" cy="6.25" r="2.75" stroke="currentColor" strokeWidth="1.7" />
        <path d="M5 15.25c.64-2.18 2.54-3.5 5-3.5s4.36 1.32 5 3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      </svg>
    );
  }

  if (href === "/moderation") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M10 3.75l5 1.5v4.1c0 3.06-2.1 5.87-5 6.9-2.9-1.03-5-3.84-5-6.9v-4.1l5-1.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    );
  }

  if (href === "/reports") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M5 4.25v11.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        <path d="M5.5 4.75h7l-1.8 3 1.8 3h-7" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    );
  }

  if (href === "/comments") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M10 4c-3.45 0-6.25 2.2-6.25 4.92 0 1.44.8 2.73 2.09 3.63l-.59 2.45 2.74-1.3c.64.14 1.31.22 2.01.22 3.45 0 6.25-2.2 6.25-4.92C16.25 6.2 13.45 4 10 4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    );
  }

  if (href.startsWith("/feed-ops")) {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M4.75 7.5h10.5M4.75 12.5h10.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        <circle cx="7.25" cy="7.5" fill="currentColor" r="1.25" />
        <circle cx="12.75" cy="12.5" fill="currentColor" r="1.25" />
      </svg>
    );
  }

  if (href === "/taxonomy") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <rect height="4.5" rx="1" stroke="currentColor" strokeWidth="1.7" width="4.5" x="4.25" y="4.25" />
        <rect height="4.5" rx="1" stroke="currentColor" strokeWidth="1.7" width="4.5" x="11.25" y="4.25" />
        <rect height="4.5" rx="1" stroke="currentColor" strokeWidth="1.7" width="4.5" x="4.25" y="11.25" />
        <rect height="4.5" rx="1" stroke="currentColor" strokeWidth="1.7" width="4.5" x="11.25" y="11.25" />
      </svg>
    );
  }

  if (href === "/media-tasks") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <rect height="9" rx="1.5" stroke="currentColor" strokeWidth="1.7" width="11" x="4.5" y="5.5" />
        <path d="M8.5 8l3.5 2-3.5 2V8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M5.25 4.75h9.5M5.25 9.75h9.5M5.25 14.75h9.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <circle cx="4.75" cy="4.75" fill="currentColor" r="1" />
      <circle cx="4.75" cy="9.75" fill="currentColor" r="1" />
      <circle cx="4.75" cy="14.75" fill="currentColor" r="1" />
    </svg>
  );
}

function isItemActive(pathname: string, href: string) {
  if (pathname === href) {
    return true;
  }

  return pathname.startsWith(`${href}/`);
}

export function AdminSidebarNav({ groups }: AdminSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {groups.map((group) => (
        <section key={group.title} className={styles.navGroup}>
          <div className={styles.navGroupTitle}>{group.title}</div>
          <div className={styles.navGroupItems}>
            {group.items.map((item) => {
              const active = isItemActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                  href={item.href}
                  title={item.note}
                >
                  <span className={styles.navIcon}>
                    <NavIcon href={item.href} />
                  </span>
                  <span className={styles.navItemLabel}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}
