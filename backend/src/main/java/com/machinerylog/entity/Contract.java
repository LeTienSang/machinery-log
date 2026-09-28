package com.machinerylog.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.Instant;

@Entity
@Table(name = "contracts")
public class Contract {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "customer_id", nullable = false) private Long customerId;
    @Column(name = "contract_number", nullable = false, unique = true) private String contractNumber;
    @Column(name = "signing_date") private LocalDate signingDate;
    @Column(name = "project_name") private String projectName;
    @Column(name = "construction_site") private String constructionSite;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private ContractStatus status = ContractStatus.ACTIVE;
    @Column(name = "deleted_at") private Instant deletedAt;
    public Contract() { }
    public Long getId() { return id; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long value) { customerId = value; }
    public String getContractNumber() { return contractNumber; }
    public void setContractNumber(String value) { contractNumber = value; }
    public LocalDate getSigningDate() { return signingDate; }
    public void setSigningDate(LocalDate value) { signingDate = value; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String value) { projectName = value; }
    public String getConstructionSite() { return constructionSite; }
    public void setConstructionSite(String value) { constructionSite = value; }
    public ContractStatus getStatus() { return status; }
    public void setStatus(ContractStatus value) { status = value; }
    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant value) { deletedAt = value; }
}