package com.machinerylog.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;

public record AuditLogDto(
    Long id,
    Long actorUserId,
    String action,
    String entityType,
    Long entityId,
    JsonNode oldValues,
    JsonNode newValues,
    String reason,
    UUID requestId,
    Instant createdAt
) { }
