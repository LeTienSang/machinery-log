package com.machinerylog.controller;

import com.machinerylog.dto.*;
import com.machinerylog.service.CatalogService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@PreAuthorize("hasRole('ACCOUNTANT_ADMIN')")
public class CatalogController {
    private final CatalogService catalogs;
    public CatalogController(CatalogService catalogs) { this.catalogs = catalogs; }

    @GetMapping("/api/v1/customers") public ResponseEntity<?> customers(@RequestParam(required = false) String search, @PageableDefault(size = 20) Pageable page) { return ResponseEntity.ok(catalogs.customers(search, page)); }
    @GetMapping("/api/v1/customers/{id}") public ResponseEntity<CustomerDto> customer(@PathVariable Long id) { return ResponseEntity.ok(catalogs.customer(id)); }
    @PostMapping("/api/v1/customers") public ResponseEntity<CustomerDto> createCustomer(@Valid @RequestBody CustomerDto dto) { return ResponseEntity.ok(catalogs.save(dto)); }
    @PutMapping("/api/v1/customers/{id}") public ResponseEntity<CustomerDto> updateCustomer(@PathVariable Long id, @Valid @RequestBody CustomerDto dto) { return ResponseEntity.ok(catalogs.save(new CustomerDto(id, dto.companyName(), dto.taxCode(), dto.representativeName(), dto.position(), dto.phoneNumber(), dto.address()))); }
    @DeleteMapping("/api/v1/customers/{id}") public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) { catalogs.deleteCustomer(id); return ResponseEntity.noContent().build(); }

    @GetMapping("/api/v1/equipment") public ResponseEntity<?> equipment(@RequestParam(required = false) String search, @PageableDefault(size = 20) Pageable page) { return ResponseEntity.ok(catalogs.equipment(search, page)); }
    @GetMapping("/api/v1/equipment/{id}") public ResponseEntity<EquipmentDto> equipment(@PathVariable Long id) { return ResponseEntity.ok(catalogs.equipment(id)); }
    @PostMapping("/api/v1/equipment") public ResponseEntity<EquipmentDto> createEquipment(@Valid @RequestBody EquipmentDto dto) { return ResponseEntity.ok(catalogs.save(dto)); }
    @PutMapping("/api/v1/equipment/{id}") public ResponseEntity<EquipmentDto> updateEquipment(@PathVariable Long id, @Valid @RequestBody EquipmentDto dto) { return ResponseEntity.ok(catalogs.save(new EquipmentDto(id, dto.equipmentName(), dto.serialRegistrationNumber(), dto.equipmentType()))); }
    @DeleteMapping("/api/v1/equipment/{id}") public ResponseEntity<Void> deleteEquipment(@PathVariable Long id) { catalogs.deleteEquipment(id); return ResponseEntity.noContent().build(); }

    @GetMapping("/api/v1/contracts") public ResponseEntity<?> contracts(@RequestParam(required = false) String search, @PageableDefault(size = 20) Pageable page) { return ResponseEntity.ok(catalogs.contracts(search, page)); }
    @GetMapping("/api/v1/contracts/{id}") public ResponseEntity<ContractDto> contract(@PathVariable Long id) { return ResponseEntity.ok(catalogs.contract(id)); }
    @PostMapping("/api/v1/contracts") public ResponseEntity<ContractDto> createContract(@Valid @RequestBody ContractDto dto) { return ResponseEntity.ok(catalogs.save(dto)); }
    @PutMapping("/api/v1/contracts/{id}") public ResponseEntity<ContractDto> updateContract(@PathVariable Long id, @Valid @RequestBody ContractDto dto) { return ResponseEntity.ok(catalogs.save(new ContractDto(id, dto.customerId(), dto.contractNumber(), dto.signingDate(), dto.projectName(), dto.constructionSite(), dto.status()))); }
    @DeleteMapping("/api/v1/contracts/{id}") public ResponseEntity<Void> deleteContract(@PathVariable Long id) { catalogs.deleteContract(id); return ResponseEntity.noContent().build(); }

    @GetMapping("/api/v1/contracts/{contractId}/pricing-appendices")
    public ResponseEntity<?> pricingAppendices(@PathVariable Long contractId) { return ResponseEntity.ok(catalogs.pricingAppendices(contractId)); }
    @PostMapping("/api/v1/contracts/{contractId}/pricing-appendices")
    public ResponseEntity<PricingAppendixDto> createPricing(@PathVariable Long contractId, @Valid @RequestBody PricingAppendixDto dto) { return ResponseEntity.ok(catalogs.savePricing(contractId, dto)); }
    @PutMapping("/api/v1/pricing-appendices/{id}")
    public ResponseEntity<PricingAppendixDto> updatePricing(@PathVariable Long id, @Valid @RequestBody PricingAppendixDto dto) { return ResponseEntity.ok(catalogs.updatePricing(id, dto)); }
    @DeleteMapping("/api/v1/pricing-appendices/{id}")
    public ResponseEntity<Void> deletePricing(@PathVariable Long id) { catalogs.deletePricing(id); return ResponseEntity.noContent().build(); }
}