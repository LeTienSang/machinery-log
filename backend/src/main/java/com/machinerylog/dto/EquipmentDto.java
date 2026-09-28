package com.machinerylog.dto;

import jakarta.validation.constraints.NotBlank;

public record EquipmentDto(Long id, @NotBlank String equipmentName, @NotBlank String serialRegistrationNumber,
                           String equipmentType) { }