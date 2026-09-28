package com.machinerylog.ocr;

public class OcrException extends RuntimeException {
    private final boolean timeout;

    public OcrException(String message, boolean timeout, Throwable cause) {
        super(message, cause);
        this.timeout = timeout;
    }

    public boolean isTimeout() { return timeout; }
}