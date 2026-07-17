package com.angelica.pos.supplier.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class SupplierInventoryBaselineRequest {

    @NotNull(message = "La fecha del inventario inicial es obligatoria")
    private LocalDate baselineDate;

    @Valid
    @NotEmpty(message = "El inventario inicial debe incluir productos")
    private List<SupplierInventoryBaselineItemRequest> items;
}
