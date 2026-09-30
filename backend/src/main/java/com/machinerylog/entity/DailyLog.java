package com.machinerylog.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "daily_logs")
public class DailyLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "operator_id")
    private Long operatorId;

    @Column(name = "contract_id")
    private Long contractId;

    @Column(name = "equipment_id")
    private Long equipmentId;

    @Column(name = "work_date")
    private LocalDate workDate;

    @Column(name = "work_description")
    private String workDescription;

    @Column(name = "morning_start_time") private String morningStartTime;
    @Column(name = "morning_end_time") private String morningEndTime;
    @Column(name = "afternoon_start_time") private String afternoonStartTime;
    @Column(name = "afternoon_end_time") private String afternoonEndTime;
    @Column(name = "evening_start_time") private String eveningStartTime;
    @Column(name = "evening_end_time") private String eveningEndTime;

    @Column(name = "operating_hours", nullable = false) private BigDecimal operatingHours = BigDecimal.ZERO;
    @Column(name = "standby_hours", nullable = false) private BigDecimal standbyHours = BigDecimal.ZERO;
    @Column(name = "operator_name") private String operatorName;
    @Column(name = "original_image_url") private String originalImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false)
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    @Column(name = "rejection_reason") private String rejectionReason;
    @Column(name = "reviewer_id") private Long reviewerId;

    public DailyLog() { }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getOperatorId() { return operatorId; }
    public void setOperatorId(Long operatorId) { this.operatorId = operatorId; }
    public Long getContractId() { return contractId; }
    public Long getEquipmentId() { return equipmentId; }
    public void setContractId(Long contractId) { this.contractId = contractId; }
    public void setEquipmentId(Long equipmentId) { this.equipmentId = equipmentId; }
    public LocalDate getWorkDate() { return workDate; }
    public void setWorkDate(LocalDate workDate) { this.workDate = workDate; }
    public String getWorkDescription() { return workDescription; }
    public void setWorkDescription(String value) { this.workDescription = value; }
    public String getMorningStartTime() { return morningStartTime; }
    public void setMorningStartTime(String value) { this.morningStartTime = value; }
    public String getMorningEndTime() { return morningEndTime; }
    public void setMorningEndTime(String value) { this.morningEndTime = value; }
    public String getAfternoonStartTime() { return afternoonStartTime; }
    public void setAfternoonStartTime(String value) { this.afternoonStartTime = value; }
    public String getAfternoonEndTime() { return afternoonEndTime; }
    public void setAfternoonEndTime(String value) { this.afternoonEndTime = value; }
    public String getEveningStartTime() { return eveningStartTime; }
    public void setEveningStartTime(String value) { this.eveningStartTime = value; }
    public String getEveningEndTime() { return eveningEndTime; }
    public void setEveningEndTime(String value) { this.eveningEndTime = value; }
    public BigDecimal getOperatingHours() { return operatingHours; }
    public void setOperatingHours(BigDecimal value) { this.operatingHours = value; }
    public BigDecimal getStandbyHours() { return standbyHours; }
    public void setStandbyHours(BigDecimal value) { this.standbyHours = value; }
    public String getOperatorName() { return operatorName; }
    public void setOperatorName(String value) { this.operatorName = value; }
    public String getOriginalImageUrl() { return originalImageUrl; }
    public void setOriginalImageUrl(String value) { this.originalImageUrl = value; }
    public ApprovalStatus getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(ApprovalStatus value) { this.approvalStatus = value; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String value) { this.rejectionReason = value; }
    public Long getReviewerId() { return reviewerId; }
    public void setReviewerId(Long reviewerId) { this.reviewerId = reviewerId; }
}