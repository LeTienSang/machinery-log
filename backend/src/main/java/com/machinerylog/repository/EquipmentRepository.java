package com.machinerylog.repository;

import com.machinerylog.entity.Equipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    @Query("select e from Equipment e where :search is null or lower(e.equipmentName) like lower(concat('%', :search, '%')) or lower(e.serialRegistrationNumber) like lower(concat('%', :search, '%'))")
    Page<Equipment> search(@Param("search") String search, Pageable pageable);
}