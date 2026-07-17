package com.angelica.pos.receivable.payment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ReceivablePaymentRequest {

    @Schema(description = "Monto del abono", example = "150.00")
    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor que cero")
    @Digits(integer = 10, fraction = 2, message = "El monto debe tener hasta 10 enteros y 2 decimales")
    private BigDecimal amount;

    @Schema(description = "Notas opcionales del abono", example = "Pago parcial", nullable = true)
    @Size(max = 255, message = "Las notas deben tener maximo 255 caracteres")
    private String notes;
}
