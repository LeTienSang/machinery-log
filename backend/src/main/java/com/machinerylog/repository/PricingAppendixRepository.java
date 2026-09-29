package com.machinerylog.repository;

import com.machinerylog.entity.PricingAppendix;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PricingAppendixRepository extends JpaRepository<PricingAppendix, Long> {
    List<PricingAppendix> findByContractIdOrderByEquipmentIdAscPricingTypeAsc(Long contractId);
    List<PricingAppendix> findByContractIdAndEquipmentIdOrderByPricingTypeAsc(Long contractId, Long equipmentId);
}