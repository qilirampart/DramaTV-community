package com.dramatv.community.shared.request;

public final class TraceIdContext {

    private static final ThreadLocal<String> HOLDER = new ThreadLocal<>();

    private TraceIdContext() {
    }

    public static void set(String traceId) {
        HOLDER.set(traceId);
    }

    public static String currentOrFallback() {
        String traceId = HOLDER.get();
        return traceId == null ? "local-trace" : traceId;
    }

    public static void clear() {
        HOLDER.remove();
    }
}
