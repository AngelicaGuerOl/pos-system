package com.angelica.pos.sale.cancellation.controller;

import com.angelica.pos.sale.cancellation.dto.SaleCancellationRequest;
import com.angelica.pos.sale.cancellation.dto.SaleCancellationResponse;
import com.angelica.pos.sale.cancellation.service.SaleCancellationService;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.config.OpenApiTags;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/sales/{saleId}/cancel")
@RequiredArgsConstructor
@Validated
@Tag(name = OpenApiTags.SALE_CANCELLATIONS)
public class SaleCancellationController {

    private final SaleCancellationService saleCancellationService;

    @PostMapping
    public ResponseEntity<SaleCancellationResponse> cancel(
            @PathVariable
            @Positive(message = "Sale id must be positive")
            Long saleId,
            @Valid @RequestBody SaleCancellationRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        SaleCancellationResponse response = saleCancellationService.cancel(saleId, request, authenticatedUser);
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/sales/{saleId}")
                .buildAndExpand(response.getSaleId())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }
}
