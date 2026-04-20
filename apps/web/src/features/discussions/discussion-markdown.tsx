"use client";

import type { ReactNode } from "react";
import styles from "./discussion-markdown.module.css";

type DiscussionMarkdownProps = {
  content: string;
  className?: string;
};

const VIDEO_LABEL_PATTERN = /^(\u89c6\u9891[:\uff1a]|video[:\uff1a])/i;
const VIDEO_URL_PATTERN = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function isVideoLink(label: string, href: string) {
  return VIDEO_LABEL_PATTERN.test(label.trim()) || VIDEO_URL_PATTERN.test(href);
}

function renderInline(value: string) {
  let html = escapeHtml(value);

  html = html.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, (_, alt, src) => {
    return `<figure class="${classNames("discussion-markdown-media", styles.media)}"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" /></figure>`;
  });

  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, href) => {
    if (isVideoLink(label, href)) {
      return `<figure class="${classNames("discussion-markdown-media", styles.media)}"><video class="${styles.video}" controls playsinline preload="metadata" src="${escapeHtml(href)}"></video></figure>`;
    }

    return `<a href="${href}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
  });

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  return html;
}

function renderBlocks(content: string): ReactNode[] {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const lines = normalized.split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trimEnd();

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trimStart().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(
        <pre className={classNames("discussion-markdown-pre", styles.pre)} key={`code-${index}`}>
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push(
        <h3
          className={classNames("discussion-markdown-h3", styles.heading, styles.h3)}
          dangerouslySetInnerHTML={{ __html: renderInline(line.slice(4).trim()) }}
          key={`h3-${index}`}
        />
      );
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push(
        <h2
          className={classNames("discussion-markdown-h2", styles.heading, styles.h2)}
          dangerouslySetInnerHTML={{ __html: renderInline(line.slice(3).trim()) }}
          key={`h2-${index}`}
        />
      );
      index += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push(
        <h1
          className={classNames("discussion-markdown-h1", styles.heading, styles.h1)}
          dangerouslySetInnerHTML={{ __html: renderInline(line.slice(2).trim()) }}
          key={`h1-${index}`}
        />
      );
      index += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trimStart().startsWith("> ")) {
        quoteLines.push(lines[index].trimStart().slice(2));
        index += 1;
      }
      blocks.push(
        <blockquote className={classNames("discussion-markdown-blockquote", styles.blockquote)} key={`quote-${index}`}>
          {quoteLines.map((item, itemIndex) => (
            <p
              dangerouslySetInnerHTML={{ __html: renderInline(item) }}
              key={`quote-line-${itemIndex}`}
            />
          ))}
        </blockquote>
      );
      continue;
    }

    if (/^(-|\*)\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^(-|\*)\s+/.test(lines[index].trimStart())) {
        items.push(lines[index].trimStart().replace(/^(-|\*)\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul className={classNames("discussion-markdown-list", styles.list)} key={`list-${index}`}>
          {items.map((item, itemIndex) => (
            <li dangerouslySetInnerHTML={{ __html: renderInline(item) }} key={`item-${itemIndex}`} />
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trimStart())) {
        items.push(lines[index].trimStart().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ol className={classNames("discussion-markdown-list", "discussion-markdown-list-ordered", styles.list)} key={`ordered-${index}`}>
          {items.map((item, itemIndex) => (
            <li dangerouslySetInnerHTML={{ __html: renderInline(item) }} key={`ordered-item-${itemIndex}`} />
          ))}
        </ol>
      );
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr className={classNames("discussion-markdown-divider", styles.divider)} key={`divider-${index}`} />);
      index += 1;
      continue;
    }

    const paragraphLines: string[] = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#|>|```|- |\* |\d+\.\s+|---+)/.test(lines[index].trimStart())) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push(
      <p
        className={classNames("discussion-markdown-paragraph", styles.paragraph)}
        dangerouslySetInnerHTML={{ __html: renderInline(paragraphLines.join(" ")) }}
        key={`paragraph-${index}`}
      />
    );
  }

  return blocks;
}

export function DiscussionMarkdown({ content, className }: DiscussionMarkdownProps) {
  return <div className={classNames("discussion-markdown", styles.root, className)}>{renderBlocks(content)}</div>;
}
