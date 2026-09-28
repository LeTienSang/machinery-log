package com.machinerylog.repository;

import com.machinerylog.entity.DailyLog;
import java.time.LocalDate;
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
        order by log.workDate desc, log.id desc
        """)
    Page<DailyLog> search(@Param("contractId") Long contractId,
                          @Param("equipmentId") Long equipmentId,
                          @Param("fromDate") LocalDate fromDate,
                          @Param("toDate") LocalDate toDate,
                          Pageable pageable);
}