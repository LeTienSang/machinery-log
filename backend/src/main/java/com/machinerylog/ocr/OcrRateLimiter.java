package com.machinerylog.ocr;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Token-bucket / sliding minute rate limiter for Gemini Flash API requests.
 */
public class OcrRateLimiter {
    private final int maxRequestsPerMinute;
    private final AtomicInteger requestCount = new AtomicInteger(0);
    private final AtomicLong windowStart = new AtomicLong(System.currentTimeMillis());

    public OcrRateLimiter(int maxRequestsPerMinute) {
        this.maxRequestsPerMinute = Math.max(1, maxRequestsPerMinute);
    }

    /**
     * Attempts to acquire permission to make an API call.
     * @return true if call is permitted, false if rate limit has been reached.
     */
    public synchronized boolean tryAcquire() {
        long now = System.currentTimeMillis();
        long start = windowStart.get();
        if (now - start >= 60_000) {
            windowStart.set(now);
            requestCount.set(0);
        }
        if (requestCount.get() < maxRequestsPerMinute) {
            requestCount.incrementAndGet();
            return true;
        }
        return false;
    }

    public int getMaxRequestsPerMinute() {
        return maxRequestsPerMinute;
    }
}
