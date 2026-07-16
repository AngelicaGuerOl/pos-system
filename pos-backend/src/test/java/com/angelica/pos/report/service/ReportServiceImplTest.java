package com.angelica.pos.report.service;

import com.angelica.pos.report.dto.ReportCashTotals;
import com.angelica.pos.report.dto.ReportReceivableTotals;
import com.angelica.pos.report.dto.ReportSalesTotals;
import com.angelica.pos.report.repository.OperationsReportRepository;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.exception.UserNotFoundException;
import com.angelica.pos.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceImplTest {

    @Mock
    private OperationsReportRepository operationsReportRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ReportServiceImpl reportService;

    @Test
    void shouldRejectInvalidRange() {
        LocalDate from = LocalDate.of(2026, 7, 15);
        LocalDate to = LocalDate.of(2026, 7, 1);

        assertThatThrownBy(() -> reportService.getOperationsSummary(from, to, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("La fecha inicial no puede ser posterior a la fecha final");
    }

    @Test
    void shouldValidateCashierExistsWhenFilterIsProvided() {
        when(userRepository.findByIdAndActiveTrue(25L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reportService.getOperationsSummary(
                LocalDate.of(2026, 7, 1),
                LocalDate.of(2026, 7, 15),
                25L
        )).isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void shouldApplyCashierFilterToAggregates() {
        User cashier = User.builder()
                .id(7L)
                .username("angelica")
                .build();

        when(userRepository.findByIdAndActiveTrue(7L)).thenReturn(Optional.of(cashier));
        stubTotals();

        reportService.getOperationsSummary(
                LocalDate.of(2026, 7, 1),
                LocalDate.of(2026, 7, 15),
                7L
        );

        verify(operationsReportRepository).getSalesTotals(any(), any(), eq(7L));
        verify(operationsReportRepository).getReceivableTotals(any(), any(), eq(7L));
        verify(operationsReportRepository).getCashTotals(any(), any(), eq(7L));
    }

    @Test
    void shouldUseExclusiveUpperDateBoundary() {
        stubTotals();
        ArgumentCaptor<OffsetDateTime> fromCaptor = ArgumentCaptor.forClass(OffsetDateTime.class);
        ArgumentCaptor<OffsetDateTime> toCaptor = ArgumentCaptor.forClass(OffsetDateTime.class);

        reportService.getOperationsSummary(
                LocalDate.of(2026, 7, 1),
                LocalDate.of(2026, 7, 15),
                null
        );

        verify(operationsReportRepository).getSalesTotals(fromCaptor.capture(), toCaptor.capture(), eq(null));
        assertThat(fromCaptor.getValue().toLocalDate()).isEqualTo(LocalDate.of(2026, 7, 1));
        assertThat(toCaptor.getValue().toLocalDate()).isEqualTo(LocalDate.of(2026, 7, 16));
    }

    @Test
    void shouldCalculateOperationalAndCashFormulasFromAggregateTotals() {
        when(operationsReportRepository.getSalesTotals(any(), any(), eq(null)))
                .thenReturn(new ReportSalesTotals(
                        money("500.00"),
                        money("300.00"),
                        money("800.00"),
                        money("120.00"),
                        money("75.00"),
                        4,
                        2,
                        1
                ));
        when(operationsReportRepository.getReceivableTotals(any(), any(), eq(null)))
                .thenReturn(new ReportReceivableTotals(money("300.00"), money("90.00"), money("210.00")));
        when(operationsReportRepository.getCashTotals(any(), any(), eq(null)))
                .thenReturn(new ReportCashTotals(
                        money("500.00"),
                        money("90.00"),
                        money("40.00"),
                        money("20.00"),
                        money("35.00"),
                        money("10.00"),
                        money("630.00"),
                        money("65.00")
                ));

        var response = reportService.getOperationsSummary(
                LocalDate.of(2026, 7, 1),
                LocalDate.of(2026, 7, 15),
                null
        );

        assertThat(response.getSales().getCashSalesAmount()).isEqualByComparingTo("500.00");
        assertThat(response.getSales().getCreditSalesAmount()).isEqualByComparingTo("300.00");
        assertThat(response.getSales().getCancelledSalesAmount()).isEqualByComparingTo("120.00");
        assertThat(response.getSales().getNetSalesAmount()).isEqualByComparingTo("725.00");
        assertThat(response.getSales().getSalesCount()).isEqualTo(4);
        assertThat(response.getSales().getReturnsCount()).isEqualTo(2);
        assertThat(response.getSales().getCancellationsCount()).isEqualTo(1);
        assertThat(response.getReceivables().getCreditGeneratedAmount()).isEqualByComparingTo("300.00");
        assertThat(response.getCash().getCashSalesAmount()).isEqualByComparingTo("500.00");
        assertThat(response.getCash().getReceivablePaymentsAmount()).isEqualByComparingTo("90.00");
        assertThat(response.getCash().getReturnRefundsAmount()).isEqualByComparingTo("35.00");
        assertThat(response.getCash().getCancellationRefundsAmount()).isEqualByComparingTo("10.00");
        assertThat(response.getCash().getNetCashFlow()).isEqualByComparingTo("565.00");
    }

    private void stubTotals() {
        when(operationsReportRepository.getSalesTotals(any(), any(), any()))
                .thenReturn(new ReportSalesTotals(
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        0,
                        0,
                        0
                ));
        when(operationsReportRepository.getReceivableTotals(any(), any(), any()))
                .thenReturn(new ReportReceivableTotals(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
        when(operationsReportRepository.getCashTotals(any(), any(), any()))
                .thenReturn(new ReportCashTotals(
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO
                ));
    }

    private BigDecimal money(String value) {
        return new BigDecimal(value);
    }
}
