package com.machinerylog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record AdvancePaymentDto(
    Long id,
    Long contractId,
    @NotNull LocalDate documentDate,
    String documentNumber,
    String description,
    @NotNull @DecimalMin(value = "0.0") BigDecimal amount
) { }
