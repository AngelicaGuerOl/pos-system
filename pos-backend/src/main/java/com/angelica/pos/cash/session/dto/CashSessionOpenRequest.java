package com.angelica.pos.cash.session.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CashSessionOpenRequest {

    @NotNull(message = "Opening amount is required")
    @DecimalMin(value = "0.00", message = "Opening amount must be zero or positive")
    private BigDecimal openingAmount;
}
