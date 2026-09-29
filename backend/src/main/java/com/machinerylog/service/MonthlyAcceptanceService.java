package com.machinerylog.service;

import com.machinerylog.dto.MonthlyAcceptanceDto;
import com.machinerylog.entity.AcceptanceStatus;
import com.machinerylog.entity.DailyLog;
import com.machinerylog.entity.MonthlyAcceptance;
import com.machinerylog.entity.PricingAppendix;
import com.machinerylog.entity.PricingType;
import com.machinerylog.exception.ResourceNotFoundException;
import com.machinerylog.repository.DailyLogRepository;
import com.machinerylog.repository.MonthlyAcceptanceRepository;
import com.machinerylog.repository.PricingAppendixRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MonthlyAcceptanceService {
    private static final int VAT_PERCENTAGE = 8;
    private final MonthlyAcceptanceRepository acceptances;
    private final DailyLogRepository dailyLogs;
    private final PricingAppendixRepository pricingAppendices;
    private final AuditLogService auditLogs;

    public MonthlyAcceptanceService(MonthlyAcceptanceRepository acceptances,
                                   DailyLogRepository dailyLogs,
                                   PricingAppendixRepository pricingAppendices) {
        this(acceptances, dailyLogs, pricingAppendices, null);
    }

    @Autowired
    public MonthlyAcceptanceService(MonthlyAcceptanceRepository acceptances,
                                   DailyLogRepository dailyLogs,
                                   PricingAppendixRepository pricingAppendices,
                                   AuditLogService auditLogs) {
        this.acceptances = acceptances;
        this.dailyLogs = dailyLogs;
        this.pricingAppendices = pricingAppendices;
        this.auditLogs = auditLogs;
    }

    @Transactional(readOnly = true)
    public List<MonthlyAcceptanceDto> list(Long contractId, String month) {
        return acceptances.findByContractIdAndBillingMonthOrderByEquipmentId(contractId, month)
            .stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public MonthlyAcceptanceDto get(Long id) { return toDto(find(id)); }

    @Transactional
    public MonthlyAcceptanceDto sign(Long id) {
        MonthlyAcceptance acceptance = acceptances.findByIdForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Monthly acceptance not found: " + id));
        if (acceptance.getStatus() != AcceptanceStatus.PENDING_SIGNATURE) {
            throw new IllegalStateException("Only pending acceptances can be signed");
        }
        acceptance.setStatus(AcceptanceStatus.SIGNED);
        MonthlyAcceptance saved = acceptances.save(acceptance);
        if (auditLogs != null) {
            auditLogs.record(null, "SIGN", "MonthlyAcceptance", saved.getId(), null, null, null, null);
        }
        return toDto(saved);
    }

    @Transactional
    public List<MonthlyAcceptanceDto> recalculate(Long contractId, String month) {
        YearMonth yearMonth = YearMonth.parse(month);
        LocalDate fromDate = yearMonth.atDay(1);
        LocalDate toDate = yearMonth.plusMonths(1).atDay(1);

        List<DailyLog> approvedLogs = dailyLogs.findApprovedByContractIdBetweenDateRange(contractId, fromDate, toDate);
        if (approvedLogs.isEmpty()) {
            return List.of();
        }

        Map<Long, BigDecimal> totalsByEquipment = approvedLogs.stream()
            .collect(Collectors.groupingBy(
                DailyLog::getEquipmentId,
                Collectors.reducing(BigDecimal.ZERO, DailyLog::getOperatingHours, BigDecimal::add)));

        Map<Long, PricingAppendix> activePricingByEquipment = pricingAppendices.findByContractIdOrderByEquipmentIdAscPricingTypeAsc(contractId)
            .stream()
            .collect(Collectors.toMap(
                PricingAppendix::getEquipmentId,
                value -> value,
                this::pickPreferredPricing,
                java.util.HashMap::new));

        List<MonthlyAcceptance> saved = new ArrayList<>();
        for (Map.Entry<Long, BigDecimal> entry : totalsByEquipment.entrySet()) {
            Long equipmentId = entry.getKey();
            BigDecimal totalOperatingHours = entry.getValue().setScale(2, RoundingMode.HALF_UP);
            PricingAppendix appendix = activePricingByEquipment.get(equipmentId);
            if (appendix == null || appendix.getUnitPrice() == null) {
                continue;
            }

            BigDecimal appliedUnitPrice = appendix.getUnitPrice().setScale(2, RoundingMode.HALF_UP);
            BigDecimal subtotalBeforeVat = totalOperatingHours.multiply(appliedUnitPrice).setScale(2, RoundingMode.HALF_UP);
            BigDecimal vatAmount = subtotalBeforeVat.multiply(BigDecimal.valueOf(VAT_PERCENTAGE))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal totalAmount = subtotalBeforeVat.add(vatAmount).setScale(2, RoundingMode.HALF_UP);

            MonthlyAcceptance acceptance = acceptances.findByContractIdAndEquipmentIdAndBillingMonth(contractId, equipmentId, month)
                .orElseGet(MonthlyAcceptance::new);
            acceptance.setContractId(contractId);
            acceptance.setEquipmentId(equipmentId);
            acceptance.setBillingMonth(month);
            acceptance.setFromDate(fromDate);
            acceptance.setToDate(toDate.minusDays(1));
            acceptance.setTotalOperatingHours(totalOperatingHours);
            acceptance.setAppliedUnitPrice(appliedUnitPrice);
            acceptance.setSubtotalBeforeVat(subtotalBeforeVat);
            acceptance.setVatPercentage(VAT_PERCENTAGE);
            acceptance.setVatAmount(vatAmount);
            acceptance.setTotalAmount(totalAmount);
            acceptance.setStatus(AcceptanceStatus.PENDING_SIGNATURE);
            if (acceptance.getId() == null) {
                acceptance.setExportVersion(1);
            } else {
                acceptance.setExportVersion(Optional.ofNullable(acceptance.getExportVersion()).orElse(1) + 1);
            }
            acceptance.setLastExportedAt(null);
            acceptance.setExportInvalidatedAt(null);
            saved.add(acceptances.save(acceptance));
        }

        saved.sort(Comparator.comparing(MonthlyAcceptance::getEquipmentId));
        return saved.stream().map(this::toDto).toList();
    }

    private PricingAppendix pickPreferredPricing(PricingAppendix current, PricingAppendix candidate) {
        if (current == null) return candidate;
        if (candidate == null) return current;
        if (Objects.equals(current.getPricingType(), candidate.getPricingType())) {
            return current;
        }
        return priority(current).compareTo(priority(candidate)) >= 0 ? current : candidate;
    }

    private Integer priority(PricingAppendix pricingAppendix) {
        if (pricingAppendix == null || pricingAppendix.getPricingType() == null) {
            return 0;
        }
        return switch (pricingAppendix.getPricingType()) {
            case HOURLY -> 3;
            case DAILY -> 2;
            case MONTHLY -> 1;
        };
    }

    private MonthlyAcceptance find(Long id) { return acceptances.findById(id).orElseThrow(() -> new ResourceNotFoundException("Monthly acceptance not found: " + id)); }
    private MonthlyAcceptanceDto toDto(MonthlyAcceptance a) { return new MonthlyAcceptanceDto(a.getId(), a.getContractId(), a.getEquipmentId(), a.getBillingMonth(), a.getTotalOperatingHours(), a.getAppliedUnitPrice(), a.getSubtotalBeforeVat(), a.getVatPercentage(), a.getVatAmount(), a.getTotalAmount(), a.getStatus(), a.getExportVersion(), a.getLastExportedAt(), a.getExportInvalidatedAt()); }
}