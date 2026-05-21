package com.dramatv.community.shared.error;

import com.dramatv.community.shared.request.RequestIdContext;
import com.dramatv.community.shared.request.RequestBusinessContextInterceptor;
import com.dramatv.community.shared.request.MdcBusinessContextScope;
import com.dramatv.community.shared.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);
    private static final Pattern CODE_PATTERN = Pattern.compile("^[A-Z0-9_]+$");

    @ExceptionHandler(ApiBusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(
            ApiBusinessException ex,
            HttpServletRequest request
    ) {
        return respond(ex.status(), ex.code(), ex.safeMessage(), request, ex, ex.status().is5xxServerError());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::formatFieldError)
                .distinct()
                .limit(3)
                .collect(Collectors.joining("; "));

        if (message.isBlank()) {
            message = "request validation failed";
        }

        return respond(HttpStatus.BAD_REQUEST, "REQUEST_VALIDATION_FAILED", message, request, ex, false);
    }

    @ExceptionHandler({
            ConstraintViolationException.class,
            MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class,
            HttpMessageNotReadableException.class
    })
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(
            Exception ex,
            HttpServletRequest request
    ) {
        String message;
        if (ex instanceof ConstraintViolationException constraintViolationException) {
            message = constraintViolationException.getConstraintViolations()
                    .stream()
                    .map(violation -> violation.getPropertyPath() + " " + violation.getMessage())
                    .distinct()
                    .limit(3)
                    .collect(Collectors.joining("; "));
        } else if (ex instanceof MissingServletRequestParameterException missingServletRequestParameterException) {
            message = missingServletRequestParameterException.getParameterName() + " is required";
        } else if (ex instanceof MethodArgumentTypeMismatchException methodArgumentTypeMismatchException) {
            message = defaultString(methodArgumentTypeMismatchException.getName(), "parameter") + " is invalid";
        } else if (ex instanceof HttpMessageNotReadableException) {
            message = "request body is invalid";
        } else {
            message = "invalid request";
        }

        if (message.isBlank()) {
            message = "invalid request";
        }

        return respond(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", message, request, ex, false);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request
    ) {
        String rawMessage = defaultString(ex.getMessage(), "INVALID_REQUEST");
        String code = isCodeLiteral(rawMessage) ? rawMessage : "INVALID_REQUEST";
        String message = isCodeLiteral(rawMessage) ? humanizeCode(rawMessage) : rawMessage;

        return respond(HttpStatus.BAD_REQUEST, code, message, request, ex, false);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResourceFound(
            NoResourceFoundException ex,
            HttpServletRequest request
    ) {
        return respond(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", "resource not found", request, ex, false);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatus(
            ResponseStatusException ex,
            HttpServletRequest request
    ) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        String code = switch (status) {
            case NOT_FOUND -> "RESOURCE_NOT_FOUND";
            case REQUESTED_RANGE_NOT_SATISFIABLE -> "MEDIA_RANGE_NOT_SATISFIABLE";
            case BAD_GATEWAY -> "MEDIA_PROXY_FAILED";
            default -> status.name();
        };

        String message = ex.getReason();
        if (message == null || message.isBlank()) {
            message = switch (status) {
                case NOT_FOUND -> "resource not found";
                case REQUESTED_RANGE_NOT_SATISFIABLE -> "requested media range is invalid";
                case BAD_GATEWAY -> "media proxy failed";
                default -> humanizeCode(code);
            };
        }

        return respond(status, code, message, request, ex, status.is5xxServerError());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnhandled(
            Exception ex,
            HttpServletRequest request
    ) {
        return respond(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                "internal server error",
                request,
                ex,
                true
        );
    }

    private ResponseEntity<ApiResponse<Void>> respond(
            HttpStatus status,
            String code,
            String message,
            HttpServletRequest request,
            Exception ex,
            boolean errorLog
    ) {
        String requestId = RequestIdContext.currentOrFallback();
        try (MdcBusinessContextScope ignored =
                     MdcBusinessContextScope.open(RequestBusinessContextInterceptor.getRequestContext(request))) {
            if (errorLog) {
                log.error(
                        "api_error status={} code={} requestId={} method={} path={} message={}",
                        status.value(),
                        code,
                        requestId,
                        request.getMethod(),
                        request.getRequestURI(),
                        ex.getMessage(),
                        ex
                );
            } else {
                log.warn(
                        "api_error status={} code={} requestId={} method={} path={} message={}",
                        status.value(),
                        code,
                        requestId,
                        request.getMethod(),
                        request.getRequestURI(),
                        ex.getMessage()
                );
            }
        }

        return ResponseEntity.status(status).body(ApiResponse.failure(code, message));
    }

    private String formatFieldError(FieldError error) {
        return error.getField() + " " + defaultString(error.getDefaultMessage(), "is invalid");
    }

    private boolean isCodeLiteral(String value) {
        return CODE_PATTERN.matcher(value).matches();
    }

    private String humanizeCode(String code) {
        return code.toLowerCase(Locale.ROOT).replace('_', ' ');
    }

    private String defaultString(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
