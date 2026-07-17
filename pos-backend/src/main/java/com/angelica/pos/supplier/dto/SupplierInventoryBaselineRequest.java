package com.angelica.pos.supplier.dto;

import io.swagger.v3.oas.annotations.media.Schema;
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

    @Schema(description = "Fecha del inventario inicial. Formato ISO yyyy-MM-dd.", example = "2026-06-13")
    @NotNull(message = "La fecha del inventario inicial es obligatoria")
    private LocalDate baselineDate;

    @Schema(description = "Productos del inventario inicial. Los importes se calculan en backend.")
    @Valid
    @NotEmpty(message = "El inventario inicial debe incluir productos")
    private List<SupplierInventoryBaselineItemRequest> items;
}
