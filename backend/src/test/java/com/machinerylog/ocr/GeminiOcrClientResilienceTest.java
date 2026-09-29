package com.machinerylog.ocr;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GeminiOcrClientResilienceTest {

    private ObjectMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new ObjectMapper();
    }

    @Test
    void rateLimiterPermitsUpToLimitWithinWindow() {
        OcrRateLimiter limiter = new OcrRateLimiter(3);
        assertTrue(limiter.tryAcquire());
        assertTrue(limiter.tryAcquire());
        assertTrue(limiter.tryAcquire());
        assertFalse(limiter.tryAcquire());
    }

    @Test
    void unconfiguredApiKeyTriggersFallbackWhenEnabled() {
        GeminiOcrClient client = new GeminiOcrClient(
            mapper,
            "", // empty api key
            "https://dummy.example.com",
            1000,
            2,
            50,
            1.5,
            10,
            true // fallback enabled
        );

        InputStream stream = new ByteArrayInputStream(new byte[]{1, 2, 3});
        OcrResult result = client.process(stream, "image/jpeg", 3);

        assertNotNull(result);
        assertEquals(BigDecimal.ZERO, result.operatingHours());
        assertEquals(BigDecimal.ZERO, result.standbyHours());
        assertTrue(result.workDescription().contains("Dữ liệu nhập thủ công"));
    }

    @Test
    void unconfiguredApiKeyThrowsExceptionWhenFallbackDisabled() {
        GeminiOcrClient client = new GeminiOcrClient(
            mapper,
            "", // empty api key
            "https://dummy.example.com",
            1000,
            2,
            50,
            1.5,
            10,
            false // fallback disabled
        );

        InputStream stream = new ByteArrayInputStream(new byte[]{1, 2, 3});
        OcrException ex = assertThrows(OcrException.class, () -> client.process(stream, "image/jpeg", 3));
        assertTrue(ex.getMessage().contains("Gemini API key is not configured"));
    }

    @Test
    void rateLimitExceededTriggersFallbackWhenEnabled() {
        GeminiOcrClient client = new GeminiOcrClient(
            mapper,
            "valid-test-key",
            "https://dummy.example.com",
            1000,
            2,
            50,
            1.5,
            1, // limit 1 request
            true
        );

        // First call will try HTTP and fail (endpoint unreachable), but let's test rate limiter directly
        // Call twice with fallback enabled
        InputStream stream1 = new ByteArrayInputStream(new byte[]{1});
        InputStream stream2 = new ByteArrayInputStream(new byte[]{1});

        // 1st request attempts and triggers fallback on network error
        OcrResult r1 = client.process(stream1, "image/jpeg", 1);
        assertNotNull(r1);

        // 2nd request is blocked immediately by rate limiter and returns fallback
        OcrResult r2 = client.process(stream2, "image/jpeg", 1);
        assertNotNull(r2);
        assertEquals(BigDecimal.ZERO, r2.operatingHours());
    }

    @Test
    void rateLimitExceededThrowsWhenFallbackDisabled() {
        GeminiOcrClient client = new GeminiOcrClient(
            mapper,
            "valid-test-key",
            "https://dummy.example.com",
            1000,
            1,
            50,
            1.5,
            1, // limit 1 request
            false // fallback disabled
        );

        InputStream stream1 = new ByteArrayInputStream(new byte[]{1});
        InputStream stream2 = new ByteArrayInputStream(new byte[]{1});

        // First call fails with network error
        assertThrows(OcrException.class, () -> client.process(stream1, "image/jpeg", 1));

        // Second call fails with rate limit error
        OcrException ex = assertThrows(OcrException.class, () -> client.process(stream2, "image/jpeg", 1));
        assertTrue(ex.isRateLimited());
        assertTrue(ex.getMessage().contains("rate limit"));
    }
}
