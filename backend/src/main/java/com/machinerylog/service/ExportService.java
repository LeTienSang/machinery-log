package com.machinerylog.service;

import com.machinerylog.entity.AcceptanceStatus;
import com.machinerylog.entity.DailyLog;
import com.machinerylog.entity.DebtReconciliation;
import com.machinerylog.entity.MonthlyAcceptance;
import com.machinerylog.exception.ResourceNotFoundException;
import com.machinerylog.repository.ContractRepository;
import com.machinerylog.repository.DailyLogRepository;
import com.machinerylog.repository.DebtReconciliationRepository;
import com.machinerylog.repository.MonthlyAcceptanceRepository;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExportService {
    private final ContractRepository contracts;
    private final DailyLogRepository dailyLogs;
    private final MonthlyAcceptanceRepository acceptances;
    private final DebtReconciliationRepository reconciliations;
    private final MonthlyAcceptanceService acceptanceService;
    private final AuditLogService auditLogs;

    public ExportService(ContractRepository contracts,
                         DailyLogRepository dailyLogs,
                         MonthlyAcceptanceRepository acceptances,
                         DebtReconciliationRepository reconciliations,
                         MonthlyAcceptanceService acceptanceService) {
        this(contracts, dailyLogs, acceptances, reconciliations, acceptanceService, null);
    }

    @Autowired
    public ExportService(ContractRepository contracts,
                         DailyLogRepository dailyLogs,
                         MonthlyAcceptanceRepository acceptances,
                         DebtReconciliationRepository reconciliations,
                         MonthlyAcceptanceService acceptanceService,
                         AuditLogService auditLogs) {
        this.contracts = contracts;
        this.dailyLogs = dailyLogs;
        this.acceptances = acceptances;
        this.reconciliations = reconciliations;
        this.acceptanceService = acceptanceService;
        this.auditLogs = auditLogs;
    }

    @Transactional
    public byte[] reportSet(Long contractId, String month) {
        if (contracts.findByIdAndNotDeleted(contractId) == null) {
            throw new ResourceNotFoundException("Contract not found: " + contractId);
        }
        YearMonth yearMonth = YearMonth.parse(month);
        LocalDate fromDate = yearMonth.atDay(1);
        LocalDate toDate = yearMonth.plusMonths(1).atDay(1);
        List<DailyLog> approvedLogs = dailyLogs.findApprovedByContractIdBetweenDateRange(contractId, fromDate, toDate);
        if (approvedLogs.isEmpty()) {
            throw new IllegalArgumentException("No approved logs for contract and month");
        }

        List<MonthlyAcceptance> monthly = acceptances.findByContractIdAndBillingMonthOrderByEquipmentId(contractId, month);
        if (monthly.isEmpty() || monthly.stream().anyMatch(value -> value.getStatus() == AcceptanceStatus.NEEDS_RECALCULATION)) {
            acceptanceService.recalculate(contractId, month);
            monthly = acceptances.findByContractIdAndBillingMonthOrderByEquipmentId(contractId, month);
        }
        if (monthly.isEmpty()) {
            throw new IllegalArgumentException("No monthly acceptance data for contract and month");
        }

        List<DebtReconciliation> debt = reconciliations.findByContractIdOrderByReconciliationDateDescIdDesc(contractId).stream()
            .filter(value -> value.getReconciliationDate() != null && YearMonth.from(value.getReconciliationDate()).equals(yearMonth))
            .toList();
        try {
            byte[] hours = workbook("Bảng tổng hợp giờ làm", List.of("Ngày", "Thiết bị", "Giờ vận hành", "Trạng thái"), approvedLogs.stream()
                .map(value -> List.of((Object) value.getWorkDate(), value.getEquipmentId(), value.getOperatingHours(), value.getApprovalStatus()))
                .toList());
            byte[] acceptance = workbook("Biên bản bàn giao nghiệm thu", List.of("Thiết bị", "Giờ vận hành", "Đơn giá", "Trước VAT", "VAT", "Tổng tiền", "Trạng thái", "Export version"), monthly.stream()
                .map(value -> List.of((Object) value.getEquipmentId(), value.getTotalOperatingHours(), value.getAppliedUnitPrice(), value.getSubtotalBeforeVat(), value.getVatAmount(), value.getTotalAmount(), value.getStatus(), value.getExportVersion()))
                .toList());
            byte[] debtReport = workbook("Biên bản đối chiếu công nợ", List.of("Ngày đối chiếu", "Dư đầu kỳ", "Nghiệm thu kỳ này", "Đã thanh toán", "Dư cuối kỳ", "Trạng thái"), debt.stream()
                .map(value -> List.of((Object) value.getReconciliationDate(), value.getPreviousBalance(), value.getCurrentPeriodAcceptance(), value.getTotalPaid(), value.getRemainingBalance(), value.getStatus()))
                .toList());

            Instant exportedAt = Instant.now();
            monthly.forEach(value -> value.setLastExportedAt(exportedAt));
            acceptances.saveAll(monthly);
            if (auditLogs != null) {
                monthly.forEach(value -> auditLogs.record(null, "EXPORT_CREATED", "MonthlyAcceptance", value.getId(), null, null, month, null));
            }
            return zip(month, hours, acceptance, debtReport);
        } catch (IOException exception) {
            throw new IllegalStateException("Excel generation failed", exception);
        }
    }

    private byte[] workbook(String title, List<String> headers, List<List<Object>> rows) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Report");
            Row titleRow = sheet.createRow(0);
            titleRow.createCell(0).setCellValue(title);
            Row headerRow = sheet.createRow(2);
            for (int index = 0; index < headers.size(); index++) {
                headerRow.createCell(index).setCellValue(headers.get(index));
            }
            for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
                Row row = sheet.createRow(rowIndex + 3);
                List<Object> values = rows.get(rowIndex);
                for (int columnIndex = 0; columnIndex < values.size(); columnIndex++) {
                    setCell(row, columnIndex, values.get(columnIndex));
                }
            }
            for (int index = 0; index < headers.size(); index++) {
                sheet.autoSizeColumn(index);
            }
            workbook.write(output);
            return output.toByteArray();
        }
    }

    private void setCell(Row row, int column, Object value) {
        if (value == null) return;
        if (value instanceof Number number) {
            row.createCell(column).setCellValue(number.doubleValue());
        } else {
            row.createCell(column).setCellValue(value.toString());
        }
    }

    private byte[] zip(String month, byte[] hours, byte[] acceptance, byte[] debt) throws IOException {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream(); ZipOutputStream zip = new ZipOutputStream(output)) {
            add(zip, "bang-tong-hop-gio-lam_" + month + ".xlsx", hours);
            add(zip, "bien-ban-ban-giao-nghiem-thu_" + month + ".xlsx", acceptance);
            add(zip, "bien-ban-doi-chieu-cong-no_" + month + ".xlsx", debt);
            zip.finish();
            return output.toByteArray();
        }
    }

    private void add(ZipOutputStream zip, String name, byte[] content) throws IOException {
        zip.putNextEntry(new ZipEntry(name));
        zip.write(content);
        zip.closeEntry();
    }
}
