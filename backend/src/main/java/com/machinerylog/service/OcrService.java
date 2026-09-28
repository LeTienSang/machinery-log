package com.machinerylog.service;

import com.machinerylog.dto.DailyLogDto;
import com.machinerylog.entity.User;
import com.machinerylog.ocr.OcrClient;
import com.machinerylog.ocr.OcrInputException;
import com.machinerylog.storage.FileStorage;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class OcrService {
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    private static final Set<String> CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/heic");
    private final FileStorage storage;
    private final OcrClient ocrClient;
    private final DailyLogService dailyLogs;

    public OcrService(FileStorage storage, OcrClient ocrClient, DailyLogService dailyLogs) {
        this.storage = storage;
        this.ocrClient = ocrClient;
        this.dailyLogs = dailyLogs;
    }

    public DailyLogDto process(MultipartFile file, Long contractId, Long equipmentId,
                               LocalDate workDate, Long requestedOperatorId, User actor) {
        validate(file);
        Long operatorId = actor.getRole().name().equals("OPERATOR") ? actor.getId() : requestedOperatorId;
        if (operatorId == null) throw new IllegalArgumentException("operatorId is required for accountant uploads");
        try {
            byte[] bytes = file.getBytes();
            String extension = extension(file.getContentType());
            String objectName = "daily-logs/" + contractId + "/" + UUID.randomUUID() + extension;
            String imageUrl = storage.store(objectName, new ByteArrayInputStream(bytes), bytes.length, file.getContentType());
            var result = ocrClient.process(new ByteArrayInputStream(bytes), file.getContentType(), bytes.length);
            return dailyLogs.createFromOcr(contractId, equipmentId, workDate, operatorId, imageUrl, result);
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to read uploaded image", exception);
        }
    }

    private void validate(MultipartFile file) {
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (file.isEmpty() || file.getSize() > MAX_FILE_SIZE) throw new OcrInputException("FILE_TOO_LARGE");
        if (!CONTENT_TYPES.contains(contentType)) throw new OcrInputException("INVALID_FILE_TYPE");
    }

    private String extension(String contentType) {
        return "image/png".equals(contentType) ? ".png" : "image/heic".equals(contentType) ? ".heic" : ".jpg";
    }
}