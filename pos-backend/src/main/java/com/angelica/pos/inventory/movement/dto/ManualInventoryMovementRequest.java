package com.angelica.pos.inventory.movement.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ManualInventoryMovementRequest {

    @NotNull(message = "Product id is required")
    @Positive(message = "Product id must be positive")
    private Long productId;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.01", message = "Quantity must be greater than zero")
    @Digits(integer = 8, fraction = 2, message = "Quantity must have up to 8 integer digits and 2 decimals")
    private BigDecimal quantity;

    @NotBlank(message = "Description is required")
    @Size(max = 255, message = "Description must have at most 255 characters")
    private String description;
}
