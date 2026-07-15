package com.angelica.pos.sale.returning.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SaleReturnItemRequest {

    @NotNull(message = "Sale item id is required")
    @Positive(message = "Sale item id must be positive")
    private Long saleItemId;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.01", message = "Quantity must be greater than zero")
    private BigDecimal quantity;
}
