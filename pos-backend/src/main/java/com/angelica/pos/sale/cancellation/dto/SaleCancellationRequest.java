package com.angelica.pos.sale.cancellation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SaleCancellationRequest {

    @Schema(description = "Motivo de la cancelación", example = "Venta capturada por error")
    @NotBlank(message = "Reason is required")
    private String reason;
}
