package com.dramatv.community.shared.request;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

@Component
public class RequestBusinessContextInterceptor implements HandlerInterceptor {

    public static final String REQUEST_ATTRIBUTE_CONTEXT_MAP =
            RequestBusinessContextInterceptor.class.getName() + ".contextMap";
    public static final String REQUEST_ATTRIBUTE_CONTEXT_KEYS =
            RequestBusinessContextInterceptor.class.getName() + ".contextKeys";
    public static final String REQUEST_ATTRIBUTE_BIZ_CONTEXT =
            RequestBusinessContextInterceptor.class.getName() + ".bizContext";

    private static final String BIZ_CONTEXT_MDC_KEY = "bizContext";
    private static final List<String> CONTEXT_OUTPUT_ORDER = List.of(
            "videoId",
            "workflowId",
            "promptId",
            "postId",
            "draftId",
            "commentId",
            "runtimeId",
            "copyTaskId",
            "reportId",
            "taskId",
            "assetId",
            "managedUserId",
            "creatorId",
            "auditLogId",
            "threadSlug",
            "targetType",
            "targetId"
    );
    private static final List<String> QUERY_PARAMETER_KEYS = List.of(
            "videoId",
            "workflowId",
            "draftId",
            "commentId",
            "runtimeId",
            "copyTaskId",
            "reportId",
            "taskId",
            "assetId",
            "targetType",
            "targetId"
    );

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Map<String, String> context = buildContext(request);
        if (context.isEmpty()) {
            return true;
        }

        List<String> appliedKeys = new ArrayList<>();
        for (Map.Entry<String, String> entry : context.entrySet()) {
            if (!StringUtils.hasText(entry.getValue())) {
                continue;
            }
            MDC.put(entry.getKey(), entry.getValue());
            appliedKeys.add(entry.getKey());
        }

        String bizContext = joinBizContext(context);
        if (StringUtils.hasText(bizContext)) {
            MDC.put(BIZ_CONTEXT_MDC_KEY, bizContext);
            appliedKeys.add(BIZ_CONTEXT_MDC_KEY);
            request.setAttribute(REQUEST_ATTRIBUTE_BIZ_CONTEXT, bizContext);
        }

        request.setAttribute(REQUEST_ATTRIBUTE_CONTEXT_MAP, context);
        request.setAttribute(REQUEST_ATTRIBUTE_CONTEXT_KEYS, List.copyOf(appliedKeys));
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        Object keysAttribute = request.getAttribute(REQUEST_ATTRIBUTE_CONTEXT_KEYS);
        if (!(keysAttribute instanceof List<?> keys)) {
            return;
        }

