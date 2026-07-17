package com.angelica.pos.supplier.settlement.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SupplierSettlementItemUpdateRequest {

    @Schema(description = "ID del producto incluido en el corte", example = "10")
    @NotNull(message = "El producto es obligatorio")
    private Long productId;

    @Schema(description = "Inventario final contado físicamente", example = "9")
    @NotNull(message = "La cantidad final es obligatoria")
    @DecimalMin(value = "0.00", message = "La cantidad final debe ser mayor o igual a 0")
    private BigDecimal closingQuantity;

    @Schema(description = "Precio de venta usado para valorar el inventario final", example = "20.00")
    @NotNull(message = "El precio final es obligatorio")
    @DecimalMin(value = "0.00", message = "El precio final debe ser mayor o igual a 0")
    private BigDecimal closingSalePrice;
}
