package com.angelica.pos.report.repository;

import com.angelica.pos.report.dto.ReportCashTotals;
import com.angelica.pos.report.dto.ReportReceivableTotals;
import com.angelica.pos.report.dto.ReportSalesTotals;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Repository
public class OperationsReportRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public ReportSalesTotals getSalesTotals(
            OffsetDateTime fromInclusive,
            OffsetDateTime toExclusive,
            Long cashierId
    ) {
        Object[] sales = singleRow("""
                SELECT
                    COALESCE(SUM(CASE WHEN s.saleType = com.angelica.pos.sale.entity.SaleType.CASH
                        AND s.status <> com.angelica.pos.sale.entity.SaleStatus.CANCELLED
                        THEN s.total ELSE 0.00 END), 0.00),
                    COALESCE(SUM(CASE WHEN s.saleType = com.angelica.pos.sale.entity.SaleType.CREDIT
                        AND s.status <> com.angelica.pos.sale.entity.SaleStatus.CANCELLED
                        THEN s.total ELSE 0.00 END), 0.00),
                    COALESCE(SUM(CASE WHEN s.status <> com.angelica.pos.sale.entity.SaleStatus.CANCELLED
                        THEN s.total ELSE 0.00 END), 0.00),
                    COALESCE(SUM(CASE WHEN s.status = com.angelica.pos.sale.entity.SaleStatus.CANCELLED
                        THEN s.total ELSE 0.00 END), 0.00),
                    COALESCE(SUM(CASE WHEN s.status <> com.angelica.pos.sale.entity.SaleStatus.CANCELLED
                        THEN 1 ELSE 0 END), 0)
                FROM Sale s
                WHERE s.createdAt >= :fromInclusive
                  AND s.createdAt < :toExclusive
                  AND (:cashierId IS NULL OR s.createdBy.id = :cashierId)
                """, fromInclusive, toExclusive, cashierId);

        Object[] returns = singleRow("""
                SELECT
                    COALESCE(SUM(sr.totalAmount), 0.00),
                    COUNT(sr.id)
                FROM SaleReturn sr
                WHERE sr.createdAt >= :fromInclusive
                  AND sr.createdAt < :toExclusive
                  AND (:cashierId IS NULL OR sr.processedBy.id = :cashierId)
                """, fromInclusive, toExclusive, cashierId);

        Object[] cancellations = singleRow("""
                SELECT COUNT(sc.id)
                FROM SaleCancellation sc
                WHERE sc.createdAt >= :fromInclusive
                  AND sc.createdAt < :toExclusive
                  AND (:cashierId IS NULL OR sc.cancelledBy.id = :cashierId)
                """, fromInclusive, toExclusive, cashierId);

        return new ReportSalesTotals(
                money(sales[0]),
                money(sales[1]),
                money(sales[2]),
                money(sales[3]),
                money(returns[0]),
                number(sales[4]).longValue(),
                number(returns[1]).longValue(),
                number(cancellations[0]).longValue()
        );
    }

    public ReportReceivableTotals getReceivableTotals(
            OffsetDateTime fromInclusive,
            OffsetDateTime toExclusive,
            Long cashierId
    ) {
        Object[] generated = singleRow("""
                SELECT
                    COALESCE(SUM(r.originalAmount), 0.00),
                    COALESCE(SUM(r.outstandingBalance), 0.00)
                FROM Receivable r
                WHERE r.createdAt >= :fromInclusive
                  AND r.createdAt < :toExclusive
                  AND (:cashierId IS NULL OR r.sale.createdBy.id = :cashierId)
                """, fromInclusive, toExclusive, cashierId);

        Object[] payments = singleRow("""
                SELECT COALESCE(SUM(rp.amount), 0.00)
                FROM ReceivablePayment rp
                WHERE rp.createdAt >= :fromInclusive
                  AND rp.createdAt < :toExclusive
                  AND (:cashierId IS NULL OR rp.receivedBy.id = :cashierId)
                """, fromInclusive, toExclusive, cashierId);

        return new ReportReceivableTotals(
                money(generated[0]),
                money(payments[0]),
                money(generated[1])
        );
    }

    public ReportCashTotals getCashTotals(
            OffsetDateTime fromInclusive,
            OffsetDateTime toExclusive,
            Long cashierId
    ) {
        Object[] row = singleRow("""
                SELECT
                    COALESCE(SUM(CASE WHEN cm.type = com.angelica.pos.cash.movement.entity.CashMovementType.CASH_SALE
                        THEN cm.amount ELSE 0.00 END), 0.00),
                    COALESCE(SUM(CASE WHEN cm.type = com.angelica.pos.cash.movement.entity.CashMovementType.RECEIVABLE_PAYMENT
                        THEN cm.amount ELSE 0.00 END), 0.00),
                    COALESCE(SUM(CASE WHEN cm.type = com.angelica.pos.cash.movement.entity.CashMovementType.MANUAL_ENTRY
                        THEN cm.amount ELSE 0.00 END), 0.00),
                    COALESCE(SUM(CASE WHEN cm.type = com.angelica.pos.cash.movement.entity.CashMovementType.MANUAL_EXIT
                        THEN cm.amount ELSE 0.00 END), 0.00),
                    COALESCE(SUM(CASE WHEN cm.type = com.angelica.pos.cash.movement.entity.CashMovementType.SALE_REFUND
                        THEN cm.amount ELSE 0.00 END), 0.00),
                    COALESCE(SUM(CASE WHEN cm.type = com.angelica.pos.cash.movement.entity.CashMovementType.SALE_CANCELLATION_REFUND
                        THEN cm.amount ELSE 0.00 END), 0.00),
                    COALESCE(SUM(CASE WHEN cm.direction = com.angelica.pos.cash.movement.entity.CashMovementDirection.INFLOW
                        THEN cm.amount ELSE 0.00 END), 0.00),
                    COALESCE(SUM(CASE WHEN cm.direction = com.angelica.pos.cash.movement.entity.CashMovementDirection.OUTFLOW
                        THEN cm.amount ELSE 0.00 END), 0.00)
                FROM CashMovement cm
                WHERE cm.createdAt >= :fromInclusive
                  AND cm.createdAt < :toExclusive
                  AND (:cashierId IS NULL OR cm.createdBy.id = :cashierId)
                """, fromInclusive, toExclusive, cashierId);

        return new ReportCashTotals(
                money(row[0]),
                money(row[1]),
                money(row[2]),
                money(row[3]),
                money(row[4]),
                money(row[5]),
                money(row[6]),
                money(row[7])
        );
    }

    private Object[] singleRow(
            String query,
            OffsetDateTime fromInclusive,
            OffsetDateTime toExclusive,
            Long cashierId
    ) {
        Object result = entityManager.createQuery(query)
                .setParameter("fromInclusive", fromInclusive)
                .setParameter("toExclusive", toExclusive)
                .setParameter("cashierId", cashierId)
                .getSingleResult();

        return result instanceof Object[] values ? values : new Object[]{result};
    }

    private BigDecimal money(Object value) {
        if (value instanceof BigDecimal amount) {
            return amount;
        }

        return BigDecimal.valueOf(number(value).doubleValue());
    }

    private Number number(Object value) {
        return value instanceof Number numericValue ? numericValue : 0;
    }
}
