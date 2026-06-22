"use client";

import { useActionState, useState } from "react";
import { signInAction } from "@/app/auth-actions";
import styles from "./AdminLoginForm.module.css";

type AdminLoginFormProps = {
  redirectTo?: string;
};

const initialState = {
  message: null as string | null
};

function AccountIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="6.25" r="2.75" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 15.25c.64-2.18 2.54-3.5 5-3.5s4.36 1.32 5 3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <rect height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" width="10.5" x="4.75" y="8.25" />
      <path d="M7 8V6.5a3 3 0 0 1 6 0V8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M2.75 10s2.5-4.25 7.25-4.25S17.25 10 17.25 10 14.75 14.25 10 14.25 2.75 10 2.75 10Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
        <circle cx="10" cy="10" r="2.1" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M2.75 10s2.5-4.25 7.25-4.25c1.45 0 2.7.4 3.78.97 2.11 1.11 3.47 3.28 3.47 3.28S14.75 14.25 10 14.25c-1.45 0-2.7-.4-3.78-.97C4.11 12.17 2.75 10 2.75 10Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M7.8 9.98A2.2 2.2 0 0 0 10 12.2c.77 0 1.45-.4 1.84-1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      <path d="M4 4l12 12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M10 3.75l5 1.5v4.1c0 3.06-2.1 5.87-5 6.9-2.9-1.03-5-3.84-5-6.9v-4.1l5-1.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M8.25 9.95l1.1 1.1 2.4-2.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function FooterBadgeIcon({ kind }: { kind: "shield" | "building" }) {
  if (kind === "shield") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M10 3.75l5 1.5v4.1c0 3.06-2.1 5.87-5 6.9-2.9-1.03-5-3.84-5-6.9v-4.1l5-1.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M3.75 15.25h12.5M5.75 15.25V8.5L10 5.75l4.25 2.75v6.75M8 9.5h.01M10 9.5h.01M12 9.5h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

export function AdminLoginForm({ redirectTo }: AdminLoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <main className={styles.page}>
      <div className={styles.stage}>
        <header className={styles.brand}>
          <div className={styles.wordmarkRow}>
            <h1 className={styles.wordmark}>DramaTV</h1>
            <span className={styles.wordmarkBadge}>TV</span>
          </div>
          <p className={styles.subtitle}>Community admin portal</p>
        </header>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Sign in to your admin account</h2>
          </div>

          <form action={formAction} className={styles.form}>
            <input name="redirectTo" type="hidden" value={redirectTo ?? ""} />

            <label className={styles.field}>
              <span className={styles.label}>Account</span>
              <span className={styles.inputShell}>
                <span className={styles.inputIcon}>
                  <AccountIcon />
                </span>
                <input
                  autoComplete="username"
                  className={styles.input}
                  name="username"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Admin ID or Email"
                  value={username}
                />
              </span>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Password</span>
              <span className={styles.inputShell}>
                <span className={styles.inputIcon}>
                  <LockIcon />
                </span>
                <input
                  autoComplete="current-password"
                  className={styles.input}
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className={styles.visibilityButton}
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </span>
            </label>

            <label className={styles.checkboxRow}>
              <input defaultChecked name="remember" type="checkbox" value="true" />
              <span>Remember login status</span>
            </label>

            {state.message ? <p className={styles.notice}>{state.message}</p> : null}

            <button className={styles.submitButton} disabled={pending} type="submit">
              {pending ? "Signing in..." : "Sign In"}
            </button>

            <div className={styles.securityNote}>
              <span className={styles.securityIcon}>
                <ShieldIcon />
              </span>
              <span>Secure sign-in. Access is restricted to authorized personnel.</span>
            </div>
          </form>
        </section>
      </div>

      <footer className={styles.footer}>
        <span className={styles.copyright}>© 2026 DramaTV</span>
        <div className={styles.footerMeta}>
          <span className={styles.footerBadge}>
            <span className={styles.footerBadgeIcon}>
              <FooterBadgeIcon kind="shield" />
            </span>
            Test Environment
          </span>
          <span className={styles.footerBadge}>
            <span className={styles.footerBadgeIcon}>
              <FooterBadgeIcon kind="building" />
            </span>
            Internal System
          </span>
          <strong className={styles.version}>v2.4.1</strong>
        </div>
      </footer>
    </main>
  );
}
