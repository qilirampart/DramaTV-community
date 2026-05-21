package com.dramatv.community.shared.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class MediaResourceConfig implements WebMvcConfigurer {

    private final MediaStorageProperties mediaStorageProperties;

    public MediaResourceConfig(MediaStorageProperties mediaStorageProperties) {
        this.mediaStorageProperties = mediaStorageProperties;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        if (!mediaStorageProperties.isServeLocally()) {
            return;
        }

        String mediaLocation = mediaStorageProperties.resolvedLocalDirPath().toUri().toString();
        if (!mediaLocation.endsWith("/")) {
            mediaLocation = mediaLocation + "/";
        }
        registry.addResourceHandler(mediaStorageProperties.normalizedPublicBasePath() + "/**")
                .addResourceLocations(mediaLocation);
    }
}
