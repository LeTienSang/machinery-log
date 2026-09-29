package com.machinerylog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.machinerylog.api.PageResponse;
import com.machinerylog.api.RequestIdContext;
import com.machinerylog.dto.AuditLogDto;
import com.machinerylog.entity.AuditLog;
import com.machinerylog.repository.AuditLogRepository;
import com.machinerylog.repository.UserRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {
    private final AuditLogRepository audits;
    private final UserRepository users;

    public AuditLogService(AuditLogRepository audits) { this(audits, null); }

    @org.springframework.beans.factory.annotation.Autowired
    public AuditLogService(AuditLogRepository audits, UserRepository users) { this.audits = audits; this.users = users; }

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
    public PageResponse<AuditLogDto> search(String entityType, Long entityId, Long actorUserId,
                                    String action, Instant fromDate, Instant toDate,
                                    org.springframework.data.domain.Pageable pageable) {
        return PageResponse.from(audits.search(blankToNull(entityType), entityId, actorUserId, blankToNull(action), fromDate, toDate, pageable)
            .map(this::toDto));
    }

    private AuditLogDto toDto(AuditLog value) {
        String actorUsername = null;
        if (value.getActorUserId() != null && users != null) {
            actorUsername = users.findById(value.getActorUserId())
                .map(user -> user.getDisplayName() != null ? user.getDisplayName() : user.getUsername())
                .orElse(null);
        }
        return new AuditLogDto(value.getId(), value.getActorUserId(), actorUsername, value.getAction(), value.getEntityType(),
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
