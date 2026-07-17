package com.angelica.pos.supplier.entry.repository;

import com.angelica.pos.supplier.entry.entity.SupplierEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SupplierEntryRepository extends JpaRepository<SupplierEntry, Long> {

    @EntityGraph(attributePaths = {"supplier", "registeredBy", "items", "items.product"})
    @Query("SELECT e FROM SupplierEntry e WHERE e.id = :id")
    Optional<SupplierEntry> findWithItemsById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"supplier", "registeredBy"})
    @Query(
            value = """
            SELECT DISTINCT e
            FROM SupplierEntry e
            LEFT JOIN e.items i
            WHERE (:supplierId IS NULL OR e.supplier.id = :supplierId)
              AND (CAST(:from AS date) IS NULL OR e.entryDate >= :from)
              AND (CAST(:to AS date) IS NULL OR e.entryDate <= :to)
              AND (:productId IS NULL OR i.product.id = :productId)
            """,
            countQuery = """
            SELECT COUNT(DISTINCT e)
            FROM SupplierEntry e
            LEFT JOIN e.items i
            WHERE (:supplierId IS NULL OR e.supplier.id = :supplierId)
              AND (CAST(:from AS date) IS NULL OR e.entryDate >= :from)
              AND (CAST(:to AS date) IS NULL OR e.entryDate <= :to)
              AND (:productId IS NULL OR i.product.id = :productId)
            """
    )
    Page<SupplierEntry> findAllWithFilters(
            @Param("supplierId") Long supplierId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("productId") Long productId,
            Pageable pageable
    );

    @Query("""
            SELECT COALESCE(SUM(i.quantity), 0)
            FROM SupplierEntryItem i
            WHERE i.product.id = :productId
              AND i.supplierEntry.supplier.id = :supplierId
              AND i.supplierEntry.entryDate BETWEEN :from AND :to
            """)
    BigDecimal sumQuantityByProductAndPeriod(
            @Param("supplierId") Long supplierId,
            @Param("productId") Long productId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @Query("""
            SELECT COALESCE(SUM(i.saleValueSubtotal), 0)
            FROM SupplierEntryItem i
            WHERE i.product.id = :productId
              AND i.supplierEntry.supplier.id = :supplierId
              AND i.supplierEntry.entryDate BETWEEN :from AND :to
            """)
    BigDecimal sumSaleValueByProductAndPeriod(
            @Param("supplierId") Long supplierId,
            @Param("productId") Long productId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @Query("""
            SELECT DISTINCT i.product.id
            FROM SupplierEntryItem i
            WHERE i.supplierEntry.supplier.id = :supplierId
              AND i.supplierEntry.entryDate BETWEEN :from AND :to
            """)
    List<Long> findProductIdsBySupplierAndPeriod(
            @Param("supplierId") Long supplierId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

}
