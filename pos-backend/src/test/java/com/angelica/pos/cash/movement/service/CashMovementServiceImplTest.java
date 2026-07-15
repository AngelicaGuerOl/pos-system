package com.angelica.pos.cash.movement.service;

import com.angelica.pos.cash.movement.dto.CashMovementResponse;
import com.angelica.pos.cash.movement.dto.CurrentCashSummaryResponse;
import com.angelica.pos.cash.movement.dto.ManualCashMovementRequest;
import com.angelica.pos.cash.movement.entity.CashMovement;
import com.angelica.pos.cash.movement.entity.CashMovementDirection;
import com.angelica.pos.cash.movement.entity.CashMovementType;
import com.angelica.pos.cash.movement.exception.OpenCashSessionRequiredException;
import com.angelica.pos.cash.movement.mapper.CashMovementMapper;
import com.angelica.pos.cash.movement.repository.CashMovementRepository;
import com.angelica.pos.cash.session.entity.CashSession;
import com.angelica.pos.cash.session.entity.CashSessionStatus;
import com.angelica.pos.cash.session.exception.CashSessionNotFoundException;
import com.angelica.pos.cash.session.repository.CashSessionRepository;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CashMovementServiceImplTest {

    private CashMovementRepository cashMovementRepository;
    private CashSessionRepository cashSessionRepository;
    private UserRepository userRepository;
    private CashMovementMapper cashMovementMapper;
    private CashMovementServiceImpl cashMovementService;

    @BeforeEach
    void setUp() {
        cashMovementRepository = mock(CashMovementRepository.class);
        cashSessionRepository = mock(CashSessionRepository.class);
        userRepository = mock(UserRepository.class);
        cashMovementMapper = mock(CashMovementMapper.class);
        cashMovementService = new CashMovementServiceImpl(
                cashMovementRepository,
                cashSessionRepository,
                userRepository,
                cashMovementMapper
        );
    }

    @Test
    void registerManualEntryCreatesInflowMovementForAuthenticatedUsersOpenSession() {
        User user = buildUser(5L);
        CashSession cashSession = buildCashSession(11L, user);
        ManualCashMovementRequest request = buildRequest("250.00", "  Fondo adicional  ");
        CashMovement movement = new CashMovement();
        CashMovement savedMovement = new CashMovement();
        CashMovementResponse response = buildResponse(20L, CashMovementDirection.INFLOW, CashMovementType.MANUAL_ENTRY);
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);

        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.of(cashSession));
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashMovementMapper.toEntity(request)).thenReturn(movement);
        when(cashMovementRepository.save(movement)).thenReturn(savedMovement);
        when(cashMovementMapper.toResponse(savedMovement)).thenReturn(response);

        CashMovementResponse result = cashMovementService.registerManualEntry(request, authenticatedUser);

        assertEquals(20L, result.getId());
        assertSame(cashSession, movement.getCashSession());
        assertSame(user, movement.getCreatedBy());
        assertEquals(CashMovementDirection.INFLOW, movement.getDirection());
        assertEquals(CashMovementType.MANUAL_ENTRY, movement.getType());
        assertEquals("Fondo adicional", movement.getDescription());
    }

    @Test
    void registerManualExitCreatesOutflowMovementForAuthenticatedUsersOpenSession() {
        User user = buildUser(5L);
        CashSession cashSession = buildCashSession(11L, user);
        ManualCashMovementRequest request = buildRequest("125.50", " Pago a proveedor ");
        CashMovement movement = new CashMovement();
        CashMovement savedMovement = new CashMovement();
        CashMovementResponse response = buildResponse(21L, CashMovementDirection.OUTFLOW, CashMovementType.MANUAL_EXIT);
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);

        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.of(cashSession));
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashMovementMapper.toEntity(request)).thenReturn(movement);
        when(cashMovementRepository.save(movement)).thenReturn(savedMovement);
        when(cashMovementMapper.toResponse(savedMovement)).thenReturn(response);

        CashMovementResponse result = cashMovementService.registerManualExit(request, authenticatedUser);

        assertEquals(21L, result.getId());
        assertSame(cashSession, movement.getCashSession());
        assertSame(user, movement.getCreatedBy());
        assertEquals(CashMovementDirection.OUTFLOW, movement.getDirection());
        assertEquals(CashMovementType.MANUAL_EXIT, movement.getType());
        assertEquals("Pago a proveedor", movement.getDescription());
    }

    @Test
    void registerManualMovementRejectsZeroAmount() {
        User user = buildUser(5L);

        assertThrows(
                IllegalArgumentException.class,
                () -> cashMovementService.registerManualEntry(buildRequest("0.00", "Fondo"), new AuthenticatedUser(user))
        );
    }

    @Test
    void registerManualMovementRejectsNegativeAmount() {
        User user = buildUser(5L);

        assertThrows(
                IllegalArgumentException.class,
                () -> cashMovementService.registerManualExit(buildRequest("-1.00", "Pago"), new AuthenticatedUser(user))
        );
    }

    @Test
    void registerManualMovementRejectsBlankDescription() {
        User user = buildUser(5L);

        assertThrows(
                IllegalArgumentException.class,
                () -> cashMovementService.registerManualEntry(buildRequest("10.00", "   "), new AuthenticatedUser(user))
        );
    }

    @Test
    void registerManualMovementRejectsMoreThanTwoDecimals() {
        User user = buildUser(5L);

        assertThrows(
                IllegalArgumentException.class,
                () -> cashMovementService.registerManualEntry(buildRequest("10.001", "Fondo"), new AuthenticatedUser(user))
        );
    }

    @Test
    void registerManualMovementRejectsWhenUserHasNoOpenCashSession() {
        User user = buildUser(5L);

        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.empty());

        assertThrows(
                OpenCashSessionRequiredException.class,
                () -> cashMovementService.registerManualEntry(buildRequest("10.00", "Fondo"), new AuthenticatedUser(user))
        );
    }

    @Test
    void registerManualMovementSearchesOnlyAuthenticatedUsersOpenSession() {
        User user = buildUser(5L);

        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.empty());

        assertThrows(
                OpenCashSessionRequiredException.class,
                () -> cashMovementService.registerManualExit(buildRequest("10.00", "Pago"), new AuthenticatedUser(user))
        );

        verify(cashSessionRepository).findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN);
    }

    @Test
    void findCurrentSessionMovementsReturnsPaginatedOpenSessionMovements() {
        User user = buildUser(5L);
        CashSession cashSession = buildCashSession(11L, user);
        CashMovement movement = CashMovement.builder().id(1L).cashSession(cashSession).createdBy(user).build();
        CashMovementResponse response = buildResponse(1L, CashMovementDirection.INFLOW, CashMovementType.MANUAL_ENTRY);
        PageRequest pageable = PageRequest.of(0, 10);

        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.of(cashSession));
        when(cashMovementRepository.findByCashSessionIdOrderByCreatedAtDesc(cashSession.getId(), pageable))
                .thenReturn(new PageImpl<>(List.of(movement), pageable, 1));
        when(cashMovementMapper.toResponseList(List.of(movement))).thenReturn(List.of(response));

        PageResponse<CashMovementResponse> result = cashMovementService.findCurrentSessionMovements(
                new AuthenticatedUser(user),
                pageable
        );

        assertEquals(1, result.getContent().size());
        assertEquals(1, result.getTotalElements());
        verify(cashMovementRepository).findByCashSessionIdOrderByCreatedAtDesc(cashSession.getId(), pageable);
    }

    @Test
    void getCurrentSessionSummaryCalculatesExpectedCash() {
        User user = buildUser(5L);
        CashSession cashSession = buildCashSession(11L, user);
        cashSession.setOpeningAmount(new BigDecimal("100.00"));

        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.of(cashSession));
        when(cashMovementRepository.sumAmountByCashSessionIdAndDirection(cashSession.getId(), CashMovementDirection.INFLOW))
                .thenReturn(new BigDecimal("250.00"));
        when(cashMovementRepository.sumAmountByCashSessionIdAndDirection(cashSession.getId(), CashMovementDirection.OUTFLOW))
                .thenReturn(new BigDecimal("40.00"));

        CurrentCashSummaryResponse result = cashMovementService.getCurrentSessionSummary(new AuthenticatedUser(user));

        assertEquals(new BigDecimal("250.00"), result.getTotalInflows());
        assertEquals(new BigDecimal("40.00"), result.getTotalOutflows());
        assertEquals(new BigDecimal("310.00"), result.getExpectedCash());
    }

    @Test
    void getCurrentSessionSummaryUsesZeroWhenNoMovementsExist() {
        User user = buildUser(5L);
        CashSession cashSession = buildCashSession(11L, user);
        cashSession.setOpeningAmount(new BigDecimal("100.00"));

        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.of(cashSession));
        when(cashMovementRepository.sumAmountByCashSessionIdAndDirection(eq(cashSession.getId()), any()))
                .thenReturn(BigDecimal.ZERO);

        CurrentCashSummaryResponse result = cashMovementService.getCurrentSessionSummary(new AuthenticatedUser(user));

        assertEquals(BigDecimal.ZERO, result.getTotalInflows());
        assertEquals(BigDecimal.ZERO, result.getTotalOutflows());
        assertEquals(new BigDecimal("100.00"), result.getExpectedCash());
    }

    @Test
    void registerCashSaleRejectsClosedCashSession() {
        User user = buildUser(5L);
        CashSession cashSession = buildCashSession(11L, user);
        cashSession.setStatus(CashSessionStatus.CLOSED);

        assertThrows(
                OpenCashSessionRequiredException.class,
                () -> cashMovementService.registerCashSale(cashSession, user, new BigDecimal("100.00"), 20L)
        );
    }

    @Test
    void findSessionMovementsRejectsPageSizeGreaterThanFifty() {
        assertThrows(
                IllegalArgumentException.class,
                () -> cashMovementService.findSessionMovements(1L, PageRequest.of(0, 51))
        );
    }

    @Test
    void findSessionMovementsThrowsWhenSessionDoesNotExist() {
        when(cashSessionRepository.existsById(99L)).thenReturn(false);

        assertThrows(
                CashSessionNotFoundException.class,
                () -> cashMovementService.findSessionMovements(99L, PageRequest.of(0, 10))
        );
    }

    private ManualCashMovementRequest buildRequest(String amount, String description) {
        ManualCashMovementRequest request = new ManualCashMovementRequest();
        request.setAmount(new BigDecimal(amount));
        request.setDescription(description);
        return request;
    }

    private CashMovementResponse buildResponse(
            Long id,
            CashMovementDirection direction,
            CashMovementType type
    ) {
        CashMovementResponse response = new CashMovementResponse();
        response.setId(id);
        response.setDirection(direction);
        response.setType(type);
        return response;
    }

    private CashSession buildCashSession(Long id, User user) {
        return CashSession.builder()
                .id(id)
                .openedBy(user)
                .openingAmount(BigDecimal.ZERO)
                .status(CashSessionStatus.OPEN)
                .build();
    }

    private User buildUser(Long id) {
        return User.builder()
                .id(id)
                .username("cashier")
                .passwordHash("password-hash")
                .role(Role.CASHIER)
                .active(true)
                .mustChangePassword(false)
                .build();
    }
}
