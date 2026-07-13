package com.angelica.pos.cash.session.repository;

import com.angelica.pos.cash.session.entity.CashSession;
import com.angelica.pos.cash.session.entity.CashSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CashSessionRepository extends JpaRepository<CashSession, Long> {

    Optional<CashSession> findByOpenedByIdAndStatus(Long openedById, CashSessionStatus status);

    boolean existsByOpenedByIdAndStatus(Long openedById, CashSessionStatus status);
}
