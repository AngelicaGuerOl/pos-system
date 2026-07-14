package com.angelica.pos.sale.repository;

import com.angelica.pos.sale.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SaleRepository extends JpaRepository<Sale, Long>, JpaSpecificationExecutor<Sale> {

    @Query("""
            SELECT DISTINCT s
            FROM Sale s
            LEFT JOIN FETCH s.customer
            JOIN FETCH s.cashSession
            JOIN FETCH s.createdBy
            LEFT JOIN FETCH s.items si
            LEFT JOIN FETCH si.product
            WHERE s.id = :id
            """)
    Optional<Sale> findByIdWithDetails(@Param("id") Long id);

    @EntityGraph(attributePaths = {"cashSession", "createdBy", "customer"})
    Page<Sale> findByCashSessionId(Long cashSessionId, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"cashSession", "createdBy", "customer"})
    Page<Sale> findAll(Specification<Sale> specification, Pageable pageable);
}
