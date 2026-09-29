package com.machinerylog.controller;

import com.machinerylog.api.ApiError;
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
@org.springframework.validation.annotation.Validated
public class CatalogController {
    private final CatalogService catalogs;
    public CatalogController(CatalogService catalogs) { this.catalogs = catalogs; }

    @GetMapping("/api/v1/customers")
    public ResponseEntity<ApiError> customers(@RequestParam(required = false) String search,
                                             @PageableDefault(size = 20) Pageable page) {
        return ResponseEntity.ok(new ApiError(catalogs.customers(search, page), "Customers retrieved"));
    }
    @GetMapping("/api/v1/customers/{id}")
    public ResponseEntity<ApiError> customer(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiError(catalogs.customer(id), "Customer retrieved"));
    }
    @PostMapping("/api/v1/customers")
    public ResponseEntity<ApiError> createCustomer(@Valid @RequestBody CustomerDto dto) {
        return ResponseEntity.ok(new ApiError(catalogs.save(dto), "Customer created"));
    }
    @PutMapping("/api/v1/customers/{id}")
    public ResponseEntity<ApiError> updateCustomer(@PathVariable Long id, @Valid @RequestBody CustomerDto dto) {
        return ResponseEntity.ok(new ApiError(catalogs.save(new CustomerDto(id, dto.companyName(), dto.taxCode(), dto.representativeName(), dto.position(), dto.phoneNumber(), dto.address())), "Customer updated"));
    }
    @DeleteMapping("/api/v1/customers/{id}")
    public ResponseEntity<ApiError> deleteCustomer(@PathVariable Long id) {
        catalogs.deleteCustomer(id);
        return ResponseEntity.ok(new ApiError(null, "Customer deleted"));
    }

    @GetMapping("/api/v1/equipment")
    public ResponseEntity<ApiError> equipment(@RequestParam(required = false) String search,
                                                     @PageableDefault(size = 20) Pageable page) {
        return ResponseEntity.ok(new ApiError(catalogs.equipment(search, page), "Equipment retrieved"));
    }
    @GetMapping("/api/v1/equipment/{id}")
    public ResponseEntity<ApiError> equipment(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiError(catalogs.equipment(id), "Equipment retrieved"));
    }
    @PostMapping("/api/v1/equipment")
    public ResponseEntity<ApiError> createEquipment(@Valid @RequestBody EquipmentDto dto) {
        return ResponseEntity.ok(new ApiError(catalogs.save(dto), "Equipment created"));
    }
    @PutMapping("/api/v1/equipment/{id}")
    public ResponseEntity<ApiError> updateEquipment(@PathVariable Long id, @Valid @RequestBody EquipmentDto dto) {
        return ResponseEntity.ok(new ApiError(catalogs.save(new EquipmentDto(id, dto.equipmentName(), dto.serialRegistrationNumber(), dto.equipmentType())), "Equipment updated"));
    }
    @DeleteMapping("/api/v1/equipment/{id}")
    public ResponseEntity<ApiError> deleteEquipment(@PathVariable Long id) {
        catalogs.deleteEquipment(id);
        return ResponseEntity.ok(new ApiError(null, "Equipment deleted"));
    }

    @GetMapping("/api/v1/contracts")
    public ResponseEntity<ApiError> contracts(@RequestParam(required = false) String search,
                                                       @PageableDefault(size = 20) Pageable page) {
        return ResponseEntity.ok(new ApiError(catalogs.contracts(search, page), "Contracts retrieved"));
    }
    @GetMapping("/api/v1/contracts/{id}")
    public ResponseEntity<ApiError> contract(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiError(catalogs.contract(id), "Contract retrieved"));
    }
    @PostMapping("/api/v1/contracts")
    public ResponseEntity<ApiError> createContract(@Valid @RequestBody ContractDto dto) {
        return ResponseEntity.ok(new ApiError(catalogs.save(dto), "Contract created"));
    }
    @PutMapping("/api/v1/contracts/{id}")
    public ResponseEntity<ApiError> updateContract(@PathVariable Long id, @Valid @RequestBody ContractDto dto) {
        return ResponseEntity.ok(new ApiError(catalogs.save(new ContractDto(id, dto.customerId(), dto.contractNumber(), dto.signingDate(), dto.projectName(), dto.constructionSite(), dto.status())), "Contract updated"));
    }
    @DeleteMapping("/api/v1/contracts/{id}")
    public ResponseEntity<ApiError> deleteContract(@PathVariable Long id) {
        catalogs.deleteContract(id);
        return ResponseEntity.ok(new ApiError(null, "Contract deleted"));
    }

    @GetMapping("/api/v1/contracts/{contractId}/pricing-appendices")
    public ResponseEntity<ApiError> pricingAppendices(@PathVariable Long contractId) {
        return ResponseEntity.ok(new ApiError(catalogs.pricingAppendices(contractId), "Pricing appendices retrieved"));
    }
    @PostMapping("/api/v1/contracts/{contractId}/pricing-appendices")
    public ResponseEntity<ApiError> createPricing(@PathVariable Long contractId, @Valid @RequestBody PricingAppendixDto dto) {
        return ResponseEntity.ok(new ApiError(catalogs.savePricing(contractId, dto), "Pricing appendix created"));
    }
    @PutMapping("/api/v1/pricing-appendices/{id}")
    public ResponseEntity<ApiError> updatePricing(@PathVariable Long id, @Valid @RequestBody PricingAppendixDto dto) {
        return ResponseEntity.ok(new ApiError(catalogs.updatePricing(id, dto), "Pricing appendix updated"));
    }
    @DeleteMapping("/api/v1/pricing-appendices/{id}")
    public ResponseEntity<ApiError> deletePricing(@PathVariable Long id) {
        catalogs.deletePricing(id);
        return ResponseEntity.ok(new ApiError(null, "Pricing appendix deleted"));
    }
}