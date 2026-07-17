package com.angelica.pos.supplier.settlement.entity;

import com.angelica.pos.supplier.entity.Supplier;
import com.angelica.pos.user.entity.User;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "supplier_settlements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierSettlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @NotNull
    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @NotNull
    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SupplierSettlementStatus status;

    @NotNull
    @Column(name = "opening_inventory_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal openingInventoryValue;

    @NotNull
    @Column(name = "entries_sale_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal entriesSaleValue;

    @NotNull
    @Column(name = "available_inventory_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal availableInventoryValue;

    @NotNull
    @Column(name = "closing_inventory_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal closingInventoryValue;

    @NotNull
    @Column(name = "expected_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal expectedAmount;

    @Column(name = "delivered_amount", precision = 12, scale = 2)
    private BigDecimal deliveredAmount;

    @Column(name = "difference_amount", precision = 12, scale = 2)
    private BigDecimal differenceAmount;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "has_discrepancies", nullable = false)
    private Boolean hasDiscrepancies;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finalized_by_user_id")
    private User finalizedBy;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "finalized_at")
    private OffsetDateTime finalizedAt;

    @Builder.Default
    @Column(name = "historical_import", nullable = false)
    private Boolean historicalImport = false;

    @Column(name = "source_file", length = 255)
    private String sourceFile;

    @Column(name = "source_sheet", length = 120)
    private String sourceSheet;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Builder.Default
    @OneToMany(mappedBy = "settlement", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SupplierSettlementItem> items = new ArrayList<>();

    public void addItem(SupplierSettlementItem item) {
        items.add(item);
        item.setSettlement(this);
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (hasDiscrepancies == null) {
            hasDiscrepancies = false;
        }
        if (historicalImport == null) {
            historicalImport = false;
        }
    }
}
