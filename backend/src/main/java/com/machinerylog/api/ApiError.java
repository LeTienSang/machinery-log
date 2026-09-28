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
}