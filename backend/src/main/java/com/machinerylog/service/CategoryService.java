package com.machinerylog.service;

import com.machinerylog.entity.Category;
import com.machinerylog.exception.ResourceNotFoundException;
import com.machinerylog.repository.CategoryRepository;
import jakarta.persistence.criteria.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;
    
    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }
    
    @Transactional public Category createCategory(String name, String description, String categoryType) {
        Category category = new Category(name, description, categoryType);
        return categoryRepository.save(category);
    }
    
    @Transactional(readOnly = true) public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }
    
    @Transactional(readOnly = true) public List<Category> getCategoriesByType(String categoryType) {
        return categoryRepository.findByCategoryType(categoryType);
    }
    
    @Transactional(readOnly = true) public Optional<Category> getCategoryById(Long id) {
        return categoryRepository.findById(id);
    }
    
    @Transactional public Category updateCategory(Long id, String name, String description, String categoryType) {
        Category category = findCategory(id);
        category.setName(name);
        category.setDescription(description);
        category.setCategoryType(categoryType);
        category.setUpdatedAt(Instant.now());
        return categoryRepository.save(category);
    }
    
    @Transactional public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
    
    @Transactional(readOnly = true) public List<Category> findAllByType(String categoryType) {
        return categoryRepository.findAllByCategoryType(categoryType);
    }
    
    public Specification<Category> nameLike(String namePattern) {
        return (root, query, criteriaBuilder) -> {
            if (namePattern == null || namePattern.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.like(root.get("name"), "%" + namePattern + "%");
        };
    }
    
    public Instant getCurrentTime() {
        return Instant.now();
    }
    
    private Category findCategory(Long id) {
        return categoryRepository.findById(id).orElseThrow(
            () -> new ResourceNotFoundException("Category not found: " + id)
        );
    }
}