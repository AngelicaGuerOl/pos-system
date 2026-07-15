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

    @Query("""
            SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
            FROM Receivable r
            WHERE r.customer.id = :customerId
              AND r.outstandingBalance > 0
            """)
    boolean existsPendingBalanceByCustomerId(@Param("customerId") Long customerId);

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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT r
            FROM Receivable r
            JOIN FETCH r.sale
            JOIN FETCH r.customer
            WHERE r.sale.id = :saleId
            """)
    Optional<Receivable> findBySaleIdForUpdate(@Param("saleId") Long saleId);

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
