package com.angelica.pos.supplier.settlement.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SupplierSettlementItemUpdateRequest {

    @NotNull(message = "El producto es obligatorio")
    private Long productId;

    @NotNull(message = "La cantidad final es obligatoria")
    @DecimalMin(value = "0.00", message = "La cantidad final debe ser mayor o igual a 0")
    private BigDecimal closingQuantity;

    @NotNull(message = "El precio final es obligatorio")
    @DecimalMin(value = "0.00", message = "El precio final debe ser mayor o igual a 0")
    private BigDecimal closingSalePrice;
}
