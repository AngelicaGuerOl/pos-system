package com.angelica.pos.catalog.category.repository;

import com.angelica.pos.catalog.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    List<Category> findAllByActiveTrueOrderByNameAsc();

    List<Category> findAllByActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc(String search);

    Optional<Category> findByIdAndActiveTrue(Long id);
}
