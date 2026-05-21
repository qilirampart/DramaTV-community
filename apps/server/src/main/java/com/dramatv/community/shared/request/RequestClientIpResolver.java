package com.dramatv.community.shared.request;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
public class RequestClientIpResolver {

    public String currentOrFallback() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes requestAttributes)) {
            return "unknown";
        }

        return resolve(requestAttributes.getRequest());
    }

    public String resolve(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (!StringUtils.hasText(forwardedFor)) {
            return fallbackRemoteAddr(request.getRemoteAddr());
        }

        int splitIndex = forwardedFor.indexOf(',');
        if (splitIndex < 0) {
            return fallbackRemoteAddr(forwardedFor.trim());
        }

        return fallbackRemoteAddr(forwardedFor.substring(0, splitIndex).trim());
    }

    private String fallbackRemoteAddr(String value) {
        return StringUtils.hasText(value) ? value.trim() : "unknown";
    }
}
