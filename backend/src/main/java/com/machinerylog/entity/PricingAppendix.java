package com.machinerylog.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "pricing_appendices")
public class PricingAppendix {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "contract_id", nullable = false) private Long contractId;
    @Column(name = "equipment_id", nullable = false) private Long equipmentId;
    @Enumerated(EnumType.STRING) @Column(name = "pricing_type", nullable = false) private PricingType pricingType = PricingType.HOURLY;
    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2) private BigDecimal unitPrice;
    @Column(name = "unit_of_measure", nullable = false) private String unitOfMeasure = "Hours";
    public PricingAppendix() { }
    public Long getId() { return id; }
    public Long getContractId() { return contractId; }
    public void setContractId(Long value) { contractId = value; }
    public Long getEquipmentId() { return equipmentId; }
    public void setEquipmentId(Long value) { equipmentId = value; }
    public PricingType getPricingType() { return pricingType; }
    public void setPricingType(PricingType value) { pricingType = value; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal value) { unitPrice = value; }
    public String getUnitOfMeasure() { return unitOfMeasure; }
    public void setUnitOfMeasure(String value) { unitOfMeasure = value; }
}