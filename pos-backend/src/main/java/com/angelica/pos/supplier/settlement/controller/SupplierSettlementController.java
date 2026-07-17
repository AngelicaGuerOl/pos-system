package com.angelica.pos.supplier.settlement.controller;

import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.supplier.settlement.dto.SupplierSettlementCreateRequest;
import com.angelica.pos.supplier.settlement.dto.SupplierSettlementResponse;
import com.angelica.pos.supplier.settlement.dto.SupplierSettlementUpdateRequest;
import com.angelica.pos.supplier.settlement.entity.SupplierSettlementStatus;
import com.angelica.pos.supplier.settlement.service.SupplierSettlementExportService;
import com.angelica.pos.supplier.settlement.service.SupplierSettlementService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/supplier-settlements")
@RequiredArgsConstructor
@Validated
public class SupplierSettlementController {

    private static final MediaType XLSX_MEDIA_TYPE = MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final SupplierSettlementService settlementService;
    private final SupplierSettlementExportService exportService;

    @PostMapping
    public ResponseEntity<SupplierSettlementResponse> create(
            @Valid @RequestBody SupplierSettlementCreateRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        SupplierSettlementResponse response = settlementService.create(request, authenticatedUser);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.getId())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SupplierSettlementResponse> update(
            @PathVariable @Positive Long id,
            @Valid @RequestBody SupplierSettlementUpdateRequest request
    ) {
        return ResponseEntity.ok(settlementService.update(id, request));
    }

    @PostMapping("/{id}/finalize")
    public ResponseEntity<SupplierSettlementResponse> finalize(
            @PathVariable @Positive Long id,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ResponseEntity.ok(settlementService.finalize(id, authenticatedUser));
    }

    @GetMapping
    public ResponseEntity<PageResponse<SupplierSettlementResponse>> findAll(
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) SupplierSettlementStatus status,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @PageableDefault(size = 10, sort = "periodEnd", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(settlementService.findAll(supplierId, status, from, to, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplierSettlementResponse> findById(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(settlementService.findById(id));
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> export(@PathVariable @Positive Long id) {
        SupplierSettlementExportService.ExportedSettlement export = exportService.export(id);
        return ResponseEntity.ok()
                .contentType(XLSX_MEDIA_TYPE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + export.filename() + "\"")
                .body(export.content());
    }
}
