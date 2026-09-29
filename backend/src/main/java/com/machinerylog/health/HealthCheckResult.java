package com.machinerylog.health;

import java.time.Instant;
import java.util.Map;

public record HealthCheckResult(
    HealthStatus status,
    String timestamp,
    DatabaseHealth database,
    MinioHealth minio,
    Map<String, Object> details
) {
    public record DatabaseHealth(boolean connected, String url) {}
    public record MinioHealth(boolean connected, String endpoint) {}
}