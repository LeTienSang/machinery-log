package com.machinerylog.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "monthly_acceptances")
public class MonthlyAcceptance {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "contract_id", nullable = false) private Long contractId;
    @Column(name = "equipment_id", nullable = false) private Long equipmentId;
    @Column(name = "billing_month", nullable = false) private String billingMonth;
    @Column(name = "from_date") private java.time.LocalDate fromDate;
    @Column(name = "to_date") private java.time.LocalDate toDate;
    @Column(name = "total_operating_hours", precision = 8, scale = 2) private BigDecimal totalOperatingHours;
    @Column(name = "applied_unit_price", precision = 15, scale = 2) private BigDecimal appliedUnitPrice;
    @Column(name = "subtotal_before_vat", precision = 15, scale = 2) private BigDecimal subtotalBeforeVat;
    @Column(name = "vat_percentage", nullable = false) private Integer vatPercentage = 8;
    @Column(name = "vat_amount", precision = 15, scale = 2) private BigDecimal vatAmount;
    @Column(name = "total_amount", precision = 15, scale = 2) private BigDecimal totalAmount;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private AcceptanceStatus status = AcceptanceStatus.PENDING_SIGNATURE;
    @Column(name = "export_version", nullable = false) private Integer exportVersion = 1;
    @Column(name = "last_exported_at") private Instant lastExportedAt;
    @Column(name = "export_invalidated_at") private Instant exportInvalidatedAt;
    public MonthlyAcceptance() { }
    public Long getId() { return id; }
    public Long getContractId() { return contractId; }
    public Long getEquipmentId() { return equipmentId; }
    public String getBillingMonth() { return billingMonth; }
    public java.time.LocalDate getFromDate() { return fromDate; }
    public java.time.LocalDate getToDate() { return toDate; }
    public BigDecimal getTotalOperatingHours() { return totalOperatingHours; }
    public BigDecimal getAppliedUnitPrice() { return appliedUnitPrice; }
    public BigDecimal getSubtotalBeforeVat() { return subtotalBeforeVat; }
    public Integer getVatPercentage() { return vatPercentage; }
    public BigDecimal getVatAmount() { return vatAmount; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public AcceptanceStatus getStatus() { return status; }
    public Integer getExportVersion() { return exportVersion; }
    public Instant getLastExportedAt() { return lastExportedAt; }
    public Instant getExportInvalidatedAt() { return exportInvalidatedAt; }
    public void setContractId(Long value) { contractId = value; }
    public void setEquipmentId(Long value) { equipmentId = value; }
    public void setBillingMonth(String value) { billingMonth = value; }
    public void setFromDate(java.time.LocalDate value) { fromDate = value; }
    public void setToDate(java.time.LocalDate value) { toDate = value; }
    public void setTotalOperatingHours(BigDecimal value) { totalOperatingHours = value; }
    public void setAppliedUnitPrice(BigDecimal value) { appliedUnitPrice = value; }
    public void setSubtotalBeforeVat(BigDecimal value) { subtotalBeforeVat = value; }
    public void setVatPercentage(Integer value) { vatPercentage = value; }
    public void setVatAmount(BigDecimal value) { vatAmount = value; }
    public void setTotalAmount(BigDecimal value) { totalAmount = value; }
    public void setStatus(AcceptanceStatus value) { status = value; }
    public void setExportVersion(Integer value) { exportVersion = value; }
    public void setLastExportedAt(Instant value) { lastExportedAt = value; }
    public void setExportInvalidatedAt(Instant value) { exportInvalidatedAt = value; }
}