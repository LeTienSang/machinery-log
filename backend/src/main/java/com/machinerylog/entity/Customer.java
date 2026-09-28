package com.machinerylog.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "customers")
public class Customer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "company_name", nullable = false) private String companyName;
    @Column(name = "tax_code") private String taxCode;
    @Column(name = "representative_name") private String representativeName;
    private String position;
    @Column(name = "phone_number") private String phoneNumber;
    private String address;
    public Customer() { }
    public Long getId() { return id; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String value) { companyName = value; }
    public String getTaxCode() { return taxCode; }
    public void setTaxCode(String value) { taxCode = value; }
    public String getRepresentativeName() { return representativeName; }
    public void setRepresentativeName(String value) { representativeName = value; }
    public String getPosition() { return position; }
    public void setPosition(String value) { position = value; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String value) { phoneNumber = value; }
    public String getAddress() { return address; }
    public void setAddress(String value) { address = value; }
}