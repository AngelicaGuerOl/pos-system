package com.angelica.pos.sale.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SaleItemRequest {

    @NotNull(message = "El producto es obligatorio")
    @Positive(message = "El producto debe ser positivo")
    private Long productId;

    @NotNull(message = "La cantidad es obligatoria")
    @DecimalMin(value = "0.01", message = "La cantidad debe ser mayor que cero")
    @Digits(integer = 8, fraction = 2, message = "La cantidad debe tener hasta 8 enteros y 2 decimales")
    private BigDecimal quantity;
}
