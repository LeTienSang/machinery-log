package com.machinerylog.controller;

import com.machinerylog.dto.AdvancePaymentDto;
import com.machinerylog.dto.DebtReconciliationDto;
import com.machinerylog.dto.DebtReconciliationRequest;
import com.machinerylog.dto.DebtReconciliationStatusRequest;
import com.machinerylog.entity.DebtReconciliationStatus;
import com.machinerylog.service.DebtService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasRole('ACCOUNTANT_ADMIN')")
public class DebtController {
    private final DebtService debt;

    public DebtController(DebtService debt) { this.debt = debt; }

    @GetMapping("/contracts/{contractId}/advance-payments")
    public ResponseEntity<List<AdvancePaymentDto>> listPayments(@PathVariable Long contractId) {
        return ResponseEntity.ok(debt.listPayments(contractId));
    }

    @PostMapping("/contracts/{contractId}/advance-payments")
    public ResponseEntity<AdvancePaymentDto> addPayment(@PathVariable Long contractId,
                                                        @Valid @RequestBody AdvancePaymentDto request) {
        return ResponseEntity.ok(debt.addPayment(contractId, request));
    }

    @DeleteMapping("/advance-payments/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        debt.deletePayment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/contracts/{contractId}/debt-reconciliations")
    public ResponseEntity<List<DebtReconciliationDto>> listReconciliations(@PathVariable Long contractId) {
        return ResponseEntity.ok(debt.listReconciliations(contractId));
    }

    @PostMapping("/contracts/{contractId}/debt-reconciliations")
    public ResponseEntity<DebtReconciliationDto> createReconciliation(
        @PathVariable Long contractId,
        @Valid @RequestBody DebtReconciliationRequest request) {
        return ResponseEntity.ok(debt.createReconciliation(contractId, request));
    }

    @PutMapping("/debt-reconciliations/{id}/status")
    public ResponseEntity<DebtReconciliationDto> updateStatus(
        @PathVariable Long id,
        @Valid @RequestBody DebtReconciliationStatusRequest request) {
        if (request.status() != DebtReconciliationStatus.RECONCILED) {
            throw new IllegalArgumentException("Only RECONCILED status is supported");
        }
        return ResponseEntity.ok(debt.reconcile(id));
    }
}
