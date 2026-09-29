package com.machinerylog.service;

import com.machinerylog.api.PageResponse;
import com.machinerylog.dto.DailyLogApprovalRequest;
import com.machinerylog.dto.DailyLogDto;
import com.machinerylog.dto.DailyLogReopenRequest;
import com.machinerylog.entity.ApprovalStatus;
import com.machinerylog.entity.DailyLog;
import com.machinerylog.exception.ResourceNotFoundException;
import com.machinerylog.repository.DailyLogRepository;
import com.machinerylog.repository.MonthlyAcceptanceRepository;
import com.machinerylog.ocr.OcrResult;
import java.time.LocalDate;
import java.time.Instant;
import java.time.YearMonth;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DailyLogService {
    private final DailyLogRepository logs;
    private final AuditLogService auditLogs;
    private final MonthlyAcceptanceRepository acceptances;

    public DailyLogService(DailyLogRepository logs) { this(logs, null, null); }

    @Autowired
    public DailyLogService(DailyLogRepository logs, AuditLogService auditLogs) {
        this(logs, auditLogs, null);
    }

    public DailyLogService(DailyLogRepository logs, AuditLogService auditLogs,
                           MonthlyAcceptanceRepository acceptances) {
        this.logs = logs;
        this.auditLogs = auditLogs;
        this.acceptances = acceptances;
    }

    @Transactional
    public List<DailyLogDto> batchSave(List<DailyLogDto> requests) {
        return requests.stream().map(request -> toDto(save(request))).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<DailyLogDto> search(Long contractId, Long equipmentId, String month, Pageable pageable) {
        LocalDate fromDate = null;
        LocalDate toDate = null;
        if (month != null && !month.isBlank()) {
            YearMonth yearMonth = YearMonth.parse(month);
            fromDate = yearMonth.atDay(1);
            toDate = yearMonth.plusMonths(1).atDay(1);
        }
        return PageResponse.from(logs.search(contractId, equipmentId, fromDate, toDate, pageable).map(this::toDto));
    }

    @Transactional(readOnly = true)
    public DailyLogDto get(Long id) { return toDto(find(id)); }

    @Transactional
    public DailyLogDto createFromOcr(Long contractId, Long equipmentId, LocalDate workDate,
                                     Long operatorId, String imageUrl, OcrResult result) {
        DailyLog log = new DailyLog();
        log.setContractId(contractId);
        log.setEquipmentId(equipmentId);
        log.setWorkDate(workDate);
        log.setOperatorId(operatorId);
        log.setOriginalImageUrl(imageUrl);
        log.setMorningStartTime(result.morningStartTime());
        log.setMorningEndTime(result.morningEndTime());
        log.setAfternoonStartTime(result.afternoonStartTime());
        log.setAfternoonEndTime(result.afternoonEndTime());
        log.setEveningStartTime(result.eveningStartTime());
        log.setEveningEndTime(result.eveningEndTime());
        log.setOperatingHours(result.operatingHours() == null ? java.math.BigDecimal.ZERO : result.operatingHours());
        log.setStandbyHours(result.standbyHours() == null ? java.math.BigDecimal.ZERO : result.standbyHours());
        log.setWorkDescription(result.workDescription());
        log.setOperatorName(result.operatorName());
        return toDto(logs.save(log));
    }

    @Transactional
    public DailyLogDto approve(Long id, DailyLogApprovalRequest request, Long reviewerId) {
        DailyLog log = find(id);
        if (log.getApprovalStatus() != ApprovalStatus.PENDING) {
            throw new IllegalStateException("Only pending logs can be approved");
        }
        if (request.approvalStatus() == ApprovalStatus.REJECTED
            && (request.rejectionReason() == null || request.rejectionReason().isBlank())) {
            throw new IllegalArgumentException("Rejection reason is required");
        }
        if (request.approvalStatus() == ApprovalStatus.PENDING) {
            throw new IllegalArgumentException("Approval status must be APPROVED or REJECTED");
        }
        log.setApprovalStatus(request.approvalStatus());
        log.setRejectionReason(request.rejectionReason());
        log.setReviewerId(reviewerId);
        DailyLog saved = logs.save(log);
        recordAudit(reviewerId, saved.getApprovalStatus() == ApprovalStatus.APPROVED ? "APPROVE" : "REJECT", saved.getId(), request.rejectionReason());
        return toDto(saved);
    }

    @Transactional
    public DailyLogDto reopen(Long id, DailyLogReopenRequest request, Long reviewerId) {
        DailyLog log = find(id);
        if (log.getApprovalStatus() != ApprovalStatus.APPROVED && log.getApprovalStatus() != ApprovalStatus.REJECTED) {
            throw new IllegalStateException("Only approved or rejected logs can be reopened");
        }
        log.setApprovalStatus(ApprovalStatus.PENDING);
        log.setRejectionReason(request.reopenReason());
        log.setReviewerId(reviewerId);
        DailyLog saved = logs.save(log);
        invalidateAcceptance(saved, request.reopenReason());
        recordAudit(reviewerId, "REOPEN", saved.getId(), request.reopenReason());
        return toDto(saved);
    }

    private DailyLog save(DailyLogDto request) {
        DailyLog log = request.id() == null ? new DailyLog() : find(request.id());
        log.setContractId(request.contractId());
        log.setEquipmentId(request.equipmentId());
        log.setWorkDate(request.workDate());
        log.setMorningStartTime(request.morningStartTime());
        log.setMorningEndTime(request.morningEndTime());
        log.setAfternoonStartTime(request.afternoonStartTime());
        log.setAfternoonEndTime(request.afternoonEndTime());
        log.setEveningStartTime(request.eveningStartTime());
        log.setEveningEndTime(request.eveningEndTime());
        log.setOperatingHours(request.operatingHours() == null ? java.math.BigDecimal.ZERO : request.operatingHours());
        log.setStandbyHours(request.standbyHours() == null ? java.math.BigDecimal.ZERO : request.standbyHours());
        log.setWorkDescription(request.workDescription());
        log.setOperatorName(request.operatorName());
        log.setOriginalImageUrl(request.originalImageUrl());
        return logs.save(log);
    }

    private DailyLog find(Long id) {
        return logs.findById(id).orElseThrow(() -> new ResourceNotFoundException("Daily log not found: " + id));
    }

    private DailyLogDto toDto(DailyLog log) {
        return new DailyLogDto(log.getId(), log.getContractId(), log.getEquipmentId(), log.getWorkDate(),
            log.getMorningStartTime(), log.getMorningEndTime(), log.getAfternoonStartTime(), log.getAfternoonEndTime(),
            log.getEveningStartTime(), log.getEveningEndTime(), log.getOperatingHours(), log.getStandbyHours(),
            log.getWorkDescription(), log.getOperatorName(), log.getOriginalImageUrl(), log.getApprovalStatus(),
            log.getRejectionReason());
    }

    private void recordAudit(Long actorUserId, String action, Long entityId, String reason) {
        if (auditLogs != null) {
            auditLogs.record(actorUserId, action, "DailyLog", entityId, null, null, reason, null);
        }
    }

    private void invalidateAcceptance(DailyLog log, String reason) {
        if (acceptances == null || log.getWorkDate() == null) return;
        String month = YearMonth.from(log.getWorkDate()).toString();
        acceptances.findByContractIdAndEquipmentIdAndBillingMonth(log.getContractId(), log.getEquipmentId(), month)
            .ifPresent(acceptance -> {
                acceptance.setStatus(com.machinerylog.entity.AcceptanceStatus.NEEDS_RECALCULATION);
                acceptance.setExportInvalidatedAt(Instant.now());
                MonthlyAcceptanceRepository repository = acceptances;
                repository.save(acceptance);
                if (auditLogs != null) {
                    auditLogs.record(null, "EXPORT_INVALIDATED", "MonthlyAcceptance", acceptance.getId(), null, null, reason, null);
                }
            });
    }
}