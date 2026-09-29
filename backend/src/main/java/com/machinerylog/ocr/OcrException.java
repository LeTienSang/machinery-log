package com.machinerylog.ocr;

public class OcrException extends RuntimeException {
    private final boolean timeout;
    private final boolean rateLimited;

    public OcrException(String message, boolean timeout, Throwable cause) {
        this(message, timeout, false, cause);
    }

    public OcrException(String message, boolean timeout, boolean rateLimited, Throwable cause) {
        super(message, cause);
        this.timeout = timeout;
        this.rateLimited = rateLimited;
    }

    public boolean isTimeout() { return timeout; }
    public boolean isRateLimited() { return rateLimited; }
}
