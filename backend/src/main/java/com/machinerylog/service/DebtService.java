package com.machinerylog.service;

import com.machinerylog.dto.AdvancePaymentDto;
import com.machinerylog.dto.DebtReconciliationDto;
import com.machinerylog.dto.DebtReconciliationRequest;
import com.machinerylog.entity.AdvancePayment;
import com.machinerylog.entity.AcceptanceStatus;
import com.machinerylog.entity.DebtReconciliation;
import com.machinerylog.entity.DebtReconciliationStatus;
import com.machinerylog.exception.ResourceNotFoundException;
import com.machinerylog.repository.AdvancePaymentRepository;
import com.machinerylog.repository.ContractRepository;
import com.machinerylog.repository.DebtReconciliationRepository;
import com.machinerylog.repository.MonthlyAcceptanceRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DebtService {
    private final AdvancePaymentRepository payments;
    private final DebtReconciliationRepository reconciliations;
    private final MonthlyAcceptanceRepository acceptances;
    private final ContractRepository contracts;

    public DebtService(AdvancePaymentRepository payments,
                       DebtReconciliationRepository reconciliations,
                       MonthlyAcceptanceRepository acceptances,
                       ContractRepository contracts) {
        this.payments = payments;
        this.reconciliations = reconciliations;
        this.acceptances = acceptances;
        this.contracts = contracts;
    }

    @Transactional(readOnly = true)
    public List<AdvancePaymentDto> listPayments(Long contractId) {
        requireContract(contractId);
        return payments.findByContractIdOrderByDocumentDateAscIdAsc(contractId).stream().map(this::toDto).toList();
    }

    @Transactional
    public AdvancePaymentDto addPayment(Long contractId, AdvancePaymentDto request) {
        requireContract(contractId);
        AdvancePayment payment = new AdvancePayment();
        payment.setContractId(contractId);
        payment.setDocumentDate(request.documentDate());
        payment.setDocumentNumber(request.documentNumber());
        payment.setDescription(request.description());
        payment.setAmount(money(request.amount()));
        return toDto(payments.save(payment));
    }

    @Transactional
    public void deletePayment(Long id) {
        AdvancePayment payment = payments.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Advance payment not found: " + id));
        if (reconciliations.existsByContractIdAndStatus(payment.getContractId(), DebtReconciliationStatus.RECONCILED)) {
            throw new IllegalStateException("Advance payment cannot be deleted after reconciliation");
        }
        payments.delete(payment);
    }

    @Transactional(readOnly = true)
    public List<DebtReconciliationDto> listReconciliations(Long contractId) {
        requireContract(contractId);
        return reconciliations.findByContractIdOrderByReconciliationDateDescIdDesc(contractId)
            .stream().map(this::toDto).toList();
    }

    @Transactional
    public DebtReconciliationDto createReconciliation(Long contractId, DebtReconciliationRequest request) {
        requireContract(contractId);
        YearMonth month = YearMonth.parse(request.month());
        LocalDate fromDate = month.atDay(1);
        LocalDate toDate = month.plusMonths(1).atDay(1);
        LocalDate reconciliationDate = month.atEndOfMonth();

        BigDecimal previousBalance = reconciliations
            .findTopByContractIdAndReconciliationDateBeforeOrderByReconciliationDateDescIdDesc(contractId, fromDate)
            .map(DebtReconciliation::getRemainingBalance)
            .orElse(BigDecimal.ZERO);
        BigDecimal currentAcceptance = acceptances
            .sumTotalAmountByContractIdAndBillingMonth(contractId, request.month(), AcceptanceStatus.NEEDS_RECALCULATION);
        BigDecimal totalPaid = payments
            .sumAmountByContractIdAndDocumentDateBetween(contractId, fromDate, toDate);

        DebtReconciliation reconciliation = new DebtReconciliation();
        reconciliation.setContractId(contractId);
        reconciliation.setReconciliationDate(reconciliationDate);
        reconciliation.setPreviousBalance(money(previousBalance));
        reconciliation.setCurrentPeriodAcceptance(money(currentAcceptance));
        reconciliation.setTotalPaid(money(totalPaid));
        reconciliation.setRemainingBalance(money(previousBalance.add(currentAcceptance).subtract(totalPaid)));
        reconciliation.setStatus(DebtReconciliationStatus.PENDING_RECONCILIATION);
        return toDto(reconciliations.save(reconciliation));
    }

    @Transactional
    public DebtReconciliationDto reconcile(Long id) {
        DebtReconciliation reconciliation = reconciliations.findByIdForUpdate(id)
            .orElseThrow(() -> new ResourceNotFoundException("Debt reconciliation not found: " + id));
        if (reconciliation.getStatus() != DebtReconciliationStatus.PENDING_RECONCILIATION) {
            throw new IllegalStateException("Only pending reconciliations can be reconciled");
        }
        reconciliation.setStatus(DebtReconciliationStatus.RECONCILED);
        return toDto(reconciliations.save(reconciliation));
    }

    private void requireContract(Long id) {
        if (contracts.findByIdAndNotDeleted(id) == null) {
            throw new ResourceNotFoundException("Contract not found: " + id);
        }
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private AdvancePaymentDto toDto(AdvancePayment value) {
        return new AdvancePaymentDto(value.getId(), value.getContractId(), value.getDocumentDate(), value.getDocumentNumber(), value.getDescription(), value.getAmount());
    }

    private DebtReconciliationDto toDto(DebtReconciliation value) {
        return new DebtReconciliationDto(value.getId(), value.getContractId(), value.getReconciliationDate(), value.getPreviousBalance(), value.getCurrentPeriodAcceptance(), value.getTotalPaid(), value.getRemainingBalance(), value.getStatus());
    }
}
