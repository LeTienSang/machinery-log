package com.machinerylog.dto;

import com.machinerylog.entity.ApprovalStatus;
import jakarta.validation.constraints.NotNull;

public record DailyLogApprovalRequest(
    @NotNull ApprovalStatus approvalStatus,
    String rejectionReason
) { }