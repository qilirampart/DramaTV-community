"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import type { JSONContent } from "@tiptap/core";
import styles from "./discussion-rich-editor.module.css";
import {
  createDiscussionRichExtensions,
  discussionEditorToStorage,
  discussionStorageToEditor
} from "./discussion-rich-content";

const FONT_SIZE_OPTIONS = [
  { label: "正文", value: "16px" },
  { label: "中号", value: "18px" },
  { label: "大号", value: "22px" },
  { label: "特大", value: "28px" }
] as const;

const TEXT_COLOR_OPTIONS = [
  { label: "默认", value: "" },
  { label: "黑", value: "#111111" },
  { label: "白", value: "#f8f8f6" },
  { label: "灰", value: "#8f9398" },
  { label: "红", value: "#d84d4d" },
  { label: "蓝", value: "#3f74ff" },
  { label: "金", value: "#c79b42" }
] as const;

type RichEditorProps = {
  value: string;
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onImageUpload: (file: File) => Promise<{ url: string; alt: string }>;
  onVideoUpload: (file: File) => Promise<{ url: string; title: string }>;
  onBusyChange?: (busy: boolean) => void;
};

type ToolbarDropdownKey = "text" | "style" | "structure" | "insert";

function getActiveFontSize(editor: Editor | null) {
  const selected = editor?.getAttributes("textStyle").fontSize;
  if (typeof selected === "string" && selected.trim()) {
    return selected.trim();
  }
  return "";
}

