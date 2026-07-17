package com.angelica.pos.sale.returning.controller;

import com.angelica.pos.sale.returning.dto.SaleReturnDetailResponse;
import com.angelica.pos.sale.returning.dto.SaleReturnRequest;
import com.angelica.pos.sale.returning.dto.SaleReturnSummaryResponse;
import com.angelica.pos.sale.returning.service.SaleReturnService;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequiredArgsConstructor
@Validated
@Tag(name = OpenApiTags.SALE_RETURNS)
public class SaleReturnController {

    private final SaleReturnService saleReturnService;

    @PostMapping("/api/sales/{saleId}/returns")
    public ResponseEntity<SaleReturnDetailResponse> create(
            @PathVariable
            @Positive(message = "Sale id must be positive")
            Long saleId,
            @Valid @RequestBody SaleReturnRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        SaleReturnDetailResponse response = saleReturnService.create(saleId, request, authenticatedUser);
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/sale-returns/{id}")
                .buildAndExpand(response.getId())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/api/sales/{saleId}/returns")
    public ResponseEntity<PageResponse<SaleReturnSummaryResponse>> findBySale(
            @PathVariable
            @Positive(message = "Sale id must be positive")
            Long saleId,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @ParameterObject @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(saleReturnService.findBySale(saleId, authenticatedUser, pageable));
    }

    @GetMapping("/api/sale-returns/{returnId}")
    public ResponseEntity<SaleReturnDetailResponse> findById(
            @PathVariable
            @Positive(message = "Return id must be positive")
            Long returnId,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ResponseEntity.ok(saleReturnService.findById(returnId, authenticatedUser));
    }
}
