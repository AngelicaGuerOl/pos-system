package com.angelica.pos.cash.movement.controller;

import com.angelica.pos.cash.movement.dto.CashMovementResponse;
import com.angelica.pos.cash.movement.dto.CurrentCashSummaryResponse;
import com.angelica.pos.cash.movement.dto.ManualCashMovementRequest;
import com.angelica.pos.cash.movement.service.CashMovementService;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Validated
@Tag(name = OpenApiTags.CASH_MOVEMENTS)
public class CashMovementController {

    private final CashMovementService cashMovementService;

    @PostMapping("/cash-movements/entries")
    public ResponseEntity<CashMovementResponse> registerEntry(
            @Valid @RequestBody ManualCashMovementRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        CashMovementResponse response = cashMovementService.registerManualEntry(request, authenticatedUser);
        URI location = buildLocation(response.getId());

        return ResponseEntity.created(location).body(response);
    }

    @PostMapping("/cash-movements/exits")
    public ResponseEntity<CashMovementResponse> registerExit(
            @Valid @RequestBody ManualCashMovementRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        CashMovementResponse response = cashMovementService.registerManualExit(request, authenticatedUser);
        URI location = buildLocation(response.getId());

        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/cash-movements/current")
    public ResponseEntity<PageResponse<CashMovementResponse>> findCurrentSessionMovements(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @ParameterObject @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(cashMovementService.findCurrentSessionMovements(authenticatedUser, pageable));
    }

    @GetMapping("/cash-movements/current/summary")
    public ResponseEntity<CurrentCashSummaryResponse> getCurrentSessionSummary(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ResponseEntity.ok(cashMovementService.getCurrentSessionSummary(authenticatedUser));
    }

    @GetMapping("/cash-sessions/{sessionId}/movements")
    public ResponseEntity<PageResponse<CashMovementResponse>> findSessionMovements(
            @PathVariable
            @Positive(message = "Cash session id must be positive")
            Long sessionId,
            @ParameterObject @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(cashMovementService.findSessionMovements(sessionId, pageable));
    }

    private URI buildLocation(Long movementId) {
        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/cash-movements/{id}")
                .buildAndExpand(movementId)
                .toUri();
    }
}
