package com.angelica.pos.dashboard.repository;

import com.angelica.pos.catalog.product.entity.ProductUnit;
import com.angelica.pos.dashboard.dto.DashboardSummaryResponse;
import com.angelica.pos.sale.entity.SaleStatus;
import com.angelica.pos.sale.entity.SaleType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
public class DashboardRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public DashboardSummaryResponse.ReceivablesSummary getReceivablesSummary() {
        Object[] row = singleRow("""
                SELECT
                    COALESCE(SUM(r.outstandingBalance), 0.00),
                    COUNT(r.id)
                FROM Receivable r
                WHERE r.outstandingBalance > 0
                """);

        return DashboardSummaryResponse.ReceivablesSummary.builder()
                .pendingAmount(money(row[0]))
                .pendingAccountsCount(number(row[1]).longValue())
                .build();
    }

    public long countLowStockProducts() {
        return number(entityManager.createQuery("""
                SELECT COUNT(p.id)
                FROM Product p
                WHERE p.active = true
                  AND p.currentStock <= p.minimumStock
                """).getSingleResult()).longValue();
    }

    public List<DashboardSummaryResponse.LowStockProduct> findLowStockProducts(int limit) {
        List<Object[]> rows = entityManager.createQuery("""
                SELECT p.id, p.name, p.currentStock, p.minimumStock, p.unit
                FROM Product p
                WHERE p.active = true
                  AND p.currentStock <= p.minimumStock
                ORDER BY p.currentStock ASC, p.name ASC
                """, Object[].class)
                .setMaxResults(limit)
                .getResultList();

        return rows.stream()
                .map(row -> DashboardSummaryResponse.LowStockProduct.builder()
                        .id((Long) row[0])
                        .name((String) row[1])
                        .currentStock(money(row[2]))
                        .minimumStock(money(row[3]))
                        .unit((ProductUnit) row[4])
                        .build())
                .toList();
    }

    public long countOpenCashSessions() {
        return number(entityManager.createQuery("""
                SELECT COUNT(cs.id)
                FROM CashSession cs
                WHERE cs.status = com.angelica.pos.cash.session.entity.CashSessionStatus.OPEN
                """).getSingleResult()).longValue();
    }

    public List<DashboardSummaryResponse.OpenCashSession> findOpenCashSessions(int limit) {
        List<Object[]> rows = entityManager.createQuery("""
                SELECT
                    cs.id,
                    openedBy.username,
                    cs.openedAt,
                    cs.openingAmount,
                    cs.openingAmount
                        + COALESCE(SUM(CASE WHEN cm.direction = com.angelica.pos.cash.movement.entity.CashMovementDirection.INFLOW
                            THEN cm.amount ELSE 0.00 END), 0.00)
                        - COALESCE(SUM(CASE WHEN cm.direction = com.angelica.pos.cash.movement.entity.CashMovementDirection.OUTFLOW
                            THEN cm.amount ELSE 0.00 END), 0.00)
                FROM CashSession cs
                JOIN cs.openedBy openedBy
                LEFT JOIN CashMovement cm ON cm.cashSession.id = cs.id
                WHERE cs.status = com.angelica.pos.cash.session.entity.CashSessionStatus.OPEN
                GROUP BY cs.id, openedBy.username, cs.openedAt, cs.openingAmount
                ORDER BY cs.openedAt DESC
                """, Object[].class)
                .setMaxResults(limit)
                .getResultList();

        return rows.stream()
                .map(row -> DashboardSummaryResponse.OpenCashSession.builder()
                        .sessionId((Long) row[0])
                        .username((String) row[1])
                        .openedAt((OffsetDateTime) row[2])
                        .openingAmount(money(row[3]))
                        .expectedCash(money(row[4]))
                        .build())
                .toList();
    }

    public List<DashboardSummaryResponse.RecentSale> findRecentSalesForAdmin(int limit) {
        return mapRecentSales(entityManager.createQuery(recentSalesSelect("""
                WHERE 1 = 1
                """), Object[].class)
                .setMaxResults(limit)
                .getResultList());
    }

    public List<DashboardSummaryResponse.RecentSale> findRecentSalesByCashSession(Long cashSessionId, int limit) {
        return mapRecentSales(entityManager.createQuery(recentSalesSelect("""
                WHERE s.cashSession.id = :cashSessionId
                """), Object[].class)
                .setParameter("cashSessionId", cashSessionId)
                .setMaxResults(limit)
                .getResultList());
    }

    public List<DashboardSummaryResponse.RecentSale> findRecentSalesByUser(Long userId, int limit) {
        return mapRecentSales(entityManager.createQuery(recentSalesSelect("""
                WHERE createdBy.id = :userId
                """), Object[].class)
                .setParameter("userId", userId)
                .setMaxResults(limit)
                .getResultList());
    }

    public long countActiveSalesByCashSession(Long cashSessionId) {
        return number(entityManager.createQuery("""
                SELECT COUNT(s.id)
                FROM Sale s
                WHERE s.cashSession.id = :cashSessionId
                  AND s.status <> com.angelica.pos.sale.entity.SaleStatus.CANCELLED
                """)
                .setParameter("cashSessionId", cashSessionId)
                .getSingleResult()).longValue();
    }

    private String recentSalesSelect(String whereClause) {
        return """
                SELECT
                    s.id,
                    s.createdAt,
                    createdBy.username,
                    COALESCE(CONCAT(customer.firstName, ' ', customer.lastName), 'Público general'),
                    s.saleType,
                    s.total,
                    s.status
                FROM Sale s
                JOIN s.createdBy createdBy
                LEFT JOIN s.customer customer
                """ + whereClause + """

                ORDER BY s.createdAt DESC
                """;
    }

    private List<DashboardSummaryResponse.RecentSale> mapRecentSales(List<Object[]> rows) {
        return rows.stream()
                .map(row -> DashboardSummaryResponse.RecentSale.builder()
                        .id((Long) row[0])
                        .createdAt((OffsetDateTime) row[1])
                        .cashierUsername((String) row[2])
                        .customerName((String) row[3])
                        .saleType((SaleType) row[4])
                        .total(money(row[5]))
                        .status((SaleStatus) row[6])
                        .build())
                .toList();
    }

    private Object[] singleRow(String query) {
        Object result = entityManager.createQuery(query).getSingleResult();
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
