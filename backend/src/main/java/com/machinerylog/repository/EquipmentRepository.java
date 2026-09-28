package com.machinerylog.repository;

import com.machinerylog.entity.Equipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.Instant;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    @Query("select e from Equipment e where (:search is null or lower(e.equipmentName) like lower(concat('%', :search, '%')) or lower(e.serialRegistrationNumber) like lower(concat('%', :search, '%'))) and e.deletedAt is null")
    Page<Equipment> search(@Param("search") String search, Pageable pageable);
    
    @Query("select e from Equipment e where e.id = :id and e.deletedAt is null")
    Equipment findByIdAndNotDeleted(@Param("id") Long id);
    
    @Modifying
    @Query("update Equipment e set e.deletedAt = :deletedAt where e.id = :id")
    int softDelete(@Param("id") Long id, @Param("deletedAt") Instant deletedAt);
}