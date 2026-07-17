package com.angelica.pos.supplier.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SupplierInventoryBaselineItemRequest {

    @Schema(description = "ID del producto del proveedor", example = "10")
    @NotNull(message = "El producto es obligatorio")
    private Long productId;

    @Schema(description = "Cantidad inicial contada", example = "3")
    @NotNull(message = "La cantidad es obligatoria")
    @DecimalMin(value = "0.00", message = "La cantidad debe ser mayor o igual a 0")
    private BigDecimal quantity;

    @Schema(description = "Precio histórico de venta usado para valorar el inventario", example = "20.00")
    @NotNull(message = "El precio de venta es obligatorio")
    @DecimalMin(value = "0.00", message = "El precio de venta debe ser mayor o igual a 0")
    private BigDecimal salePrice;
}
