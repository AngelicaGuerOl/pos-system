package com.angelica.pos.dashboard.dto;

import com.angelica.pos.catalog.product.entity.ProductUnit;
import com.angelica.pos.cash.session.entity.CashSessionStatus;
import com.angelica.pos.sale.entity.SaleStatus;
import com.angelica.pos.sale.entity.SaleType;
import com.angelica.pos.user.entity.Role;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Value
@Builder
public class DashboardSummaryResponse {

    Role role;
    OffsetDateTime generatedAt;
    AdminSummary adminSummary;
    CashierSummary cashierSummary;

    @Value
    @Builder
    public static class AdminSummary {
        SalesSummary todaySales;
        ReceivablesSummary receivables;
        InventorySummary inventory;
        CashSummary cash;
        List<RecentSale> recentSales;
    }

    @Value
    @Builder
    public static class CashierSummary {
        CurrentCashSession currentCashSession;
        SalesSummary currentSessionSales;
        List<RecentSale> recentSales;
    }

    @Value
    @Builder
    public static class SalesSummary {
        long salesCount;
        BigDecimal cashSalesAmount;
        BigDecimal creditSalesAmount;
        BigDecimal totalSalesAmount;
    }

    @Value
    @Builder
    public static class ReceivablesSummary {
        BigDecimal pendingAmount;
        long pendingAccountsCount;
    }

    @Value
    @Builder
    public static class InventorySummary {
        long lowStockCount;
        List<LowStockProduct> lowStockProducts;
    }

    @Value
    @Builder
    public static class LowStockProduct {
        Long id;
        String name;
        BigDecimal currentStock;
        BigDecimal minimumStock;
        ProductUnit unit;
    }

    @Value
    @Builder
    public static class CashSummary {
        long openSessionsCount;
        List<OpenCashSession> openSessions;
    }

    @Value
    @Builder
    public static class OpenCashSession {
        Long sessionId;
        String username;
        OffsetDateTime openedAt;
        BigDecimal openingAmount;
        BigDecimal expectedCash;
    }

    @Value
    @Builder
    public static class CurrentCashSession {
        boolean open;
        Long sessionId;
        CashSessionStatus status;
        OffsetDateTime openedAt;
        BigDecimal openingAmount;
        BigDecimal totalInflows;
        BigDecimal totalOutflows;
        BigDecimal expectedCash;
    }

    @Value
    @Builder
    public static class RecentSale {
        Long id;
        OffsetDateTime createdAt;
        String cashierUsername;
        String customerName;
        SaleType saleType;
        BigDecimal total;
        SaleStatus status;
    }
}
