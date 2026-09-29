package com.machinerylog.repository;

import com.machinerylog.entity.MonthlyAcceptance;
import com.machinerylog.entity.AcceptanceStatus;
import java.math.BigDecimal;
import java.util.List;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface MonthlyAcceptanceRepository extends JpaRepository<MonthlyAcceptance, Long> {
    List<MonthlyAcceptance> findByContractIdAndBillingMonthOrderByEquipmentId(Long contractId, String billingMonth);
    Optional<MonthlyAcceptance> findByContractIdAndEquipmentIdAndBillingMonth(Long contractId, Long equipmentId, String billingMonth);

    @Query("select coalesce(sum(a.totalAmount), 0) from MonthlyAcceptance a where a.contractId = :contractId and a.billingMonth = :month and a.status <> :invalidStatus")
    BigDecimal sumTotalAmountByContractIdAndBillingMonth(@Param("contractId") Long contractId,
                                                         @Param("month") String month,
                                                         @Param("invalidStatus") AcceptanceStatus invalidStatus);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from MonthlyAcceptance a where a.id = :id")
    Optional<MonthlyAcceptance> findByIdForUpdate(@Param("id") Long id);
}