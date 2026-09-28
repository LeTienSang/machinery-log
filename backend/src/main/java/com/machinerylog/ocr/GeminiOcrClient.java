package com.machinerylog.ocr;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.net.SocketTimeoutException;
import java.util.Base64;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

@Service
public class GeminiOcrClient implements OcrClient {
    private final RestClient client;
    private final ObjectMapper mapper;
    private final String apiKey;

    public GeminiOcrClient(ObjectMapper mapper,
                           @Value("${machinery-log.ocr.api-key:}") String apiKey,
                           @Value("${machinery-log.ocr.endpoint:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent}") String endpoint) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(30_000);
        requestFactory.setReadTimeout(30_000);
        this.client = RestClient.builder().baseUrl(endpoint).requestFactory(requestFactory).build();
        this.mapper = mapper;
        this.apiKey = apiKey;
    }

    @Override
    public OcrResult process(InputStream image, String contentType, long size) {
        if (apiKey.isBlank() || apiKey.equals("replace-me")) {
            throw new OcrException("Gemini API key is not configured", false, null);
        }
        try {
            byte[] bytes = image.readAllBytes();
            String prompt = "Extract this handwritten machinery log as JSON only. Fields: "
                + "morningStartTime, morningEndTime, afternoonStartTime, afternoonEndTime, "
                + "eveningStartTime, eveningEndTime, operatingHours, standbyHours, workDescription, operatorName. "
                + "Use null when unreadable. Times must be HH:mm.";
            Map<String, Object> body = Map.of("contents", new Object[]{Map.of("parts", new Object[]{
                Map.of("text", prompt), Map.of("inline_data", Map.of("mime_type", contentType,
                    "data", Base64.getEncoder().encodeToString(bytes)))
            })});
            String raw = client.post().uri(uriBuilder -> uriBuilder.queryParam("key", apiKey).build())
                .contentType(MediaType.APPLICATION_JSON).body(body).retrieve().body(String.class);
            JsonNode root = mapper.readTree(raw);
            String text = root.at("/candidates/0/content/parts/0/text").asText();
            text = text.replaceFirst("^```json\\s*", "").replaceFirst("\\s*```$", "").trim();
            return mapper.readValue(text, OcrResult.class);
        } catch (ResourceAccessException exception) {
            boolean timeout = exception.getCause() instanceof SocketTimeoutException;
            throw new OcrException("Gemini API request failed", timeout, exception);
        } catch (Exception exception) {
            throw new OcrException("Gemini response could not be parsed", false, exception);
        }
    }
}