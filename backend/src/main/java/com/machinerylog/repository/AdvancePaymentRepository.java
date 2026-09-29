package com.machinerylog.repository;

import com.machinerylog.entity.AdvancePayment;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdvancePaymentRepository extends JpaRepository<AdvancePayment, Long> {
    List<AdvancePayment> findByContractIdOrderByDocumentDateAscIdAsc(Long contractId);

    @Query("select coalesce(sum(p.amount), 0) from AdvancePayment p where p.contractId = :contractId and p.documentDate >= :fromDate and p.documentDate < :toDate")
    BigDecimal sumAmountByContractIdAndDocumentDateBetween(@Param("contractId") Long contractId,
                                                            @Param("fromDate") LocalDate fromDate,
                                                            @Param("toDate") LocalDate toDate);

    boolean existsByContractId(Long contractId);
}
