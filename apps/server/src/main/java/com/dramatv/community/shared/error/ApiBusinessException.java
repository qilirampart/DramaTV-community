package com.dramatv.community.shared.error;

import org.springframework.http.HttpStatus;

public class ApiBusinessException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    private final String safeMessage;

    public ApiBusinessException(HttpStatus status, String code, String safeMessage) {
        super(safeMessage);
        this.status = status;
        this.code = code;
        this.safeMessage = safeMessage;
    }

    public static ApiBusinessException badRequest(String code, String safeMessage) {
        return new ApiBusinessException(HttpStatus.BAD_REQUEST, code, safeMessage);
    }

    public static ApiBusinessException forbidden(String code, String safeMessage) {
        return new ApiBusinessException(HttpStatus.FORBIDDEN, code, safeMessage);
    }

    public static ApiBusinessException conflict(String code, String safeMessage) {
        return new ApiBusinessException(HttpStatus.CONFLICT, code, safeMessage);
    }

    public static ApiBusinessException tooManyRequests(String code, String safeMessage) {
        return new ApiBusinessException(HttpStatus.TOO_MANY_REQUESTS, code, safeMessage);
    }

    public static ApiBusinessException notFound(String code, String safeMessage) {
        return new ApiBusinessException(HttpStatus.NOT_FOUND, code, safeMessage);
    }

    public static ApiBusinessException internalError(String code, String safeMessage) {
        return new ApiBusinessException(HttpStatus.INTERNAL_SERVER_ERROR, code, safeMessage);
    }

    public HttpStatus status() {
        return status;
    }

    public String code() {
        return code;
    }

    public String safeMessage() {
        return safeMessage;
    }
}
