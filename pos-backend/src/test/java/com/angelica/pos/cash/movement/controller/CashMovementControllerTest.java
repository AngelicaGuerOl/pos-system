package com.angelica.pos.cash.movement.controller;

import com.angelica.pos.cash.movement.dto.CashMovementResponse;
import com.angelica.pos.cash.movement.dto.CurrentCashSummaryResponse;
import com.angelica.pos.cash.movement.dto.ManualCashMovementRequest;
import com.angelica.pos.cash.movement.entity.CashMovementDirection;
import com.angelica.pos.cash.movement.entity.CashMovementType;
import com.angelica.pos.cash.movement.service.CashMovementService;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CashMovementControllerTest {

    private CashMovementService cashMovementService;
    private CashMovementController cashMovementController;

    @BeforeEach
    void setUp() {
        cashMovementService = mock(CashMovementService.class);
        cashMovementController = new CashMovementController(cashMovementService);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setContextPath("");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }

    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void registerEntryReturnsCreatedWithLocation() {
        User user = buildUser();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);
        ManualCashMovementRequest request = buildRequest();
        CashMovementResponse response = buildResponse(15L, CashMovementDirection.INFLOW, CashMovementType.MANUAL_ENTRY);

        when(cashMovementService.registerManualEntry(request, authenticatedUser)).thenReturn(response);

        ResponseEntity<CashMovementResponse> result = cashMovementController.registerEntry(request, authenticatedUser);

        assertEquals(HttpStatus.CREATED, result.getStatusCode());
        assertNotNull(result.getHeaders().getLocation());
        assertEquals("/api/cash-movements/15", result.getHeaders().getLocation().getPath());
        assertEquals(response, result.getBody());
    }

    @Test
    void registerExitReturnsCreatedWithLocation() {
        User user = buildUser();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);
        ManualCashMovementRequest request = buildRequest();
        CashMovementResponse response = buildResponse(16L, CashMovementDirection.OUTFLOW, CashMovementType.MANUAL_EXIT);

        when(cashMovementService.registerManualExit(request, authenticatedUser)).thenReturn(response);

        ResponseEntity<CashMovementResponse> result = cashMovementController.registerExit(request, authenticatedUser);

        assertEquals(HttpStatus.CREATED, result.getStatusCode());
        assertNotNull(result.getHeaders().getLocation());
        assertEquals("/api/cash-movements/16", result.getHeaders().getLocation().getPath());
        assertEquals(response, result.getBody());
    }

    @Test
    void findCurrentSessionMovementsReturnsPageResponse() {
        User user = buildUser();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);
        PageRequest pageable = PageRequest.of(0, 10);
        PageResponse<CashMovementResponse> pageResponse = PageResponse.<CashMovementResponse>builder()
                .content(List.of(buildResponse(1L, CashMovementDirection.INFLOW, CashMovementType.MANUAL_ENTRY)))
                .page(0)
                .size(10)
                .totalElements(1)
                .totalPages(1)
                .first(true)
                .last(true)
                .build();

        when(cashMovementService.findCurrentSessionMovements(authenticatedUser, pageable)).thenReturn(pageResponse);

        ResponseEntity<PageResponse<CashMovementResponse>> result =
                cashMovementController.findCurrentSessionMovements(authenticatedUser, pageable);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(pageResponse, result.getBody());
    }

    @Test
    void getCurrentSessionSummaryReturnsSummary() {
        User user = buildUser();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);
        CurrentCashSummaryResponse summary = CurrentCashSummaryResponse.builder()
                .sessionId(1L)
                .openingAmount(new BigDecimal("100.00"))
                .totalInflows(new BigDecimal("50.00"))
                .totalOutflows(new BigDecimal("25.00"))
                .expectedCash(new BigDecimal("125.00"))
                .build();

        when(cashMovementService.getCurrentSessionSummary(authenticatedUser)).thenReturn(summary);

        ResponseEntity<CurrentCashSummaryResponse> result =
                cashMovementController.getCurrentSessionSummary(authenticatedUser);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(summary, result.getBody());
    }

    private ManualCashMovementRequest buildRequest() {
        ManualCashMovementRequest request = new ManualCashMovementRequest();
        request.setAmount(new BigDecimal("10.00"));
        request.setDescription("Movimiento");
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
