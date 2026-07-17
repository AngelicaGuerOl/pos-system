package com.angelica.pos.supplier.settlement.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class SupplierSettlementUpdateRequest {

    @Schema(description = "Conteos finales por producto del corte.")
    @Valid
    @NotEmpty(message = "El corte debe incluir conteos")
    private List<SupplierSettlementItemUpdateRequest> items;

    @Schema(description = "Importe entregado por el proveedor. Obligatorio al finalizar.", example = "400.00", nullable = true)
    @DecimalMin(value = "0.00", message = "El importe entregado debe ser mayor o igual a 0")
    private BigDecimal deliveredAmount;

    @Schema(description = "Observaciones. Requeridas al finalizar si hay diferencia o inconsistencias.", example = "Pendiente revisar diferencia", nullable = true)
    @Size(max = 500, message = "Las notas no deben superar los 500 caracteres")
    private String notes;
}
