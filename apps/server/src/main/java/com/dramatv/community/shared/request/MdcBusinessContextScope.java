package com.dramatv.community.shared.request;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.slf4j.MDC;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

public final class MdcBusinessContextScope implements AutoCloseable {

    private static final String BIZ_CONTEXT_KEY = "bizContext";
    private static final List<String> OUTPUT_ORDER = List.of(
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

    private final Map<String, String> previousValues = new LinkedHashMap<>();
    private final List<String> changedKeys = new ArrayList<>();

    private MdcBusinessContextScope(Map<String, String> context) {
        LinkedHashMap<String, String> resolvedContext = new LinkedHashMap<>();
        context.forEach((key, value) -> {
            if (StringUtils.hasText(key) && StringUtils.hasText(value)) {
                resolvedContext.put(key, value.trim());
            }
        });
        deriveTargetAliases(resolvedContext);
        LinkedHashMap<String, String> mergedContext = currentBusinessContext();
        mergedContext.putAll(resolvedContext);
        deriveTargetAliases(mergedContext);

        for (Map.Entry<String, String> entry : resolvedContext.entrySet()) {
            String key = entry.getKey();
            previousValues.put(key, MDC.get(key));
            MDC.put(key, entry.getValue());
            changedKeys.add(key);
        }

        String bizContext = joinBizContext(mergedContext);
        if (StringUtils.hasText(bizContext)) {
            previousValues.put(BIZ_CONTEXT_KEY, MDC.get(BIZ_CONTEXT_KEY));
            MDC.put(BIZ_CONTEXT_KEY, bizContext);
            changedKeys.add(BIZ_CONTEXT_KEY);
        }

        mergeIntoCurrentRequest(resolvedContext);
    }

    public static MdcBusinessContextScope open(Map<String, String> context) {
        return new MdcBusinessContextScope(context == null ? Map.of() : context);
    }

    @Override
    public void close() {
        for (int index = changedKeys.size() - 1; index >= 0; index--) {
            String key = changedKeys.get(index);
            String previous = previousValues.get(key);
            if (previous == null) {
                MDC.remove(key);
            } else {
                MDC.put(key, previous);
            }
        }
    }

    private static void deriveTargetAliases(Map<String, String> context) {
        String targetType = context.get("targetType");
        String targetId = context.get("targetId");
        if (!StringUtils.hasText(targetType) || !StringUtils.hasText(targetId)) {
            return;
        }

        switch (targetType.trim().toLowerCase(Locale.ROOT)) {
            case "video" -> context.putIfAbsent("videoId", targetId);
            case "workflow" -> context.putIfAbsent("workflowId", targetId);
            case "prompt" -> context.putIfAbsent("promptId", targetId);
            case "post" -> context.putIfAbsent("postId", targetId);
            case "comment" -> context.putIfAbsent("commentId", targetId);
            default -> {
            }
        }
    }

    private static String joinBizContext(Map<String, String> context) {
        StringBuilder builder = new StringBuilder();
        for (String key : OUTPUT_ORDER) {
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

    private static LinkedHashMap<String, String> currentBusinessContext() {
        LinkedHashMap<String, String> context = new LinkedHashMap<>();
        for (String key : OUTPUT_ORDER) {
            String value = MDC.get(key);
            if (StringUtils.hasText(value)) {
                context.put(key, value.trim());
            }
        }
        deriveTargetAliases(context);
        return context;
    }

    private static void mergeIntoCurrentRequest(Map<String, String> context) {
        if (context.isEmpty()) {
            return;
        }

        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes requestAttributes)) {
            return;
        }

        LinkedHashMap<String, String> mergedContext = new LinkedHashMap<>(
                RequestBusinessContextInterceptor.getRequestContext(requestAttributes.getRequest())
        );
        context.forEach((key, value) -> {
            if (StringUtils.hasText(key) && StringUtils.hasText(value)) {
                mergedContext.put(key, value);
            }
        });
        deriveTargetAliases(mergedContext);

        requestAttributes.getRequest().setAttribute(
                RequestBusinessContextInterceptor.REQUEST_ATTRIBUTE_CONTEXT_MAP,
                mergedContext
        );

        String bizContext = joinBizContext(mergedContext);
        if (StringUtils.hasText(bizContext)) {
            requestAttributes.getRequest().setAttribute(
                    RequestBusinessContextInterceptor.REQUEST_ATTRIBUTE_BIZ_CONTEXT,
                    bizContext
            );
        }
    }
}
