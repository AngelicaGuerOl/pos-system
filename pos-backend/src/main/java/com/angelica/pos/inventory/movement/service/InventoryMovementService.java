package com.angelica.pos.inventory.movement.service;

import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.inventory.movement.entity.InventoryMovement;
import com.angelica.pos.inventory.movement.dto.InventoryMovementResponse;
import com.angelica.pos.inventory.movement.dto.ManualInventoryMovementRequest;
import com.angelica.pos.inventory.movement.entity.InventoryMovementDirection;
import com.angelica.pos.inventory.movement.entity.InventoryMovementType;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.user.entity.User;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public interface InventoryMovementService {

    InventoryMovementResponse registerManualEntry(
            ManualInventoryMovementRequest request,
            AuthenticatedUser authenticatedUser
    );

    InventoryMovementResponse registerManualExit(
            ManualInventoryMovementRequest request,
            AuthenticatedUser authenticatedUser
    );

    InventoryMovementResponse registerInitialStock(
            Long productId,
            BigDecimal initialStock,
            AuthenticatedUser authenticatedUser
    );

    InventoryMovementResponse registerStockMovement(
            Long productId,
            BigDecimal quantity,
            String description,
            InventoryMovementDirection direction,
            InventoryMovementType type,
            String sourceType,
            Long sourceId,
            AuthenticatedUser authenticatedUser
    );

    InventoryMovement registerSaleMovement(
            Product lockedProduct,
            BigDecimal quantity,
            Long saleItemId,
            User user
    );

    InventoryMovement registerSaleReturnMovement(
            Product lockedProduct,
            BigDecimal quantity,
            Long saleReturnItemId,
            User user
    );

    InventoryMovement registerSaleCancellationMovement(
            Product lockedProduct,
            BigDecimal quantity,
            Long saleCancellationId,
            User user
    );

    InventoryMovementResponse findById(Long id);

    PageResponse<InventoryMovementResponse> findAll(
            String search,
            Long productId,
            InventoryMovementDirection direction,
            InventoryMovementType type,
            OffsetDateTime from,
            OffsetDateTime to,
            Pageable pageable
    );

    PageResponse<InventoryMovementResponse> findByProduct(Long productId, Pageable pageable);
}
