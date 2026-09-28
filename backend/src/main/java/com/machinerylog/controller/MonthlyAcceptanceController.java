package com.machinerylog.controller;

import com.machinerylog.dto.MonthlyAcceptanceDto;
import com.machinerylog.service.MonthlyAcceptanceService;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/monthly-acceptances")
@PreAuthorize("hasRole('ACCOUNTANT_ADMIN')")
public class MonthlyAcceptanceController {
    private final MonthlyAcceptanceService acceptances;
    public MonthlyAcceptanceController(MonthlyAcceptanceService acceptances) { this.acceptances = acceptances; }
    @GetMapping public ResponseEntity<List<MonthlyAcceptanceDto>> list(@RequestParam Long contractId, @RequestParam @Pattern(regexp = "\\d{4}-(0[1-9]|1[0-2])") String month) { return ResponseEntity.ok(acceptances.list(contractId, month)); }
    @GetMapping("/{id}") public ResponseEntity<MonthlyAcceptanceDto> get(@PathVariable Long id) { return ResponseEntity.ok(acceptances.get(id)); }
    @PutMapping("/{id}/sign") public ResponseEntity<MonthlyAcceptanceDto> sign(@PathVariable Long id) { return ResponseEntity.ok(acceptances.sign(id)); }
}