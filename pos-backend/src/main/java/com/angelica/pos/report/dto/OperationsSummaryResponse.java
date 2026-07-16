package com.angelica.pos.report.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDate;

@Value
@Builder
public class OperationsSummaryResponse {

    Period period;
    Sales sales;
    Receivables receivables;
    Cash cash;

    @Value
    @Builder
    public static class Period {
        LocalDate from;
        LocalDate to;
        Long cashierId;
        String cashierUsername;
    }

    @Value
    @Builder
    public static class Sales {
        BigDecimal cashSalesAmount;
        BigDecimal creditSalesAmount;
        BigDecimal grossSalesAmount;
        BigDecimal cancelledSalesAmount;
        BigDecimal returnedAmount;
        BigDecimal netSalesAmount;
        long salesCount;
        long returnsCount;
        long cancellationsCount;
    }

    @Value
    @Builder
    public static class Receivables {
        BigDecimal creditGeneratedAmount;
        BigDecimal receivablePaymentsAmount;
        BigDecimal outstandingGeneratedAmount;
    }

    @Value
    @Builder
    public static class Cash {
        BigDecimal cashSalesAmount;
        BigDecimal receivablePaymentsAmount;
        BigDecimal manualInflowsAmount;
        BigDecimal manualOutflowsAmount;
        BigDecimal returnRefundsAmount;
        BigDecimal cancellationRefundsAmount;
        BigDecimal totalInflows;
        BigDecimal totalOutflows;
        BigDecimal netCashFlow;
    }
}
