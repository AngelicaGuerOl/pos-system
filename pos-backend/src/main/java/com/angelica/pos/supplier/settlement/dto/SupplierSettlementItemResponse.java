package com.angelica.pos.supplier.settlement.dto;

import com.angelica.pos.catalog.product.entity.ProductUnit;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SupplierSettlementItemResponse {

    private Long id;
    private Long productId;
    private String productNameSnapshot;
    private String barcodeSnapshot;
    private ProductUnit unitSnapshot;
    private BigDecimal openingQuantity;
    private BigDecimal openingSalePrice;
    private BigDecimal openingValue;
    private BigDecimal receivedQuantity;
    private BigDecimal receivedSaleValue;
    private BigDecimal availableQuantity;
    private BigDecimal closingQuantity;
    private BigDecimal closingSalePrice;
    private BigDecimal closingValue;
    private BigDecimal quantityToJustify;
    private BigDecimal expectedAmount;
    private Boolean hasDiscrepancy;
}
