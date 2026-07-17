package com.angelica.pos.supplier.settlement.entity;

import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.catalog.product.entity.ProductUnit;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "supplier_settlement_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierSettlementItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "settlement_id", nullable = false)
    private SupplierSettlement settlement;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @NotNull
    @Column(name = "product_name_snapshot", nullable = false, length = 180)
    private String productNameSnapshot;

    @Column(name = "barcode_snapshot", length = 50)
    private String barcodeSnapshot;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "unit_snapshot", nullable = false, length = 30)
    private ProductUnit unitSnapshot;

    @NotNull
    @Column(name = "opening_quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal openingQuantity;

    @NotNull
    @Column(name = "opening_sale_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal openingSalePrice;

    @NotNull
    @Column(name = "opening_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal openingValue;

    @NotNull
    @Column(name = "received_quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal receivedQuantity;

    @NotNull
    @Column(name = "received_sale_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal receivedSaleValue;

    @NotNull
    @Column(name = "available_quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal availableQuantity;

    @Column(name = "closing_quantity", precision = 10, scale = 2)
    private BigDecimal closingQuantity;

    @NotNull
    @Column(name = "closing_sale_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal closingSalePrice;

    @NotNull
    @Column(name = "closing_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal closingValue;

    @NotNull
    @Column(name = "quantity_to_justify", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantityToJustify;

    @NotNull
    @Column(name = "expected_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal expectedAmount;

    @Column(name = "has_discrepancy", nullable = false)
    private Boolean hasDiscrepancy;
}
