package com.angelica.pos.supplier.entry.dto;

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

    @NotNull(message = "El proveedor es obligatorio")
    private Long supplierId;

    @NotNull(message = "La fecha de entrada es obligatoria")
    private LocalDate entryDate;

    @Size(max = 500, message = "Las notas no deben superar los 500 caracteres")
    private String notes;

    @Valid
    @NotEmpty(message = "La entrada debe incluir productos")
    private List<SupplierEntryItemRequest> items;
}
