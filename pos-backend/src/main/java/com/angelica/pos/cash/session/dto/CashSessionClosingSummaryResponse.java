package com.angelica.pos.cash.session.dto;

import com.angelica.pos.cash.session.entity.CashSessionStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Builder
public class CashSessionClosingSummaryResponse {

    private Long sessionId;
    private CashSessionStatus status;
    private OffsetDateTime openedAt;
    private OffsetDateTime closedAt;
    private String openedByUsername;
    private String closedByUsername;
    private BigDecimal openingAmount;
    private SalesSummary salesSummary;
    private OperationsSummary operationsSummary;
    private CashSummary cashSummary;
    private BigDecimal countedAmount;
    private BigDecimal differenceAmount;
    private String notes;

    @Getter
    @Builder
    public static class SalesSummary {
        private BigDecimal cashSalesAmount;
        private BigDecimal creditSalesAmount;
        private BigDecimal totalSalesAmount;
    }

    @Getter
    @Builder
    public static class OperationsSummary {
        private BigDecimal returnsProcessedAmount;
        private BigDecimal returnCashRefundAmount;
        private BigDecimal cancellationsProcessedAmount;
        private BigDecimal cancellationCashRefundAmount;
    }

    @Getter
    @Builder
    public static class CashSummary {
        private BigDecimal cashSalesAmount;
        private BigDecimal receivablePaymentsAmount;
        private BigDecimal manualInflowsAmount;
        private BigDecimal totalInflows;
        private BigDecimal manualOutflowsAmount;
        private BigDecimal saleRefundsAmount;
        private BigDecimal saleCancellationRefundsAmount;
        private BigDecimal totalOutflows;
        private BigDecimal expectedAmount;
    }
}
