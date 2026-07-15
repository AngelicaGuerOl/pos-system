package com.angelica.pos.sale.cancellation.repository;

import com.angelica.pos.sale.cancellation.entity.SaleCancellation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SaleCancellationRepository extends JpaRepository<SaleCancellation, Long> {

    boolean existsBySaleId(Long saleId);

    @Override
    @EntityGraph(attributePaths = {"sale", "cashSession", "cancelledBy"})
    Optional<SaleCancellation> findById(Long id);
}
