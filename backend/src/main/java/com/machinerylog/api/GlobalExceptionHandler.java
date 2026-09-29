package com.machinerylog.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import com.machinerylog.exception.BusinessException;
import com.machinerylog.exception.ResourceNotFoundException;
import com.machinerylog.ocr.OcrException;
import com.machinerylog.ocr.OcrInputException;
import com.machinerylog.storage.StorageException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(OcrInputException.class)
    ResponseEntity<ApiError> handleOcrInput(OcrInputException exception, HttpServletRequest request) {
        return response(request, HttpStatus.BAD_REQUEST, exception.getErrorCode(), exception.getMessage());
    }
    @ExceptionHandler(OcrException.class)
    ResponseEntity<ApiError> handleOcr(OcrException exception, HttpServletRequest request) {
        HttpStatus status;
        String errorCode;
        if (exception.isTimeout()) {
            status = HttpStatus.GATEWAY_TIMEOUT;
            errorCode = "OCR_SERVICE_TIMEOUT";
        } else if (exception.isRateLimited()) {
            status = HttpStatus.TOO_MANY_REQUESTS;
            errorCode = "OCR_QUOTA_EXCEEDED";
        } else {
            status = HttpStatus.BAD_GATEWAY;
            errorCode = "OCR_SERVICE_ERROR";
        }
        return response(request, status, errorCode, exception.getMessage());
    }


    @ExceptionHandler(StorageException.class)
    ResponseEntity<ApiError> handleStorage(StorageException exception, HttpServletRequest request) {
        return response(request, HttpStatus.BAD_GATEWAY, "STORAGE_SERVICE_ERROR", "Image storage is unavailable");
    }
    @ExceptionHandler(BusinessException.class)
    ResponseEntity<ApiError> handleBusiness(BusinessException exception, HttpServletRequest request) {
        return response(request, HttpStatus.BAD_REQUEST, exception.getErrorCode(), exception.getMessage());
    }
    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException exception, HttpServletRequest request) {
        return response(request, HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", exception.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<ApiError> handleConflict(IllegalStateException exception, HttpServletRequest request) {
        return response(request, HttpStatus.CONFLICT, "INVALID_STATE", exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception,
                                              HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return response(request, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
            "Request validation failed", fieldErrors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException exception,
                                                        HttpServletRequest request) {
        return response(request, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", exception.getMessage());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> handleUnreadableMessage(HttpMessageNotReadableException exception,
                                                      HttpServletRequest request) {
        return response(request, HttpStatus.BAD_REQUEST, "MALFORMED_REQUEST", "Request body is malformed");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException exception,
                                                    HttpServletRequest request) {
        return response(request, HttpStatus.BAD_REQUEST, "INVALID_ARGUMENT",
            exception.getMessage() == null ? "Invalid request" : exception.getMessage());
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> handleUnexpected(Exception exception, HttpServletRequest request) {
        return response(request, HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", "An unexpected error occurred");
    }

    private ResponseEntity<ApiError> response(HttpServletRequest request, HttpStatus status,
                                              String errorCode, String message) {
        return response(request, status, errorCode, message, Map.of());
    }

    private ResponseEntity<ApiError> response(HttpServletRequest request, HttpStatus status,
                                              String errorCode, String message,
                                              Map<String, String> fieldErrors) {
        String requestId = (String) request.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE);
        return ResponseEntity.status(status).body(new ApiError(false, null, message, errorCode, requestId, fieldErrors));
    }
}