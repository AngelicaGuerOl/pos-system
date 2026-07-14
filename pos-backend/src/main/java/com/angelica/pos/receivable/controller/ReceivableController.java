package com.angelica.pos.receivable.controller;

import com.angelica.pos.receivable.dto.ReceivableDetailResponse;
import com.angelica.pos.receivable.dto.ReceivableSummaryResponse;
import com.angelica.pos.receivable.entity.ReceivableStatus;
import com.angelica.pos.receivable.service.ReceivableService;
import com.angelica.pos.shared.response.PageResponse;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;

@RestController
@RequiredArgsConstructor
@Validated
public class ReceivableController {

    private final ReceivableService receivableService;

    @GetMapping("/api/receivables")
    public ResponseEntity<PageResponse<ReceivableSummaryResponse>> findAll(
            @RequestParam(required = false)
            @Positive(message = "Customer id must be positive")
            Long customerId,
            @RequestParam(required = false)
            @Positive(message = "Sale id must be positive")
            Long saleId,
            @RequestParam(required = false) ReceivableStatus status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime to,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(receivableService.findAll(customerId, saleId, status, from, to, pageable));
    }

    @GetMapping("/api/receivables/{id}")
    public ResponseEntity<ReceivableDetailResponse> findById(
            @PathVariable
            @Positive(message = "Receivable id must be positive")
            Long id
    ) {
        return ResponseEntity.ok(receivableService.findById(id));
    }

    @GetMapping("/api/customers/{customerId}/receivables")
    public ResponseEntity<PageResponse<ReceivableSummaryResponse>> findByCustomer(
            @PathVariable
            @Positive(message = "Customer id must be positive")
            Long customerId,
            @RequestParam(required = false) ReceivableStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(receivableService.findByCustomer(customerId, status, pageable));
    }
}
