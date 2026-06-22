package com.dramatv.community.admin.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "dramatv.admin-auth")
public class AdminAuthProperties {

    private boolean allowLocalBootstrap = false;
    private String bootstrapPassword = "";

    public boolean isAllowLocalBootstrap() {
        return allowLocalBootstrap;
    }

    public void setAllowLocalBootstrap(boolean allowLocalBootstrap) {
        this.allowLocalBootstrap = allowLocalBootstrap;
    }

    public String getBootstrapPassword() {
        return bootstrapPassword;
    }

    public void setBootstrapPassword(String bootstrapPassword) {
        this.bootstrapPassword = bootstrapPassword;
    }
}
