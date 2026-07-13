package com.angelica.pos.cash.session.controller;

import com.angelica.pos.cash.session.dto.CashSessionOpenRequest;
import com.angelica.pos.cash.session.dto.CashSessionResponse;
import com.angelica.pos.cash.session.service.CashSessionService;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api/cash-sessions")
@RequiredArgsConstructor
@Validated
public class CashSessionController {

    private final CashSessionService cashSessionService;

    @PostMapping("/open")
    public ResponseEntity<CashSessionResponse> open(
            @Valid @RequestBody CashSessionOpenRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        CashSessionResponse response = cashSessionService.open(request, authenticatedUser);
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/cash-sessions/{id}")
                .buildAndExpand(response.getId())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/current")
    public ResponseEntity<CashSessionResponse> findCurrent(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return cashSessionService.findCurrent(authenticatedUser)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CashSessionResponse> findById(
            @PathVariable
            @Positive(message = "Cash session id must be positive")
            Long id
    ) {
        return ResponseEntity.ok(cashSessionService.findById(id));
    }

    @GetMapping
    public ResponseEntity<PageResponse<CashSessionResponse>> findAll(
            @PageableDefault(size = 10, sort = "openedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(cashSessionService.findAll(pageable));
    }
}
