package com.angelica.pos.receivable.controller;

import com.angelica.pos.receivable.dto.ReceivableDetailResponse;
import com.angelica.pos.receivable.dto.ReceivableSummaryResponse;
import com.angelica.pos.receivable.entity.ReceivableStatus;
import com.angelica.pos.receivable.service.ReceivableService;
import com.angelica.pos.shared.response.PageResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReceivableControllerTest {

    private ReceivableService receivableService;
    private ReceivableController receivableController;

    @BeforeEach
    void setUp() {
        receivableService = mock(ReceivableService.class);
        receivableController = new ReceivableController(receivableService);
    }

    @Test
    void findAllReturnsPage() {
        PageRequest pageable = PageRequest.of(0, 10);
        OffsetDateTime from = OffsetDateTime.parse("2026-07-01T00:00:00Z");
        OffsetDateTime to = OffsetDateTime.parse("2026-07-31T23:59:59Z");
        PageResponse<ReceivableSummaryResponse> page = pageResponse();
        when(receivableService.findAll(8L, 20L, ReceivableStatus.PENDING, from, to, pageable)).thenReturn(page);

        ResponseEntity<PageResponse<ReceivableSummaryResponse>> result =
                receivableController.findAll(8L, 20L, ReceivableStatus.PENDING, from, to, pageable);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(page, result.getBody());
    }

    @Test
    void findByIdReturnsDetail() {
        ReceivableDetailResponse detail = new ReceivableDetailResponse();
        detail.setId(30L);
        when(receivableService.findById(30L)).thenReturn(detail);

        ResponseEntity<ReceivableDetailResponse> result = receivableController.findById(30L);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(detail, result.getBody());
    }

    @Test
    void findByCustomerReturnsPage() {
        PageRequest pageable = PageRequest.of(0, 10);
        PageResponse<ReceivableSummaryResponse> page = pageResponse();
        when(receivableService.findByCustomer(8L, ReceivableStatus.PENDING, pageable)).thenReturn(page);

        ResponseEntity<PageResponse<ReceivableSummaryResponse>> result =
                receivableController.findByCustomer(8L, ReceivableStatus.PENDING, pageable);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(page, result.getBody());
    }

    private PageResponse<ReceivableSummaryResponse> pageResponse() {
        ReceivableSummaryResponse response = new ReceivableSummaryResponse(
                30L,
                20L,
                8L,
                "Ana Lopez",
                new BigDecimal("500.00"),
                BigDecimal.ZERO,
                new BigDecimal("500.00"),
                ReceivableStatus.PENDING,
                OffsetDateTime.parse("2026-07-13T10:00:00Z"),
                null
        );

        return PageResponse.<ReceivableSummaryResponse>builder()
                .content(List.of(response))
                .page(0)
                .size(10)
                .totalElements(1)
                .totalPages(1)
                .first(true)
                .last(true)
                .build();
    }
}