function getActiveTextColor(editor: Editor | null) {
  const selected = editor?.getAttributes("textStyle").color;
  if (typeof selected === "string" && selected.trim()) {
    return selected.trim().toLowerCase();
  }
  return "";
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function DiscussionRichEditor({
  value,
  placeholder,
  disabled = false,
  onChange,
  onImageUpload,
  onVideoUpload,
  onBusyChange
}: RichEditorProps) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [openDropdown, setOpenDropdown] = useState<ToolbarDropdownKey | null>(null);
  const [uploadPending, setUploadPending] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    ...discussionStorageToEditor(value || ""),
    extensions: createDiscussionRichExtensions(placeholder),
    editorProps: {
      attributes: {
        class: styles.proseMirror
      },
      handleKeyDown: (_, event) => {
        const isMeta = event.ctrlKey || event.metaKey;

        if (isMeta && event.key.toLowerCase() === "k") {
          event.preventDefault();
          const href = window.prompt("输入链接地址", "https://");
          if (!href) {
            return true;
          }

          const text = editor?.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to,
            " "
          );

          if (!text) {
            editor?.chain().focus().insertContent(text ? text : href).extendMarkRange("link").setLink({ href }).run();
            return true;
          }

          editor?.chain().focus().extendMarkRange("link").setLink({ href }).run();
          return true;
        }

        return false;
      },
      handleDOMEvents: {
        drop: (_view, event) => {
          if (!event.dataTransfer?.files?.length || disabled || uploadPending) {
            return false;
          }

          const files = Array.from(event.dataTransfer.files).filter((file) =>
            file.type.startsWith("image/") || file.type.startsWith("video/")
          );

          if (!files.length) {
            return false;
          }

          event.preventDefault();
          void insertFiles(files);
          return true;
        },
        paste: (_view, event) => {
          if (!event.clipboardData?.files?.length || disabled || uploadPending) {
            return false;
          }

          const files = Array.from(event.clipboardData.files).filter((file) =>
            file.type.startsWith("image/") || file.type.startsWith("video/")
          );

          if (!files.length) {
            return false;
          }

          event.preventDefault();
          void insertFiles(files);
          return true;
        }
      }
    },
    onUpdate({ editor: nextEditor }) {
      onChange(discussionEditorToStorage(nextEditor));
    }
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    onBusyChange?.(uploadPending);
  }, [onBusyChange, uploadPending]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentMarkdown = discussionEditorToStorage(editor);

    if (currentMarkdown === (value || "").trim()) {
      return;
    }

    const nextContent = discussionStorageToEditor(value || "");
    editor.commands.setContent(nextContent.content, {
      contentType: nextContent.contentType
    });
  }, [editor, value]);

  useEffect(() => {
    if (!openDropdown) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && menuRef.current?.contains(target)) {
        return;
      }
      setOpenDropdown(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdown(null);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [openDropdown]);

  const status = useMemo(() => {
    const markdown = value || "";
    const plainText = markdown
      .replace(/!\[[^\]]*]\(([^)]+)\)/g, "")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/<dramatv-video[^>]*><\/dramatv-video>/g, "")
      .replace(/\s+/g, "");

    return {
      characters: plainText.length,
      lines: markdown.trim() ? markdown.replace(/\r\n/g, "\n").split("\n").length : 0
    };
  }, [value]);

  async function insertFiles(files: File[]) {
    if (!editor) {
      return;
    }

    setUploadPending(true);
    try {
      for (const file of files) {
        if (file.type.startsWith("image/")) {
          const asset = await onImageUpload(file);
          editor.chain().focus().setImage({ src: asset.url, alt: asset.alt, title: asset.alt }).run();
          editor.chain().focus().createParagraphNear().run();
          continue;
        }

        if (file.type.startsWith("video/")) {
          const asset = await onVideoUpload(file);
          editor
            .chain()
            .focus()
            .insertContent({
              type: "discussionVideo",
              attrs: {
                src: asset.url,
                title: asset.title
              }
            } satisfies JSONContent)
            .createParagraphNear()
            .run();
        }
      }
    } finally {
      setUploadPending(false);
    }
  }

  async function handleFileInput(
    event: ChangeEvent<HTMLInputElement>,
    kind: "image" | "video"
  ) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith(`${kind}/`)) {
      return;
    }

    await insertFiles([file]);
    setOpenDropdown(null);
  }

  function run(action: () => void) {
    action();
    setOpenDropdown(null);
  }

  function applyLink() {
    if (!editor) {
      return;
    }

    const previous = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("输入链接地址", previous || "https://");
    if (href === null) {
      return;
    }

    const trimmed = href.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  }

  function toggleDropdown(key: ToolbarDropdownKey) {
    setOpenDropdown((current) => (current === key ? null : key));
  }

  const activeFontSize = getActiveFontSize(editor);
  const activeTextColor = getActiveTextColor(editor);

  return (
    <div className={styles.root}>
      <div ref={menuRef} className={styles.toolbarShell}>
        <div className={styles.toolbarRow}>
          <div className={styles.toolbarDropdown}>
            <button
              className={classNames(styles.toolbarButton, openDropdown === "text" && styles.toolbarButtonActive)}
              disabled={disabled || uploadPending}
              type="button"
              onClick={() => toggleDropdown("text")}
            >
              文字
            </button>
            {openDropdown === "text" ? (
              <div className={styles.dropdownMenu}>
                <button className={styles.dropdownItem} type="button" onClick={() => run(() => editor?.chain().focus().toggleHeading({ level: 1 }).run())}>一级标题</button>
                <button className={styles.dropdownItem} type="button" onClick={() => run(() => editor?.chain().focus().toggleHeading({ level: 2 }).run())}>二级标题</button>
                <button className={styles.dropdownItem} type="button" onClick={() => run(() => editor?.chain().focus().toggleHeading({ level: 3 }).run())}>三级标题</button>
                <div className={styles.dropdownDivider} />
                <button className={styles.dropdownItem} type="button" onClick={() => run(() => editor?.chain().focus().setParagraph().run())}>正文</button>
                <button className={styles.dropdownItem} type="button" onClick={() => run(() => editor?.chain().focus().toggleBold().run())}>加粗</button>
                <button className={styles.dropdownItem} type="button" onClick={() => run(() => editor?.chain().focus().toggleItalic().run())}>斜体</button>
                <button className={styles.dropdownItem} type="button" onClick={() => run(() => editor?.chain().focus().toggleCode().run())}>行内代码</button>
                <button className={styles.dropdownItem} type="button" onClick={() => run(applyLink)}>链接</button>
              </div>
            ) : null}
          </div>

          <div className={styles.toolbarDropdown}>
            <button
              className={classNames(styles.toolbarButton, openDropdown === "style" && styles.toolbarButtonActive)}
              disabled={disabled || uploadPending}
              type="button"
              onClick={() => toggleDropdown("style")}
            >
              样式
            </button>
            {openDropdown === "style" ? (
              <div className={styles.dropdownPanel}>
                <label className={styles.fieldLabel}>
                  <span>字号</span>
                  <select
                    className={styles.selectField}
                    value={activeFontSize}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (!editor) {
                        return;
                      }
                      if (!nextValue) {
                        editor.chain().focus().unsetFontSize().run();
                        return;
                      }
                      editor.chain().focus().setFontSize(nextValue).run();
                    }}
                  >
                    <option value="">默认</option>
                    {FONT_SIZE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className={styles.colorBlock}>
                  <span className={styles.colorTitle}>颜色</span>
                  <div className={styles.colorGrid}>
                    {TEXT_COLOR_OPTIONS.map((option) => {
                      const active = option.value
                        ? activeTextColor === option.value.toLowerCase()
                        : !activeTextColor;

                      return (
                        <button
                          key={option.label}
                          className={classNames(styles.colorChip, active && styles.colorChipActive)}
                          style={option.value ? { ["--chip-color" as string]: option.value } : undefined}
                          type="button"
                          onClick={() => {
                            if (!editor) {
                              return;
                            }
                            if (!option.value) {
                              editor.chain().focus().unsetColor().run();
                              return;
                            }
                            editor.chain().focus().setColor(option.value).run();
                          }}
                        >
                          <span className={styles.colorDot} />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className={styles.toolbarDropdown}>
            <button
              className={classNames(styles.toolbarButton, openDropdown === "structure" && styles.toolbarButtonActive)}
              disabled={disabled || uploadPending}
              type="button"
              onClick={() => toggleDropdown("structure")}
            >
              结构
            </button>
            {openDropdown === "structure" ? (
              <div className={styles.dropdownMenu}>
                <button className={styles.dropdownItem} type="button" onClick={() => run(() => editor?.chain().focus().toggleBulletList().run())}>无序列表</button>
                <button className={styles.dropdownItem} type="button" onClick={() => run(() => editor?.chain().focus().toggleOrderedList().run())}>有序列表</button>
                <button className={styles.dropdownItem} type="button" onClick={() => run(() => editor?.chain().focus().toggleBlockquote().run())}>引用</button>
                <button className={styles.dropdownItem} type="button" onClick={() => run(() => editor?.chain().focus().toggleCodeBlock().run())}>代码块</button>
                <button className={styles.dropdownItem} type="button" onClick={() => run(() => editor?.chain().focus().setHorizontalRule().run())}>分割线</button>
                <div className={styles.dropdownDivider} />
                <button className={styles.dropdownItem} type="button" onClick={() => run(() => editor?.chain().focus().setTextAlign("left").run())}>左对齐</button>
                <button className={styles.dropdownItem} type="button" onClick={() => run(() => editor?.chain().focus().setTextAlign("center").run())}>居中</button>
                <button className={styles.dropdownItem} type="button" onClick={() => run(() => editor?.chain().focus().setTextAlign("right").run())}>右对齐</button>
              </div>
            ) : null}
          </div>

          <div className={styles.toolbarDropdown}>
            <button
              className={classNames(styles.toolbarButton, openDropdown === "insert" && styles.toolbarButtonActive)}
              disabled={disabled || uploadPending}
              type="button"
              onClick={() => toggleDropdown("insert")}
            >
              插入
            </button>
            {openDropdown === "insert" ? (
              <div className={styles.dropdownMenu}>
                <label className={styles.uploadItem}>
                  <input ref={imageInputRef} accept="image/*" type="file" onChange={(event) => void handleFileInput(event, "image")} />
                  插入图片
                </label>
                <label className={styles.uploadItem}>
                  <input ref={videoInputRef} accept="video/*" type="file" onChange={(event) => void handleFileInput(event, "video")} />
                  插入视频
                </label>
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.metaRow}>
          <span className={styles.metaText}>所见即所得编辑，标题、粗斜体、颜色和字号会直接在编辑区生效。</span>
          <span className={styles.metaText}>支持粘贴或拖入图片/视频，快捷键：Ctrl/⌘ + B / I / K</span>
        </div>
      </div>

      <div className={classNames(styles.editorFrame, uploadPending && styles.editorFrameBusy)}>
        <EditorContent editor={editor} />
        {uploadPending ? <div className={styles.uploadOverlay}>正在上传媒体并插入正文...</div> : null}
      </div>

      <div className={styles.footer}>
        <span className={styles.statusPill}>富文本</span>
        <span className={styles.statusPill}>字数 {status.characters}</span>
        <span className={styles.statusPill}>行数 {status.lines}</span>
      </div>
    </div>
  );
}
