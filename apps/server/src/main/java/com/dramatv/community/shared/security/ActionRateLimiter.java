package com.dramatv.community.shared.security;

import com.dramatv.community.shared.error.ApiBusinessException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.DigestUtils;
import org.springframework.util.StringUtils;

@Component
public class ActionRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(ActionRateLimiter.class);
    private static final String KEY_PREFIX = "dramatv:rate-limit";

    private final StringRedisTemplate stringRedisTemplate;
    private final ActionRateLimitProperties properties;

    public ActionRateLimiter(
            StringRedisTemplate stringRedisTemplate,
            ActionRateLimitProperties properties
    ) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.properties = properties;
    }

    public void checkLogin(String clientIp, String username) {
        enforce(
                "auth-login",
                normalize(clientIp) + "|" + normalize(username),
                properties.getLogin(),
                "AUTH_RATE_LIMITED",
                "too many login attempts, please try again later"
        );
    }

    public void checkReport(UUID userId) {
        checkReport(userId, null);
    }

    public void checkReport(UUID userId, String roleCode) {
        if (isPrivilegedReportActor(roleCode)) {
            return;
        }

        enforce(
                "report-create",
                userId == null ? "anonymous" : userId.toString(),
                properties.getReport(),
                "REPORT_RATE_LIMITED",
                "reporting too fast, please try again later"
        );
    }

    public void checkUploadPolicy(UUID userId) {
        enforce(
                "upload-policy",
                userId == null ? "anonymous" : userId.toString(),
                properties.getUploadPolicy(),
                "UPLOAD_RATE_LIMITED",
                "uploading too fast, please try again later"
        );
    }

    public void checkUploadBinary(UUID userId) {
        enforce(
                "upload-binary",
                userId == null ? "anonymous" : userId.toString(),
                properties.getUploadBinary(),
                "UPLOAD_RATE_LIMITED",
                "uploading too fast, please try again later"
        );
    }

    private void enforce(
            String scope,
            String subject,
            ActionRateLimitProperties.Rule rule,
            String code,
            String safeMessage
    ) {
        if (!properties.isEnabled() || rule == null || !rule.active()) {
            return;
        }

        String fingerprintHash = DigestUtils.md5DigestAsHex(
                normalize(subject).getBytes(StandardCharsets.UTF_8)
        );
        String redisKey = KEY_PREFIX + ":" + scope + ":" + fingerprintHash;

        try {
            Long attempts = stringRedisTemplate.opsForValue().increment(redisKey);
            if (attempts == null) {
                return;
            }

            Duration window = Duration.ofSeconds(rule.getWindowSeconds());
            if (attempts == 1L || !Boolean.TRUE.equals(stringRedisTemplate.expire(redisKey, window))) {
                stringRedisTemplate.expire(redisKey, window);
            }

            if (attempts > rule.getMaxAttempts()) {
                log.warn(
                        "action_rate_limited scope={} fingerprintHash={} attempts={} limit={}",
                        scope,
                        fingerprintHash,
                        attempts,
                        rule.getMaxAttempts()
                );
                throw ApiBusinessException.tooManyRequests(code, safeMessage);
            }
        } catch (ApiBusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn(
                    "action_rate_limit_bypass scope={} fingerprintHash={} reason={}",
                    scope,
                    fingerprintHash,
                    ex.getClass().getSimpleName()
            );
        }
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim().toLowerCase() : "unknown";
    }

    private boolean isPrivilegedReportActor(String roleCode) {
        String normalizedRole = roleCode == null ? "" : roleCode.trim().toLowerCase(Locale.ROOT);
        return "admin".equals(normalizedRole)
                || "operator".equals(normalizedRole)
                || "moderator".equals(normalizedRole);
    }
}
