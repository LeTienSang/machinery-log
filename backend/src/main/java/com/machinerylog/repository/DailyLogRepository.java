package com.machinerylog.repository;

import com.machinerylog.entity.DailyLog;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DailyLogRepository extends JpaRepository<DailyLog, Long> {
    @Query("""
        select log from DailyLog log
        where (:contractId is null or log.contractId = :contractId)
          and (:equipmentId is null or log.equipmentId = :equipmentId)
          and (:fromDate is null or log.workDate >= :fromDate)
          and (:toDate is null or log.workDate < :toDate)
          and (:approvalStatus is null or log.approvalStatus = :approvalStatus)
        order by log.workDate desc, log.id desc
        """)
    Page<DailyLog> search(@Param("contractId") Long contractId,
                          @Param("equipmentId") Long equipmentId,
                          @Param("fromDate") LocalDate fromDate,
                          @Param("toDate") LocalDate toDate,
                          @Param("approvalStatus") com.machinerylog.entity.ApprovalStatus approvalStatus,
                          Pageable pageable);

    @Query("""
        select log from DailyLog log
        where log.contractId = :contractId
          and log.workDate >= :fromDate
          and log.workDate < :toDate
          and log.approvalStatus = com.machinerylog.entity.ApprovalStatus.APPROVED
        order by log.equipmentId asc, log.workDate asc, log.id asc
        """)
    List<DailyLog> findApprovedByContractIdBetweenDateRange(@Param("contractId") Long contractId,
                                                            @Param("fromDate") LocalDate fromDate,
                                                            @Param("toDate") LocalDate toDate);
}