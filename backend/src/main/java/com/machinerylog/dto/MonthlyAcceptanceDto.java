package com.machinerylog.dto;

import com.machinerylog.entity.AcceptanceStatus;
import java.math.BigDecimal;

public record MonthlyAcceptanceDto(Long id, Long contractId, Long equipmentId, String billingMonth,
                                   BigDecimal totalOperatingHours, BigDecimal appliedUnitPrice,
                                   BigDecimal subtotalBeforeVat, Integer vatPercentage, BigDecimal vatAmount,
                                   BigDecimal totalAmount, AcceptanceStatus status, Integer exportVersion,
                                   java.time.Instant lastExportedAt, java.time.Instant exportInvalidatedAt) { }