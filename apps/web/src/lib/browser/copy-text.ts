"use client";

function fallbackCopyText(text: string) {
  if (typeof document === "undefined") {
    throw new Error("Document is unavailable.");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const selection = document.getSelection();
  const previousRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (activeElement) {
    activeElement.focus();
  }

  if (selection) {
    selection.removeAllRanges();
    if (previousRange) {
      selection.addRange(previousRange);
    }
  }

  if (!copied) {
    throw new Error("Copy command failed.");
  }
}

export async function copyText(text: string) {
  const normalized = String(text ?? "");

  if (
    typeof navigator !== "undefined"
    && typeof window !== "undefined"
    && typeof navigator.clipboard?.writeText === "function"
    && window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(normalized);
      return;
    } catch {
      // Fall back to the textarea-based copy path below.
    }
  }

  fallbackCopyText(normalized);
}
