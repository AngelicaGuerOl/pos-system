package com.angelica.pos.cash.session.dto;

import java.math.BigDecimal;

public record SalesClosingTotals(
        BigDecimal cashSalesAmount,
        BigDecimal creditSalesAmount,
        BigDecimal totalSalesAmount
) {

    public SalesClosingTotals(
            Number cashSalesAmount,
            Number creditSalesAmount,
            Number totalSalesAmount
    ) {
        this(
                toBigDecimal(cashSalesAmount),
                toBigDecimal(creditSalesAmount),
                toBigDecimal(totalSalesAmount)
        );
    }

    public SalesClosingTotals(
            Double cashSalesAmount,
            Double creditSalesAmount,
            Double totalSalesAmount
    ) {
        this((Number) cashSalesAmount, creditSalesAmount, totalSalesAmount);
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
