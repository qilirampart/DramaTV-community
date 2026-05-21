package com.dramatv.community.shared.request;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class TraceIdFilter extends OncePerRequestFilter {

    public static final String TRACE_ID_HEADER = "X-Trace-Id";
    private static final String TRACEPARENT_HEADER = "traceparent";
    private static final Pattern TRACE_ID_PATTERN = Pattern.compile("^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$");
    private static final Pattern HEX_32_PATTERN = Pattern.compile("^[0-9a-f]{32}$");
    private static final String TRACE_ID_MDC_KEY = "traceId";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String traceId = resolveTraceId(request);

        TraceIdContext.set(traceId);
        MDC.put(TRACE_ID_MDC_KEY, traceId);
        response.setHeader(TRACE_ID_HEADER, traceId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(TRACE_ID_MDC_KEY);
            TraceIdContext.clear();
        }
    }

    private String resolveTraceId(HttpServletRequest request) {
        String traceparentTraceId = extractTraceparentTraceId(request.getHeader(TRACEPARENT_HEADER));
        if (traceparentTraceId != null) {
            return traceparentTraceId;
        }

        String headerTraceId = normalizeCustomTraceId(request.getHeader(TRACE_ID_HEADER));
        if (headerTraceId != null) {
            return headerTraceId;
        }

        return UUID.randomUUID().toString().replace("-", "");
    }

    private String extractTraceparentTraceId(String traceparent) {
        if (traceparent == null) {
            return null;
        }

        String[] segments = traceparent.trim().split("-");
        if (segments.length != 4) {
            return null;
        }

        String traceId = segments[1].toLowerCase();
        if (!HEX_32_PATTERN.matcher(traceId).matches()) {
            return null;
        }

        return isAllZeros(traceId) ? null : traceId;
    }

    private String normalizeCustomTraceId(String traceId) {
        if (traceId == null) {
            return null;
        }

        String candidate = traceId.trim();
        if (candidate.isEmpty() || !TRACE_ID_PATTERN.matcher(candidate).matches()) {
            return null;
        }

        return candidate;
    }

    private boolean isAllZeros(String traceId) {
        for (int index = 0; index < traceId.length(); index++) {
            if (traceId.charAt(index) != '0') {
                return false;
            }
        }
        return true;
    }
}
