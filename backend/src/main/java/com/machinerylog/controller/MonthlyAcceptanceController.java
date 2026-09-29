package com.machinerylog.controller;

import com.machinerylog.api.ApiError;
import com.machinerylog.service.MonthlyAcceptanceService;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/monthly-acceptances")
@PreAuthorize("hasRole('ACCOUNTANT_ADMIN')")
public class MonthlyAcceptanceController {
    private final MonthlyAcceptanceService acceptances;
    public MonthlyAcceptanceController(MonthlyAcceptanceService acceptances) { this.acceptances = acceptances; }
    @GetMapping public ResponseEntity<ApiError> list(@RequestParam Long contractId, @RequestParam @Pattern(regexp = "\\d{4}-(0[1-9]|1[0-2])") String month) { return ResponseEntity.ok(new ApiError(acceptances.list(contractId, month), "Monthly acceptances retrieved")); }
    @GetMapping("/{id}") public ResponseEntity<ApiError> get(@PathVariable Long id) { return ResponseEntity.ok(new ApiError(acceptances.get(id), "Monthly acceptance retrieved")); }
    @PutMapping("/{id}/sign") public ResponseEntity<ApiError> sign(@PathVariable Long id) { return ResponseEntity.ok(new ApiError(acceptances.sign(id), "Monthly acceptance signed")); }
}