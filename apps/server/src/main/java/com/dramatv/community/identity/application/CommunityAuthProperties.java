package com.dramatv.community.identity.application;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "dramatv.community-auth")
public class CommunityAuthProperties {

    private final Provider provider = new Provider();

    public Provider getProvider() {
        return provider;
    }

    public static class Provider {
        private String primary = "local_password";
        private boolean localPasswordEnabled = true;
        private String localPasswordDisplayName = "开发环境账号登录";
        private String localPasswordDescription = "当前用于本地联调，后续会切换到公司统一登录。";

        public String getPrimary() {
            return primary;
        }

        public void setPrimary(String primary) {
            this.primary = primary;
        }

        public boolean isLocalPasswordEnabled() {
            return localPasswordEnabled;
        }

        public void setLocalPasswordEnabled(boolean localPasswordEnabled) {
            this.localPasswordEnabled = localPasswordEnabled;
        }

        public String getLocalPasswordDisplayName() {
            return localPasswordDisplayName;
        }

        public void setLocalPasswordDisplayName(String localPasswordDisplayName) {
            this.localPasswordDisplayName = localPasswordDisplayName;
        }

        public String getLocalPasswordDescription() {
            return localPasswordDescription;
        }

        public void setLocalPasswordDescription(String localPasswordDescription) {
            this.localPasswordDescription = localPasswordDescription;
        }
    }
}
