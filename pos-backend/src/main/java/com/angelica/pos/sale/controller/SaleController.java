package com.angelica.pos.sale.controller;

import com.angelica.pos.sale.dto.SaleDetailResponse;
import com.angelica.pos.sale.dto.SaleRequest;
import com.angelica.pos.sale.dto.SaleResponse;
import com.angelica.pos.sale.dto.SaleSummaryResponse;
import com.angelica.pos.sale.entity.SaleStatus;
import com.angelica.pos.sale.entity.SaleType;
import com.angelica.pos.sale.service.SaleService;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.config.OpenApiTags;
import com.angelica.pos.shared.response.PageResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
@Validated
@Tag(name = OpenApiTags.SALES)
public class SaleController {

    private final SaleService saleService;

    @PostMapping
    public ResponseEntity<SaleResponse> create(
            @Valid @RequestBody SaleRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        SaleResponse response = saleService.create(request, authenticatedUser);
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/sales/{id}")
                .buildAndExpand(response.getId())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/current-session")
    public ResponseEntity<PageResponse<SaleSummaryResponse>> findCurrentSession(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @ParameterObject @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(saleService.findCurrentSession(authenticatedUser, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SaleDetailResponse> findById(
            @PathVariable
            @Positive(message = "Sale id must be positive")
            Long id,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ResponseEntity.ok(saleService.findById(id, authenticatedUser));
    }

    @GetMapping
    public ResponseEntity<PageResponse<SaleSummaryResponse>> findAll(
            @RequestParam(required = false)
            @Positive(message = "Sale id must be positive")
            Long id,
            @RequestParam(required = false)
            @Positive(message = "Folio must be positive")
            Long folio,
            @RequestParam(required = false)
            @Positive(message = "Customer id must be positive")
            Long customerId,
            @RequestParam(required = false)
            @Positive(message = "Created by user id must be positive")
            Long createdByUserId,
            @RequestParam(required = false) SaleStatus status,
            @RequestParam(required = false) SaleType saleType,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime to,
            @ParameterObject @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Long effectiveId = id == null ? folio : id;
        return ResponseEntity.ok(saleService.findAll(
                effectiveId,
                customerId,
                createdByUserId,
                status,
                saleType,
                from,
                to,
                pageable
        ));
    }
}
