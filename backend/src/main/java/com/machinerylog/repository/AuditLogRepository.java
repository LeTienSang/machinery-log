package com.machinerylog.repository;

import com.machinerylog.entity.AuditLog;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @Query("""
        select audit from AuditLog audit
        where (:entityType is null or audit.entityType = :entityType)
          and (:entityId is null or audit.entityId = :entityId)
          and (:actorUserId is null or audit.actorUserId = :actorUserId)
          and (:action is null or audit.action = :action)
          and (:fromDate is null or audit.createdAt >= :fromDate)
          and (:toDate is null or audit.createdAt < :toDate)
        order by audit.createdAt desc, audit.id desc
        """)
    List<AuditLog> search(@Param("entityType") String entityType,
                          @Param("entityId") Long entityId,
                          @Param("actorUserId") Long actorUserId,
                          @Param("action") String action,
                          @Param("fromDate") Instant fromDate,
                          @Param("toDate") Instant toDate);
}
