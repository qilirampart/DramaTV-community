"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitLoginAction } from "@/app/(community)/login/actions";
import { PageShell } from "@/components/shared/PageShell";
import type { LoginFormState } from "@/app/(community)/login/actions";
import type { ApiAuthProviderConfig } from "@/lib/contracts/community-api";
import styles from "./LoginPage.module.css";

type LoginPageProps = {
  redirectTo?: string;
  providerConfig: ApiAuthProviderConfig;
};

const LOGIN_TITLE = "\u8fdb\u5165 DramaTV \u793e\u533a";
const USERNAME_LABEL = "\u7528\u6237\u540d";
const PASSWORD_LABEL = "\u5bc6\u7801";
const LOGIN_PENDING_TEXT = "\u767b\u5f55\u4e2d...";
const LOGIN_READY_TEXT = "\u8fdb\u5165\u793e\u533a";
const LOGIN_DISABLED_TEXT = "\u767b\u5f55\u65b9\u5f0f\u6682\u4e0d\u53ef\u7528";
const SKIP_LOGIN_TEXT = "\u6682\u4e0d\u767b\u5f55";
const INITIAL_LOGIN_FORM_STATE: LoginFormState = { message: null };

export function LoginPage({ redirectTo, providerConfig }: LoginPageProps) {
  const primaryProvider =
    providerConfig.loginProviders.find((provider) => provider.code === providerConfig.primaryProvider) ??
    providerConfig.loginProviders.find((provider) => provider.enabled) ??
    providerConfig.loginProviders[0];
  const [state, formAction, pending] = useActionState(submitLoginAction, INITIAL_LOGIN_FORM_STATE);
  const canSubmit = Boolean(primaryProvider?.enabled) && !pending;

  return (
    <PageShell topNavActive="landing" variant="home">
      <main className={styles.page}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.eyebrow}>Login</div>
            <h1 className={styles.panelTitle}>{LOGIN_TITLE}</h1>
          </div>

          <form action={formAction} className={styles.form}>
            <input name="redirectTo" type="hidden" value={redirectTo ?? "/home"} />
            <input name="loginType" type="hidden" value={primaryProvider?.code ?? ""} />

            <label className={styles.field}>
              <span className={styles.label}>{USERNAME_LABEL}</span>
              <input
                autoCapitalize="none"
                autoComplete="username"
                className={styles.input}
                disabled={pending}
                name="username"
                spellCheck={false}
                type="text"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>{PASSWORD_LABEL}</span>
              <input
                autoComplete="current-password"
                className={styles.input}
                disabled={pending}
                name="password"
                type="password"
              />
            </label>

            {state.message ? <p className={styles.notice}>{state.message}</p> : null}

            <div className={styles.actionRow}>
              <button
                className={`${styles.actionButton} ${styles.primaryButton}`}
                disabled={!canSubmit}
                type="submit"
              >
                {pending ? LOGIN_PENDING_TEXT : primaryProvider?.enabled ? LOGIN_READY_TEXT : LOGIN_DISABLED_TEXT}
              </button>
              <Link className={`${styles.actionButton} ${styles.secondaryButton}`} href="/">
                {SKIP_LOGIN_TEXT}
              </Link>
            </div>
          </form>
        </section>
      </main>
    </PageShell>
  );
}
