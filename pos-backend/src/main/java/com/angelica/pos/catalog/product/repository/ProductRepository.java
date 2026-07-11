package com.angelica.pos.catalog.product.repository;

import com.angelica.pos.catalog.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsByBarcodeIgnoreCase(String barcode);

    boolean existsByBarcodeIgnoreCaseAndIdNot(String barcode, Long id);

    Optional<Product> findByIdAndActiveTrue(Long id);

    Optional<Product> findByBarcodeIgnoreCaseAndActiveTrue(String barcode);

    @EntityGraph(attributePaths = "category")
    @Query("""
            SELECT p
            FROM Product p
            JOIN p.category c
            WHERE p.active = true
              AND (
                    LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(p.barcode) LIKE LOWER(CONCAT('%', :search, '%'))
                  )
              AND (:categoryId IS NULL OR c.id = :categoryId)
              AND (:lowStock IS NULL OR :lowStock = false OR p.currentStock <= p.minimumStock)
            """)
    Page<Product> findAllActiveWithSearchAndFilters(
            @Param("search") String search,
            @Param("categoryId") Long categoryId,
            @Param("lowStock") Boolean lowStock,
            Pageable pageable
    );

    @EntityGraph(attributePaths = "category")
    @Query("""
            SELECT p
            FROM Product p
            JOIN p.category c
            WHERE p.active = true
              AND (:categoryId IS NULL OR c.id = :categoryId)
              AND (:lowStock IS NULL OR :lowStock = false OR p.currentStock <= p.minimumStock)
            """)
    Page<Product> findAllActiveWithFilters(
            @Param("categoryId") Long categoryId,
            @Param("lowStock") Boolean lowStock,
            Pageable pageable
    );
}
