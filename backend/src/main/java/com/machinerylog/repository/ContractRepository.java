package com.machinerylog.repository;

import com.machinerylog.entity.Contract;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.Instant;

public interface ContractRepository extends JpaRepository<Contract, Long> {
    @Query("select c from Contract c where (:search is null or lower(c.contractNumber) like lower(concat('%', :search, '%')) or lower(coalesce(c.projectName, '')) like lower(concat('%', :search, '%'))) and c.deletedAt is null")
    Page<Contract> search(@Param("search") String search, Pageable pageable);
    
    @Query("select c from Contract c where c.id = :id and c.deletedAt is null")
    Contract findByIdAndNotDeleted(@Param("id") Long id);
    
    @Modifying
    @Query("update Contract c set c.deletedAt = :deletedAt where c.id = :id")
    int softDelete(@Param("id") Long id, @Param("deletedAt") Instant deletedAt);
}