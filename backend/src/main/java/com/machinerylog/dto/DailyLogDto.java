package com.machinerylog.dto;

import com.machinerylog.entity.ApprovalStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyLogDto(
    Long id,
    @NotNull Long contractId,
    @NotNull Long equipmentId,
    @NotNull LocalDate workDate,
    String morningStartTime,
    String morningEndTime,
    String afternoonStartTime,
    String afternoonEndTime,
    String eveningStartTime,
    String eveningEndTime,
    @DecimalMin("0.0") BigDecimal operatingHours,
    @DecimalMin("0.0") BigDecimal standbyHours,
    String workDescription,
    Long operatorId,
    String operatorName,
    Long reviewerId,
    String reviewerName,
    String originalImageUrl,
    ApprovalStatus approvalStatus,
    String rejectionReason
) { }