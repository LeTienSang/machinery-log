package com.machinerylog.repository;

import com.machinerylog.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    @Query("select c from Customer c where :search is null or lower(c.companyName) like lower(concat('%', :search, '%')) or lower(coalesce(c.taxCode, '')) like lower(concat('%', :search, '%'))")
    Page<Customer> search(@Param("search") String search, Pageable pageable);
}