package com.angelica.pos.dashboard.service;

import com.angelica.pos.cash.movement.repository.CashMovementRepository;
import com.angelica.pos.cash.session.dto.CashMovementClosingTotals;
import com.angelica.pos.cash.session.dto.SalesClosingTotals;
import com.angelica.pos.cash.session.entity.CashSession;
import com.angelica.pos.cash.session.entity.CashSessionStatus;
import com.angelica.pos.cash.session.repository.CashSessionRepository;
import com.angelica.pos.catalog.product.entity.ProductUnit;
import com.angelica.pos.dashboard.dto.DashboardSummaryResponse;
import com.angelica.pos.dashboard.repository.DashboardRepository;
import com.angelica.pos.report.dto.OperationsSummaryResponse;
import com.angelica.pos.report.service.ReportService;
import com.angelica.pos.sale.entity.SaleStatus;
import com.angelica.pos.sale.entity.SaleType;
import com.angelica.pos.sale.repository.SaleRepository;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DashboardServiceImplTest {

    private DashboardRepository dashboardRepository;
    private ReportService reportService;
    private UserRepository userRepository;
    private CashSessionRepository cashSessionRepository;
    private CashMovementRepository cashMovementRepository;
    private SaleRepository saleRepository;
    private DashboardServiceImpl dashboardService;

    @BeforeEach
    void setUp() {
        dashboardRepository = mock(DashboardRepository.class);
        reportService = mock(ReportService.class);
        userRepository = mock(UserRepository.class);
        cashSessionRepository = mock(CashSessionRepository.class);
        cashMovementRepository = mock(CashMovementRepository.class);
        saleRepository = mock(SaleRepository.class);
        dashboardService = new DashboardServiceImpl(
                dashboardRepository,
                reportService,
                userRepository,
                cashSessionRepository,
                cashMovementRepository,
                saleRepository
        );
    }

    @Test
    void adminReceivesGlobalSummaryWithReportSalesAndLimitedLists() {
        User admin = user(1L, "admin", Role.ADMIN);
        when(userRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(admin));
        when(reportService.getOperationsSummary(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.isNull()))
                .thenReturn(report("250.00", "100.00", "350.00", 3));
        when(dashboardRepository.getReceivablesSummary()).thenReturn(DashboardSummaryResponse.ReceivablesSummary.builder()
                .pendingAmount(bd("800"))
                .pendingAccountsCount(4)
                .build());
        when(dashboardRepository.countLowStockProducts()).thenReturn(7L);
        when(dashboardRepository.findLowStockProducts(5)).thenReturn(List.of(lowStockProduct(1L)));
        when(dashboardRepository.countOpenCashSessions()).thenReturn(6L);
        when(dashboardRepository.findOpenCashSessions(5)).thenReturn(List.of(openSession(10L)));
        when(dashboardRepository.findRecentSalesForAdmin(5)).thenReturn(List.of(recentSale(20L)));

        DashboardSummaryResponse response = dashboardService.getSummary(authenticated(admin));

        assertEquals(Role.ADMIN, response.getRole());
        assertNull(response.getCashierSummary());
        assertEquals(3, response.getAdminSummary().getTodaySales().getSalesCount());
        assertEquals(bd("250.00"), response.getAdminSummary().getTodaySales().getCashSalesAmount());
        assertEquals(bd("100.00"), response.getAdminSummary().getTodaySales().getCreditSalesAmount());
        assertEquals(bd("350.00"), response.getAdminSummary().getTodaySales().getTotalSalesAmount());
        assertEquals(7, response.getAdminSummary().getInventory().getLowStockCount());
        assertEquals(1, response.getAdminSummary().getInventory().getLowStockProducts().size());
        assertEquals(6, response.getAdminSummary().getCash().getOpenSessionsCount());
        assertEquals(1, response.getAdminSummary().getRecentSales().size());

        verify(dashboardRepository).findLowStockProducts(5);
        verify(dashboardRepository).findOpenCashSessions(5);
        verify(dashboardRepository).findRecentSalesForAdmin(5);
    }

    @Test
    void cashierReceivesOnlyCurrentSessionSummary() {
        User cashier = user(2L, "cashier", Role.CASHIER);
        CashSession session = CashSession.builder()
                .id(30L)
                .openedBy(cashier)
                .status(CashSessionStatus.OPEN)
                .openingAmount(bd("100"))
                .openedAt(OffsetDateTime.parse("2026-07-17T08:00:00-06:00"))
                .build();
        when(userRepository.findByIdAndActiveTrue(2L)).thenReturn(Optional.of(cashier));
        when(cashSessionRepository.findByOpenedByIdAndStatus(2L, CashSessionStatus.OPEN)).thenReturn(Optional.of(session));
        when(cashMovementRepository.sumClosingTotalsByCashSessionId(30L)).thenReturn(new CashMovementClosingTotals(
                bd("200"),
                bd("0"),
                bd("50"),
                bd("250"),
                bd("25"),
                bd("0"),
                bd("0"),
                bd("25")
        ));
        when(saleRepository.sumClosingTotalsByCashSessionId(30L)).thenReturn(new SalesClosingTotals(
                bd("200"),
                bd("150"),
                bd("350")
        ));
        when(dashboardRepository.countActiveSalesByCashSession(30L)).thenReturn(5L);
        when(dashboardRepository.findRecentSalesByCashSession(30L, 5)).thenReturn(List.of(recentSale(40L)));

        DashboardSummaryResponse response = dashboardService.getSummary(authenticated(cashier));

        assertEquals(Role.CASHIER, response.getRole());
        assertNull(response.getAdminSummary());
        assertTrue(response.getCashierSummary().getCurrentCashSession().isOpen());
        assertEquals(bd("325"), response.getCashierSummary().getCurrentCashSession().getExpectedCash());
        assertEquals(5, response.getCashierSummary().getCurrentSessionSales().getSalesCount());
        assertEquals(bd("200"), response.getCashierSummary().getCurrentSessionSales().getCashSalesAmount());
        assertEquals(bd("150"), response.getCashierSummary().getCurrentSessionSales().getCreditSalesAmount());
        assertEquals(bd("350"), response.getCashierSummary().getCurrentSessionSales().getTotalSalesAmount());

        verify(dashboardRepository, never()).countLowStockProducts();
        verify(dashboardRepository, never()).findRecentSalesForAdmin(5);
    }

    @Test
    void cashierWithoutOpenSessionDoesNotReceiveGlobalData() {
        User cashier = user(2L, "cashier", Role.CASHIER);
        when(userRepository.findByIdAndActiveTrue(2L)).thenReturn(Optional.of(cashier));
        when(cashSessionRepository.findByOpenedByIdAndStatus(2L, CashSessionStatus.OPEN)).thenReturn(Optional.empty());
        when(dashboardRepository.findRecentSalesByUser(2L, 5)).thenReturn(List.of(recentSale(50L)));

        DashboardSummaryResponse response = dashboardService.getSummary(authenticated(cashier));

        assertEquals(Role.CASHIER, response.getRole());
        assertNull(response.getAdminSummary());
        assertEquals(0, response.getCashierSummary().getCurrentSessionSales().getSalesCount());
        assertEquals(bd("0"), response.getCashierSummary().getCurrentSessionSales().getTotalSalesAmount());
        assertEquals(1, response.getCashierSummary().getRecentSales().size());

        verify(reportService, never()).getOperationsSummary(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
        verify(dashboardRepository, never()).getReceivablesSummary();
    }

    private OperationsSummaryResponse report(String cash, String credit, String gross, long salesCount) {
        return OperationsSummaryResponse.builder()
                .sales(OperationsSummaryResponse.Sales.builder()
                        .cashSalesAmount(bd(cash))
                        .creditSalesAmount(bd(credit))
                        .grossSalesAmount(bd(gross))
                        .cancelledSalesAmount(bd("999"))
                        .returnedAmount(bd("10"))
                        .netSalesAmount(bd("340"))
                        .salesCount(salesCount)
                        .returnsCount(1)
                        .cancellationsCount(1)
                        .build())
                .build();
    }

    private DashboardSummaryResponse.LowStockProduct lowStockProduct(Long id) {
        return DashboardSummaryResponse.LowStockProduct.builder()
                .id(id)
                .name("Producto bajo")
                .currentStock(bd("1"))
                .minimumStock(bd("2"))
                .unit(ProductUnit.PIECE)
                .build();
    }

    private DashboardSummaryResponse.OpenCashSession openSession(Long id) {
        return DashboardSummaryResponse.OpenCashSession.builder()
                .sessionId(id)
                .username("cashier")
                .openedAt(OffsetDateTime.parse("2026-07-17T08:00:00-06:00"))
                .openingAmount(bd("100"))
                .expectedCash(bd("300"))
                .build();
    }

    private DashboardSummaryResponse.RecentSale recentSale(Long id) {
        return DashboardSummaryResponse.RecentSale.builder()
                .id(id)
                .createdAt(OffsetDateTime.parse("2026-07-17T09:00:00-06:00"))
                .cashierUsername("cashier")
                .customerName("Público general")
                .saleType(SaleType.CASH)
                .total(bd("50"))
                .status(SaleStatus.COMPLETED)
                .build();
    }

    private AuthenticatedUser authenticated(User user) {
        return new AuthenticatedUser(user);
    }

    private User user(Long id, String username, Role role) {
        return User.builder()
                .id(id)
                .username(username)
                .role(role)
                .active(true)
                .mustChangePassword(false)
                .passwordHash("hash")
                .build();
    }

    private BigDecimal bd(String value) {
        return new BigDecimal(value);
    }
}
