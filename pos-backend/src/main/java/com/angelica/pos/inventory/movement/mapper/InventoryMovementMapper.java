package com.angelica.pos.inventory.movement.mapper;

import com.angelica.pos.inventory.movement.dto.InventoryMovementResponse;
import com.angelica.pos.inventory.movement.dto.ManualInventoryMovementRequest;
import com.angelica.pos.inventory.movement.entity.InventoryMovement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface InventoryMovementMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "direction", ignore = true)
    @Mapping(target = "type", ignore = true)
    @Mapping(target = "previousStock", ignore = true)
    @Mapping(target = "newStock", ignore = true)
    @Mapping(target = "sourceType", ignore = true)
    @Mapping(target = "sourceId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    InventoryMovement toEntity(ManualInventoryMovementRequest request);

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productBarcode", source = "product.barcode")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "productUnit", source = "product.unit")
    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByUsername", source = "createdBy.username")
    InventoryMovementResponse toResponse(InventoryMovement inventoryMovement);

    List<InventoryMovementResponse> toResponseList(List<InventoryMovement> inventoryMovements);
}
