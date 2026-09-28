package com.machinerylog.service;

import com.machinerylog.dto.MonthlyAcceptanceDto;
import com.machinerylog.entity.AcceptanceStatus;
import com.machinerylog.entity.MonthlyAcceptance;
import com.machinerylog.exception.ResourceNotFoundException;
import com.machinerylog.repository.MonthlyAcceptanceRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MonthlyAcceptanceService {
    private final MonthlyAcceptanceRepository acceptances;
    public MonthlyAcceptanceService(MonthlyAcceptanceRepository acceptances) { this.acceptances = acceptances; }

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
        return toDto(acceptances.save(acceptance));
    }

    private MonthlyAcceptance find(Long id) { return acceptances.findById(id).orElseThrow(() -> new ResourceNotFoundException("Monthly acceptance not found: " + id)); }
    private MonthlyAcceptanceDto toDto(MonthlyAcceptance a) { return new MonthlyAcceptanceDto(a.getId(), a.getContractId(), a.getEquipmentId(), a.getBillingMonth(), a.getTotalOperatingHours(), a.getAppliedUnitPrice(), a.getSubtotalBeforeVat(), a.getVatPercentage(), a.getVatAmount(), a.getTotalAmount(), a.getStatus(), a.getExportVersion(), a.getLastExportedAt(), a.getExportInvalidatedAt()); }
}