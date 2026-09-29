package com.machinerylog.controller;

import com.machinerylog.api.ApiError;
import com.machinerylog.dto.AdvancePaymentDto;
import com.machinerylog.dto.DebtReconciliationRequest;
import com.machinerylog.dto.DebtReconciliationStatusRequest;
import com.machinerylog.entity.DebtReconciliationStatus;
import com.machinerylog.service.DebtService;
import jakarta.validation.Valid;
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
    public ResponseEntity<ApiError> listPayments(@PathVariable Long contractId) {
        return ResponseEntity.ok(new ApiError(debt.listPayments(contractId), "Advance payments retrieved"));
    }

    @PostMapping("/contracts/{contractId}/advance-payments")
    public ResponseEntity<ApiError> addPayment(@PathVariable Long contractId,
                                                        @Valid @RequestBody AdvancePaymentDto request) {
        return ResponseEntity.ok(new ApiError(debt.addPayment(contractId, request), "Advance payment created"));
    }

    @DeleteMapping("/advance-payments/{id}")
    public ResponseEntity<ApiError> deletePayment(@PathVariable Long id) {
        debt.deletePayment(id);
        return ResponseEntity.ok(new ApiError(null, "Advance payment deleted"));
    }

    @GetMapping("/contracts/{contractId}/debt-reconciliations")
    public ResponseEntity<ApiError> listReconciliations(@PathVariable Long contractId) {
        return ResponseEntity.ok(new ApiError(debt.listReconciliations(contractId), "Debt reconciliations retrieved"));
    }

    @PostMapping("/contracts/{contractId}/debt-reconciliations")
    public ResponseEntity<ApiError> createReconciliation(
        @PathVariable Long contractId,
        @Valid @RequestBody DebtReconciliationRequest request) {
        return ResponseEntity.ok(new ApiError(debt.createReconciliation(contractId, request), "Debt reconciliation created"));
    }

    @PutMapping("/debt-reconciliations/{id}/status")
    public ResponseEntity<ApiError> updateStatus(
        @PathVariable Long id,
        @Valid @RequestBody DebtReconciliationStatusRequest request) {
        if (request.status() != DebtReconciliationStatus.RECONCILED) {
            throw new IllegalArgumentException("Only RECONCILED status is supported");
        }
        return ResponseEntity.ok(new ApiError(debt.reconcile(id), "Debt reconciliation updated"));
    }
}
