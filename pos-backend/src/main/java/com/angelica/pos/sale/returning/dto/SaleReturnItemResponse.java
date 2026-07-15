package com.angelica.pos.sale.returning.dto;

import com.angelica.pos.catalog.product.entity.ProductUnit;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SaleReturnItemResponse {

    private Long saleItemId;
    private Long productId;
    private String productName;
    private String productBarcode;
    private ProductUnit unit;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
}
