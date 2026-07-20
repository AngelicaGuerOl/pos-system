package com.angelica.pos.supplier.entry.dto;

import com.angelica.pos.catalog.product.entity.ProductUnit;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class NewSupplierEntryProductRequest {

    @Schema(description = "Codigo de barras del producto nuevo", example = "7502222222222")
    @NotBlank(message = "El codigo de barras es obligatorio para producto nuevo")
    @Size(max = 50, message = "El codigo de barras no debe superar los 50 caracteres")
    private String barcode;

    @Schema(description = "Nombre del producto nuevo", example = "Producto nuevo")
    @NotBlank(message = "El nombre del producto es obligatorio para producto nuevo")
    @Size(max = 180, message = "El nombre no debe superar los 180 caracteres")
    private String name;

    @Schema(description = "ID de la categoria", example = "3")
    @NotNull(message = "La categoria es obligatoria para producto nuevo")
    private Long categoryId;

    @Schema(description = "Unidad de venta", example = "PIECE")
    @NotNull(message = "La unidad es obligatoria para producto nuevo")
    private ProductUnit unit;

    @Schema(description = "Stock minimo", example = "0")
    @DecimalMin(value = "0.00", message = "El stock minimo debe ser mayor o igual a 0")
    private BigDecimal minimumStock;
}
