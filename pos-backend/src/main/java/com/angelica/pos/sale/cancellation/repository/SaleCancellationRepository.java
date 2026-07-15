package com.angelica.pos.sale.cancellation.repository;

import com.angelica.pos.cash.session.dto.OperationsClosingTotals;
import com.angelica.pos.sale.cancellation.entity.SaleCancellation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SaleCancellationRepository extends JpaRepository<SaleCancellation, Long> {

    boolean existsBySaleId(Long saleId);

    @Override
    @EntityGraph(attributePaths = {"sale", "cashSession", "cancelledBy"})
    Optional<SaleCancellation> findById(Long id);

    @Query("""
            SELECT new com.angelica.pos.cash.session.dto.OperationsClosingTotals(
                COALESCE(SUM(sc.sale.total), 0.00),
                COALESCE(SUM(sc.refundAmount), 0.00)
            )
            FROM SaleCancellation sc
            WHERE sc.cashSession.id = :cashSessionId
            """)
    OperationsClosingTotals sumClosingTotalsByCashSessionId(@Param("cashSessionId") Long cashSessionId);
}
