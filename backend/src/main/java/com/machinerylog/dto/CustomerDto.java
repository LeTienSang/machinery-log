package com.machinerylog.dto;

import jakarta.validation.constraints.NotBlank;

public record CustomerDto(Long id, @NotBlank String companyName, String taxCode, String representativeName,
                          String position, String phoneNumber, String address) { }