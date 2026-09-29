package com.machinerylog.controller;

import com.machinerylog.api.ApiError;
import com.machinerylog.service.AuditLogService;
import java.time.Instant;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
    public ResponseEntity<ApiError> search(
        @RequestParam(required = false) String entityType,
        @RequestParam(required = false) Long entityId,
        @RequestParam(required = false) Long actorUserId,
        @RequestParam(required = false) String action,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
        @PageableDefault(page = 0, size = 50) Pageable pageable) {
        Pageable bounded = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 100), pageable.getSort());
        return ResponseEntity.ok(new ApiError(audits.search(entityType, entityId, actorUserId, action, from, to, bounded), "Audit logs retrieved"));
    }
}
