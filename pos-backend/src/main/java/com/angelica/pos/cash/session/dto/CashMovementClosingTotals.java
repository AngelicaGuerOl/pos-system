package com.angelica.pos.cash.session.dto;

import java.math.BigDecimal;

public record CashMovementClosingTotals(
        BigDecimal cashSalesAmount,
        BigDecimal receivablePaymentsAmount,
        BigDecimal manualInflowsAmount,
        BigDecimal totalInflows,
        BigDecimal manualOutflowsAmount,
        BigDecimal saleRefundsAmount,
        BigDecimal saleCancellationRefundsAmount,
        BigDecimal totalOutflows
) {

    public CashMovementClosingTotals(
            Number cashSalesAmount,
            Number receivablePaymentsAmount,
            Number manualInflowsAmount,
            Number totalInflows,
            Number manualOutflowsAmount,
            Number saleRefundsAmount,
            Number saleCancellationRefundsAmount,
            Number totalOutflows
    ) {
        this(
                toBigDecimal(cashSalesAmount),
                toBigDecimal(receivablePaymentsAmount),
                toBigDecimal(manualInflowsAmount),
                toBigDecimal(totalInflows),
                toBigDecimal(manualOutflowsAmount),
                toBigDecimal(saleRefundsAmount),
                toBigDecimal(saleCancellationRefundsAmount),
                toBigDecimal(totalOutflows)
        );
    }

    public CashMovementClosingTotals(
            Double cashSalesAmount,
            Double receivablePaymentsAmount,
            Double manualInflowsAmount,
            Double totalInflows,
            Double manualOutflowsAmount,
            Double saleRefundsAmount,
            Double saleCancellationRefundsAmount,
            Double totalOutflows
    ) {
        this(
                (Number) cashSalesAmount,
                receivablePaymentsAmount,
                manualInflowsAmount,
                totalInflows,
                manualOutflowsAmount,
                saleRefundsAmount,
                saleCancellationRefundsAmount,
                totalOutflows
        );
    }

    private static BigDecimal toBigDecimal(Number value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }
        return new BigDecimal(value.toString());
    }
}
