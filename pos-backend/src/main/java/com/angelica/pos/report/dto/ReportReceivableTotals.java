package com.angelica.pos.report.dto;

import java.math.BigDecimal;

public record ReportReceivableTotals(
        BigDecimal creditGeneratedAmount,
        BigDecimal receivablePaymentsAmount,
        BigDecimal outstandingGeneratedAmount
) {
}
