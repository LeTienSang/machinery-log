package com.machinerylog.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "actor_user_id") private Long actorUserId;
    @Column(nullable = false, length = 50) private String action;
    @Column(name = "entity_type", nullable = false, length = 100) private String entityType;
    @Column(name = "entity_id", nullable = false) private Long entityId;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "old_values", columnDefinition = "jsonb") private JsonNode oldValues;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "new_values", columnDefinition = "jsonb") private JsonNode newValues;
    @Column private String reason;
    @Column(name = "request_id") private UUID requestId;
    @Column(name = "created_at", nullable = false) private Instant createdAt;

    public AuditLog() { }

    public Long getId() { return id; }
    public Long getActorUserId() { return actorUserId; }
    public String getAction() { return action; }
    public String getEntityType() { return entityType; }
    public Long getEntityId() { return entityId; }
    public JsonNode getOldValues() { return oldValues; }
    public JsonNode getNewValues() { return newValues; }
    public String getReason() { return reason; }
    public UUID getRequestId() { return requestId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setActorUserId(Long value) { actorUserId = value; }
    public void setAction(String value) { action = value; }
    public void setEntityType(String value) { entityType = value; }
    public void setEntityId(Long value) { entityId = value; }
    public void setOldValues(JsonNode value) { oldValues = value; }
    public void setNewValues(JsonNode value) { newValues = value; }
    public void setReason(String value) { reason = value; }
    public void setRequestId(UUID value) { requestId = value; }
    public void setCreatedAt(Instant value) { createdAt = value; }
}
