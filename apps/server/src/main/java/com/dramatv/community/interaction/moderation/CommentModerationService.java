package com.dramatv.community.interaction.moderation;

import com.dramatv.community.shared.error.ApiBusinessException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class CommentModerationService {

    private static final Logger log = LoggerFactory.getLogger(CommentModerationService.class);
    private static final Pattern URL_PATTERN = Pattern.compile("(?i)(https?://|www\\.)");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("(?i)[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}");
    private static final Pattern CONTACT_HINT_PATTERN = Pattern.compile("(?i)(wechat|wx|vx|qq|telegram|tg|discord)");
    private static final Pattern LONG_DIGIT_PATTERN = Pattern.compile("\\d{7,}");
    private static final Pattern REPEATED_CHAR_PATTERN = Pattern.compile("(.)\\1{9,}");

    private final JdbcTemplate jdbcTemplate;
    private final CommentModerationProperties properties;

    public CommentModerationService(
            JdbcTemplate jdbcTemplate,
            CommentModerationProperties properties
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.properties = properties;
    }

    public CommentModerationDecision moderate(
            UUID authorId,
            String targetType,
            UUID targetId,
            String content
    ) {
        if (!properties.isEnabled()) {
            return CommentModerationDecision.visible("COMMENT_ALLOWED");
        }

        if (content.length() > properties.getMaxLength()) {
            throw ApiBusinessException.badRequest("COMMENT_CONTENT_TOO_LONG", "comment is too long");
        }

        NormalizedComment normalized = normalize(content);

        if (containsAny(normalized.searchText(), properties.getBlockedKeywords())) {
            logModeration("reject", "blocked_keyword", authorId, targetType, targetId);
            throw ApiBusinessException.badRequest("COMMENT_CONTENT_BLOCKED", "comment contains blocked content");
        }

        if (isBurstLimited(authorId)) {
            logModeration("reject", "rate_limit", authorId, targetType, targetId);
            throw ApiBusinessException.badRequest("COMMENT_RATE_LIMITED", "commenting too fast, please try again later");
        }

        if (isDuplicate(authorId, targetType, targetId, normalized.duplicateFingerprint())) {
            logModeration("reject", "duplicate", authorId, targetType, targetId);
            throw ApiBusinessException.badRequest("COMMENT_DUPLICATE_BLOCKED", "please do not post the same comment repeatedly");
        }

        if (shouldHide(normalized)) {
            logModeration("hide", "suspicious_spam_or_contact", authorId, targetType, targetId);
            return CommentModerationDecision.hidden("COMMENT_AUTO_HIDDEN");
        }

        return CommentModerationDecision.visible("COMMENT_ALLOWED");
    }

    private boolean isBurstLimited(UUID authorId) {
        OffsetDateTime threshold = OffsetDateTime.now().minusSeconds(properties.getBurstWindowSeconds());
        Integer count = jdbcTemplate.queryForObject("""
                select count(*)
                from comments
                where author_id = ?
                  and deleted_at is null
                  and created_at >= ?
                """,
                Integer.class,
                authorId,
                threshold
        );

        return count != null && count >= properties.getBurstMaxComments();
    }

    private boolean isDuplicate(
            UUID authorId,
            String targetType,
            UUID targetId,
            String duplicateFingerprint
    ) {
        OffsetDateTime threshold = OffsetDateTime.now().minusMinutes(properties.getDuplicateWindowMinutes());
        Integer count = jdbcTemplate.queryForObject("""
                select count(*)
                from comments
                where author_id = ?
                  and target_type = ?
                  and target_id = ?
                  and deleted_at is null
                  and created_at >= ?
                  and lower(regexp_replace(content_text, '\\s+', ' ', 'g')) = ?
                """,
                Integer.class,
                authorId,
                targetType,
                targetId,
                threshold,
                duplicateFingerprint
        );

        return count != null && count >= properties.getDuplicateMaxCopies();
    }

    private boolean shouldHide(NormalizedComment normalized) {
        if (containsAny(normalized.searchText(), properties.getHiddenSpamKeywords())) {
            return true;
        }

        if (URL_PATTERN.matcher(normalized.raw()).find() || EMAIL_PATTERN.matcher(normalized.raw()).find()) {
            return true;
        }

        if (CONTACT_HINT_PATTERN.matcher(normalized.searchText()).find()
                && LONG_DIGIT_PATTERN.matcher(normalized.searchText()).find()) {
            return true;
        }

        return REPEATED_CHAR_PATTERN.matcher(normalized.searchText()).find();
    }

    private boolean containsAny(String haystack, List<String> keywords) {
        for (String keyword : keywords) {
            if (keyword == null || keyword.isBlank()) {
                continue;
            }

            if (haystack.contains(normalizeSearchText(keyword))) {
                return true;
            }
        }
        return false;
    }

    private NormalizedComment normalize(String raw) {
        String lower = raw.toLowerCase(Locale.ROOT);
        String collapsedWhitespace = lower.replaceAll("\\s+", " ").trim();
        String searchText = normalizeSearchText(lower);
        return new NormalizedComment(raw, searchText, collapsedWhitespace);
    }

    private String normalizeSearchText(String raw) {
        return raw.toLowerCase(Locale.ROOT).replaceAll("[\\s\\p{P}\\p{S}]+", "");
    }

    private void logModeration(
            String action,
            String reason,
            UUID authorId,
            String targetType,
            UUID targetId
    ) {
        log.info(
                "comment_moderation action={} reason={} authorId={} targetType={} targetId={}",
                action,
                reason,
                authorId,
                targetType,
                targetId
        );
    }

    private record NormalizedComment(
            String raw,
            String searchText,
            String duplicateFingerprint
    ) {
    }

    public record CommentModerationDecision(
            String statusCode,
            String outcomeCode
    ) {
        public static CommentModerationDecision visible(String outcomeCode) {
            return new CommentModerationDecision("active", outcomeCode);
        }

        public static CommentModerationDecision hidden(String outcomeCode) {
            return new CommentModerationDecision("hidden", outcomeCode);
        }

        public boolean hidden() {
            return "hidden".equals(statusCode);
        }
    }
}
