package com.machinerylog.repository;

import com.machinerylog.entity.Category;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    // Find by name
    List<Category> findByName(String name);

    List<Category> findByCategoryType(String categoryType);

    List<Category> findAllByCategoryType(String categoryType);
    
    // Count by category type
    long countByCategoryType(String categoryType);
    
    // Update category type
    @Modifying
    @Query("update Category c set c.categoryType = :categoryType, c.updatedAt = CURRENT_TIMESTAMP where c.id = :id")
    void updateCategoryType(@Param("id") Long id, @Param("categoryType") String categoryType);
}