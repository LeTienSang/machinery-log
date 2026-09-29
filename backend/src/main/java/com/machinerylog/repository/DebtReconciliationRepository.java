package com.machinerylog.repository;

import com.machinerylog.entity.DebtReconciliation;
import com.machinerylog.entity.DebtReconciliationStatus;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface DebtReconciliationRepository extends JpaRepository<DebtReconciliation, Long> {
    List<DebtReconciliation> findByContractIdOrderByReconciliationDateDescIdDesc(Long contractId);

    Optional<DebtReconciliation> findTopByContractIdAndReconciliationDateBeforeOrderByReconciliationDateDescIdDesc(Long contractId, LocalDate date);

    boolean existsByContractIdAndStatus(Long contractId, DebtReconciliationStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from DebtReconciliation r where r.id = :id")
    Optional<DebtReconciliation> findByIdForUpdate(@Param("id") Long id);
}
