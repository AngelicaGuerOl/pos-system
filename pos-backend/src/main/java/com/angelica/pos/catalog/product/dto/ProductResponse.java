package com.angelica.pos.catalog.product.dto;

import com.angelica.pos.catalog.product.entity.ProductUnit;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
public class ProductResponse {

    private Long id;
    private Long categoryId;
    private String categoryName;
    private String barcode;
    private String name;
    private String description;
    private ProductUnit unit;
    private BigDecimal costPrice;
    private BigDecimal salePrice;
    private BigDecimal currentStock;
    private BigDecimal minimumStock;
    private Boolean active;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
