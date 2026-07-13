package com.angelica.pos.catalog.product.dto;

import com.angelica.pos.catalog.product.entity.ProductUnit;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ProductUpdateRequest {

    @NotNull(message = "La categoria es obligatoria")
    private Long categoryId;

    @NotBlank(message = "El codigo de barras es obligatorio")
    @Size(max = 50, message = "El codigo de barras no debe superar los 50 caracteres")
    private String barcode;

    @NotBlank(message = "El nombre del producto es obligatorio")
    @Size(max = 180, message = "El nombre no debe superar los 180 caracteres")
    private String name;

    @Size(max = 255, message = "La descripcion no debe superar los 255 caracteres")
    private String description;

    @NotNull(message = "La unidad del producto es obligatoria")
    private ProductUnit unit;

    @NotNull(message = "El precio de costo es obligatorio")
    @DecimalMin(value = "0.00", message = "El precio de costo debe ser mayor o igual a 0")
    private BigDecimal costPrice;

    @NotNull(message = "El precio de venta es obligatorio")
    @DecimalMin(value = "0.00", message = "El precio de venta debe ser mayor o igual a 0")
    private BigDecimal salePrice;

    @NotNull(message = "El stock minimo es obligatorio")
    @DecimalMin(value = "0.00", message = "El stock minimo debe ser mayor o igual a 0")
    private BigDecimal minimumStock;
}
