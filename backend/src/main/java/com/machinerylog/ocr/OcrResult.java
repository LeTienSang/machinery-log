package com.machinerylog.ocr;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
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