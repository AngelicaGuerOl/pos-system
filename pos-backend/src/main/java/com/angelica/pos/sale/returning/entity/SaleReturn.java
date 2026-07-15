package com.angelica.pos.sale.returning.entity;

import com.angelica.pos.cash.session.entity.CashSession;
import com.angelica.pos.sale.entity.Sale;
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
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sale_returns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleReturn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cash_session_id")
    private CashSession cashSession;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "processed_by_user_id", nullable = false)
    private User processedBy;

    @NotNull
    @DecimalMin(value = "0.01")
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @NotNull
    @DecimalMin(value = "0.00")
    @Column(name = "cash_refund_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal cashRefundAmount;

    @NotBlank
    @Size(max = 255)
    @Column(name = "reason", nullable = false, length = 255)
    private String reason;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "saleReturn", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SaleReturnItem> items = new ArrayList<>();

    public void addItem(SaleReturnItem item) {
        items.add(item);
        item.setSaleReturn(this);
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (cashRefundAmount == null) {
            cashRefundAmount = BigDecimal.ZERO;
        }
    }
}
