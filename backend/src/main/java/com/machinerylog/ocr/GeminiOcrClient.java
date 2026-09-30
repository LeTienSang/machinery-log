package com.machinerylog.ocr;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.net.SocketTimeoutException;
import java.util.Base64;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
public class GeminiOcrClient implements OcrClient {
    private static final Logger log = LoggerFactory.getLogger(GeminiOcrClient.class);

    private final RestClient client;
    private final ObjectMapper mapper;
    private final String apiKey;
    private final int maxAttempts;
    private final long initialBackoffMs;
    private final double backoffMultiplier;
    private final boolean enableFallback;
    private final OcrRateLimiter rateLimiter;

    public GeminiOcrClient(ObjectMapper mapper,
                           @Value("${machinery-log.ocr.api-key:}") String apiKey,
                           @Value("${machinery-log.ocr.endpoint:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent}") String endpoint,
                           @Value("${machinery-log.ocr.timeout-ms:30000}") int timeoutMs,
                           @Value("${machinery-log.ocr.max-attempts:3}") int maxAttempts,
                           @Value("${machinery-log.ocr.initial-backoff-ms:1000}") long initialBackoffMs,
                           @Value("${machinery-log.ocr.backoff-multiplier:2.0}") double backoffMultiplier,
                           @Value("${machinery-log.ocr.max-requests-per-minute:15}") int maxRequestsPerMinute,
                           @Value("${machinery-log.ocr.enable-fallback:true}") boolean enableFallback) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        int safeTimeout = Math.max(1_000, timeoutMs);
        requestFactory.setConnectTimeout(safeTimeout);
        requestFactory.setReadTimeout(safeTimeout);

        this.client = RestClient.builder().baseUrl(endpoint).requestFactory(requestFactory).build();
        this.mapper = mapper;
        this.apiKey = apiKey;
        this.maxAttempts = Math.max(1, maxAttempts);
        this.initialBackoffMs = Math.max(100, initialBackoffMs);
        this.backoffMultiplier = Math.max(1.0, backoffMultiplier);
        this.enableFallback = enableFallback;
        this.rateLimiter = new OcrRateLimiter(maxRequestsPerMinute);
    }

    @Override
    public OcrResult process(InputStream image, String contentType, long size) {
        if (apiKey.isBlank() || apiKey.equals("replace-me")) {
            log.warn("Gemini API key is not configured");
            if (enableFallback) {
                log.info("Fallback enabled: returning editable draft result due to unconfigured API key");
                return OcrFallbackHandler.createFallbackResult();
            }
            throw new OcrException("Gemini API key is not configured", false, null);
        }

        // Rate limiting check
        if (!rateLimiter.tryAcquire()) {
            log.warn("Rate limit exceeded for OCR requests (max: {} req/min)", rateLimiter.getMaxRequestsPerMinute());
            if (enableFallback) {
                log.info("Fallback enabled: returning editable draft result due to rate limit exhaustion");
                return OcrFallbackHandler.createFallbackResult();
            }
            throw new OcrException("Gemini OCR rate limit exceeded. Please try again in a moment.", false, true, null);
        }

        try {
            byte[] bytes = image.readAllBytes();
            String prompt = "You are a specialized OCR parser for Vietnamese construction machinery logbooks "
                + "(Nhat ky xe / may cong trinh). Return valid JSON only, no markdown, no explanation. Fields: "
                + "morningStartTime, morningEndTime, afternoonStartTime, afternoonEndTime, "
                + "eveningStartTime, eveningEndTime, operatingHours, standbyHours, workDescription, operatorName. "
                + "Use null when unreadable. Times must be HH:mm.";
            Map<String, Object> body = Map.of("contents", new Object[]{Map.of("parts", new Object[]{
                Map.of("text", prompt), Map.of("inline_data", Map.of("mime_type", contentType,
                    "data", Base64.getEncoder().encodeToString(bytes)))
            })});
            // ponytail: systemInstruction ceiling when model supports it; upgrade prompt to versioned template file

            String raw = requestWithRetry(body);
            JsonNode root = mapper.readTree(raw);
            String text = root.at("/candidates/0/content/parts/0/text").asText();
            text = text.replaceFirst("^```json\\s*", "").replaceFirst("\\s*```$", "").trim();
            return mapper.readValue(text, OcrResult.class);
        } catch (OcrException ocrEx) {
            if (enableFallback) {
                log.warn("OCR failed with OcrException (timeout={}, rateLimited={}). Using fallback draft.",
                    ocrEx.isTimeout(), ocrEx.isRateLimited());
                return OcrFallbackHandler.createFallbackResult();
            }
            throw ocrEx;
        } catch (Exception exception) {
            log.error("Failed to parse Gemini OCR response", exception);
            if (enableFallback) {
                log.info("Fallback enabled: returning editable draft result due to parsing error");
                return OcrFallbackHandler.createFallbackResult();
            }
            throw new OcrException("Gemini response could not be parsed", false, exception);
        }
    }

    private String requestWithRetry(Map<String, Object> body) {
        long currentBackoff = initialBackoffMs;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return client.post()
                    .uri(uriBuilder -> uriBuilder.queryParam("key", apiKey).build())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            } catch (RestClientResponseException ex) {
                int status = ex.getStatusCode().value();
                boolean isQuotaOrRateLimit = status == HttpStatus.TOO_MANY_REQUESTS.value() || status == 429;
                boolean is5xx = ex.getStatusCode().is5xxServerError();

                if (isQuotaOrRateLimit) {
                    log.warn("Gemini API quota exceeded / rate limited (status 429) on attempt {}/{}", attempt, maxAttempts);
                    if (attempt == maxAttempts) {
                        throw new OcrException("Gemini API quota exceeded or rate limited (429)", false, true, ex);
                    }
                } else if (is5xx) {
                    log.warn("Gemini API returned server error status {} on attempt {}/{}", status, attempt, maxAttempts);
                    if (attempt == maxAttempts) {
                        throw new OcrException("Gemini API request failed with server error: " + status, false, ex);
                    }
                } else {
                    // 4xx client errors (e.g. 400 bad payload, 403 forbidden) are not retryable
                    log.error("Gemini API returned client error: {} {}", status, ex.getResponseBodyAsString());
                    throw new OcrException("Gemini API client error: " + status, false, ex);
                }

                sleepBackoff(currentBackoff);
                currentBackoff = (long) (currentBackoff * backoffMultiplier);
            } catch (ResourceAccessException ex) {
                boolean timeout = ex.getCause() instanceof SocketTimeoutException;
                log.warn("Network / timeout exception on attempt {}/{} (timeout={}): {}", attempt, maxAttempts, timeout, ex.getMessage());

                if (attempt == maxAttempts) {
                    throw new OcrException("Gemini API request failed: " + (timeout ? "Read/Connect Timeout" : "Network error"),
                        timeout, ex);
                }

                sleepBackoff(currentBackoff);
                currentBackoff = (long) (currentBackoff * backoffMultiplier);
            } catch (Exception ex) {
                log.error("Unexpected error contacting Gemini API on attempt {}/{}", attempt, maxAttempts, ex);
                throw new OcrException("Unexpected error communicating with Gemini API", false, ex);
            }
        }

        throw new OcrException("Gemini API request failed after " + maxAttempts + " attempts", false, null);
    }

    private void sleepBackoff(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new OcrException("Interrupted during retry backoff", false, ie);
        }
    }
}