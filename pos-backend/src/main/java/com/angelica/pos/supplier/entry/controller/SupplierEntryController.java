package com.angelica.pos.supplier.entry.controller;

import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.supplier.entry.dto.SupplierEntryRequest;
import com.angelica.pos.supplier.entry.dto.SupplierEntryResponse;
import com.angelica.pos.supplier.entry.service.SupplierEntryService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/supplier-entries")
@RequiredArgsConstructor
@Validated
public class SupplierEntryController {

    private final SupplierEntryService entryService;

    @PostMapping
    public ResponseEntity<SupplierEntryResponse> create(
            @Valid @RequestBody SupplierEntryRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        SupplierEntryResponse response = entryService.create(request, authenticatedUser);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.getId())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    public ResponseEntity<PageResponse<SupplierEntryResponse>> findAll(
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(required = false) Long productId,
            @PageableDefault(size = 10, sort = "entryDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(entryService.findAll(supplierId, from, to, productId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplierEntryResponse> findById(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(entryService.findById(id));
    }
}
