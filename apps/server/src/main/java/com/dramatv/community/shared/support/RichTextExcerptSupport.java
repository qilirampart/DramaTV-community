package com.dramatv.community.shared.support;

import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.web.util.HtmlUtils;

public final class RichTextExcerptSupport {

    private static final Pattern DRAMATV_VIDEO_PATTERN = Pattern.compile(
            "<dramatv-video[^>]*data-title=\"([^\"]*)\"[^>]*><\\/dramatv-video>",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern FIGURE_VIDEO_PATTERN = Pattern.compile(
            "<figure\\b[^>]*discussion-rich-video[^>]*>([\\s\\S]*?)<\\/figure>",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern FIGCAPTION_PATTERN = Pattern.compile(
            "<figcaption\\b[^>]*>([\\s\\S]*?)<\\/figcaption>",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern IMAGE_WITH_ALT_PATTERN = Pattern.compile(
            "<img[^>]*alt=\"([^\"]*)\"[^>]*>",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern IMAGE_PATTERN = Pattern.compile("<img[^>]*>", Pattern.CASE_INSENSITIVE);
    private static final Pattern VIDEO_PATTERN = Pattern.compile("<video[^>]*>[\\s\\S]*?<\\/video>", Pattern.CASE_INSENSITIVE);
    private static final Pattern BR_PATTERN = Pattern.compile("<br\\s*/?>", Pattern.CASE_INSENSITIVE);
    private static final Pattern BLOCK_END_PATTERN = Pattern.compile(
            "<\\/(p|div|h1|h2|h3|blockquote|li|figure|figcaption|pre|code|ul|ol)>",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern ANY_TAG_PATTERN = Pattern.compile("<[^>]+>");
    private static final Pattern MARKDOWN_IMAGE_PATTERN = Pattern.compile("!\\[([^]]*)]\\([^)]+\\)");
    private static final Pattern MARKDOWN_LINK_PATTERN = Pattern.compile("\\[([^]]+)]\\([^)]+\\)");
    private static final Pattern CODE_FENCE_PATTERN = Pattern.compile("```([\\s\\S]*?)```");
    private static final Pattern MARKDOWN_DECORATION_PATTERN = Pattern.compile("[#>*`_~-]");
    private static final Pattern WHITESPACE_PATTERN = Pattern.compile("\\s+");

    private RichTextExcerptSupport() {
    }

    public static String toPlainText(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        String normalized = value;
        normalized = replaceAll(normalized, DRAMATV_VIDEO_PATTERN, matcher -> {
            String title = decodeHtml(matcher.group(1));
            return title.isBlank() ? " " : title + " ";
        });
        normalized = replaceAll(normalized, FIGURE_VIDEO_PATTERN, matcher -> {
            Matcher captionMatcher = FIGCAPTION_PATTERN.matcher(matcher.group(1));
            if (!captionMatcher.find()) {
                return " ";
            }

            String caption = stripHtml(captionMatcher.group(1));
            return caption.isBlank() ? " " : caption + " ";
        });
        normalized = replaceAll(normalized, IMAGE_WITH_ALT_PATTERN, matcher -> decodeHtml(matcher.group(1)) + " ");
        normalized = IMAGE_PATTERN.matcher(normalized).replaceAll(" ");
        normalized = VIDEO_PATTERN.matcher(normalized).replaceAll(" ");
        normalized = BR_PATTERN.matcher(normalized).replaceAll(" ");
        normalized = BLOCK_END_PATTERN.matcher(normalized).replaceAll(" ");
        normalized = ANY_TAG_PATTERN.matcher(normalized).replaceAll(" ");
        normalized = replaceAll(normalized, MARKDOWN_IMAGE_PATTERN, matcher -> matcher.group(1) + " ");
        normalized = replaceAll(normalized, MARKDOWN_LINK_PATTERN, matcher -> matcher.group(1));
        normalized = replaceAll(normalized, CODE_FENCE_PATTERN, matcher -> " " + matcher.group(1) + " ");
        normalized = MARKDOWN_DECORATION_PATTERN.matcher(normalized).replaceAll(" ");
        normalized = decodeHtml(normalized);
        normalized = WHITESPACE_PATTERN.matcher(normalized).replaceAll(" ").trim();
        return normalized;
    }

    public static String toExcerpt(String value, int maxLength) {
        String plainText = toPlainText(value);
        if (plainText.isBlank()) {
            return null;
        }

        if (plainText.length() <= maxLength) {
            return plainText;
        }

        return plainText.substring(0, maxLength) + "...";
    }

    private static String stripHtml(String value) {
        return decodeHtml(ANY_TAG_PATTERN.matcher(value).replaceAll(" "))
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static String decodeHtml(String value) {
        return HtmlUtils.htmlUnescape(value == null ? "" : value);
    }

    private static String replaceAll(String value, Pattern pattern, Function<Matcher, String> replacer) {
        Matcher matcher = pattern.matcher(value);
        StringBuffer buffer = new StringBuffer();
        while (matcher.find()) {
            matcher.appendReplacement(buffer, Matcher.quoteReplacement(replacer.apply(matcher)));
        }
        matcher.appendTail(buffer);
        return buffer.toString();
    }
}
