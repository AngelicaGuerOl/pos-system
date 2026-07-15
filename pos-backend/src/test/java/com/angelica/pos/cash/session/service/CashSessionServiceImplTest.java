package com.angelica.pos.cash.session.service;

import com.angelica.pos.cash.movement.exception.OpenCashSessionRequiredException;
import com.angelica.pos.cash.movement.repository.CashMovementRepository;
import com.angelica.pos.cash.session.dto.CashMovementClosingTotals;
import com.angelica.pos.cash.session.dto.CashSessionCloseRequest;
import com.angelica.pos.cash.session.dto.CashSessionClosingSummaryResponse;
import com.angelica.pos.cash.session.dto.CashSessionOpenRequest;
import com.angelica.pos.cash.session.dto.CashSessionResponse;
import com.angelica.pos.cash.session.dto.OperationsClosingTotals;
import com.angelica.pos.cash.session.dto.SalesClosingTotals;
import com.angelica.pos.cash.session.entity.CashSession;
import com.angelica.pos.cash.session.entity.CashSessionStatus;
import com.angelica.pos.cash.session.exception.CashSessionAlreadyOpenException;
import com.angelica.pos.cash.session.exception.CashSessionNotFoundException;
import com.angelica.pos.cash.session.mapper.CashSessionMapper;
import com.angelica.pos.cash.session.repository.CashSessionRepository;
import com.angelica.pos.sale.cancellation.repository.SaleCancellationRepository;
import com.angelica.pos.sale.repository.SaleRepository;
import com.angelica.pos.sale.returning.repository.SaleReturnRepository;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CashSessionServiceImplTest {

    private CashSessionRepository cashSessionRepository;
    private CashMovementRepository cashMovementRepository;
    private SaleRepository saleRepository;
    private SaleReturnRepository saleReturnRepository;
    private SaleCancellationRepository saleCancellationRepository;
    private UserRepository userRepository;
    private CashSessionMapper cashSessionMapper;
    private CashSessionServiceImpl cashSessionService;

    @BeforeEach
    void setUp() {
        cashSessionRepository = mock(CashSessionRepository.class);
        cashMovementRepository = mock(CashMovementRepository.class);
        saleRepository = mock(SaleRepository.class);
        saleReturnRepository = mock(SaleReturnRepository.class);
        saleCancellationRepository = mock(SaleCancellationRepository.class);
        userRepository = mock(UserRepository.class);
        cashSessionMapper = mock(CashSessionMapper.class);
        cashSessionService = new CashSessionServiceImpl(
                cashSessionRepository,
                cashMovementRepository,
                saleRepository,
                saleReturnRepository,
                saleCancellationRepository,
                userRepository,
                cashSessionMapper
        );
    }

    @Test
    void openCreatesOpenCashSessionForAuthenticatedUser() {
        User user = buildUser();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);
        CashSessionOpenRequest request = buildOpenRequest("100.00");
        CashSession savedCashSession = CashSession.builder()
                .id(10L)
                .openedBy(user)
                .openingAmount(request.getOpeningAmount())
                .status(CashSessionStatus.OPEN)
                .build();
        CashSessionResponse response = new CashSessionResponse();
        response.setId(10L);
        response.setOpenedByUserId(user.getId());
        response.setOpeningAmount(request.getOpeningAmount());
        response.setStatus(CashSessionStatus.OPEN);

        when(cashSessionRepository.existsByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(false);
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashSessionRepository.saveAndFlush(any(CashSession.class))).thenReturn(savedCashSession);
        when(cashSessionMapper.toResponse(savedCashSession)).thenReturn(response);

        CashSessionResponse result = cashSessionService.open(request, authenticatedUser);

        assertEquals(10L, result.getId());
        assertEquals(user.getId(), result.getOpenedByUserId());
        assertEquals(CashSessionStatus.OPEN, result.getStatus());
        assertNull(savedCashSession.getClosedBy());
        assertNull(savedCashSession.getClosedAt());
        assertNull(savedCashSession.getExpectedCash());
        assertNull(savedCashSession.getCountedCash());
        assertNull(savedCashSession.getCashDifference());
    }

    @Test
    void openRejectsUserWithExistingOpenCashSession() {
        User user = buildUser();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);

        when(cashSessionRepository.existsByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(true);

        assertThrows(
                CashSessionAlreadyOpenException.class,
                () -> cashSessionService.open(buildOpenRequest("0.00"), authenticatedUser)
        );
    }

    @Test
    void openConvertsConcurrentUniqueViolationToAlreadyOpenException() {
        User user = buildUser();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);

        when(cashSessionRepository.existsByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(false);
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashSessionRepository.saveAndFlush(any(CashSession.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate open cash session"));

        assertThrows(
                CashSessionAlreadyOpenException.class,
                () -> cashSessionService.open(buildOpenRequest("50.00"), authenticatedUser)
        );
    }

    @Test
    void findCurrentReturnsEmptyWhenUserHasNoOpenCashSession() {
        User user = buildUser();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);

        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.empty());

        assertFalse(cashSessionService.findCurrent(authenticatedUser).isPresent());
    }

    @Test
    void findByIdThrowsWhenCashSessionDoesNotExist() {
        when(cashSessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(CashSessionNotFoundException.class, () -> cashSessionService.findById(99L));
    }

    @Test
    void getCurrentClosingPreviewCalculatesExpectedCashFromOpeningAndCashMovements() {
        User user = buildUser();
        CashSession cashSession = buildOpenSession(10L, user, "500.00");
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);

        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.of(cashSession));
        stubClosingTotals(
                cashSession.getId(),
                new SalesClosingTotals(new BigDecimal("2000.00"), new BigDecimal("700.00"), new BigDecimal("2700.00")),
                new CashMovementClosingTotals(
                        new BigDecimal("2000.00"),
                        new BigDecimal("300.00"),
                        new BigDecimal("100.00"),
                        new BigDecimal("2400.00"),
                        new BigDecimal("50.00"),
                        new BigDecimal("150.00"),
                        new BigDecimal("100.00"),
                        new BigDecimal("300.00")
                ),
                new OperationsClosingTotals(new BigDecimal("200.00"), new BigDecimal("150.00")),
                new OperationsClosingTotals(new BigDecimal("100.00"), new BigDecimal("100.00"))
        );

        CashSessionClosingSummaryResponse result = cashSessionService.getCurrentClosingPreview(authenticatedUser);

        assertEquals(new BigDecimal("2600.00"), result.getCashSummary().getExpectedAmount());
        assertEquals(new BigDecimal("700.00"), result.getSalesSummary().getCreditSalesAmount());
        assertEquals(new BigDecimal("2700.00"), result.getSalesSummary().getTotalSalesAmount());
        assertEquals(new BigDecimal("200.00"), result.getOperationsSummary().getReturnsProcessedAmount());
        assertEquals(new BigDecimal("100.00"), result.getOperationsSummary().getCancellationsProcessedAmount());
        assertNull(result.getCountedAmount());
        assertNull(result.getDifferenceAmount());
    }

    @Test
    void closeCurrentStoresSnapshotAndCalculatesDifference() {
        User user = buildUser();
        CashSession cashSession = buildOpenSession(10L, user, "500.00");
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);
        CashSessionCloseRequest request = buildCloseRequest("2530.00", " Faltante pendiente de revision ");

        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashSessionRepository.findByOpenedByIdAndStatusForUpdate(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.of(cashSession));
        when(cashSessionRepository.saveAndFlush(cashSession)).thenReturn(cashSession);
        stubClosingTotals(
                cashSession.getId(),
                new SalesClosingTotals(new BigDecimal("2000.00"), new BigDecimal("700.00"), new BigDecimal("2700.00")),
                new CashMovementClosingTotals(
                        new BigDecimal("2000.00"),
                        new BigDecimal("300.00"),
                        new BigDecimal("100.00"),
                        new BigDecimal("2400.00"),
                        new BigDecimal("50.00"),
                        new BigDecimal("150.00"),
                        new BigDecimal("100.00"),
                        new BigDecimal("300.00")
                ),
                new OperationsClosingTotals(new BigDecimal("200.00"), new BigDecimal("150.00")),
                new OperationsClosingTotals(new BigDecimal("100.00"), new BigDecimal("100.00"))
        );

        CashSessionClosingSummaryResponse result = cashSessionService.closeCurrent(request, authenticatedUser);

        assertEquals(CashSessionStatus.CLOSED, cashSession.getStatus());
        assertEquals(user, cashSession.getClosedBy());
        assertEquals(new BigDecimal("2600.00"), cashSession.getExpectedCash());
        assertEquals(new BigDecimal("2530.00"), cashSession.getCountedCash());
        assertEquals(new BigDecimal("-70.00"), cashSession.getCashDifference());
        assertEquals("Faltante pendiente de revision", cashSession.getClosingNotes());
        assertEquals(new BigDecimal("300.00"), cashSession.getReceivablePaymentsAmount());
        assertEquals(new BigDecimal("50.00"), cashSession.getManualOutflowsAmount());
        assertEquals(new BigDecimal("-70.00"), result.getDifferenceAmount());
        verify(cashSessionRepository).findByOpenedByIdAndStatusForUpdate(user.getId(), CashSessionStatus.OPEN);
    }

    @Test
    void closeCurrentRejectsWhenNoOpenSessionExists() {
        User user = buildUser();
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashSessionRepository.findByOpenedByIdAndStatusForUpdate(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.empty());

        assertThrows(
                OpenCashSessionRequiredException.class,
                () -> cashSessionService.closeCurrent(buildCloseRequest("100.00", null), new AuthenticatedUser(user))
        );
    }

    @Test
    void closeCurrentRequiresNotesWhenDifferenceIsNotZero() {
        User user = buildUser();
        CashSession cashSession = buildOpenSession(10L, user, "100.00");
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashSessionRepository.findByOpenedByIdAndStatusForUpdate(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.of(cashSession));
        stubClosingTotals(
                cashSession.getId(),
                new SalesClosingTotals(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO),
                new CashMovementClosingTotals(
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO
                ),
                new OperationsClosingTotals(BigDecimal.ZERO, BigDecimal.ZERO),
                new OperationsClosingTotals(BigDecimal.ZERO, BigDecimal.ZERO)
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> cashSessionService.closeCurrent(buildCloseRequest("90.00", "  "), new AuthenticatedUser(user))
        );
    }

    @Test
    void getClosingSummaryUsesStoredSnapshot() {
        User user = buildUser();
        CashSession cashSession = buildOpenSession(10L, user, "500.00");
        cashSession.setStatus(CashSessionStatus.CLOSED);
        cashSession.setClosedBy(user);
        cashSession.setClosedAt(java.time.OffsetDateTime.now());
        cashSession.setExpectedCash(new BigDecimal("2600.00"));
        cashSession.setCountedCash(new BigDecimal("2530.00"));
        cashSession.setCashDifference(new BigDecimal("-70.00"));
        cashSession.setTotalInflows(new BigDecimal("2400.00"));
        cashSession.setTotalOutflows(new BigDecimal("300.00"));
        cashSession.setCashSalesAmount(new BigDecimal("2000.00"));
        cashSession.setCreditSalesAmount(new BigDecimal("700.00"));
        cashSession.setReceivablePaymentsAmount(new BigDecimal("300.00"));
        cashSession.setManualInflowsAmount(new BigDecimal("100.00"));
        cashSession.setManualOutflowsAmount(new BigDecimal("50.00"));
        cashSession.setSaleRefundsAmount(new BigDecimal("150.00"));
        cashSession.setSaleCancellationRefundsAmount(new BigDecimal("100.00"));
        cashSession.setReturnsProcessedAmount(new BigDecimal("200.00"));
        cashSession.setCancellationsProcessedAmount(new BigDecimal("100.00"));
        cashSession.setClosingNotes("Faltante pendiente de revision");

        when(cashSessionRepository.findByIdWithUsers(10L)).thenReturn(Optional.of(cashSession));

        CashSessionClosingSummaryResponse result = cashSessionService.getClosingSummary(10L);

        assertEquals(new BigDecimal("2600.00"), result.getCashSummary().getExpectedAmount());
        assertEquals(new BigDecimal("2700.00"), result.getSalesSummary().getTotalSalesAmount());
        assertEquals(new BigDecimal("150.00"), result.getOperationsSummary().getReturnCashRefundAmount());
        assertEquals(new BigDecimal("2530.00"), result.getCountedAmount());
    }

    @Test
    void findAllReturnsPageResponse() {
        User user = buildUser();
        CashSession cashSession = CashSession.builder()
                .id(1L)
                .openedBy(user)
                .openingAmount(BigDecimal.ZERO)
                .status(CashSessionStatus.OPEN)
                .build();
        CashSessionResponse response = new CashSessionResponse();
        response.setId(1L);

        PageRequest pageable = PageRequest.of(0, 10);
        when(cashSessionRepository.findAll(pageable))
                .thenReturn(new PageImpl<>(List.of(cashSession), pageable, 1));
        when(cashSessionMapper.toResponseList(List.of(cashSession))).thenReturn(List.of(response));

        PageResponse<CashSessionResponse> result = cashSessionService.findAll(pageable);

        assertEquals(1, result.getContent().size());
        assertEquals(0, result.getPage());
        assertEquals(10, result.getSize());
        assertEquals(1, result.getTotalElements());
        assertTrue(result.isFirst());
        assertTrue(result.isLast());
        verify(cashSessionRepository).findAll(pageable);
    }

    private CashSessionOpenRequest buildOpenRequest(String amount) {
        CashSessionOpenRequest request = new CashSessionOpenRequest();
        request.setOpeningAmount(new BigDecimal(amount));
        return request;
    }

    private CashSessionCloseRequest buildCloseRequest(String amount, String notes) {
        CashSessionCloseRequest request = new CashSessionCloseRequest();
        request.setCountedAmount(new BigDecimal(amount));
        request.setNotes(notes);
        return request;
    }

    private CashSession buildOpenSession(Long id, User user, String openingAmount) {
        return CashSession.builder()
                .id(id)
                .openedBy(user)
                .openingAmount(new BigDecimal(openingAmount))
                .status(CashSessionStatus.OPEN)
                .build();
    }

    private void stubClosingTotals(
            Long cashSessionId,
            SalesClosingTotals salesTotals,
            CashMovementClosingTotals cashMovementTotals,
            OperationsClosingTotals returnTotals,
            OperationsClosingTotals cancellationTotals
    ) {
        when(saleRepository.sumClosingTotalsByCashSessionId(cashSessionId)).thenReturn(salesTotals);
        when(cashMovementRepository.sumClosingTotalsByCashSessionId(cashSessionId)).thenReturn(cashMovementTotals);
        when(saleReturnRepository.sumClosingTotalsByCashSessionId(cashSessionId)).thenReturn(returnTotals);
        when(saleCancellationRepository.sumClosingTotalsByCashSessionId(cashSessionId)).thenReturn(cancellationTotals);
    }

    private User buildUser() {
        return User.builder()
                .id(5L)
                .username("cashier")
                .passwordHash("password-hash")
                .role(Role.CASHIER)
                .active(true)
                .mustChangePassword(false)
                .build();
    }
}
