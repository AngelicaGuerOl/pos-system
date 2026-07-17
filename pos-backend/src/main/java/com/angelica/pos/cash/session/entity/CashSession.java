package com.angelica.pos.cash.session.entity;

import com.angelica.pos.user.entity.User;
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
import java.time.OffsetDateTime;

@Entity
@Table(name = "cash_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "opened_by_user_id", nullable = false)
    private User openedBy;

    @NotNull
    @DecimalMin(value = "0.00")
    @Column(name = "opening_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal openingAmount;

    @Column(name = "opened_at", nullable = false)
    private OffsetDateTime openedAt;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CashSessionStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "closed_by_user_id")
    private User closedBy;

    @Column(name = "closed_at")
    private OffsetDateTime closedAt;

    @Column(name = "expected_cash", precision = 10, scale = 2)
    private BigDecimal expectedCash;

    @DecimalMin(value = "0.00")
    @Column(name = "counted_cash", precision = 10, scale = 2)
    private BigDecimal countedCash;

    @Column(name = "cash_difference", precision = 10, scale = 2)
    private BigDecimal cashDifference;

    @DecimalMin(value = "0.00")
    @Column(name = "total_inflows", precision = 12, scale = 2)
    private BigDecimal totalInflows;

    @DecimalMin(value = "0.00")
    @Column(name = "total_outflows", precision = 12, scale = 2)
    private BigDecimal totalOutflows;

    @DecimalMin(value = "0.00")
    @Column(name = "cash_sales_amount", precision = 12, scale = 2)
    private BigDecimal cashSalesAmount;

    @DecimalMin(value = "0.00")
    @Column(name = "credit_sales_amount", precision = 12, scale = 2)
    private BigDecimal creditSalesAmount;

    @DecimalMin(value = "0.00")
    @Column(name = "receivable_payments_amount", precision = 12, scale = 2)
    private BigDecimal receivablePaymentsAmount;

    @DecimalMin(value = "0.00")
    @Column(name = "manual_inflows_amount", precision = 12, scale = 2)
    private BigDecimal manualInflowsAmount;

    @DecimalMin(value = "0.00")
    @Column(name = "manual_outflows_amount", precision = 12, scale = 2)
    private BigDecimal manualOutflowsAmount;

    @DecimalMin(value = "0.00")
    @Column(name = "sale_refunds_amount", precision = 12, scale = 2)
    private BigDecimal saleRefundsAmount;

    @DecimalMin(value = "0.00")
    @Column(name = "sale_cancellation_refunds_amount", precision = 12, scale = 2)
    private BigDecimal saleCancellationRefundsAmount;

    @DecimalMin(value = "0.00")
    @Column(name = "returns_processed_amount", precision = 12, scale = 2)
    private BigDecimal returnsProcessedAmount;

    @DecimalMin(value = "0.00")
    @Column(name = "cancellations_processed_amount", precision = 12, scale = 2)
    private BigDecimal cancellationsProcessedAmount;

    @Column(name = "closing_notes", length = 255)
    private String closingNotes;

    @PrePersist
    public void prePersist() {
        if (openedAt == null) {
            openedAt = OffsetDateTime.now();
        }
        if (status == null) {
            status = CashSessionStatus.OPEN;
        }
    }
}
