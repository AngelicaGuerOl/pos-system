package com.angelica.pos.supplier.settlement.dto;

import com.angelica.pos.supplier.settlement.entity.SupplierSettlementStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
public class SupplierSettlementResponse {

    private Long id;
    private Long supplierId;
    private String supplierName;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private SupplierSettlementStatus status;
    private BigDecimal openingInventoryValue;
    private BigDecimal entriesSaleValue;
    private BigDecimal availableInventoryValue;
    private BigDecimal closingInventoryValue;
    private BigDecimal expectedAmount;
    private BigDecimal deliveredAmount;
    private BigDecimal differenceAmount;
    private String notes;
    private Boolean hasDiscrepancies;
    private Long createdByUserId;
    private String createdByUsername;
    private Long finalizedByUserId;
    private String finalizedByUsername;
    private OffsetDateTime createdAt;
    private OffsetDateTime finalizedAt;
    private Boolean historicalImport;
    private String sourceFile;
    private String sourceSheet;
    private List<SupplierSettlementItemResponse> items;
}