        for (Object key : keys) {
            if (key instanceof String stringKey) {
                MDC.remove(stringKey);
            }
        }
    }

    @SuppressWarnings("unchecked")
    public static Map<String, String> getRequestContext(HttpServletRequest request) {
        Object attribute = request.getAttribute(REQUEST_ATTRIBUTE_CONTEXT_MAP);
        if (attribute instanceof Map<?, ?> map) {
            Map<String, String> result = new LinkedHashMap<>();
            map.forEach((key, value) -> {
                if (key instanceof String stringKey && value instanceof String stringValue) {
                    result.put(stringKey, stringValue);
                }
            });
            return result;
        }
        return Map.of();
    }

    public static String getBizContext(HttpServletRequest request) {
        Object attribute = request.getAttribute(REQUEST_ATTRIBUTE_BIZ_CONTEXT);
        return attribute instanceof String value ? value : null;
    }

    private Map<String, String> buildContext(HttpServletRequest request) {
        LinkedHashMap<String, String> context = new LinkedHashMap<>();
        capturePathVariables(request, context);
        captureQueryParameters(request, context);
        deriveTargetAliases(context);
        return context;
    }

    @SuppressWarnings("unchecked")
    private void capturePathVariables(HttpServletRequest request, Map<String, String> context) {
        Object attribute = request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        if (!(attribute instanceof Map<?, ?> rawVariables)) {
            return;
        }

        String pattern = bestMatchingPattern(request);
        for (Map.Entry<?, ?> entry : rawVariables.entrySet()) {
            if (!(entry.getKey() instanceof String rawKey) || !(entry.getValue() instanceof String rawValue)) {
                continue;
            }

            String normalizedKey = normalizePathVariableKey(rawKey, pattern);
            if (!StringUtils.hasText(normalizedKey) || !StringUtils.hasText(rawValue)) {
                continue;
            }
            context.putIfAbsent(normalizedKey, rawValue.trim());
        }
    }

    private void captureQueryParameters(HttpServletRequest request, Map<String, String> context) {
        for (String key : QUERY_PARAMETER_KEYS) {
            String value = request.getParameter(key);
            if (StringUtils.hasText(value)) {
                context.putIfAbsent(key, value.trim());
            }
        }
    }

    private void deriveTargetAliases(Map<String, String> context) {
        String targetType = context.get("targetType");
        String targetId = context.get("targetId");
        if (!StringUtils.hasText(targetType) || !StringUtils.hasText(targetId)) {
            return;
        }

        String normalizedTargetType = targetType.trim().toLowerCase(Locale.ROOT);
        switch (normalizedTargetType) {
            case "video" -> context.putIfAbsent("videoId", targetId);
            case "workflow" -> context.putIfAbsent("workflowId", targetId);
            case "prompt" -> context.putIfAbsent("promptId", targetId);
            case "post" -> context.putIfAbsent("postId", targetId);
            case "comment" -> context.putIfAbsent("commentId", targetId);
            default -> {
            }
        }
    }

    private String joinBizContext(Map<String, String> context) {
        StringBuilder builder = new StringBuilder();
        for (String key : CONTEXT_OUTPUT_ORDER) {
            String value = context.get(key);
            if (!StringUtils.hasText(value)) {
                continue;
            }
            if (builder.length() > 0) {
                builder.append(',');
            }
            builder.append(key).append('=').append(value);
        }
        return builder.toString();
    }

    private String normalizePathVariableKey(String rawKey, String pattern) {
        return switch (rawKey) {
            case "commentId" -> "commentId";
            case "reportId" -> "reportId";
            case "taskId" -> "taskId";
            case "copyTaskId" -> "copyTaskId";
            case "assetId" -> "assetId";
            case "userId" -> "managedUserId";
            case "logId" -> "auditLogId";
            case "slug" -> "threadSlug";
            case "targetType" -> "targetType";
            case "targetId" -> "targetId";
            case "id" -> aliasForGenericId(pattern);
            default -> rawKey;
        };
    }

    private String aliasForGenericId(String pattern) {
        if (!StringUtils.hasText(pattern)) {
            return "id";
        }

        if (pattern.startsWith("/api/video-drafts/{id}")
                || pattern.startsWith("/api/workflow-drafts/{id}")
                || pattern.startsWith("/api/post-drafts/{id}")) {
            return "draftId";
        }
        if (pattern.startsWith("/api/videos/{id}")) {
            return "videoId";
        }
        if (pattern.startsWith("/api/workflows/{id}")) {
            return "workflowId";
        }
        if (pattern.startsWith("/api/canvas-runtimes/{id}")) {
            return "runtimeId";
        }
        if (pattern.startsWith("/api/canvas-copy-tasks/{id}")) {
            return "copyTaskId";
        }
        if (pattern.startsWith("/api/media-tasks/{id}")) {
            return "taskId";
        }
        if (pattern.startsWith("/api/creators/{id}")) {
            return "creatorId";
        }
        return "id";
    }

    private String bestMatchingPattern(HttpServletRequest request) {
        Object attribute = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        return attribute instanceof String pattern ? pattern : request.getRequestURI();
    }
}
