package com.machinerylog.repository;

import com.machinerylog.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.Instant;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    @Query("select c from Customer c where (:search is null or lower(c.companyName) like lower(concat('%', :search, '%')) or lower(coalesce(c.taxCode, '')) like lower(concat('%', :search, '%'))) and c.deletedAt is null")
    Page<Customer> search(@Param("search") String search, Pageable pageable);
    
    @Query("select c from Customer c where c.id = :id and c.deletedAt is null")
    Customer findByIdAndNotDeleted(@Param("id") Long id);
    
    @Modifying
    @Query("update Customer c set c.deletedAt = :deletedAt where c.id = :id")
    int softDelete(@Param("id") Long id, @Param("deletedAt") Instant deletedAt);

    boolean existsByTaxCodeAndDeletedAtIsNull(String taxCode);
    boolean existsByTaxCodeAndDeletedAtIsNullAndIdNot(String taxCode, Long id);
}