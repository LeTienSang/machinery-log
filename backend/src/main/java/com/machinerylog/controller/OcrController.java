package com.machinerylog.controller;

import com.machinerylog.api.ApiError;
import com.machinerylog.entity.User;
import com.machinerylog.service.OcrService;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/ocr")
public class OcrController {
    private final OcrService ocr;

    public OcrController(OcrService ocr) { this.ocr = ocr; }

    @PostMapping(value = "/process-log", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OPERATOR', 'ACCOUNTANT_ADMIN')")
    public ResponseEntity<ApiError> process(
        @RequestPart("file") MultipartFile file,
        @RequestParam(required = false) Long contractId,
        @RequestParam(required = false) Long equipmentId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate workDate,
        @RequestParam(required = false) Long operatorId,
        @AuthenticationPrincipal User actor
    ) {
        return ResponseEntity.ok(new ApiError(ocr.process(file, contractId, equipmentId, workDate, operatorId, actor), "OCR processed successfully"));
    }
}