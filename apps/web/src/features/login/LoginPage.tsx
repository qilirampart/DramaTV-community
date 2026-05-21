"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { PageShell } from "@/components/shared/PageShell";
import { loginAction } from "@/app/(community)/login/actions";
import type { ApiAuthProviderConfig } from "@/lib/contracts/community-api";
import styles from "./LoginPage.module.css";

type LoginPageProps = {
  redirectTo?: string;
  providerConfig: ApiAuthProviderConfig;
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

export function LoginPage({ redirectTo, providerConfig }: LoginPageProps) {
  const primaryProvider =
    providerConfig.loginProviders.find((provider) => provider.code === providerConfig.primaryProvider) ??
    providerConfig.loginProviders.find((provider) => provider.enabled) ??
    providerConfig.loginProviders[0];
  const [username, setUsername] = useState("creator-a");
  const [password, setPassword] = useState("dramatv-local-dev");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const redirectLabel = resolveRedirectLabel(redirectTo);
  const canSubmit =
    Boolean(primaryProvider?.enabled) &&
    !pending &&
    username.trim().length > 0 &&
    password.trim().length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    startTransition(async () => {
      const result = await loginAction({
        loginType: primaryProvider?.code,
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
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.eyebrow}>Login</div>
            <h1 className={styles.panelTitle}>进入 DramaTV 社区</h1>
            <p className={styles.panelCopy}>当前用于开发联调。身份源后续会切到画布产品登录，社区页面和交互链路保持不变。</p>
            <p className={styles.redirectHint}>{redirectLabel}</p>
          </div>

          {primaryProvider ? (
            <section className={styles.providerCard} aria-label="当前登录方式">
              <div className={styles.providerHeader}>
                <strong>{primaryProvider.displayName}</strong>
                <span>{primaryProvider.enabled ? "当前可用" : "暂未开放"}</span>
              </div>
              {primaryProvider.description ? <p className={styles.providerCopy}>{primaryProvider.description}</p> : null}
            </section>
          ) : null}

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
              <button
                className={`${styles.actionButton} ${styles.primaryButton}`}
                disabled={!canSubmit}
                type="submit"
              >
                {pending ? "登录中..." : primaryProvider?.enabled ? "进入社区" : "登录方式暂不可用"}
              </button>
              <Link className={`${styles.actionButton} ${styles.secondaryButton}`} href="/">
                暂不登录
              </Link>
            </div>
          </form>

          <div className={styles.devCard}>
            <div className={styles.devHeader}>
              <strong>开发环境测试账号</strong>
              <span>当前 provider：{primaryProvider?.code ?? "unknown"}，后续会被画布侧登录替换</span>
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
              如果你现在只是继续看页面，可以直接走公开浏览入口；只有写入动作和个人态页面才要求登录。
            </p>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
