package com.angelica.pos.receivable.payment.repository;

import com.angelica.pos.receivable.payment.entity.ReceivablePayment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReceivablePaymentRepository extends JpaRepository<ReceivablePayment, Long> {

    @Query("""
            SELECT p
            FROM ReceivablePayment p
            JOIN FETCH p.receivable receivable
            JOIN FETCH receivable.sale
            JOIN FETCH receivable.customer
            JOIN FETCH p.cashSession
            JOIN FETCH p.receivedBy
            WHERE p.id = :id
            """)
    Optional<ReceivablePayment> findByIdWithDetails(@Param("id") Long id);

    @Query(
            value = """
                    SELECT p
                    FROM ReceivablePayment p
                    JOIN p.receivable receivable
                    WHERE receivable.id = :receivableId
                    """,
            countQuery = """
                    SELECT COUNT(p)
                    FROM ReceivablePayment p
                    WHERE p.receivable.id = :receivableId
                    """
    )
    @EntityGraph(attributePaths = {"receivable", "receivable.sale", "receivable.customer", "cashSession", "receivedBy"})
    Page<ReceivablePayment> findByReceivableId(@Param("receivableId") Long receivableId, Pageable pageable);

    @Query("""
            SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END
            FROM ReceivablePayment p
            WHERE p.receivable.sale.id = :saleId
            """)
    boolean existsBySaleId(@Param("saleId") Long saleId);
}
