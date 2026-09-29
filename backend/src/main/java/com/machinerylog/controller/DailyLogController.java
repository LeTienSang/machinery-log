package com.machinerylog.controller;

import com.machinerylog.dto.DailyLogApprovalRequest;
import com.machinerylog.dto.DailyLogDto;
import com.machinerylog.dto.DailyLogReopenRequest;
import com.machinerylog.entity.User;
import com.machinerylog.service.DailyLogService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/daily-logs")
public class DailyLogController {
    private final DailyLogService dailyLogs;

    public DailyLogController(DailyLogService dailyLogs) { this.dailyLogs = dailyLogs; }

    @PostMapping("/batch-save")
    @PreAuthorize("hasRole('ACCOUNTANT_ADMIN')")
    public ResponseEntity<List<DailyLogDto>> batchSave(@RequestBody List<@Valid DailyLogDto> requests) {
        return ResponseEntity.ok(dailyLogs.batchSave(requests));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OPERATOR', 'ACCOUNTANT_ADMIN')")
    public ResponseEntity<org.springframework.data.domain.Page<DailyLogDto>> search(@RequestParam(required = false) Long contractId,
                                    @RequestParam(required = false) Long equipmentId,
                                    @RequestParam(required = false) String month,
                                    @RequestParam(required = false) String approvalStatus,
                                    @PageableDefault(page = 0, size = 50) Pageable pageable) {
        Pageable bounded = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 100), pageable.getSort());
        var page = dailyLogs.search(contractId, equipmentId, month, approvalStatus, bounded);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OPERATOR', 'ACCOUNTANT_ADMIN')")
    public ResponseEntity<DailyLogDto> get(@PathVariable Long id) {
        return ResponseEntity.ok(dailyLogs.get(id));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ACCOUNTANT_ADMIN')")
    public ResponseEntity<ApiError> approve(@PathVariable Long id,
                                               @Valid @RequestBody DailyLogApprovalRequest request,
                                               @AuthenticationPrincipal User reviewer) {
        return ResponseEntity.ok(dailyLogs.approve(id, request, reviewer.getId()));
    }

    @PostMapping("/{id}/reopen")
    @PreAuthorize("hasRole('ACCOUNTANT_ADMIN')")
    public ResponseEntity<ApiError> reopen(@PathVariable Long id,
                                              @Valid @RequestBody DailyLogReopenRequest request,
                                              @AuthenticationPrincipal User reviewer) {
        return ResponseEntity.ok(dailyLogs.reopen(id, request, reviewer.getId()));
    }
}