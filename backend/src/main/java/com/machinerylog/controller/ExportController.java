package com.machinerylog.controller;

import com.machinerylog.api.ApiError;
import com.machinerylog.service.ExportService;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/export")
@PreAuthorize("hasRole('ACCOUNTANT_ADMIN')")
public class ExportController {
    private final ExportService exports;

    public ExportController(ExportService exports) { this.exports = exports; }

    @GetMapping("/report-set")
    public ResponseEntity<byte[]> reportSet(
        @RequestParam Long contractId,
        @RequestParam @Pattern(regexp = "\\d{4}-(0[1-9]|1[0-2])") String month) {
        byte[] content = exports.reportSet(contractId, month);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.valueOf("application/zip"));
        headers.setContentDisposition(ContentDisposition.attachment()
            .filename("report-set_contract" + contractId + "_" + month + ".zip")
            .build());
        headers.setContentLength(content.length);
        return ResponseEntity.ok().headers(headers).body(content);
    }
}
