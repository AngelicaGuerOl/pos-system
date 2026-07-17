package com.angelica.pos.supplier.entry.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class SupplierEntryRequest {

    @Schema(description = "ID del proveedor activo", example = "1")
    @NotNull(message = "El proveedor es obligatorio")
    private Long supplierId;

    @Schema(description = "Fecha de recepción. Formato ISO yyyy-MM-dd.", example = "2026-07-02")
    @NotNull(message = "La fecha de entrada es obligatoria")
    private LocalDate entryDate;

    @Schema(description = "Notas opcionales", example = "Factura pendiente", nullable = true)
    @Size(max = 500, message = "Las notas no deben superar los 500 caracteres")
    private String notes;

    @Schema(description = "Productos recibidos. No enviar totales calculados.")
    @Valid
    @NotEmpty(message = "La entrada debe incluir productos")
    private List<SupplierEntryItemRequest> items;
}
