package com.machinerylog.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "customers")
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "company_name", nullable = false)
    private String companyName;
    
    @Column(name = "tax_code")
    private String taxCode;
    
    @Column(name = "representative_name")
    private String representativeName;
    
    private String position;
    
    @Column(name = "phone_number")
    private String phoneNumber;
    
    @Column(name = "address")
    private String address;
    
    @Column(name = "deleted_at")
    private Instant deletedAt;
    
    // Constructors
    public Customer() {}
    
    public Customer(String companyName, String taxCode, String representativeName, String position, String phoneNumber, String address) {
        this.companyName = companyName;
        this.taxCode = taxCode;
        this.representativeName = representativeName;
        this.position = position;
        this.phoneNumber = phoneNumber;
        this.address = address;
        this.deletedAt = null;
    }
    
    // Getters and setters
    public Long getId() { return id; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getTaxCode() { return taxCode; }
    public void setTaxCode(String taxCode) { this.taxCode = taxCode; }
    public String getRepresentativeName() { return representativeName; }
    public void setRepresentativeName(String representativeName) { this.representativeName = representativeName; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }
}