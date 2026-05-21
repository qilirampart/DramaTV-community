package com.dramatv.community.shared.config;

import com.dramatv.community.shared.request.RequestBusinessContextInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class RequestBusinessContextConfig implements WebMvcConfigurer {

    private final RequestBusinessContextInterceptor requestBusinessContextInterceptor;

    public RequestBusinessContextConfig(RequestBusinessContextInterceptor requestBusinessContextInterceptor) {
        this.requestBusinessContextInterceptor = requestBusinessContextInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(requestBusinessContextInterceptor)
                .addPathPatterns("/api/**");
    }
}
