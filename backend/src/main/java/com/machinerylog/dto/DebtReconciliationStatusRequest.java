package com.machinerylog.dto;

import com.machinerylog.entity.DebtReconciliationStatus;
import jakarta.validation.constraints.NotNull;

public record DebtReconciliationStatusRequest(
    @NotNull DebtReconciliationStatus status
) { }
