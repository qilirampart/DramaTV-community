package com.dramatv.community.shared.request;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class AccessLogFilter extends OncePerRequestFilter {

    private static final Logger accessLog = LoggerFactory.getLogger("com.dramatv.community.access");
    private static final Set<String> SKIP_PATHS = Set.of("/actuator/health", "/actuator/info");
    private final RequestClientIpResolver requestClientIpResolver;

    public AccessLogFilter(RequestClientIpResolver requestClientIpResolver) {
        this.requestClientIpResolver = requestClientIpResolver;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return SKIP_PATHS.contains(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        long startTime = System.nanoTime();

        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startTime);
            List<String> restoredKeys = restoreBusinessContext(request);
            try {
                accessLog.info(
                        "method={} path={} status={} durationMs={} remoteIp={}",
                        request.getMethod(),
                        request.getRequestURI(),
                        response.getStatus(),
                        durationMs,
                        requestClientIpResolver.resolve(request)
                );
            } finally {
                restoredKeys.forEach(MDC::remove);
            }
        }
    }

    private List<String> restoreBusinessContext(HttpServletRequest request) {
        Map<String, String> context = RequestBusinessContextInterceptor.getRequestContext(request);
        if (context.isEmpty()) {
            return List.of();
        }

        List<String> restoredKeys = new ArrayList<>();
        context.forEach((key, value) -> {
            if (StringUtils.hasText(key) && StringUtils.hasText(value)) {
                MDC.put(key, value);
                restoredKeys.add(key);
            }
        });

        String bizContext = RequestBusinessContextInterceptor.getBizContext(request);
        if (StringUtils.hasText(bizContext)) {
            MDC.put("bizContext", bizContext);
            restoredKeys.add("bizContext");
        }

        return restoredKeys;
    }
}
