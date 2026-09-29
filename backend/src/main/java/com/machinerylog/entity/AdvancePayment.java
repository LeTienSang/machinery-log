package com.machinerylog.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "advance_payments")
public class AdvancePayment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "contract_id", nullable = false) private Long contractId;
    @Column(name = "document_date", nullable = false) private LocalDate documentDate;
    @Column(name = "document_number") private String documentNumber;
    @Column private String description;
    @Column(nullable = false, precision = 15, scale = 2) private BigDecimal amount;

    public AdvancePayment() { }

    public Long getId() { return id; }
    public Long getContractId() { return contractId; }
    public LocalDate getDocumentDate() { return documentDate; }
    public String getDocumentNumber() { return documentNumber; }
    public String getDescription() { return description; }
    public BigDecimal getAmount() { return amount; }
    public void setContractId(Long value) { contractId = value; }
    public void setDocumentDate(LocalDate value) { documentDate = value; }
    public void setDocumentNumber(String value) { documentNumber = value; }
    public void setDescription(String value) { description = value; }
    public void setAmount(BigDecimal value) { amount = value; }
}
