package com.angelica.pos.sale.controller;

import com.angelica.pos.sale.dto.SaleDetailResponse;
import com.angelica.pos.sale.dto.SaleItemRequest;
import com.angelica.pos.sale.dto.SaleRequest;
import com.angelica.pos.sale.dto.SaleResponse;
import com.angelica.pos.sale.dto.SaleSummaryResponse;
import com.angelica.pos.sale.entity.SaleStatus;
import com.angelica.pos.sale.entity.SaleType;
import com.angelica.pos.sale.service.SaleService;
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
import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SaleControllerTest {

    private SaleService saleService;
    private SaleController saleController;

    @BeforeEach
    void setUp() {
        saleService = mock(SaleService.class);
        saleController = new SaleController(saleService);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setContextPath("");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }

    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void createReturnsCreatedWithLocation() {
        User user = buildUser(Role.CASHIER);
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);
        SaleRequest request = buildRequest();
        SaleResponse response = buildResponse(15L);

        when(saleService.create(request, authenticatedUser)).thenReturn(response);

        ResponseEntity<SaleResponse> result = saleController.create(request, authenticatedUser);

        assertEquals(HttpStatus.CREATED, result.getStatusCode());
        assertNotNull(result.getHeaders().getLocation());
        assertEquals("/api/sales/15", result.getHeaders().getLocation().getPath());
        assertEquals(response, result.getBody());
    }

    @Test
    void findByIdReturnsSale() {
        User user = buildUser(Role.ADMIN);
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);
        SaleDetailResponse response = buildDetailResponse(15L);

        when(saleService.findById(15L, authenticatedUser)).thenReturn(response);

        ResponseEntity<SaleDetailResponse> result = saleController.findById(15L, authenticatedUser);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(response, result.getBody());
    }

    @Test
    void findCurrentSessionReturnsPage() {
        User user = buildUser(Role.CASHIER);
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);
        PageRequest pageable = PageRequest.of(0, 10);
        PageResponse<SaleSummaryResponse> page = pageResponse();

        when(saleService.findCurrentSession(authenticatedUser, pageable)).thenReturn(page);

        ResponseEntity<PageResponse<SaleSummaryResponse>> result =
                saleController.findCurrentSession(authenticatedUser, pageable);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(page, result.getBody());
    }

    @Test
    void findAllReturnsPage() {
        PageRequest pageable = PageRequest.of(0, 10);
        PageResponse<SaleSummaryResponse> page = pageResponse();

        when(saleService.findAll(15L, null, null, SaleStatus.COMPLETED, SaleType.CASH, null, null, pageable))
                .thenReturn(page);

        ResponseEntity<PageResponse<SaleSummaryResponse>> result =
                saleController.findAll(15L, null, null, null, SaleStatus.COMPLETED, SaleType.CASH, null, null, pageable);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(page, result.getBody());
    }

    private SaleRequest buildRequest() {
        SaleItemRequest item = new SaleItemRequest();
        item.setProductId(1L);
        item.setQuantity(new BigDecimal("2.00"));

        SaleRequest request = new SaleRequest();
        request.setSaleType(SaleType.CASH);
        request.setCashReceived(new BigDecimal("400.00"));
        request.setItems(List.of(item));
        return request;
    }

    private SaleResponse buildResponse(Long id) {
        SaleResponse response = new SaleResponse();
        response.setId(id);
        response.setSaleType(SaleType.CASH);
        response.setStatus(SaleStatus.COMPLETED);
        return response;
    }

    private SaleDetailResponse buildDetailResponse(Long id) {
        SaleDetailResponse response = new SaleDetailResponse();
        response.setId(id);
        response.setSaleType(SaleType.CASH);
        response.setStatus(SaleStatus.COMPLETED);
        return response;
    }

    private PageResponse<SaleSummaryResponse> pageResponse() {
        return PageResponse.<SaleSummaryResponse>builder()
                .content(List.of(buildSummaryResponse(15L)))
                .page(0)
                .size(10)
                .totalElements(1)
                .totalPages(1)
                .first(true)
                .last(true)
                .build();
    }

    private SaleSummaryResponse buildSummaryResponse(Long id) {
        return new SaleSummaryResponse(
                id,
                OffsetDateTime.parse("2026-07-13T10:00:00Z"),
                5L,
                "user",
                null,
                "Público general",
                SaleType.CASH,
                SaleStatus.COMPLETED,
                new BigDecimal("100.00"),
                1L
        );
    }

    private User buildUser(Role role) {
        return User.builder()
                .id(5L)
                .username("user")
                .passwordHash("password-hash")
                .role(role)
                .active(true)
                .mustChangePassword(false)
                .build();
    }
}
