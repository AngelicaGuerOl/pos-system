package com.angelica.pos.report.dto;

import java.math.BigDecimal;

public record ReportCashTotals(
        BigDecimal cashSalesAmount,
        BigDecimal receivablePaymentsAmount,
        BigDecimal manualInflowsAmount,
        BigDecimal manualOutflowsAmount,
        BigDecimal returnRefundsAmount,
        BigDecimal cancellationRefundsAmount,
        BigDecimal totalInflows,
        BigDecimal totalOutflows
) {
}
