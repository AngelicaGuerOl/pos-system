package com.angelica.pos.supplier.settlement.dto;

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

    @Valid
    @NotEmpty(message = "El corte debe incluir conteos")
    private List<SupplierSettlementItemUpdateRequest> items;

    @DecimalMin(value = "0.00", message = "El importe entregado debe ser mayor o igual a 0")
    private BigDecimal deliveredAmount;

    @Size(max = 500, message = "Las notas no deben superar los 500 caracteres")
    private String notes;
}
