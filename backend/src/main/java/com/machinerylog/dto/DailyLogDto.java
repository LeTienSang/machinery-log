package com.machinerylog.dto;

import com.machinerylog.entity.ApprovalStatus;
import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyLogDto(
    Long id,
    Long contractId,
    Long equipmentId,
    LocalDate workDate,
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