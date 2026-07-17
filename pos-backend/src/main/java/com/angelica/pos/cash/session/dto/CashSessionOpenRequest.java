package com.angelica.pos.cash.session.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CashSessionOpenRequest {

    @Schema(description = "Fondo inicial de la caja", example = "500.00")
    @NotNull(message = "Opening amount is required")
    @DecimalMin(value = "0.00", message = "Opening amount must be zero or positive")
    private BigDecimal openingAmount;
}
