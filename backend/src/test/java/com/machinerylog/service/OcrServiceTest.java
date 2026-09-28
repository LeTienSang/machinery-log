package com.machinerylog.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import com.machinerylog.ocr.OcrClient;
import com.machinerylog.ocr.OcrInputException;
import com.machinerylog.storage.FileStorage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class OcrServiceTest {
    private FileStorage storage;
    private OcrClient ocrClient;
    private OcrService service;

    @BeforeEach
    void setUp() {
        storage = mock(FileStorage.class);
        ocrClient = mock(OcrClient.class);
        service = new OcrService(storage, ocrClient, mock(DailyLogService.class), 10 * 1024 * 1024);
    }

    @Test
    void rejectsUnsupportedFileTypeBeforeExternalCalls() {
        var file = new MockMultipartFile("file", "log.txt", "text/plain", "text".getBytes());

        OcrInputException exception = assertThrows(OcrInputException.class,
            () -> service.process(file, 1L, 2L, java.time.LocalDate.now(), 3L, user()));

        assertEquals("INVALID_FILE_TYPE", exception.getErrorCode());
        verifyNoInteractions(storage, ocrClient);
    }

    @Test
    void rejectsOversizedFileBeforeExternalCalls() {
        var file = new MockMultipartFile("file", "log.jpg", "image/jpeg", new byte[10 * 1024 * 1024 + 1]);

        OcrInputException exception = assertThrows(OcrInputException.class,
            () -> service.process(file, 1L, 2L, java.time.LocalDate.now(), 3L, user()));

        assertEquals("FILE_TOO_LARGE", exception.getErrorCode());
        verifyNoInteractions(storage, ocrClient);
    }

    private com.machinerylog.entity.User user() {
        return new com.machinerylog.entity.User("operator", "hash", "Operator", com.machinerylog.entity.UserRole.OPERATOR);
    }
}