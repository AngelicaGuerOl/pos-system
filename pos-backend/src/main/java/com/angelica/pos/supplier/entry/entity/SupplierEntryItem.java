package com.angelica.pos.supplier.entry.entity;

import com.angelica.pos.catalog.product.entity.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@Table(name = "supplier_entry_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierEntryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supplier_entry_id", nullable = false)
    private SupplierEntry supplierEntry;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @NotNull
    @DecimalMin("0.01")
    @Column(name = "quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @NotNull
    @DecimalMin("0.00")
    @Column(name = "unit_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitCost;

    @Builder.Default
    @Column(name = "cost_known", nullable = false)
    private Boolean costKnown = true;

    @NotNull
    @DecimalMin("0.01")
    @Column(name = "sale_price", nullable = false, precision = 12, scale = 4)
    private BigDecimal salePrice;

    @NotNull
    @Column(name = "cost_subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal costSubtotal;

    @NotNull
    @Column(name = "sale_value_subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal saleValueSubtotal;
}
