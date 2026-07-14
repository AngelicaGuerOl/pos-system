package com.angelica.pos.receivable.payment.controller;

import com.angelica.pos.receivable.entity.ReceivableStatus;
import com.angelica.pos.receivable.payment.dto.ReceivablePaymentRequest;
import com.angelica.pos.receivable.payment.dto.ReceivablePaymentResponse;
import com.angelica.pos.receivable.payment.service.ReceivablePaymentService;
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

class ReceivablePaymentControllerTest {

    private ReceivablePaymentService receivablePaymentService;
    private ReceivablePaymentController receivablePaymentController;

    @BeforeEach
    void setUp() {
        receivablePaymentService = mock(ReceivablePaymentService.class);
        receivablePaymentController = new ReceivablePaymentController(receivablePaymentService);
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
        User user = user();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);
        ReceivablePaymentRequest request = new ReceivablePaymentRequest();
        request.setAmount(new BigDecimal("300.00"));
        ReceivablePaymentResponse response = response(40L);

        when(receivablePaymentService.create(20L, request, authenticatedUser)).thenReturn(response);

        ResponseEntity<ReceivablePaymentResponse> result =
                receivablePaymentController.create(20L, request, authenticatedUser);

        assertEquals(HttpStatus.CREATED, result.getStatusCode());
        assertNotNull(result.getHeaders().getLocation());
        assertEquals("/api/receivable-payments/40", result.getHeaders().getLocation().getPath());
        assertEquals(response, result.getBody());
    }

    @Test
    void findByReceivableReturnsPage() {
        PageRequest pageable = PageRequest.of(0, 10);
        PageResponse<ReceivablePaymentResponse> page = PageResponse.<ReceivablePaymentResponse>builder()
                .content(List.of(response(40L)))
                .page(0)
                .size(10)
                .totalElements(1)
                .totalPages(1)
                .first(true)
                .last(true)
                .build();
        when(receivablePaymentService.findByReceivable(20L, pageable)).thenReturn(page);

        ResponseEntity<PageResponse<ReceivablePaymentResponse>> result =
                receivablePaymentController.findByReceivable(20L, pageable);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(page, result.getBody());
    }

    @Test
    void findByIdReturnsPayment() {
        ReceivablePaymentResponse response = response(40L);
        when(receivablePaymentService.findById(40L)).thenReturn(response);

        ResponseEntity<ReceivablePaymentResponse> result = receivablePaymentController.findById(40L);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(response, result.getBody());
    }

    private ReceivablePaymentResponse response(Long id) {
        ReceivablePaymentResponse response = new ReceivablePaymentResponse();
        response.setId(id);
        response.setReceivableId(20L);
        response.setSaleId(30L);
        response.setCustomerId(8L);
        response.setCustomerFullName("Ana Lopez");
        response.setCashSessionId(11L);
        response.setReceivedById(5L);
        response.setReceivedByUsername("user5");
        response.setAmount(new BigDecimal("300.00"));
        response.setCreatedAt(OffsetDateTime.parse("2026-07-13T10:00:00Z"));
        response.setPaidAmount(new BigDecimal("300.00"));
        response.setOutstandingBalance(new BigDecimal("200.00"));
        response.setReceivableStatus(ReceivableStatus.PARTIALLY_PAID);
        return response;
    }

    private User user() {
        return User.builder()
                .id(5L)
                .username("user5")
                .passwordHash("password-hash")
                .role(Role.CASHIER)
                .active(true)
                .mustChangePassword(false)
                .build();
    }
}
