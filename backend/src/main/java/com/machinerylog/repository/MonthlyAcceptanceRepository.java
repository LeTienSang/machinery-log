package com.machinerylog.repository;

import com.machinerylog.entity.MonthlyAcceptance;
import java.util.List;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface MonthlyAcceptanceRepository extends JpaRepository<MonthlyAcceptance, Long> {
    List<MonthlyAcceptance> findByContractIdAndBillingMonthOrderByEquipmentId(Long contractId, String billingMonth);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from MonthlyAcceptance a where a.id = :id")
    Optional<MonthlyAcceptance> findByIdForUpdate(@Param("id") Long id);
}