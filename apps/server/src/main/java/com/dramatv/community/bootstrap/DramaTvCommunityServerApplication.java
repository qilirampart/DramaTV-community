package com.dramatv.community.bootstrap;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.dramatv.community")
@EntityScan(basePackages = "com.dramatv.community")
@EnableJpaRepositories(basePackages = "com.dramatv.community")
public class DramaTvCommunityServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(DramaTvCommunityServerApplication.class, args);
    }
}
