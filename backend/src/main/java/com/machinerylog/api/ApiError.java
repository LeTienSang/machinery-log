package com.machinerylog.api;

import java.util.Map;

public record ApiError(
    boolean success,
    Object data,
    String message,
    String errorCode,
    String requestId,
    Map<String, String> fieldErrors
) {
    public ApiError(String message, String errorCode, String requestId) {
        this(false, null, message, errorCode, requestId, Map.of());
    }
    
    public ApiError(Object data, String message, String requestId) {
        this(true, data, message, null, requestId, Map.of());
    }
    
    public ApiError(Object data, String message) {
        this(true, data, message, null, RequestIdContext.current(), Map.of());
    }
    
    public ApiError(Object data, String message, String requestId, Map<String, String> fieldErrors) {
        this(true, data, message, null, requestId, fieldErrors);
    }
}