package com.dramatv.community.shared.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "dramatv.action-rate-limit")
public class ActionRateLimitProperties {

    private boolean enabled = true;
    private final Rule login = new Rule(60, 6);
    private final Rule report = new Rule(60, 5);
    private final Rule uploadPolicy = new Rule(60, 20);
    private final Rule uploadBinary = new Rule(60, 20);

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Rule getLogin() {
        return login;
    }

    public Rule getReport() {
        return report;
    }

    public Rule getUploadPolicy() {
        return uploadPolicy;
    }

    public Rule getUploadBinary() {
        return uploadBinary;
    }

    public static class Rule {

        private int windowSeconds;
        private int maxAttempts;

        public Rule() {
            this(60, 5);
        }

        public Rule(int windowSeconds, int maxAttempts) {
            this.windowSeconds = windowSeconds;
            this.maxAttempts = maxAttempts;
        }

        public int getWindowSeconds() {
            return windowSeconds;
        }

        public void setWindowSeconds(int windowSeconds) {
            this.windowSeconds = windowSeconds;
        }

        public int getMaxAttempts() {
            return maxAttempts;
        }

        public void setMaxAttempts(int maxAttempts) {
            this.maxAttempts = maxAttempts;
        }

        public boolean active() {
            return windowSeconds > 0 && maxAttempts > 0;
        }
    }
}
