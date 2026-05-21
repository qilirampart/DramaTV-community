package com.dramatv.community.shared.media;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MediaByteRangeTest {

    @Test
    void returnsNullWhenRangeHeaderIsMissing() {
        assertThat(MediaByteRange.parse(null, 1024)).isNull();
        assertThat(MediaByteRange.parse("   ", 1024)).isNull();
    }

    @Test
    void ignoresUnsupportedRangeUnits() {
        assertThat(MediaByteRange.parse("items=0-10", 1024)).isNull();
    }

    @Test
    void parsesExplicitStartAndEndRange() {
        MediaByteRange range = MediaByteRange.parse("bytes=100-199", 1000);

        assertThat(range.start()).isEqualTo(100);
        assertThat(range.end()).isEqualTo(199);
        assertThat(range.contentLength()).isEqualTo(100);
        assertThat(range.contentRangeValue()).isEqualTo("bytes 100-199/1000");
    }

    @Test
    void parsesOpenEndedRange() {
        MediaByteRange range = MediaByteRange.parse("bytes=900-", 1000);

        assertThat(range.start()).isEqualTo(900);
        assertThat(range.end()).isEqualTo(999);
        assertThat(range.contentLength()).isEqualTo(100);
    }

    @Test
    void parsesSuffixRange() {
        MediaByteRange range = MediaByteRange.parse("bytes=-128", 1000);

        assertThat(range.start()).isEqualTo(872);
        assertThat(range.end()).isEqualTo(999);
        assertThat(range.contentLength()).isEqualTo(128);
    }

    @Test
    void clampsEndToAssetLength() {
        MediaByteRange range = MediaByteRange.parse("bytes=900-1200", 1000);

        assertThat(range.start()).isEqualTo(900);
        assertThat(range.end()).isEqualTo(999);
        assertThat(range.contentLength()).isEqualTo(100);
    }

    @Test
    void rejectsMultipleRanges() {
        assertThatThrownBy(() -> MediaByteRange.parse("bytes=0-10,20-30", 1000))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsStartBeyondAssetLength() {
        assertThatThrownBy(() -> MediaByteRange.parse("bytes=1000-1200", 1000))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsInvalidSuffixLength() {
        assertThatThrownBy(() -> MediaByteRange.parse("bytes=-0", 1000))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
