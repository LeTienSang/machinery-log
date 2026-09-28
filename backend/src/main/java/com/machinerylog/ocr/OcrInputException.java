package com.machinerylog.ocr;

public class OcrInputException extends RuntimeException {
    private final String errorCode;

    public OcrInputException(String errorCode) {
        super(errorCode);
        this.errorCode = errorCode;
    }

    public String getErrorCode() { return errorCode; }
}