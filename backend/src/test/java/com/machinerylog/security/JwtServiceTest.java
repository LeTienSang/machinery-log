package com.machinerylog.security;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class JwtServiceTest {
    private static final String VALID_SECRET = "local-development-secret-at-least-32-chars";

    @Test
    void rejectsDefaultOrShortSecret() {
        assertThrows(IllegalArgumentException.class, () -> service("change-me-secret", 120, 7));
        assertThrows(IllegalArgumentException.class, () -> service("short", 120, 7));
    }

    @Test
    void rejectsNonPositiveTokenDurations() {
        assertThrows(IllegalArgumentException.class, () -> service(VALID_SECRET, 0, 7));
        assertThrows(IllegalArgumentException.class, () -> service(VALID_SECRET, 120, 0));
    }

    @Test
    void acceptsValidConfiguration() {
        assertDoesNotThrow(() -> service(VALID_SECRET, 120, 7));
    }

    private JwtService service(String secret, long accessMinutes, long refreshDays) {
        return new JwtService(secret, accessMinutes, refreshDays);
    }
}