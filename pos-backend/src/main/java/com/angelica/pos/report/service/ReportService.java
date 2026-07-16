package com.angelica.pos.report.service;

import com.angelica.pos.report.dto.OperationsSummaryResponse;

import java.time.LocalDate;

public interface ReportService {

    OperationsSummaryResponse getOperationsSummary(LocalDate from, LocalDate to, Long cashierId);
}
