package com.angelica.pos.dashboard.service;

import com.angelica.pos.cash.movement.repository.CashMovementRepository;
import com.angelica.pos.cash.session.dto.CashMovementClosingTotals;
import com.angelica.pos.cash.session.dto.SalesClosingTotals;
import com.angelica.pos.cash.session.entity.CashSession;
import com.angelica.pos.cash.session.entity.CashSessionStatus;
import com.angelica.pos.cash.session.repository.CashSessionRepository;
import com.angelica.pos.dashboard.dto.DashboardSummaryResponse;
import com.angelica.pos.dashboard.repository.DashboardRepository;
import com.angelica.pos.report.dto.OperationsSummaryResponse;
import com.angelica.pos.report.service.ReportService;
import com.angelica.pos.sale.repository.SaleRepository;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.exception.UserNotFoundException;
import com.angelica.pos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private static final int MAX_LIST_SIZE = 5;

    private final DashboardRepository dashboardRepository;
    private final ReportService reportService;
    private final UserRepository userRepository;
    private final CashSessionRepository cashSessionRepository;
    private final CashMovementRepository cashMovementRepository;
    private final SaleRepository saleRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(AuthenticatedUser authenticatedUser) {
        User user = userRepository.findByIdAndActiveTrue(authenticatedUser.getId())
                .orElseThrow(() -> new UserNotFoundException(authenticatedUser.getId()));

        OffsetDateTime generatedAt = OffsetDateTime.now();
        if (user.getRole() == Role.ADMIN) {
            return DashboardSummaryResponse.builder()
                    .role(user.getRole())
                    .generatedAt(generatedAt)
                    .adminSummary(buildAdminSummary())
                    .cashierSummary(null)
                    .build();
        }

        return DashboardSummaryResponse.builder()
                .role(user.getRole())
                .generatedAt(generatedAt)
                .adminSummary(null)
                .cashierSummary(buildCashierSummary(user))
                .build();
    }

    private DashboardSummaryResponse.AdminSummary buildAdminSummary() {
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        OperationsSummaryResponse report = reportService.getOperationsSummary(today, today, null);

        long lowStockCount = dashboardRepository.countLowStockProducts();
        long openSessionsCount = dashboardRepository.countOpenCashSessions();

        return DashboardSummaryResponse.AdminSummary.builder()
                .todaySales(toSalesSummary(report.getSales()))
                .receivables(dashboardRepository.getReceivablesSummary())
                .inventory(DashboardSummaryResponse.InventorySummary.builder()
                        .lowStockCount(lowStockCount)
                        .lowStockProducts(dashboardRepository.findLowStockProducts(MAX_LIST_SIZE))
                        .build())
                .cash(DashboardSummaryResponse.CashSummary.builder()
                        .openSessionsCount(openSessionsCount)
                        .openSessions(dashboardRepository.findOpenCashSessions(MAX_LIST_SIZE))
                        .build())
                .recentSales(dashboardRepository.findRecentSalesForAdmin(MAX_LIST_SIZE))
                .build();
    }

    private DashboardSummaryResponse.CashierSummary buildCashierSummary(User user) {
        return cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN)
                .map(this::buildOpenCashierSummary)
                .orElseGet(() -> DashboardSummaryResponse.CashierSummary.builder()
                        .currentCashSession(DashboardSummaryResponse.CurrentCashSession.builder()
                                .open(false)
                                .build())
                        .currentSessionSales(emptySalesSummary())
                        .recentSales(dashboardRepository.findRecentSalesByUser(user.getId(), MAX_LIST_SIZE))
                        .build());
    }

    private DashboardSummaryResponse.CashierSummary buildOpenCashierSummary(CashSession cashSession) {
        CashMovementClosingTotals cashTotals = cashMovementRepository.sumClosingTotalsByCashSessionId(cashSession.getId());
        SalesClosingTotals salesTotals = saleRepository.sumClosingTotalsByCashSessionId(cashSession.getId());
        BigDecimal expectedCash = cashSession.getOpeningAmount()
                .add(cashTotals.totalInflows())
                .subtract(cashTotals.totalOutflows());

        return DashboardSummaryResponse.CashierSummary.builder()
                .currentCashSession(DashboardSummaryResponse.CurrentCashSession.builder()
                        .open(true)
                        .sessionId(cashSession.getId())
                        .status(cashSession.getStatus())
                        .openedAt(cashSession.getOpenedAt())
                        .openingAmount(cashSession.getOpeningAmount())
                        .totalInflows(cashTotals.totalInflows())
                        .totalOutflows(cashTotals.totalOutflows())
                        .expectedCash(expectedCash)
                        .build())
                .currentSessionSales(DashboardSummaryResponse.SalesSummary.builder()
                        .salesCount(dashboardRepository.countActiveSalesByCashSession(cashSession.getId()))
                        .cashSalesAmount(salesTotals.cashSalesAmount())
                        .creditSalesAmount(salesTotals.creditSalesAmount())
                        .totalSalesAmount(salesTotals.totalSalesAmount())
                        .build())
                .recentSales(dashboardRepository.findRecentSalesByCashSession(cashSession.getId(), MAX_LIST_SIZE))
                .build();
    }

    private DashboardSummaryResponse.SalesSummary toSalesSummary(OperationsSummaryResponse.Sales sales) {
        return DashboardSummaryResponse.SalesSummary.builder()
                .salesCount(sales.getSalesCount())
                .cashSalesAmount(sales.getCashSalesAmount())
                .creditSalesAmount(sales.getCreditSalesAmount())
                .totalSalesAmount(sales.getGrossSalesAmount())
                .build();
    }

    private DashboardSummaryResponse.SalesSummary emptySalesSummary() {
        return DashboardSummaryResponse.SalesSummary.builder()
                .salesCount(0)
                .cashSalesAmount(BigDecimal.ZERO)
                .creditSalesAmount(BigDecimal.ZERO)
                .totalSalesAmount(BigDecimal.ZERO)
                .build();
    }
}
