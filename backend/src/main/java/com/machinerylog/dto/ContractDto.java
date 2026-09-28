package com.machinerylog.dto;

import com.machinerylog.entity.ContractStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ContractDto(Long id, @NotNull Long customerId, @NotBlank String contractNumber,
                          LocalDate signingDate, String projectName, String constructionSite,
                          ContractStatus status) { }