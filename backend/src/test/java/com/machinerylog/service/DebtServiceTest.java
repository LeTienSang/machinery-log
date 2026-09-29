package com.machinerylog.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.machinerylog.dto.DebtReconciliationDto;
import com.machinerylog.dto.DebtReconciliationRequest;
import com.machinerylog.entity.AcceptanceStatus;
import com.machinerylog.entity.Contract;
import com.machinerylog.entity.DebtReconciliation;
import com.machinerylog.entity.DebtReconciliationStatus;
import com.machinerylog.repository.AdvancePaymentRepository;
import com.machinerylog.repository.ContractRepository;
import com.machinerylog.repository.DebtReconciliationRepository;
import com.machinerylog.repository.MonthlyAcceptanceRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class DebtServiceTest {
    @Mock private AdvancePaymentRepository payments;
    @Mock private DebtReconciliationRepository reconciliations;
    @Mock private MonthlyAcceptanceRepository acceptances;
    @Mock private ContractRepository contracts;

    private DebtService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new DebtService(payments, reconciliations, acceptances, contracts);
    }

    @Test
    void calculatesCurrentDebtFromPreviousAcceptanceAndPayments() {
        when(contracts.findByIdAndNotDeleted(10L)).thenReturn(new Contract());
        DebtReconciliation previous = new DebtReconciliation();
        previous.setRemainingBalance(new BigDecimal("300.00"));
        when(reconciliations.findTopByContractIdAndReconciliationDateBeforeOrderByReconciliationDateDescIdDesc(10L, LocalDate.of(2026, 9, 1)))
            .thenReturn(Optional.of(previous));
        when(acceptances.sumTotalAmountByContractIdAndBillingMonth(10L, "2026-09", AcceptanceStatus.NEEDS_RECALCULATION))
            .thenReturn(new BigDecimal("1350.00"));
        when(payments.sumAmountByContractIdAndDocumentDateBetween(10L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 10, 1)))
            .thenReturn(new BigDecimal("500.00"));
        when(reconciliations.save(any(DebtReconciliation.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        DebtReconciliationDto result = service.createReconciliation(10L, new DebtReconciliationRequest("2026-09"));

        assertEquals(new BigDecimal("300.00"), result.previousBalance());
        assertEquals(new BigDecimal("1350.00"), result.currentPeriodAcceptance());
        assertEquals(new BigDecimal("500.00"), result.totalPaid());
        assertEquals(new BigDecimal("1150.00"), result.remainingBalance());
        assertEquals(DebtReconciliationStatus.PENDING_RECONCILIATION, result.status());
    }
}
