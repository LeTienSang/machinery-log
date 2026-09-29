package com.machinerylog.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "debt_reconciliations")
public class DebtReconciliation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "contract_id", nullable = false) private Long contractId;
    @Column(name = "reconciliation_date") private LocalDate reconciliationDate;
    @Column(name = "previous_balance", nullable = false, precision = 15, scale = 2) private BigDecimal previousBalance = BigDecimal.ZERO;
    @Column(name = "current_period_acceptance", precision = 15, scale = 2) private BigDecimal currentPeriodAcceptance;
    @Column(name = "total_paid", precision = 15, scale = 2) private BigDecimal totalPaid;
    @Column(name = "remaining_balance", precision = 15, scale = 2) private BigDecimal remainingBalance;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private DebtReconciliationStatus status = DebtReconciliationStatus.PENDING_RECONCILIATION;

    public DebtReconciliation() { }

    public Long getId() { return id; }
    public Long getContractId() { return contractId; }
    public LocalDate getReconciliationDate() { return reconciliationDate; }
    public BigDecimal getPreviousBalance() { return previousBalance; }
    public BigDecimal getCurrentPeriodAcceptance() { return currentPeriodAcceptance; }
    public BigDecimal getTotalPaid() { return totalPaid; }
    public BigDecimal getRemainingBalance() { return remainingBalance; }
    public DebtReconciliationStatus getStatus() { return status; }
    public void setContractId(Long value) { contractId = value; }
    public void setReconciliationDate(LocalDate value) { reconciliationDate = value; }
    public void setPreviousBalance(BigDecimal value) { previousBalance = value; }
    public void setCurrentPeriodAcceptance(BigDecimal value) { currentPeriodAcceptance = value; }
    public void setTotalPaid(BigDecimal value) { totalPaid = value; }
    public void setRemainingBalance(BigDecimal value) { remainingBalance = value; }
    public void setStatus(DebtReconciliationStatus value) { status = value; }
}
