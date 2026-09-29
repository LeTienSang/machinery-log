package com.machinerylog.health;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class HealthService {
    private final JdbcTemplate jdbcTemplate;

    public HealthService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public HealthCheckResult check() {
        boolean dbOk = checkDatabase();
        HealthStatus status = dbOk ? HealthStatus.UP : HealthStatus.DOWN;

        return new HealthCheckResult(
            status,
            Instant.now().toString(),
            new HealthCheckResult.DatabaseHealth(dbOk, "postgresql://localhost:5432/machinery_log_db"),
            null,
            buildDetails(dbOk)
        );
    }

    private boolean checkDatabase() {
        try {
            jdbcTemplate.execute((java.sql.Connection connection) -> true);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Map<String, Object> buildDetails(boolean dbOk) {
        Map<String, Object> details = new HashMap<>();
        details.put("database", Map.of("status", dbOk ? "connected" : "disconnected"));
        details.put("minio", Map.of("status", "skipped"));
        return details;
    }
}