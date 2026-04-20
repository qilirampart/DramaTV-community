"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { PageShell } from "@/components/shared/PageShell";
import { loginAction } from "@/app/(community)/login/actions";
import styles from "./LoginPage.module.css";

type LoginPageProps = {
  redirectTo?: string;
};

function resolveRedirectLabel(redirectTo?: string) {
  switch (redirectTo) {
    case "/publish":
      return "登录后将返回发布页";
    case "/discussions/new":
      return "登录后将返回发帖页";
    case "/me":
      return "登录后将返回个人中心";
    case "/canvas":
      return "登录后将进入画布入口";
    default:
      if (redirectTo?.startsWith("/canvas/")) {
        return "登录后将返回指定画布运行态";
      }

      return "登录后默认进入社区首页";
  }
}

export function LoginPage({ redirectTo }: LoginPageProps) {
  const [username, setUsername] = useState("creator-a");
  const [password, setPassword] = useState("dramatv-local-dev");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const redirectLabel = resolveRedirectLabel(redirectTo);
  const canSubmit = !pending && username.trim().length > 0 && password.trim().length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    startTransition(async () => {
      const result = await loginAction({
        username,
        password,
        redirectTo
      });

      if (!result.ok) {
        setNotice(result.message);
      }
    });
  }

  return (
    <PageShell topNavActive="landing" variant="home">
      <main className={styles.page}>
        <div className={styles.layout}>
          <section className={`hero-panel ${styles.hero}`}>
            <div className={styles.heroCopy}>
              <div className="eyebrow">Community Access</div>
              <h1 className={styles.title}>先接当前社区会话，再平滑切到画布登录。</h1>
              <p className={styles.subtitle}>
                这页不是一次性的临时壳子。现在先用本地账号打通登录态、当前用户和受保护路由，后续接公司画布产品登录时，只替换身份提供方和 token 来源，不重写发布、讨论、个人中心和画布入口这些业务链路。
              </p>
            </div>

            <div className={styles.metricGrid}>
              <article className={styles.metricCard}>
                <strong>游客可浏览</strong>
                <span>首页、精选页、讨论列表保持开放，登录只拦截需要身份的写入和个人能力。</span>
              </article>
              <article className={styles.metricCard}>
                <strong>登录后解锁</strong>
                <span>发布内容、发起讨论、进入个人中心、打开画布入口，都会复用同一套当前用户边界。</span>
              </article>
              <article className={styles.metricCard}>
                <strong>后续可替换</strong>
                <span>数据库已经预留 `identity_provider` 和 `external_subject`，方便对接真实账号体系。</span>
              </article>
            </div>

            <div className={styles.routeCard}>
              <span className={styles.routeLabel}>{redirectLabel}</span>
              <code className={styles.routeValue}>{redirectTo || "/home"}</code>
            </div>

            <div className={styles.quickLinks}>
              <Link className="button-secondary" href="/">
                先浏览首页
              </Link>
              <Link className="button-secondary" href="/">
                先看精选
              </Link>
              <Link className="button-secondary" href="/">
                去社区逛逛
              </Link>
            </div>
          </section>

          <section className={`glass-panel ${styles.panel}`}>
            <div className={styles.panelHeader}>
              <div className="eyebrow">Login</div>
              <h2 className={styles.panelTitle}>进入 DramaTV 社区</h2>
              <p className={styles.panelCopy}>当前用于开发联调。样式和站内一致，但身份源后续会切到画布产品登录。</p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.field}>
                <span className={styles.label}>用户名</span>
                <input
                  autoComplete="username"
                  className={styles.input}
                  disabled={pending}
                  onChange={(event) => setUsername(event.target.value)}
                  type="text"
                  value={username}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>密码</span>
                <input
                  autoComplete="current-password"
                  className={styles.input}
                  disabled={pending}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  value={password}
                />
              </label>

              {notice ? <p className={styles.notice}>{notice}</p> : null}

              <div className={styles.actionRow}>
                <button className="button" disabled={!canSubmit} type="submit">
                  {pending ? "登录中..." : "进入社区"}
                </button>
                <Link className="button-secondary" href="/">
                  暂不登录
                </Link>
              </div>
            </form>

            <div className={styles.devCard}>
              <div className={styles.devHeader}>
                <strong>开发环境测试账号</strong>
                <span>后续会被画布侧登录替换</span>
              </div>

              <div className={styles.devGrid}>
                <div className={styles.devItem}>
                  <span>用户名</span>
                  <code>creator-a</code>
                </div>
                <div className={styles.devItem}>
                  <span>密码</span>
                  <code>dramatv-local-dev</code>
                </div>
              </div>

              <p className={styles.devCopy}>
                如果你现在只是想继续看页面，可以直接走上面的公开浏览入口；只有写入动作和个人态页面才要求登录。
              </p>
            </div>
          </section>
        </div>
      </main>
    </PageShell>
  );
}
