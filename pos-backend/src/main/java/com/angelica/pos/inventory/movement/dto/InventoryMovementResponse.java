package com.angelica.pos.inventory.movement.dto;

import com.angelica.pos.catalog.product.entity.ProductUnit;
import com.angelica.pos.inventory.movement.entity.InventoryMovementDirection;
import com.angelica.pos.inventory.movement.entity.InventoryMovementType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
public class InventoryMovementResponse {

    private Long id;
    private Long productId;
    private String productBarcode;
    private String productName;
    private ProductUnit productUnit;
    private Long createdById;
    private String createdByUsername;
    private InventoryMovementDirection direction;
    private InventoryMovementType type;
    private BigDecimal quantity;
    private BigDecimal previousStock;
    private BigDecimal newStock;
    private String description;
    private String sourceType;
    private Long sourceId;
    private OffsetDateTime createdAt;
}
