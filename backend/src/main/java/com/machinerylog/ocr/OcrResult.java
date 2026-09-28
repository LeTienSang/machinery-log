package com.machinerylog.ocr;

import java.math.BigDecimal;

public record OcrResult(
    String morningStartTime,
    String morningEndTime,
    String afternoonStartTime,
    String afternoonEndTime,
    String eveningStartTime,
    String eveningEndTime,
    BigDecimal operatingHours,
    BigDecimal standbyHours,
    String workDescription,
    String operatorName
) { }