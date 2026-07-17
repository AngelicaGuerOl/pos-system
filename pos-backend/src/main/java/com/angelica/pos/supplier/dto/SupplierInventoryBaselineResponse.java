package com.angelica.pos.supplier.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
public class SupplierInventoryBaselineResponse {

    private Long id;
    private Long supplierId;
    private String supplierName;
    private LocalDate baselineDate;
    private BigDecimal totalSaleValue;
    private Long createdByUserId;
    private String createdByUsername;
    private OffsetDateTime createdAt;
    private List<SupplierInventoryBaselineItemResponse> items;
}
