package com.machinerylog.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.machinerylog.dto.MonthlyAcceptanceDto;
import com.machinerylog.entity.AcceptanceStatus;
import com.machinerylog.entity.DailyLog;
import com.machinerylog.entity.PricingAppendix;
import com.machinerylog.entity.PricingType;
import com.machinerylog.repository.DailyLogRepository;
import com.machinerylog.repository.MonthlyAcceptanceRepository;
import com.machinerylog.repository.PricingAppendixRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class MonthlyAcceptanceServiceTest {
    @Mock
    private MonthlyAcceptanceRepository acceptances;
    @Mock
    private DailyLogRepository dailyLogs;
    @Mock
    private PricingAppendixRepository pricingAppendices;

    private MonthlyAcceptanceService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new MonthlyAcceptanceService(acceptances, dailyLogs, pricingAppendices);
    }

    @Test
    void recalculatesApprovedLogsIntoMonthlyAcceptance() {
        DailyLog first = new DailyLog();
        first.setContractId(10L);
        first.setEquipmentId(20L);
        first.setWorkDate(LocalDate.of(2026, 9, 1));
        first.setOperatingHours(new BigDecimal("8.50"));
        first.setApprovalStatus(com.machinerylog.entity.ApprovalStatus.APPROVED);

        DailyLog second = new DailyLog();
        second.setContractId(10L);
        second.setEquipmentId(20L);
        second.setWorkDate(LocalDate.of(2026, 9, 5));
        second.setOperatingHours(new BigDecimal("1.50"));
        second.setApprovalStatus(com.machinerylog.entity.ApprovalStatus.APPROVED);

        PricingAppendix appendix = new PricingAppendix();
        appendix.setContractId(10L);
        appendix.setEquipmentId(20L);
        appendix.setPricingType(PricingType.HOURLY);
        appendix.setUnitPrice(new BigDecimal("125.00"));

        when(dailyLogs.findApprovedByContractIdBetweenDateRange(10L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 10, 1)))
            .thenReturn(List.of(first, second));
        when(pricingAppendices.findByContractIdOrderByEquipmentIdAscPricingTypeAsc(10L))
            .thenReturn(List.of(appendix));
        when(acceptances.findByContractIdAndEquipmentIdAndBillingMonth(10L, 20L, "2026-09"))
            .thenReturn(Optional.empty());
        when(acceptances.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        List<MonthlyAcceptanceDto> result = service.recalculate(10L, "2026-09");

        assertEquals(1, result.size());
        MonthlyAcceptanceDto row = result.get(0);
        assertEquals(20L, row.equipmentId());
        assertEquals(new BigDecimal("10.00"), row.totalOperatingHours());
        assertEquals(new BigDecimal("125.00"), row.appliedUnitPrice());
        assertEquals(new BigDecimal("1250.00"), row.subtotalBeforeVat());
        assertEquals(new BigDecimal("100.00"), row.vatAmount());
        assertEquals(new BigDecimal("1350.00"), row.totalAmount());
        assertEquals(AcceptanceStatus.PENDING_SIGNATURE, row.status());
    }
}
