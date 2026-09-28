package com.machinerylog.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.machinerylog.dto.DailyLogApprovalRequest;
import com.machinerylog.dto.DailyLogReopenRequest;
import com.machinerylog.entity.ApprovalStatus;
import com.machinerylog.entity.DailyLog;
import com.machinerylog.exception.ResourceNotFoundException;
import com.machinerylog.repository.DailyLogRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class DailyLogServiceTest {
    @Mock
    private DailyLogRepository logs;
    private DailyLogService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new DailyLogService(logs);
    }

    @Test
    void approvesPendingLog() {
        DailyLog log = log(ApprovalStatus.PENDING);
        when(logs.findById(1L)).thenReturn(Optional.of(log));
        when(logs.save(any(DailyLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.approve(1L, new DailyLogApprovalRequest(ApprovalStatus.APPROVED, null), 7L);

        assertEquals(ApprovalStatus.APPROVED, result.approvalStatus());
        assertEquals(7L, log.getReviewerId());
    }

    @Test
    void reopensApprovedLogToPending() {
        DailyLog log = log(ApprovalStatus.APPROVED);
        when(logs.findById(1L)).thenReturn(Optional.of(log));
        when(logs.save(any(DailyLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.reopen(1L, new DailyLogReopenRequest("Cập nhật giờ máy"), 7L);

        assertEquals(ApprovalStatus.PENDING, result.approvalStatus());
        assertEquals("Cập nhật giờ máy", result.rejectionReason());
    }

    @Test
    void rejectsApprovalOfAlreadyProcessedLog() {
        when(logs.findById(1L)).thenReturn(Optional.of(log(ApprovalStatus.REJECTED)));

        assertThrows(IllegalStateException.class,
            () -> service.approve(1L, new DailyLogApprovalRequest(ApprovalStatus.APPROVED, null), 7L));
    }

    @Test
    void returnsNotFoundForUnknownLog() {
        when(logs.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.get(1L));
    }

    private DailyLog log(ApprovalStatus status) {
        DailyLog log = new DailyLog();
        log.setId(1L);
        log.setApprovalStatus(status);
        return log;
    }
}