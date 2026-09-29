package com.machinerylog.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.machinerylog.health.HealthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(HealthController.class)
class HealthControllerTest {
    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    HealthService healthService;

    @Test
    void returnsHealthyWhenDatabaseConnected() throws Exception {
        // given
        when(healthService.check()).thenReturn(
            new com.machinerylog.health.HealthCheckResult(
                com.machinerylog.health.HealthStatus.UP,
                "2026-09-29T16:30:00.000Z",
                new com.machinerylog.health.HealthCheckResult.DatabaseHealth(true, "postgresql://localhost:5432/machinery_log_db"),
                null,
                java.util.Map.of("database", java.util.Map.of("status", "connected"), "minio", java.util.Map.of("status", "skipped"))
            )
        );

        // when & then
        mockMvc.perform(get("/api/v1/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"));
    }
}