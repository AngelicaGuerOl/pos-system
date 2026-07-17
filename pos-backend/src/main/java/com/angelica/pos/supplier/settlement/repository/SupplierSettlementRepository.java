package com.angelica.pos.supplier.settlement.repository;

import com.angelica.pos.supplier.settlement.entity.SupplierSettlement;
import com.angelica.pos.supplier.settlement.entity.SupplierSettlementStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface SupplierSettlementRepository extends JpaRepository<SupplierSettlement, Long> {

    boolean existsBySupplierIdAndStatus(Long supplierId, SupplierSettlementStatus status);

    @Query("""
            SELECT COUNT(s) > 0
            FROM SupplierSettlement s
            WHERE s.supplier.id = :supplierId
              AND s.status = com.angelica.pos.supplier.settlement.entity.SupplierSettlementStatus.FINALIZED
              AND :entryDate BETWEEN s.periodStart AND s.periodEnd
            """)
    boolean existsFinalizedPeriodContaining(@Param("supplierId") Long supplierId, @Param("entryDate") LocalDate entryDate);

    @EntityGraph(attributePaths = {"items", "items.product"})
    Optional<SupplierSettlement> findFirstBySupplierIdAndStatusOrderByPeriodEndDesc(
            Long supplierId,
            SupplierSettlementStatus status
    );

    @EntityGraph(attributePaths = {"supplier", "createdBy", "finalizedBy", "items", "items.product"})
    @Query("SELECT s FROM SupplierSettlement s WHERE s.id = :id")
    Optional<SupplierSettlement> findWithItemsById(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"supplier", "createdBy", "finalizedBy", "items", "items.product"})
    @Query("SELECT s FROM SupplierSettlement s WHERE s.id = :id")
    Optional<SupplierSettlement> findWithItemsByIdForUpdate(@Param("id") Long id);

    @EntityGraph(attributePaths = {"supplier", "createdBy", "finalizedBy"})
    @Query("""
            SELECT s
            FROM SupplierSettlement s
            WHERE (:supplierId IS NULL OR s.supplier.id = :supplierId)
              AND (:status IS NULL OR s.status = :status)
              AND (CAST(:from AS date) IS NULL OR s.periodEnd >= :from)
              AND (CAST(:to AS date) IS NULL OR s.periodStart <= :to)
            """)
    Page<SupplierSettlement> findAllWithFilters(
            @Param("supplierId") Long supplierId,
            @Param("status") SupplierSettlementStatus status,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable
    );

}
