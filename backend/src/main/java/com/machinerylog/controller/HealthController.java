package com.machinerylog.controller;

import com.machinerylog.health.HealthCheckResult;
import com.machinerylog.health.HealthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {
    private final HealthService healthService;

    public HealthController(HealthService healthService) {
        this.healthService = healthService;
    }

    @GetMapping
    public ResponseEntity<HealthCheckResult> health() {
        HealthCheckResult result = healthService.check();
        return ResponseEntity.status(result.status() == com.machinerylog.health.HealthStatus.UP ? 200 : 503).body(result);
    }
}