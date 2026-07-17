package com.angelica.pos.supplier.settlement.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class SupplierSettlementCreateRequest {

    @Schema(description = "ID del proveedor", example = "1")
    @NotNull(message = "El proveedor es obligatorio")
    private Long supplierId;

    @Schema(description = "Fecha final del corte. La fecha inicial se determina en backend.", example = "2026-07-04")
    @NotNull(message = "La fecha final del corte es obligatoria")
    private LocalDate periodEnd;
}
