package com.angelica.pos.report.service;

import com.angelica.pos.report.dto.OperationsSummaryResponse;
import com.angelica.pos.report.dto.ReportCashTotals;
import com.angelica.pos.report.dto.ReportReceivableTotals;
import com.angelica.pos.report.dto.ReportSalesTotals;
import com.angelica.pos.report.repository.OperationsReportRepository;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.exception.UserNotFoundException;
import com.angelica.pos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private static final long MAX_PERIOD_DAYS = 366;

    private final OperationsReportRepository operationsReportRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public OperationsSummaryResponse getOperationsSummary(LocalDate from, LocalDate to, Long cashierId) {
        validatePeriod(from, to);

        User cashier = null;
        if (cashierId != null) {
            cashier = userRepository.findByIdAndActiveTrue(cashierId)
                    .orElseThrow(() -> new UserNotFoundException(cashierId));
        }

        ZoneId zoneId = ZoneId.systemDefault();
        OffsetDateTime fromInclusive = from.atStartOfDay(zoneId).toOffsetDateTime();
        OffsetDateTime toExclusive = to.plusDays(1).atStartOfDay(zoneId).toOffsetDateTime();

        ReportSalesTotals salesTotals = operationsReportRepository.getSalesTotals(
                fromInclusive,
                toExclusive,
                cashierId
        );
        ReportReceivableTotals receivableTotals = operationsReportRepository.getReceivableTotals(
                fromInclusive,
                toExclusive,
                cashierId
        );
        ReportCashTotals cashTotals = operationsReportRepository.getCashTotals(
                fromInclusive,
                toExclusive,
                cashierId
        );

        return OperationsSummaryResponse.builder()
                .period(OperationsSummaryResponse.Period.builder()
                        .from(from)
                        .to(to)
                        .cashierId(cashier == null ? null : cashier.getId())
                        .cashierUsername(cashier == null ? null : cashier.getUsername())
                        .build())
                .sales(OperationsSummaryResponse.Sales.builder()
                        .cashSalesAmount(salesTotals.cashSalesAmount())
                        .creditSalesAmount(salesTotals.creditSalesAmount())
                        .grossSalesAmount(salesTotals.grossSalesAmount())
                        .cancelledSalesAmount(salesTotals.cancelledSalesAmount())
                        .returnedAmount(salesTotals.returnedAmount())
                        .netSalesAmount(salesTotals.grossSalesAmount().subtract(salesTotals.returnedAmount()))
                        .salesCount(salesTotals.salesCount())
                        .returnsCount(salesTotals.returnsCount())
                        .cancellationsCount(salesTotals.cancellationsCount())
                        .build())
                .receivables(OperationsSummaryResponse.Receivables.builder()
                        .creditGeneratedAmount(receivableTotals.creditGeneratedAmount())
                        .receivablePaymentsAmount(receivableTotals.receivablePaymentsAmount())
                        .outstandingGeneratedAmount(receivableTotals.outstandingGeneratedAmount())
                        .build())
                .cash(OperationsSummaryResponse.Cash.builder()
                        .cashSalesAmount(cashTotals.cashSalesAmount())
                        .receivablePaymentsAmount(cashTotals.receivablePaymentsAmount())
                        .manualInflowsAmount(cashTotals.manualInflowsAmount())
                        .manualOutflowsAmount(cashTotals.manualOutflowsAmount())
                        .returnRefundsAmount(cashTotals.returnRefundsAmount())
                        .cancellationRefundsAmount(cashTotals.cancellationRefundsAmount())
                        .totalInflows(cashTotals.totalInflows())
                        .totalOutflows(cashTotals.totalOutflows())
                        .netCashFlow(cashTotals.totalInflows().subtract(cashTotals.totalOutflows()))
                        .build())
                .build();
    }

    private void validatePeriod(LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            throw new IllegalArgumentException("Fecha inicial y fecha final son obligatorias");
        }

        if (from.isAfter(to)) {
            throw new IllegalArgumentException("La fecha inicial no puede ser posterior a la fecha final");
        }

        if (ChronoUnit.DAYS.between(from, to) > MAX_PERIOD_DAYS) {
            throw new IllegalArgumentException("El periodo consultado no puede ser mayor a un ano");
        }
    }
}
