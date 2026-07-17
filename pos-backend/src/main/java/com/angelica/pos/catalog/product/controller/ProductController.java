package com.angelica.pos.catalog.product.controller;

import com.angelica.pos.catalog.product.dto.ProductRequest;
import com.angelica.pos.catalog.product.dto.ProductResponse;
import com.angelica.pos.catalog.product.dto.ProductUpdateRequest;
import com.angelica.pos.catalog.product.service.ProductService;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Validated
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ProductResponse> create(
            @Valid @RequestBody ProductRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        ProductResponse response = productService.create(request, authenticatedUser);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.getId())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    public ResponseEntity<PageResponse<ProductResponse>> findAll(
            @RequestParam(required = false)
            @Size(max = 100, message = "Search must have at most 100 characters")
            String search,
            @RequestParam(required = false)
            @Positive(message = "Category id must be positive")
            Long categoryId,
            @RequestParam(required = false)
            @Positive(message = "Supplier id must be positive")
            Long supplierId,
            @RequestParam(required = false) Boolean lowStock,
            @PageableDefault(size = 10, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(productService.findAllActive(search, categoryId, supplierId, lowStock, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> findById(
            @PathVariable
            @Positive(message = "Product id must be positive")
            Long id
    ) {
        return ResponseEntity.ok(productService.findById(id));
    }

    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<ProductResponse> findByBarcode(
            @PathVariable
            @Size(max = 50, message = "Barcode must have at most 50 characters")
            String barcode
    ) {
        return ResponseEntity.ok(productService.findByBarcode(barcode));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> update(
            @PathVariable
            @Positive(message = "Product id must be positive")
            Long id,
            @Valid @RequestBody ProductUpdateRequest request
    ) {
        return ResponseEntity.ok(productService.update(id, request));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(
            @PathVariable
            @Positive(message = "Product id must be positive")
            Long id
    ) {
        productService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
