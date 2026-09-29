package com.machinerylog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.machinerylog.api.RequestIdContext;
import com.machinerylog.dto.AuditLogDto;
import com.machinerylog.entity.AuditLog;
import com.machinerylog.repository.AuditLogRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {
    private final AuditLogRepository audits;

    public AuditLogService(AuditLogRepository audits) { this.audits = audits; }

    @Transactional
    public void record(Long actorUserId, String action, String entityType, Long entityId,
                       JsonNode oldValues, JsonNode newValues, String reason, String requestId) {
        AuditLog audit = new AuditLog();
        audit.setActorUserId(actorUserId);
        audit.setAction(action);
        audit.setEntityType(entityType);
        audit.setEntityId(entityId);
        audit.setOldValues(oldValues);
        audit.setNewValues(newValues);
        audit.setReason(reason);
        audit.setRequestId(parseRequestId(requestId == null ? RequestIdContext.current() : requestId));
        audit.setCreatedAt(Instant.now());
        audits.save(audit);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> search(String entityType, Long entityId, Long actorUserId,
                                    String action, Instant fromDate, Instant toDate) {
        return audits.search(blankToNull(entityType), entityId, actorUserId, blankToNull(action), fromDate, toDate)
            .stream().map(this::toDto).toList();
    }

    private AuditLogDto toDto(AuditLog value) {
        return new AuditLogDto(value.getId(), value.getActorUserId(), value.getAction(), value.getEntityType(),
            value.getEntityId(), value.getOldValues(), value.getNewValues(), value.getReason(),
            value.getRequestId(), value.getCreatedAt());
    }

    private UUID parseRequestId(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value; }
}
