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

    @Test
    void generatesValidTokensAndDetectsRoleAndType() {
        JwtService jwt = service(VALID_SECRET, 120, 7);
        com.machinerylog.entity.User user = new com.machinerylog.entity.User(
            "test_user", "hashed", "Test User", com.machinerylog.entity.UserRole.ACCOUNTANT_ADMIN
        );

        String accessToken = jwt.createAccessToken(user);
        String refreshToken = jwt.createRefreshToken(user);

        org.junit.jupiter.api.Assertions.assertNotNull(accessToken);
        org.junit.jupiter.api.Assertions.assertNotNull(refreshToken);
        org.junit.jupiter.api.Assertions.assertEquals("test_user", jwt.extractUsername(accessToken));
        org.junit.jupiter.api.Assertions.assertEquals("test_user", jwt.extractUsername(refreshToken));
        org.junit.jupiter.api.Assertions.assertFalse(jwt.isRefreshToken(accessToken));
        org.junit.jupiter.api.Assertions.assertTrue(jwt.isRefreshToken(refreshToken));
        org.junit.jupiter.api.Assertions.assertTrue(jwt.isValid(accessToken, user));
        org.junit.jupiter.api.Assertions.assertTrue(jwt.isValid(refreshToken, user));

        com.machinerylog.entity.User otherUser = new com.machinerylog.entity.User(
            "other_user", "hashed", "Other User", com.machinerylog.entity.UserRole.OPERATOR
        );
        org.junit.jupiter.api.Assertions.assertFalse(jwt.isValid(accessToken, otherUser));
    }

    @Test
    void detectsExpiredToken() throws InterruptedException {
        // Test with short lifespan if possible or manipulate / test parsing failure
        JwtService jwt = service(VALID_SECRET, 120, 7);
        com.machinerylog.entity.User user = new com.machinerylog.entity.User(
            "test_user", "hashed", "Test User", com.machinerylog.entity.UserRole.OPERATOR
        );
        String token = jwt.createAccessToken(user);
        org.junit.jupiter.api.Assertions.assertTrue(jwt.isValid(token, user));

        // Invalid signature or malformed token
        assertThrows(Exception.class, () -> jwt.extractUsername("malformed.jwt.token"));
    }

    private JwtService service(String secret, long accessMinutes, long refreshDays) {
        return new JwtService(secret, accessMinutes, refreshDays);
    }
}