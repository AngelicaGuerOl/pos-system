package com.angelica.pos.sale.dto;

import com.angelica.pos.sale.entity.SaleType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class SaleRequest {

    @NotNull(message = "El tipo de venta es obligatorio")
    private SaleType saleType;

    @Positive(message = "El cliente debe ser positivo")
    private Long customerId;

    @DecimalMin(value = "0.01", message = "El efectivo recibido debe ser mayor que cero")
    @Digits(integer = 10, fraction = 2, message = "El efectivo recibido debe tener hasta 10 enteros y 2 decimales")
    private BigDecimal cashReceived;

    @NotEmpty(message = "La venta debe incluir al menos un articulo")
    @Size(max = 100, message = "La venta no debe superar 100 lineas")
    private List<@Valid @NotNull(message = "El articulo es obligatorio") SaleItemRequest> items;
}
