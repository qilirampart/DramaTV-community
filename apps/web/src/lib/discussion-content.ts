function decodeHtml(value: string) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function stripHtml(value: string) {
  return decodeHtml(
    value
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

export function stripDiscussionContentToPlainText(value: string) {
  return decodeHtml(value || "")
    .replace(
      /<dramatv-video[^>]*data-title="([^"]*)"[^>]*data-src="([^"]*)"[^>]*><\/dramatv-video>/gi,
      (_, rawTitle: string) => `${decodeHtml(String(rawTitle ?? "")).trim()} `
    )
    .replace(/<figure\b[^>]*discussion-rich-video[^>]*>([\s\S]*?)<\/figure>/gi, (_, rawFigure: string) => {
      const caption = rawFigure.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1] ?? "";
      return `${stripHtml(caption)} `;
    })
    .replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, "$1 ")
    .replace(/<img[^>]*>/gi, " ")
    .replace(/<video[^>]*>[\s\S]*?<\/video>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|h1|h2|h3|blockquote|li|figure|figcaption|pre|code|ul|ol)>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[([^\]]*)]\(([^)]+)\)/g, "$1 ")
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1")
    .replace(/```([\s\S]*?)```/g, " $1 ")
    .replace(/[#>*`_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
