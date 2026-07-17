package com.angelica.pos.supplier.entry.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SupplierEntryItemResponse {

    private Long id;
    private Long productId;
    private String productName;
    private BigDecimal quantity;
    private BigDecimal unitCost;
    private Boolean costKnown;
    private BigDecimal salePrice;
    private BigDecimal costSubtotal;
    private BigDecimal saleValueSubtotal;
}
