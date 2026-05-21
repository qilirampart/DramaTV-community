package com.dramatv.community.shared.media;

final class MediaByteRange {

    private final long start;
    private final long end;
    private final long totalLength;

    private MediaByteRange(long start, long end, long totalLength) {
        this.start = start;
        this.end = end;
        this.totalLength = totalLength;
    }

    static MediaByteRange parse(String rangeHeader, long totalLength) {
        if (rangeHeader == null || rangeHeader.isBlank()) {
            return null;
        }

        if (totalLength <= 0) {
            throw new IllegalArgumentException("range requires a positive total length");
        }

        String normalized = rangeHeader.trim();
        if (!normalized.regionMatches(true, 0, "bytes=", 0, 6)) {
            return null;
        }

        String rangeValue = normalized.substring(6).trim();
        if (rangeValue.isEmpty() || rangeValue.contains(",")) {
            throw new IllegalArgumentException("multiple ranges are not supported");
        }

        int dashIndex = rangeValue.indexOf('-');
        if (dashIndex < 0) {
            throw new IllegalArgumentException("range is missing dash separator");
        }

        String startText = rangeValue.substring(0, dashIndex).trim();
        String endText = rangeValue.substring(dashIndex + 1).trim();

        if (startText.isEmpty()) {
            long suffixLength = parsePositiveLong(endText);
            long resolvedLength = Math.min(suffixLength, totalLength);
            long start = totalLength - resolvedLength;
            return new MediaByteRange(start, totalLength - 1, totalLength);
        }

        long start = parseNonNegativeLong(startText);
        if (start >= totalLength) {
            throw new IllegalArgumentException("range start exceeds total length");
        }

        long end = endText.isEmpty() ? totalLength - 1 : parseNonNegativeLong(endText);
        if (end < start) {
            throw new IllegalArgumentException("range end is smaller than range start");
        }

        long normalizedEnd = Math.min(end, totalLength - 1);
        return new MediaByteRange(start, normalizedEnd, totalLength);
    }

    long start() {
        return start;
    }

    long end() {
        return end;
    }

    long totalLength() {
        return totalLength;
    }

    long contentLength() {
        return end - start + 1;
    }

    String contentRangeValue() {
        return "bytes " + start + "-" + end + "/" + totalLength;
    }

    String unsatisfiedContentRangeValue() {
        return "bytes */" + totalLength;
    }

    private static long parsePositiveLong(String value) {
        long parsed = parseNonNegativeLong(value);
        if (parsed <= 0) {
            throw new IllegalArgumentException("suffix length must be positive");
        }
        return parsed;
    }

    private static long parseNonNegativeLong(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("range bound is blank");
        }

        try {
            long parsed = Long.parseLong(value);
            if (parsed < 0) {
                throw new IllegalArgumentException("range bound must be non-negative");
            }
            return parsed;
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("range bound is not a number", exception);
        }
    }
}
