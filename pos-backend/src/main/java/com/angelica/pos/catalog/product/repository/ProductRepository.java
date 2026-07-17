package com.angelica.pos.catalog.product.repository;

import com.angelica.pos.catalog.product.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsByBarcodeIgnoreCase(String barcode);

    boolean existsByBarcodeIgnoreCaseAndIdNot(String barcode, Long id);

    Optional<Product> findByIdAndActiveTrue(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p
            FROM Product p
            WHERE p.id = :id
              AND p.active = true
            """)
    Optional<Product> findByIdAndActiveTrueForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p
            FROM Product p
            WHERE p.id IN :ids
              AND p.active = true
            ORDER BY p.id ASC
            """)
    List<Product> findAllActiveByIdInForUpdate(@Param("ids") List<Long> ids);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p
            FROM Product p
            WHERE p.id IN :ids
            ORDER BY p.id ASC
            """)
    List<Product> findAllByIdInForUpdate(@Param("ids") List<Long> ids);

    Optional<Product> findByBarcodeIgnoreCaseAndActiveTrue(String barcode);

    Optional<Product> findByBarcodeIgnoreCase(String barcode);

    List<Product> findBySupplierId(Long supplierId);

    @EntityGraph(attributePaths = {"category", "supplier"})
    @Query("""
            SELECT p
            FROM Product p
            JOIN p.category c
            LEFT JOIN p.supplier s
            WHERE p.active = true
              AND (
                    LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(p.barcode) LIKE LOWER(CONCAT('%', :search, '%'))
                  )
              AND (:categoryId IS NULL OR c.id = :categoryId)
              AND (:supplierId IS NULL OR s.id = :supplierId)
              AND (:lowStock IS NULL OR :lowStock = false OR p.currentStock <= p.minimumStock)
            """)
    Page<Product> findAllActiveWithSearchAndFilters(
            @Param("search") String search,
            @Param("categoryId") Long categoryId,
            @Param("supplierId") Long supplierId,
            @Param("lowStock") Boolean lowStock,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"category", "supplier"})
    @Query("""
            SELECT p
            FROM Product p
            JOIN p.category c
            LEFT JOIN p.supplier s
            WHERE p.active = true
              AND (:categoryId IS NULL OR c.id = :categoryId)
              AND (:supplierId IS NULL OR s.id = :supplierId)
              AND (:lowStock IS NULL OR :lowStock = false OR p.currentStock <= p.minimumStock)
            """)
    Page<Product> findAllActiveWithFilters(
            @Param("categoryId") Long categoryId,
            @Param("supplierId") Long supplierId,
            @Param("lowStock") Boolean lowStock,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"category", "supplier"})
    @Query("""
            SELECT p
            FROM Product p
            JOIN p.category c
            JOIN p.supplier s
            WHERE p.active = true
              AND s.id = :supplierId
              AND (
                    :search IS NULL
                    OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(p.barcode) LIKE LOWER(CONCAT('%', :search, '%'))
                  )
            """)
    Page<Product> findActiveBySupplier(
            @Param("supplierId") Long supplierId,
            @Param("search") String search,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"category", "supplier"})
    @Query("""
            SELECT p
            FROM Product p
            JOIN p.category c
            JOIN p.supplier s
            WHERE p.active = true
              AND s.id = :supplierId
            """)
    List<Product> findAllActiveBySupplierId(@Param("supplierId") Long supplierId);
}
