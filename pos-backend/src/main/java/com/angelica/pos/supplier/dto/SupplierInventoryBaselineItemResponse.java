package com.angelica.pos.supplier.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SupplierInventoryBaselineItemResponse {

    private Long id;
    private Long productId;
    private String productName;
    private BigDecimal quantity;
    private BigDecimal salePriceSnapshot;
    private BigDecimal inventoryValue;
}
