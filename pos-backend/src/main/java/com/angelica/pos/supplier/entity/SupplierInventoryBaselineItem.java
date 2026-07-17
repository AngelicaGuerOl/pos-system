package com.angelica.pos.supplier.entity;

import com.angelica.pos.catalog.product.entity.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "supplier_inventory_baseline_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierInventoryBaselineItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "baseline_id", nullable = false)
    private SupplierInventoryBaseline baseline;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @NotNull
    @DecimalMin("0.00")
    @Column(name = "quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @NotNull
    @DecimalMin("0.00")
    @Column(name = "sale_price_snapshot", nullable = false, precision = 10, scale = 2)
    private BigDecimal salePriceSnapshot;

    @NotNull
    @DecimalMin("0.00")
    @Column(name = "inventory_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal inventoryValue;

    @Column(name = "historical_import", nullable = false)
    private Boolean historicalImport;

    @Column(name = "source_file", length = 255)
    private String sourceFile;

    @Column(name = "source_sheet", length = 120)
    private String sourceSheet;

    @PrePersist
    public void prePersist() {
        if (historicalImport == null) {
            historicalImport = false;
        }
    }
}
