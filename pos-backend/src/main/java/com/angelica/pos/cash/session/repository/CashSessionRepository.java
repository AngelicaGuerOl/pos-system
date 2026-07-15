package com.angelica.pos.cash.session.repository;

import com.angelica.pos.cash.session.entity.CashSession;
import com.angelica.pos.cash.session.entity.CashSessionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CashSessionRepository extends JpaRepository<CashSession, Long> {

    @EntityGraph(attributePaths = {"openedBy", "closedBy"})
    Optional<CashSession> findByOpenedByIdAndStatus(Long openedById, CashSessionStatus status);

    boolean existsByOpenedByIdAndStatus(Long openedById, CashSessionStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"openedBy", "closedBy"})
    @Query("""
            SELECT cs
            FROM CashSession cs
            WHERE cs.openedBy.id = :openedById
              AND cs.status = :status
            """)
    Optional<CashSession> findByOpenedByIdAndStatusForUpdate(
            @Param("openedById") Long openedById,
            @Param("status") CashSessionStatus status
    );

    @EntityGraph(attributePaths = {"openedBy", "closedBy"})
    @Query("""
            SELECT cs
            FROM CashSession cs
            WHERE cs.id = :id
            """)
    Optional<CashSession> findByIdWithUsers(@Param("id") Long id);
}
