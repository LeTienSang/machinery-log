package com.machinerylog.ocr;

import java.math.BigDecimal;

/**
 * Fallback provider when OCR service is unavailable, timed out, or quota exceeded.
 * Creates an empty, editable draft so that operators are not blocked from submitting daily logs.
 */
public class OcrFallbackHandler {

    public static OcrResult createFallbackResult() {
        return new OcrResult(
            null, // morningStartTime
            null, // morningEndTime
            null, // afternoonStartTime
            null, // afternoonEndTime
            null, // eveningStartTime
            null, // eveningEndTime
            BigDecimal.ZERO, // operatingHours
            BigDecimal.ZERO, // standbyHours
            "Dữ liệu nhập thủ công (AI OCR tạm thời không khả dụng)", // workDescription
            null  // operatorName
        );
    }
}
