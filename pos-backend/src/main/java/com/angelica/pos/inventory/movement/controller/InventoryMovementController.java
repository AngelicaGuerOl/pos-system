package com.angelica.pos.inventory.movement.controller;

import com.angelica.pos.inventory.movement.dto.InventoryMovementResponse;
import com.angelica.pos.inventory.movement.dto.ManualInventoryMovementRequest;
import com.angelica.pos.inventory.movement.entity.InventoryMovementDirection;
import com.angelica.pos.inventory.movement.entity.InventoryMovementType;
import com.angelica.pos.inventory.movement.service.InventoryMovementService;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api")
@RequiredArgsConstructor
@Validated
public class InventoryMovementController {

    private final InventoryMovementService inventoryMovementService;

    @PostMapping("/inventory-movements/entries")
    public ResponseEntity<InventoryMovementResponse> registerEntry(
            @Valid @RequestBody ManualInventoryMovementRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        InventoryMovementResponse response = inventoryMovementService.registerManualEntry(request, authenticatedUser);
        URI location = buildLocation(response.getId());

        return ResponseEntity.created(location).body(response);
    }

    @PostMapping("/inventory-movements/exits")
    public ResponseEntity<InventoryMovementResponse> registerExit(
            @Valid @RequestBody ManualInventoryMovementRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        InventoryMovementResponse response = inventoryMovementService.registerManualExit(request, authenticatedUser);
        URI location = buildLocation(response.getId());

        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/inventory-movements/{id}")
    public ResponseEntity<InventoryMovementResponse> findById(
            @PathVariable
            @Positive(message = "Inventory movement id must be positive")
            Long id
    ) {
        return ResponseEntity.ok(inventoryMovementService.findById(id));
    }

    @GetMapping("/inventory-movements")
    public ResponseEntity<PageResponse<InventoryMovementResponse>> findAll(
            @RequestParam(required = false)
            @Size(max = 100, message = "Search must have at most 100 characters")
            String search,
            @RequestParam(required = false)
            @Positive(message = "Product id must be positive")
            Long productId,
            @RequestParam(required = false) InventoryMovementDirection direction,
            @RequestParam(required = false) InventoryMovementType type,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime to,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(inventoryMovementService.findAll(
                search,
                productId,
                direction,
                type,
                from,
                to,
                pageable
        ));
    }

    @GetMapping("/products/{productId}/inventory-movements")
    public ResponseEntity<PageResponse<InventoryMovementResponse>> findByProduct(
            @PathVariable
            @Positive(message = "Product id must be positive")
            Long productId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(inventoryMovementService.findByProduct(productId, pageable));
    }

    private URI buildLocation(Long movementId) {
        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/inventory-movements/{id}")
                .buildAndExpand(movementId)
                .toUri();
    }
}
