package com.angelica.pos.sale.repository;

import com.angelica.pos.sale.entity.SaleItem;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT item
            FROM SaleItem item
            JOIN FETCH item.sale sale
            JOIN FETCH item.product product
            WHERE sale.id = :saleId
              AND item.id IN :itemIds
            ORDER BY item.id ASC
            """)
    List<SaleItem> findAllBySaleIdAndIdInForUpdate(
            @Param("saleId") Long saleId,
            @Param("itemIds") List<Long> itemIds
    );
}
