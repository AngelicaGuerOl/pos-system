package com.angelica.pos.supplier.entry.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
public class SupplierEntryResponse {

    private Long id;
    private Long supplierId;
    private String supplierName;
    private LocalDate entryDate;
    private Long registeredByUserId;
    private String registeredByUsername;
    private BigDecimal totalCost;
    private BigDecimal totalSaleValue;
    private String notes;
    private OffsetDateTime createdAt;
    private Boolean historicalImport;
    private String sourceFile;
    private String sourceSheet;
    private List<SupplierEntryItemResponse> items;
}
