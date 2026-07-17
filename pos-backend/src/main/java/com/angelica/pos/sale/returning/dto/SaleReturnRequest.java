package com.angelica.pos.sale.returning.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SaleReturnRequest {

    @Schema(description = "Motivo de la devolución", example = "Producto devuelto por cliente")
    @NotBlank(message = "Reason is required")
    @Size(min = 3, max = 255, message = "Reason must have between 3 and 255 characters")
    private String reason;

    @Schema(description = "Artículos a devolver")
    @Valid
    @NotEmpty(message = "At least one item is required")
    private List<SaleReturnItemRequest> items;
}
