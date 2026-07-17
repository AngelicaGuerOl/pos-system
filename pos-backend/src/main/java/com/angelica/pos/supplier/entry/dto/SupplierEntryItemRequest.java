package com.angelica.pos.supplier.entry.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SupplierEntryItemRequest {

    @Schema(description = "ID del producto asociado al proveedor", example = "10")
    @NotNull(message = "El producto es obligatorio")
    private Long productId;

    @Schema(description = "Cantidad recibida", example = "2")
    @NotNull(message = "La cantidad es obligatoria")
    @DecimalMin(value = "0.01", message = "La cantidad debe ser mayor que 0")
    private BigDecimal quantity;

    @Schema(description = "Costo unitario capturado", example = "15.56")
    @NotNull(message = "El costo unitario es obligatorio")
    @DecimalMin(value = "0.00", message = "El costo unitario debe ser mayor o igual a 0")
    private BigDecimal unitCost;

    @Schema(description = "Precio histórico de venta capturado", example = "20.00")
    @NotNull(message = "El precio de venta es obligatorio")
    @DecimalMin(value = "0.01", message = "El precio de venta debe ser mayor que 0")
    private BigDecimal salePrice;
}
