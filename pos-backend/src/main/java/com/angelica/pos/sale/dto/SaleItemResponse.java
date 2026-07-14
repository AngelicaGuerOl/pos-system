package com.angelica.pos.sale.dto;

import com.angelica.pos.catalog.product.entity.ProductUnit;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SaleItemResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String productBarcode;
    private ProductUnit productUnit;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
}
