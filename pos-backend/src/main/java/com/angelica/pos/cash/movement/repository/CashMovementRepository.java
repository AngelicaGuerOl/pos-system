package com.angelica.pos.cash.movement.repository;

import com.angelica.pos.cash.movement.entity.CashMovement;
import com.angelica.pos.cash.movement.entity.CashMovementDirection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface CashMovementRepository extends JpaRepository<CashMovement, Long> {

    @EntityGraph(attributePaths = {"cashSession", "createdBy"})
    Page<CashMovement> findByCashSessionId(Long cashSessionId, Pageable pageable);

    @EntityGraph(attributePaths = {"cashSession", "createdBy"})
    List<CashMovement> findByCashSessionIdOrderByCreatedAtDesc(Long cashSessionId);

    @EntityGraph(attributePaths = {"cashSession", "createdBy"})
    Page<CashMovement> findByCashSessionIdOrderByCreatedAtDesc(Long cashSessionId, Pageable pageable);

    @Query("""
            SELECT COALESCE(SUM(cm.amount), 0.00)
            FROM CashMovement cm
            WHERE cm.cashSession.id = :cashSessionId
              AND cm.direction = :direction
            """)
    BigDecimal sumAmountByCashSessionIdAndDirection(
            @Param("cashSessionId") Long cashSessionId,
            @Param("direction") CashMovementDirection direction
    );
}
