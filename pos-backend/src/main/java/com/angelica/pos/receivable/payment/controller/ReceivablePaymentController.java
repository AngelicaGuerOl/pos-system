package com.angelica.pos.receivable.payment.controller;

import com.angelica.pos.receivable.payment.dto.ReceivablePaymentRequest;
import com.angelica.pos.receivable.payment.dto.ReceivablePaymentResponse;
import com.angelica.pos.receivable.payment.service.ReceivablePaymentService;
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
@Tag(name = OpenApiTags.RECEIVABLE_PAYMENTS)
public class ReceivablePaymentController {

    private final ReceivablePaymentService receivablePaymentService;

    @PostMapping("/api/receivables/{receivableId}/payments")
    public ResponseEntity<ReceivablePaymentResponse> create(
            @PathVariable
            @Positive(message = "Receivable id must be positive")
            Long receivableId,
            @Valid @RequestBody ReceivablePaymentRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        ReceivablePaymentResponse response = receivablePaymentService.create(
                receivableId,
                request,
                authenticatedUser
        );
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/receivable-payments/{id}")
                .buildAndExpand(response.getId())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/api/receivables/{receivableId}/payments")
    public ResponseEntity<PageResponse<ReceivablePaymentResponse>> findByReceivable(
            @PathVariable
            @Positive(message = "Receivable id must be positive")
            Long receivableId,
            @ParameterObject @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(receivablePaymentService.findByReceivable(receivableId, pageable));
    }

    @GetMapping("/api/receivable-payments/{id}")
    public ResponseEntity<ReceivablePaymentResponse> findById(
            @PathVariable
            @Positive(message = "Payment id must be positive")
            Long id
    ) {
        return ResponseEntity.ok(receivablePaymentService.findById(id));
    }
}
