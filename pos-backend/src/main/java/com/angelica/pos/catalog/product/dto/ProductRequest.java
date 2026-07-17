package com.angelica.pos.catalog.product.dto;

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
public class ProductRequest {

    @Schema(description = "ID de la categoría", example = "1")
    @NotNull(message = "La categoria es obligatoria")
    private Long categoryId;

    @Schema(description = "ID del proveedor principal. Opcional.", example = "2", nullable = true)
    private Long supplierId;

    @Schema(description = "Código de barras o código interno único", example = "7501000000012")
    @NotBlank(message = "El codigo de barras es obligatorio")
    @Size(max = 50, message = "El codigo de barras no debe superar los 50 caracteres")
    private String barcode;

    @Schema(description = "Nombre visible del producto", example = "Papas 45g")
    @NotBlank(message = "El nombre del producto es obligatorio")
    @Size(max = 180, message = "El nombre no debe superar los 180 caracteres")
    private String name;

    @Schema(description = "Descripción opcional del producto", example = "Bolsa individual", nullable = true)
    @Size(max = 255, message = "La descripcion no debe superar los 255 caracteres")
    private String description;

    @Schema(description = "Unidad de venta", example = "PIECE")
    @NotNull(message = "La unidad del producto es obligatoria")
    private ProductUnit unit;

    @Schema(description = "Precio de costo", example = "12.50")
    @NotNull(message = "El precio de costo es obligatorio")
    @DecimalMin(value = "0.00", message = "El precio de costo debe ser mayor o igual a 0")
    private BigDecimal costPrice;

    @Schema(description = "Precio de venta", example = "18.00")
    @NotNull(message = "El precio de venta es obligatorio")
    @DecimalMin(value = "0.00", message = "El precio de venta debe ser mayor o igual a 0")
    private BigDecimal salePrice;

    @Schema(description = "Existencia actual inicial", example = "10")
    @NotNull(message = "El stock actual es obligatorio")
    @DecimalMin(value = "0.00", message = "El stock actual debe ser mayor o igual a 0")
    private BigDecimal currentStock;

    @Schema(description = "Nivel mínimo para alertar stock bajo", example = "3")
    @NotNull(message = "El stock minimo es obligatorio")
    @DecimalMin(value = "0.00", message = "El stock minimo debe ser mayor o igual a 0")
    private BigDecimal minimumStock;
}
