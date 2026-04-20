"use client";

import Link from "next/link";
import { useState } from "react";
import { PageShell } from "@/components/shared/PageShell";
import {
  refreshLocalSmokeToolsAction,
  resetLocalSmokeToolsAction
} from "./actions";
import type { LocalSmokeToolsPageView } from "./shared";

type LocalSmokeToolsPageProps = {
  view: LocalSmokeToolsPageView;
};

type ToolNotice = {
  tone: "neutral" | "success" | "error";
  text: string;
};

function noticeClassName(notice: ToolNotice) {
  if (notice.tone === "success") {
    return "interaction-notice interaction-notice-success";
  }

  if (notice.tone === "error") {
    return "interaction-notice interaction-notice-error";
  }

  return "interaction-notice";
}

function formatGeneratedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    hour12: false
  });
}

export function LocalSmokeToolsPage({ view }: LocalSmokeToolsPageProps) {
  const [currentView, setCurrentView] = useState(view);
  const [pendingAction, setPendingAction] = useState<"refresh" | "reset" | null>(null);
  const [notice, setNotice] = useState<ToolNotice | null>(null);
  const [commandOutput, setCommandOutput] = useState<string | null>(null);

  async function runAction(
    action: "refresh" | "reset",
    runner: typeof refreshLocalSmokeToolsAction | typeof resetLocalSmokeToolsAction
  ) {
    setPendingAction(action);
    setNotice({
      tone: "neutral",
      text: action === "reset" ? "正在执行本地 smoke 数据重置..." : "正在刷新本地 smoke 基线状态..."
    });

    try {
      const result = await runner();
      if (result.ok) {
        setCurrentView(result.view);
        setNotice({
          tone: "success",
          text: result.message
        });
        setCommandOutput(result.commandOutput ?? null);
        return;
      }

      setNotice({
        tone: "error",
        text: result.message
      });
      setCommandOutput(result.commandOutput ?? null);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <PageShell>
      <section className="hero-panel">
        <div className="eyebrow">开发态工具</div>
        <h1 className="hero-title">本地 smoke 基线工具页</h1>
        <p className="hero-copy">
          这个页面只服务当前本地真实联调：先检查视频、工作流、作者三个固定 smoke 基线是否健康，再在必要时一键把本地数据恢复到固定状态。
        </p>
        <div className="hero-actions">
          <button
            type="button"
            className="button-secondary"
            disabled={pendingAction !== null}
            onClick={() => runAction("refresh", refreshLocalSmokeToolsAction)}
          >
            {pendingAction === "refresh" ? "刷新中..." : "刷新基线状态"}
          </button>
          <button
            type="button"
            className="button"
            disabled={pendingAction !== null}
            onClick={() => runAction("reset", resetLocalSmokeToolsAction)}
          >
            {pendingAction === "reset" ? "重置中..." : "一键重置本地 smoke 数据"}
          </button>
          <Link className="button-secondary" href="/publish">
            回到社区主线
          </Link>
        </div>
        <div className="stats-row">
          <span className="meta-pill">数据模式：{currentView.environment.dataMode}</span>
          <span className="meta-pill">后端地址：{currentView.environment.apiBaseUrl ?? "未配置"}</span>
          <span className={currentView.overallHealthy ? "meta-pill" : "meta-pill tag-highlight"}>
            {currentView.overallHealthy ? "当前基线健康" : "当前基线需要整理"}
          </span>
          <span className="meta-pill">最近刷新：{formatGeneratedAt(currentView.environment.generatedAt)}</span>
        </div>
      </section>

      <section className="section">
        <div className="devtools-summary-grid">
          <div className="glass-panel publish-section">
            <div className="eyebrow">执行入口</div>
            <h2 className="section-title">一键重置命令</h2>
            <p className="section-copy">
              当前页面按钮会直接调用这条本地脚本。需要手动执行时，也可以复制下面这条命令。
            </p>
            <div className="field">
              <code>{currentView.resetCommand}</code>
            </div>
          </div>

          <div className="glass-panel publish-section">
            <div className="eyebrow">说明文档</div>
            <h2 className="section-title">脚本边界</h2>
            <p className="section-copy">
              只面向本地 Docker + PostgreSQL 联调环境，不用于线上或共享环境。
            </p>
            <div className="hero-actions">
              <Link className="button-secondary" href="/videos/3d82413b-1036-4c1b-93dd-3a102e0b4683">
                打开视频 smoke
              </Link>
              <Link className="button-secondary" href="/workflows/dd715ee9-189b-4450-a4ca-fdf71fb8aafb">
                打开工作流 smoke
              </Link>
              <Link className="button-secondary" href="/creators/33333333-3333-3333-3333-333333333333">
                打开作者 smoke
              </Link>
            </div>
          </div>
        </div>
      </section>

      {notice ? (
        <section className="section">
          <div className="glass-panel publish-section">
            <p className={noticeClassName(notice)}>{notice.text}</p>
            {commandOutput ? (
              <pre className="devtools-output">{commandOutput}</pre>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-header">
          <div>
            <div className="eyebrow">基线检查</div>
            <h2 className="section-title">当前固定 smoke 数据状态</h2>
            <p className="section-copy">
              每一项都直接来自当前真实接口返回，用来确认本地联调环境是否已经回到固定基线。
            </p>
          </div>
        </div>
        <div className="devtools-section-grid">
          {currentView.sections.map((section) => (
            <article className="glass-panel publish-section" key={section.key}>
              <div className="section-header">
                <div>
                  <div className="eyebrow">{section.title}</div>
                  <h3 className="section-title">{section.description}</h3>
                </div>
                <Link className="section-link" href={section.href}>
                  查看页面
                </Link>
              </div>
              <div className="devtools-check-list">
                {section.checks.map((check) => (
                  <div className="devtools-check" key={`${section.key}-${check.label}`}>
                    <div>
                      <strong>{check.label}</strong>
                    </div>
                    <div className="devtools-check-values">
                      <span>当前：{check.current}</span>
                      <span>预期：{check.expected}</span>
                    </div>
                    <span className={check.ok ? "meta-pill" : "meta-pill tag-highlight"}>
                      {check.ok ? "正常" : "偏离基线"}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
