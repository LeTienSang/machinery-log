package com.machinerylog.dto;

import com.machinerylog.entity.DebtReconciliationStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

public record DebtReconciliationDto(
    Long id,
    Long contractId,
    LocalDate reconciliationDate,
    BigDecimal previousBalance,
    BigDecimal currentPeriodAcceptance,
    BigDecimal totalPaid,
    BigDecimal remainingBalance,
    DebtReconciliationStatus status
) { }
