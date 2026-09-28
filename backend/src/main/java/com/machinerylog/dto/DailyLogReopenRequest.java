package com.machinerylog.dto;

import jakarta.validation.constraints.NotBlank;

public record DailyLogReopenRequest(@NotBlank String reopenReason) { }