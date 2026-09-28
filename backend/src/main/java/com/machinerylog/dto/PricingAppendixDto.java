package com.machinerylog.dto;

import com.machinerylog.entity.PricingType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PricingAppendixDto(
    Long id,
    @NotNull Long contractId,
    @NotNull Long equipmentId,
    @NotNull PricingType pricingType,
    @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal unitPrice,
    String unitOfMeasure
) { }