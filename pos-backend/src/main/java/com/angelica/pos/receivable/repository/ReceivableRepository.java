package com.angelica.pos.receivable.repository;

import com.angelica.pos.receivable.entity.Receivable;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReceivableRepository extends JpaRepository<Receivable, Long>, JpaSpecificationExecutor<Receivable> {

    boolean existsBySaleId(Long saleId);

    Optional<Receivable> findBySaleId(Long saleId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT r
            FROM Receivable r
            JOIN FETCH r.sale
            JOIN FETCH r.customer
            WHERE r.id = :id
            """)
    Optional<Receivable> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            SELECT r
            FROM Receivable r
            JOIN FETCH r.sale sale
            JOIN FETCH sale.createdBy
            JOIN FETCH r.customer
            WHERE r.id = :id
            """)
    Optional<Receivable> findByIdWithDetails(@Param("id") Long id);

    @Override
    @EntityGraph(attributePaths = {"sale", "customer"})
    Page<Receivable> findAll(Specification<Receivable> specification, Pageable pageable);
}
