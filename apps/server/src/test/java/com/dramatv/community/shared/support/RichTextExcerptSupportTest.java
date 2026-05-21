package com.dramatv.community.shared.support;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RichTextExcerptSupportTest {

    @Test
    void toPlainTextStripsRichHtmlButKeepsReadableText() {
        String content = """
                <h1>Story Title</h1>
                <p><span style="font-size:28px;color:#d84d4d">Opening paragraph</span> with <a href="https://example.com">linked text</a>.</p>
                <figure class="discussion-rich-video">
                  <video src="/demo.mp4"></video>
                  <figcaption>Demo video</figcaption>
                </figure>
                <p><img src="/cover.jpg" alt="Cover image" /></p>
                <p>```code block```</p>
                """;

        String plainText = RichTextExcerptSupport.toPlainText(content);

        assertThat(plainText).contains("Story Title");
        assertThat(plainText).contains("Opening paragraph");
        assertThat(plainText).contains("linked text");
        assertThat(plainText).contains("Demo video");
        assertThat(plainText).contains("Cover image");
        assertThat(plainText).contains("code block");
        assertThat(plainText).doesNotContain("<h1>");
        assertThat(plainText).doesNotContain("/demo.mp4");
    }

    @Test
    void toPlainTextSupportsLegacyMarkdownMediaSyntax() {
        String content = """
                # Legacy title
                [视频：Clip demo](https://example.com/video.mp4)
                ![Poster image](https://example.com/poster.jpg)
                This is a [detail link](https://example.com/post/1)
                """;

        String plainText = RichTextExcerptSupport.toPlainText(content);

        assertThat(plainText).contains("Legacy title");
        assertThat(plainText).contains("Clip demo");
        assertThat(plainText).contains("Poster image");
        assertThat(plainText).contains("detail link");
        assertThat(plainText).doesNotContain("https://example.com/video.mp4");
    }

    @Test
    void toExcerptTruncatesLongRichContentWithoutLeakingTags() {
        String content = "<p>" + "rich text ".repeat(30) + "</p>";

        String excerpt = RichTextExcerptSupport.toExcerpt(content, 40);

        assertThat(excerpt).isNotNull();
        assertThat(excerpt).endsWith("...");
        assertThat(excerpt).doesNotContain("<p>");
        assertThat(excerpt).startsWith("rich text");
    }
}
