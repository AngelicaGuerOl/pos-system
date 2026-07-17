package com.angelica.pos.supplier.controller;

import com.angelica.pos.catalog.product.dto.ProductResponse;
import com.angelica.pos.shared.config.OpenApiTags;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.supplier.dto.SupplierInventoryBaselineRequest;
import com.angelica.pos.supplier.dto.SupplierInventoryBaselineResponse;
import com.angelica.pos.supplier.dto.SupplierRequest;
import com.angelica.pos.supplier.dto.SupplierResponse;
import com.angelica.pos.supplier.service.SupplierInventoryBaselineService;
import com.angelica.pos.supplier.service.SupplierService;
import com.angelica.pos.supplier.entry.dto.SupplierEntryResponse;
import com.angelica.pos.supplier.entry.service.SupplierEntryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
@Validated
@Tag(name = OpenApiTags.SUPPLIERS)
public class SupplierController {

    private final SupplierService supplierService;
    private final SupplierInventoryBaselineService baselineService;
    private final SupplierEntryService entryService;

    @PostMapping
    public ResponseEntity<SupplierResponse> create(@Valid @RequestBody SupplierRequest request) {
        SupplierResponse response = supplierService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.getId())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    public ResponseEntity<PageResponse<SupplierResponse>> findAll(
            @RequestParam(required = false) @Size(max = 100) String search,
            @RequestParam(required = false) Boolean active,
            @ParameterObject @PageableDefault(size = 10, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(supplierService.findAll(search, active, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplierResponse> findById(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(supplierService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SupplierResponse> update(
            @PathVariable @Positive Long id,
            @Valid @RequestBody SupplierRequest request
    ) {
        return ResponseEntity.ok(supplierService.update(id, request));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable @Positive Long id) {
        supplierService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{supplierId}/products")
    public ResponseEntity<PageResponse<ProductResponse>> findProducts(
            @PathVariable @Positive Long supplierId,
            @RequestParam(required = false) @Size(max = 100) String search,
            @ParameterObject @PageableDefault(size = 10, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(supplierService.findProducts(supplierId, search, pageable));
    }

    @PostMapping("/{supplierId}/inventory-baseline")
    public ResponseEntity<SupplierInventoryBaselineResponse> createInventoryBaseline(
            @PathVariable @Positive Long supplierId,
            @Valid @RequestBody SupplierInventoryBaselineRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ResponseEntity.ok(baselineService.create(supplierId, request, authenticatedUser));
    }

    @GetMapping("/{supplierId}/inventory-baseline")
    public ResponseEntity<SupplierInventoryBaselineResponse> findInventoryBaseline(
            @PathVariable @Positive Long supplierId
    ) {
        return ResponseEntity.ok(baselineService.findBySupplier(supplierId));
    }

    @GetMapping("/{supplierId}/entries")
    public ResponseEntity<PageResponse<SupplierEntryResponse>> findEntries(
            @PathVariable @Positive Long supplierId,
            @RequestParam(required = false) java.time.LocalDate from,
            @RequestParam(required = false) java.time.LocalDate to,
            @RequestParam(required = false) Long productId,
            @ParameterObject @PageableDefault(size = 10, sort = "entryDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(entryService.findAll(supplierId, from, to, productId, pageable));
    }
}
