package com.angelica.pos.cash.session.dto;

import java.math.BigDecimal;

public record OperationsClosingTotals(
        BigDecimal processedAmount,
        BigDecimal cashRefundAmount
) {

    public OperationsClosingTotals(Number processedAmount, Number cashRefundAmount) {
        this(toBigDecimal(processedAmount), toBigDecimal(cashRefundAmount));
    }

    public OperationsClosingTotals(Double processedAmount, Double cashRefundAmount) {
        this((Number) processedAmount, cashRefundAmount);
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
