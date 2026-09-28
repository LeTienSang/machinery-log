package com.machinerylog.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "equipment")
public class Equipment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "equipment_name", nullable = false) private String equipmentName;
    @Column(name = "serial_registration_number", nullable = false, unique = true) private String serialRegistrationNumber;
    @Column(name = "equipment_type") private String equipmentType;
    @Column(name = "deleted_at") private Instant deletedAt;
    public Equipment() { }
    public Long getId() { return id; }
    public String getEquipmentName() { return equipmentName; }
    public void setEquipmentName(String value) { equipmentName = value; }
    public String getSerialRegistrationNumber() { return serialRegistrationNumber; }
    public void setSerialRegistrationNumber(String value) { serialRegistrationNumber = value; }
    public String getEquipmentType() { return equipmentType; }
    public void setEquipmentType(String value) { equipmentType = value; }
    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant value) { deletedAt = value; }
}