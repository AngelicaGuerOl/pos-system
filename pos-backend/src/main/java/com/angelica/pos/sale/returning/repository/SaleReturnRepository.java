package com.angelica.pos.sale.returning.repository;

import com.angelica.pos.sale.returning.entity.SaleReturn;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;

public interface SaleReturnRepository extends JpaRepository<SaleReturn, Long> {

    @EntityGraph(attributePaths = {"sale", "sale.customer", "cashSession", "processedBy"})
    Page<SaleReturn> findBySaleId(Long saleId, Pageable pageable);

    @EntityGraph(attributePaths = {
            "sale",
            "sale.customer",
            "cashSession",
            "processedBy",
            "items",
            "items.saleItem",
            "items.product"
    })
    Optional<SaleReturn> findById(Long id);

    @Query("""
            SELECT COALESCE(SUM(sr.totalAmount), 0)
            FROM SaleReturn sr
            WHERE sr.sale.id = :saleId
            """)
    BigDecimal sumTotalAmountBySaleId(@Param("saleId") Long saleId);

    boolean existsBySaleId(Long saleId);
}
