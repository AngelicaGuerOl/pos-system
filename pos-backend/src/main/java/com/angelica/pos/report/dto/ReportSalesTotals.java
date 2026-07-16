package com.angelica.pos.report.dto;

import java.math.BigDecimal;

public record ReportSalesTotals(
        BigDecimal cashSalesAmount,
        BigDecimal creditSalesAmount,
        BigDecimal grossSalesAmount,
        BigDecimal cancelledSalesAmount,
        BigDecimal returnedAmount,
        long salesCount,
        long returnsCount,
        long cancellationsCount
) {
}
