"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect } from "react";
import styles from "./discussion-markdown.module.css";
import {
  createDiscussionRichExtensions,
  discussionStorageToEditor,
  extractDiscussionHeadings,
  type DiscussionHeading
} from "./discussion-rich-content";

type DiscussionMarkdownProps = {
  content: string;
  className?: string;
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export { extractDiscussionHeadings, type DiscussionHeading } from "./discussion-rich-content";

export function DiscussionMarkdown({ content, className }: DiscussionMarkdownProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    ...discussionStorageToEditor(content),
    extensions: createDiscussionRichExtensions()
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextContent = discussionStorageToEditor(content);
    editor.commands.setContent(nextContent.content, {
      contentType: nextContent.contentType
    });
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={classNames("discussion-markdown", styles.root, className)}>
      <EditorContent editor={editor} />
    </div>
  );
}
