package com.machinerylog.controller;

import com.machinerylog.dto.AuditLogDto;
import com.machinerylog.service.AuditLogService;
import java.time.Instant;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit-logs")
@PreAuthorize("hasRole('ACCOUNTANT_ADMIN')")
public class AuditLogController {
    private final AuditLogService audits;

    public AuditLogController(AuditLogService audits) { this.audits = audits; }

    @GetMapping
    public ResponseEntity<List<AuditLogDto>> search(
        @RequestParam(required = false) String entityType,
        @RequestParam(required = false) Long entityId,
        @RequestParam(required = false) Long actorUserId,
        @RequestParam(required = false) String action,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return ResponseEntity.ok(audits.search(entityType, entityId, actorUserId, action, from, to));
    }
}
