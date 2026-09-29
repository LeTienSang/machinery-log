package com.machinerylog.dto;

import com.machinerylog.entity.UserRole;

public record UserDto(
    Long id,
    String username,
    String displayName,
    UserRole role,
    boolean active
) { }