package com.dramatv.community.admin.auth;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

class AdminAuthPropertiesTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(ConfigurationPropertiesAutoConfiguration.class))
            .withUserConfiguration(AdminAuthProperties.class);

    @Test
    void defaultsAreSafe() {
        contextRunner.run(context -> {
            AdminAuthProperties properties = context.getBean(AdminAuthProperties.class);

            assertThat(properties.isAllowLocalBootstrap()).isFalse();
            assertThat(properties.getBootstrapPassword()).isBlank();
        });
    }

    @Test
    void explicitOptInOverridesDefaults() {
        contextRunner
                .withPropertyValues(
                        "dramatv.admin-auth.allow-local-bootstrap=true",
                        "dramatv.admin-auth.bootstrap-password=explicit-test-password"
                )
                .run(context -> {
                    AdminAuthProperties properties = context.getBean(AdminAuthProperties.class);

                    assertThat(properties.isAllowLocalBootstrap()).isTrue();
                    assertThat(properties.getBootstrapPassword()).isEqualTo("explicit-test-password");
                });
    }
}
