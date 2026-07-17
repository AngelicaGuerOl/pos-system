package com.angelica.pos.supplier.entry.entity;

import com.angelica.pos.supplier.entity.Supplier;
import com.angelica.pos.user.entity.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
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
@Table(name = "supplier_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @NotNull
    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "registered_by_user_id", nullable = false)
    private User registeredBy;

    @NotNull
    @Column(name = "total_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalCost;

    @NotNull
    @Column(name = "total_sale_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalSaleValue;

    @Size(max = 500)
    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Builder.Default
    @Column(name = "historical_import", nullable = false)
    private Boolean historicalImport = false;

    @Column(name = "source_file", length = 255)
    private String sourceFile;

    @Column(name = "source_sheet", length = 120)
    private String sourceSheet;

    @Builder.Default
    @OneToMany(mappedBy = "supplierEntry", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SupplierEntryItem> items = new ArrayList<>();

    public void addItem(SupplierEntryItem item) {
        items.add(item);
        item.setSupplierEntry(this);
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (historicalImport == null) {
            historicalImport = false;
        }
    }
}
