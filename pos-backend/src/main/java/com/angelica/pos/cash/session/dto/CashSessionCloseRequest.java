package com.angelica.pos.cash.session.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CashSessionCloseRequest {

    @Schema(description = "Efectivo contado al cierre", example = "1450.50")
    private BigDecimal countedAmount;

    @Schema(description = "Observaciones del cierre. Obligatorio cuando existe diferencia.", example = "Diferencia revisada con supervisor", nullable = true)
    private String notes;
}
