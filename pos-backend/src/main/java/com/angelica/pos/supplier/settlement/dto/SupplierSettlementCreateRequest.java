package com.angelica.pos.supplier.settlement.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class SupplierSettlementCreateRequest {

    @NotNull(message = "El proveedor es obligatorio")
    private Long supplierId;

    @NotNull(message = "La fecha final del corte es obligatoria")
    private LocalDate periodEnd;
}
