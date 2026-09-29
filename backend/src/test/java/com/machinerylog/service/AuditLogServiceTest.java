package com.machinerylog.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.machinerylog.entity.AuditLog;
import com.machinerylog.repository.AuditLogRepository;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class AuditLogServiceTest {
    @Mock private AuditLogRepository audits;
    private AuditLogService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new AuditLogService(audits);
    }

    @Test
    void recordsBusinessActionAndValidRequestId() throws Exception {
        String requestId = UUID.randomUUID().toString();
        var newValues = new ObjectMapper().readTree("{\"status\":\"APPROVED\"}");

        service.record(7L, "APPROVE", "DailyLog", 10L, null, newValues, "reviewed", requestId);

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(audits).save(captor.capture());
        AuditLog saved = captor.getValue();
        assertEquals(7L, saved.getActorUserId());
        assertEquals("APPROVE", saved.getAction());
        assertEquals("DailyLog", saved.getEntityType());
        assertEquals(10L, saved.getEntityId());
        assertEquals(newValues, saved.getNewValues());
        assertEquals(UUID.fromString(requestId), saved.getRequestId());
    }
}
