package com.angelica.pos.sale.repository;

import com.angelica.pos.sale.dto.SaleSummaryResponse;
import com.angelica.pos.sale.entity.Sale;
import com.angelica.pos.sale.entity.SaleStatus;
import com.angelica.pos.sale.entity.SaleType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Optional;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    @EntityGraph(attributePaths = {"cashSession", "createdBy", "customer", "items", "items.product", "receivable"})
    @Query("""
            SELECT s
            FROM Sale s
            WHERE s.id = :id
            """)
    Optional<Sale> findByIdWithDetails(@Param("id") Long id);

    @Query(
            value = """
                    SELECT new com.angelica.pos.sale.dto.SaleSummaryResponse(
                        s.id,
                        s.createdAt,
                        createdBy.id,
                        createdBy.username,
                        customer.id,
                        COALESCE(CONCAT(customer.firstName, ' ', customer.lastName), 'Público general'),
                        s.saleType,
                        s.status,
                        s.total,
                        COUNT(item.id),
                        receivable.id,
                        receivable.originalAmount,
                        receivable.paidAmount,
                        receivable.outstandingBalance,
                        receivable.status
                    )
                    FROM Sale s
                    JOIN s.createdBy createdBy
                    LEFT JOIN s.customer customer
                    LEFT JOIN s.items item
                    LEFT JOIN s.receivable receivable
                    WHERE s.cashSession.id = :cashSessionId
                    GROUP BY s.id, s.createdAt, createdBy.id, createdBy.username, customer.id,
                             customer.firstName, customer.lastName, s.saleType, s.status, s.total,
                             receivable.id, receivable.originalAmount, receivable.paidAmount,
                             receivable.outstandingBalance, receivable.status
                    """,
            countQuery = """
                    SELECT COUNT(s.id)
                    FROM Sale s
                    WHERE s.cashSession.id = :cashSessionId
                    """
    )
    Page<SaleSummaryResponse> findSummariesByCashSessionId(
            @Param("cashSessionId") Long cashSessionId,
            Pageable pageable
    );

    @Query(
            value = """
                    SELECT new com.angelica.pos.sale.dto.SaleSummaryResponse(
                        s.id,
                        s.createdAt,
                        createdBy.id,
                        createdBy.username,
                        customer.id,
                        COALESCE(CONCAT(customer.firstName, ' ', customer.lastName), 'Público general'),
                        s.saleType,
                        s.status,
                        s.total,
                        COUNT(item.id),
                        receivable.id,
                        receivable.originalAmount,
                        receivable.paidAmount,
                        receivable.outstandingBalance,
                        receivable.status
                    )
                    FROM Sale s
                    JOIN s.createdBy createdBy
                    LEFT JOIN s.customer customer
                    LEFT JOIN s.items item
                    LEFT JOIN s.receivable receivable
                    WHERE (:id IS NULL OR s.id = :id)
                      AND (:customerId IS NULL OR customer.id = :customerId)
                      AND (:createdByUserId IS NULL OR createdBy.id = :createdByUserId)
                      AND (:status IS NULL OR s.status = :status)
                      AND (:saleType IS NULL OR s.saleType = :saleType)
                      AND s.createdAt >= COALESCE(:from, s.createdAt)
                      AND s.createdAt <= COALESCE(:to, s.createdAt)
                    GROUP BY s.id, s.createdAt, createdBy.id, createdBy.username, customer.id,
                             customer.firstName, customer.lastName, s.saleType, s.status, s.total,
                             receivable.id, receivable.originalAmount, receivable.paidAmount,
                             receivable.outstandingBalance, receivable.status
                    """,
            countQuery = """
                    SELECT COUNT(s.id)
                    FROM Sale s
                    JOIN s.createdBy createdBy
                    LEFT JOIN s.customer customer
                    WHERE (:id IS NULL OR s.id = :id)
                      AND (:customerId IS NULL OR customer.id = :customerId)
                      AND (:createdByUserId IS NULL OR createdBy.id = :createdByUserId)
                      AND (:status IS NULL OR s.status = :status)
                      AND (:saleType IS NULL OR s.saleType = :saleType)
                      AND s.createdAt >= COALESCE(:from, s.createdAt)
                      AND s.createdAt <= COALESCE(:to, s.createdAt)
                    """
    )
    Page<SaleSummaryResponse> findSummaries(
            @Param("id") Long id,
            @Param("customerId") Long customerId,
            @Param("createdByUserId") Long createdByUserId,
            @Param("status") SaleStatus status,
            @Param("saleType") SaleType saleType,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to,
            Pageable pageable
    );
}
