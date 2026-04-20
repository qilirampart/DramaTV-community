package com.dramatv.community.shared.config;

import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class MediaResourceConfig implements WebMvcConfigurer {

    private final String mediaLocalDir;

    public MediaResourceConfig(@Value("${dramatv.media.local-dir:tmp/media}") String mediaLocalDir) {
        this.mediaLocalDir = mediaLocalDir;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String mediaLocation = Path.of(mediaLocalDir).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/media/**")
                .addResourceLocations(mediaLocation);
    }
}
