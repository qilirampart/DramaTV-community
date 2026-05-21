"use client";

import { Node, mergeAttributes, type JSONContent, type Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { Markdown } from "@tiptap/markdown";
import { TextStyleKit } from "@tiptap/extension-text-style";
export { stripDiscussionContentToPlainText } from "@/lib/discussion-content";

const VIDEO_MARKDOWN_PATTERN = /\[视频：([^\]]+)\]\(([^)]+)\)/g;
const HTML_TAG_PATTERN = /<\/?(p|div|span|h1|h2|h3|blockquote|ul|ol|li|img|video|figure|figcaption|dramatv-video|pre|code|hr|a)\b/i;

export type DiscussionHeading = {
  id: string;
  text: string;
  depth: 1 | 2 | 3;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

export function videoMarkdownToHtml(value: string) {
  return value.replace(VIDEO_MARKDOWN_PATTERN, (_, rawTitle, rawUrl) => {
    const title = escapeHtml(String(rawTitle ?? ""));
    const url = escapeHtml(String(rawUrl ?? ""));
    return `<dramatv-video data-title="${title}" data-src="${url}"></dramatv-video>`;
  });
}

export function htmlToVideoMarkdown(value: string) {
  return value.replace(
    /<dramatv-video[^>]*data-title="([^"]*)"[^>]*data-src="([^"]*)"[^>]*><\/dramatv-video>/g,
    (_, rawTitle, rawUrl) => `[视频：${decodeHtml(String(rawTitle ?? "")) || "未命名视频"}](${decodeHtml(String(rawUrl ?? ""))})`
  );
}

export function detectDiscussionContentType(value: string): "html" | "markdown" {
  return HTML_TAG_PATTERN.test(value) ? "html" : "markdown";
}

export function prepareDiscussionContent(value: string) {
  const normalized = value || "";
  const contentType = detectDiscussionContentType(normalized);

  if (contentType === "html") {
    return {
      content: normalized,
      contentType
    } as const;
  }

  return {
    content: videoMarkdownToHtml(normalized),
    contentType
  } as const;
}

function stripInlineMarkdown(value: string) {
  return value
    .replace(/!\[[^\]]*]\(([^)]+)\)/g, " ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[#>*`_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createDiscussionHeadingId(text: string, index: number) {
  const normalized = stripInlineMarkdown(text)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  if (!normalized) {
    return `discussion-section-${index + 1}`;
  }

  return `discussion-${normalized}-${index + 1}`;
}

function stripHtml(value: string) {
  return decodeHtml(
    value
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

export function extractDiscussionHeadings(content: string): DiscussionHeading[] {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  if (detectDiscussionContentType(normalized) === "html") {
    const headings: DiscussionHeading[] = [];
    const pattern = /<(h[1-3])\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(normalized)) !== null) {
      const depth = Number(match[1].slice(1)) as 1 | 2 | 3;
      const rawText = stripHtml(match[2]);
      headings.push({
        id: createDiscussionHeadingId(rawText, headings.length),
        text: rawText || `章节 ${headings.length + 1}`,
        depth
      });
    }

    return headings;
  }

  const lines = normalized.split("\n");
  const headings: DiscussionHeading[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    const depth = trimmed.startsWith("### ") ? 3 : trimmed.startsWith("## ") ? 2 : trimmed.startsWith("# ") ? 1 : null;

    if (!depth) {
      return;
    }

    const rawText = trimmed.slice(depth + 1).trim();
    const text = stripInlineMarkdown(rawText);

    headings.push({
      id: createDiscussionHeadingId(rawText, headings.length),
      text: text || `章节 ${headings.length + 1}`,
      depth
    });
  });

  return headings;
}

export const DiscussionVideoNode = Node.create({
  name: "discussionVideo",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null }
    };
  },

  parseHTML() {
    return [
      {
        tag: "dramatv-video[data-src]",
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) {
            return false;
          }

          return {
            src: element.dataset.src ?? null,
            title: element.dataset.title ?? null
          };
        }
      },
      {
        tag: "figure.discussion-rich-video",
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) {
            return false;
          }

          const video = element.querySelector("video");
          const caption = element.querySelector("figcaption");
          return {
            src: video?.getAttribute("src") ?? null,
            title: caption?.textContent?.trim() ?? null
          };
        }
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "figure",
      mergeAttributes({ class: "discussion-rich-video" }, HTMLAttributes),
      [
        "video",
        {
          class: "discussion-rich-video-player",
          controls: "true",
          playsinline: "true",
          preload: "metadata",
          src: HTMLAttributes.src
        }
      ],
      HTMLAttributes.title
        ? ["figcaption", { class: "discussion-rich-video-caption" }, HTMLAttributes.title]
        : ["figcaption", { class: "discussion-rich-video-caption", "data-empty": "true" }, ""]
    ];
  },

  markdownTokenName: "html",

  parseMarkdown: (token, helpers) => {
    const raw = token.raw ?? "";
    const matched = raw.match(/<dramatv-video[^>]*data-title="([^"]*)"[^>]*data-src="([^"]*)"[^>]*><\/dramatv-video>/i);
    if (!matched) {
      return [];
    }

    return helpers.createNode("discussionVideo", {
      title: decodeHtml(matched[1] ?? ""),
      src: decodeHtml(matched[2] ?? "")
    });
  },

  renderMarkdown: (node) => {
    const title = escapeHtml(String(node.attrs?.title ?? ""));
    const src = escapeHtml(String(node.attrs?.src ?? ""));
    return `<dramatv-video data-title="${title}" data-src="${src}"></dramatv-video>`;
  }
});

export function createDiscussionRichExtensions(placeholder?: string): Extensions {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      },
      link: {
        openOnClick: false,
        autolink: true
      }
    }),
    Image.configure({
      inline: false,
      allowBase64: false
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"]
    }),
    TextStyleKit.configure({
      backgroundColor: false,
      fontFamily: false,
      lineHeight: false,
      color: {
        types: ["textStyle"]
      },
      fontSize: {
        types: ["textStyle"]
      }
    }),
    ...(placeholder
      ? [
          Placeholder.configure({
            placeholder
          })
        ]
      : []),
    DiscussionVideoNode,
    Markdown
  ];
}

export function discussionEditorToStorage(editor: { getHTML: () => string }) {
  return editor.getHTML().trim();
}

export function discussionStorageToEditor(value: string) {
  return prepareDiscussionContent(value);
}
