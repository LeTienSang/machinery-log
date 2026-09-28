package com.machinerylog.service;

import com.machinerylog.api.PageResponse;
import com.machinerylog.dto.*;
import com.machinerylog.entity.*;
import com.machinerylog.exception.ResourceNotFoundException;
import com.machinerylog.repository.*;
import java.util.function.Consumer;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CatalogService {
    private final CustomerRepository customers;
    private final EquipmentRepository equipment;
    private final ContractRepository contracts;
    private final PricingAppendixRepository pricingAppendices;

    public CatalogService(CustomerRepository customers, EquipmentRepository equipment, ContractRepository contracts,
                          PricingAppendixRepository pricingAppendices) {
        this.customers = customers; this.equipment = equipment; this.contracts = contracts;
        this.pricingAppendices = pricingAppendices;
    }

    @Transactional(readOnly = true) public PageResponse<CustomerDto> customers(String search, Pageable page) {
        return PageResponse.from(customers.search(blankToNull(search), page).map(this::customerDto));
    }
    @Transactional(readOnly = true) public CustomerDto customer(Long id) { return customerDto(findCustomer(id)); }
    @Transactional public CustomerDto save(CustomerDto dto) {
        Customer entity = dto.id() == null ? new Customer() : findCustomer(dto.id());
        entity.setCompanyName(dto.companyName()); entity.setTaxCode(dto.taxCode());
        entity.setRepresentativeName(dto.representativeName()); entity.setPosition(dto.position());
        entity.setPhoneNumber(dto.phoneNumber()); entity.setAddress(dto.address());
        return customerDto(customers.save(entity));
    }
    @Transactional public void deleteCustomer(Long id) { customers.delete(findCustomer(id)); }

    @Transactional(readOnly = true) public PageResponse<EquipmentDto> equipment(String search, Pageable page) {
        return PageResponse.from(equipment.search(blankToNull(search), page).map(this::equipmentDto));
    }
    @Transactional(readOnly = true) public EquipmentDto equipment(Long id) { return equipmentDto(findEquipment(id)); }
    @Transactional public EquipmentDto save(EquipmentDto dto) {
        Equipment entity = dto.id() == null ? new Equipment() : findEquipment(dto.id());
        entity.setEquipmentName(dto.equipmentName()); entity.setSerialRegistrationNumber(dto.serialRegistrationNumber());
        entity.setEquipmentType(dto.equipmentType()); return equipmentDto(equipment.save(entity));
    }
    @Transactional public void deleteEquipment(Long id) { equipment.delete(findEquipment(id)); }

    @Transactional(readOnly = true) public PageResponse<ContractDto> contracts(String search, Pageable page) {
        return PageResponse.from(contracts.search(blankToNull(search), page).map(this::contractDto));
    }
    @Transactional(readOnly = true) public ContractDto contract(Long id) { return contractDto(findContract(id)); }
    @Transactional public ContractDto save(ContractDto dto) {
        Customer customer = findCustomer(dto.customerId());
        Contract entity = dto.id() == null ? new Contract() : findContract(dto.id());
        entity.setCustomerId(customer.getId()); entity.setContractNumber(dto.contractNumber());
        entity.setSigningDate(dto.signingDate()); entity.setProjectName(dto.projectName());
        entity.setConstructionSite(dto.constructionSite());
        if (dto.status() != null) entity.setStatus(dto.status());
        return contractDto(contracts.save(entity));
    }
    @Transactional public void deleteContract(Long id) { contracts.delete(findContract(id)); }

    @Transactional(readOnly = true)
    public java.util.List<PricingAppendixDto> pricingAppendices(Long contractId) {
        findContract(contractId);
        return pricingAppendices.findByContractIdOrderByEquipmentIdAscPricingTypeAsc(contractId)
            .stream().map(this::pricingDto).toList();
    }

    @Transactional
    public PricingAppendixDto savePricing(Long contractId, PricingAppendixDto dto) {
        findContract(contractId);
        findEquipment(dto.equipmentId());
        PricingAppendix entity = dto.id() == null ? new PricingAppendix() : findPricing(dto.id());
        entity.setContractId(contractId);
        entity.setEquipmentId(dto.equipmentId());
        entity.setPricingType(dto.pricingType());
        entity.setUnitPrice(dto.unitPrice());
        entity.setUnitOfMeasure(dto.unitOfMeasure() == null || dto.unitOfMeasure().isBlank() ? "Hours" : dto.unitOfMeasure());
        return pricingDto(pricingAppendices.save(entity));
    }

    @Transactional
    public PricingAppendixDto updatePricing(Long id, PricingAppendixDto dto) {
        PricingAppendix current = findPricing(id);
        return savePricing(current.getContractId(), new PricingAppendixDto(id, current.getContractId(), dto.equipmentId(), dto.pricingType(), dto.unitPrice(), dto.unitOfMeasure()));
    }

    @Transactional public void deletePricing(Long id) { pricingAppendices.delete(findPricing(id)); }

    private Customer findCustomer(Long id) { return customers.findById(id).orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id)); }
    private Equipment findEquipment(Long id) { return equipment.findById(id).orElseThrow(() -> new ResourceNotFoundException("Equipment not found: " + id)); }
    private Contract findContract(Long id) { return contracts.findById(id).orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + id)); }
    private PricingAppendix findPricing(Long id) { return pricingAppendices.findById(id).orElseThrow(() -> new ResourceNotFoundException("Pricing appendix not found: " + id)); }
    private CustomerDto customerDto(Customer e) { return new CustomerDto(e.getId(), e.getCompanyName(), e.getTaxCode(), e.getRepresentativeName(), e.getPosition(), e.getPhoneNumber(), e.getAddress()); }
    private EquipmentDto equipmentDto(Equipment e) { return new EquipmentDto(e.getId(), e.getEquipmentName(), e.getSerialRegistrationNumber(), e.getEquipmentType()); }
    private ContractDto contractDto(Contract e) { return new ContractDto(e.getId(), e.getCustomerId(), e.getContractNumber(), e.getSigningDate(), e.getProjectName(), e.getConstructionSite(), e.getStatus()); }
    private PricingAppendixDto pricingDto(PricingAppendix e) { return new PricingAppendixDto(e.getId(), e.getContractId(), e.getEquipmentId(), e.getPricingType(), e.getUnitPrice(), e.getUnitOfMeasure()); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value; }
}