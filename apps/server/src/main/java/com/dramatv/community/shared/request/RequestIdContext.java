package com.dramatv.community.shared.request;

public final class RequestIdContext {

    private static final ThreadLocal<String> HOLDER = new ThreadLocal<>();

    private RequestIdContext() {
    }

    public static void set(String requestId) {
        HOLDER.set(requestId);
    }

    public static String currentOrFallback() {
        String requestId = HOLDER.get();
        return requestId == null ? "local-request" : requestId;
    }

    public static void clear() {
        HOLDER.remove();
    }
}
