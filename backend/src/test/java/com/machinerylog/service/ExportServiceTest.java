package com.machinerylog.service;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.machinerylog.entity.ApprovalStatus;
import com.machinerylog.entity.Contract;
import com.machinerylog.entity.DailyLog;
import com.machinerylog.entity.MonthlyAcceptance;
import com.machinerylog.repository.ContractRepository;
import com.machinerylog.repository.DailyLogRepository;
import com.machinerylog.repository.DebtReconciliationRepository;
import com.machinerylog.repository.MonthlyAcceptanceRepository;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class ExportServiceTest {
    @Mock private ContractRepository contracts;
    @Mock private DailyLogRepository dailyLogs;
    @Mock private MonthlyAcceptanceRepository acceptances;
    @Mock private DebtReconciliationRepository reconciliations;
    @Mock private MonthlyAcceptanceService acceptanceService;

    private ExportService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new ExportService(contracts, dailyLogs, acceptances, reconciliations, acceptanceService);
    }

    @Test
    void createsZipWithThreeExcelReports() throws Exception {
        when(contracts.findByIdAndNotDeleted(10L)).thenReturn(new Contract());
        DailyLog log = new DailyLog();
        log.setWorkDate(LocalDate.of(2026, 9, 1));
        log.setEquipmentId(20L);
        log.setOperatingHours(new BigDecimal("8.00"));
        log.setApprovalStatus(ApprovalStatus.APPROVED);
        when(dailyLogs.findApprovedByContractIdBetweenDateRange(10L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 10, 1)))
            .thenReturn(List.of(log));

        MonthlyAcceptance acceptance = new MonthlyAcceptance();
        acceptance.setEquipmentId(20L);
        acceptance.setTotalOperatingHours(new BigDecimal("8.00"));
        acceptance.setAppliedUnitPrice(new BigDecimal("125.00"));
        acceptance.setSubtotalBeforeVat(new BigDecimal("1000.00"));
        acceptance.setVatAmount(new BigDecimal("80.00"));
        acceptance.setTotalAmount(new BigDecimal("1080.00"));
        when(acceptances.findByContractIdAndBillingMonthOrderByEquipmentId(10L, "2026-09"))
            .thenReturn(List.of(acceptance));
        when(acceptances.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(reconciliations.findByContractIdOrderByReconciliationDateDescIdDesc(10L)).thenReturn(List.of());

        byte[] result = service.reportSet(10L, "2026-09");

        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(result))) {
            String[] names = new String[3];
            for (int index = 0; index < names.length; index++) {
                ZipEntry entry = zip.getNextEntry();
                names[index] = entry.getName();
                assertTrue(entry.getSize() != 0 || entry.getCompressedSize() != 0);
            }
            assertArrayEquals(new String[] {
                "bang-tong-hop-gio-lam_2026-09.xlsx",
                "bien-ban-ban-giao-nghiem-thu_2026-09.xlsx",
                "bien-ban-doi-chieu-cong-no_2026-09.xlsx"
            }, names);
        }
    }
}
