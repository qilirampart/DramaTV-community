package com.dramatv.community.shared.response;

import com.dramatv.community.shared.request.RequestIdContext;

public record ApiResponse<T>(
        String code,
        String message,
        T data,
        String requestId
) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>("OK", "ok", data, RequestIdContext.currentOrFallback());
    }

    public static <T> ApiResponse<T> failure(String code, String message) {
        return new ApiResponse<>(code, message, null, RequestIdContext.currentOrFallback());
    }
}
