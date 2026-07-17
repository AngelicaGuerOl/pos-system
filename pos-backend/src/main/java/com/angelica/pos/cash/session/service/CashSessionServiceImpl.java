package com.angelica.pos.cash.session.service;

import com.angelica.pos.cash.movement.exception.OpenCashSessionRequiredException;
import com.angelica.pos.cash.movement.repository.CashMovementRepository;
import com.angelica.pos.cash.session.dto.CashMovementClosingTotals;
import com.angelica.pos.cash.session.dto.CashSessionCloseRequest;
import com.angelica.pos.cash.session.dto.CashSessionClosingSummaryResponse;
import com.angelica.pos.cash.session.dto.CashSessionOpenRequest;
import com.angelica.pos.cash.session.dto.CashSessionResponse;
import com.angelica.pos.cash.session.dto.OperationsClosingTotals;
import com.angelica.pos.cash.session.dto.SalesClosingTotals;
import com.angelica.pos.cash.session.entity.CashSession;
import com.angelica.pos.cash.session.entity.CashSessionStatus;
import com.angelica.pos.cash.session.exception.CashSessionAlreadyOpenException;
import com.angelica.pos.cash.session.exception.CashSessionInconsistentStateException;
import com.angelica.pos.cash.session.exception.CashSessionNotFoundException;
import com.angelica.pos.cash.session.mapper.CashSessionMapper;
import com.angelica.pos.cash.session.repository.CashSessionRepository;
import com.angelica.pos.sale.cancellation.repository.SaleCancellationRepository;
import com.angelica.pos.sale.repository.SaleRepository;
import com.angelica.pos.sale.returning.repository.SaleReturnRepository;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.exception.UserNotFoundException;
import com.angelica.pos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CashSessionServiceImpl implements CashSessionService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final int MAX_AMOUNT_INTEGER_DIGITS = 10;
    private static final int MAX_AMOUNT_SCALE = 2;

    private final CashSessionRepository cashSessionRepository;
    private final CashMovementRepository cashMovementRepository;
    private final SaleRepository saleRepository;
    private final SaleReturnRepository saleReturnRepository;
    private final SaleCancellationRepository saleCancellationRepository;
    private final UserRepository userRepository;
    private final CashSessionMapper cashSessionMapper;

    @Override
    @Transactional
    public CashSessionResponse open(CashSessionOpenRequest request, AuthenticatedUser authenticatedUser) {
        Long userId = authenticatedUser.getId();
        if (cashSessionRepository.existsByOpenedByIdAndStatus(userId, CashSessionStatus.OPEN)) {
            throw new CashSessionAlreadyOpenException(userId);
        }

        User user = userRepository.findByIdAndActiveTrue(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        CashSession cashSession = CashSession.builder()
                .openedBy(user)
                .openingAmount(request.getOpeningAmount())
                .status(CashSessionStatus.OPEN)
                .build();

        try {
            CashSession savedCashSession = cashSessionRepository.saveAndFlush(cashSession);
            return cashSessionMapper.toResponse(savedCashSession);
        } catch (DataIntegrityViolationException exception) {
            throw new CashSessionAlreadyOpenException(userId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CashSessionResponse> findCurrent(AuthenticatedUser authenticatedUser) {
        return cashSessionRepository.findByOpenedByIdAndStatus(authenticatedUser.getId(), CashSessionStatus.OPEN)
                .map(cashSessionMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CashSessionClosingSummaryResponse getCurrentClosingPreview(AuthenticatedUser authenticatedUser) {
        User user = findActiveUser(authenticatedUser.getId());
        CashSession cashSession = cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN)
                .orElseThrow(OpenCashSessionRequiredException::new);

        return buildLiveSummary(cashSession, null, null);
    }

    @Override
    @Transactional
    public CashSessionClosingSummaryResponse closeCurrent(
            CashSessionCloseRequest request,
            AuthenticatedUser authenticatedUser
    ) {
        BigDecimal countedAmount = validateCountedAmount(request);
        User user = findActiveUser(authenticatedUser.getId());
        CashSession cashSession = cashSessionRepository.findByOpenedByIdAndStatusForUpdate(
                        user.getId(),
                        CashSessionStatus.OPEN
                )
                .orElseThrow(OpenCashSessionRequiredException::new);

        CashSessionClosingSummaryResponse preview = buildLiveSummary(cashSession, null, null);
        BigDecimal expectedAmount = preview.getCashSummary().getExpectedAmount();
        BigDecimal differenceAmount = countedAmount.subtract(expectedAmount);
        String notes = normalizeClosingNotes(request == null ? null : request.getNotes());

        cashSession.setExpectedCash(expectedAmount);
        cashSession.setCountedCash(countedAmount);
        cashSession.setCashDifference(differenceAmount);
        cashSession.setCashSalesAmount(preview.getCashSummary().getCashSalesAmount());
        cashSession.setCreditSalesAmount(preview.getSalesSummary().getCreditSalesAmount());
        cashSession.setReceivablePaymentsAmount(preview.getCashSummary().getReceivablePaymentsAmount());
        cashSession.setManualInflowsAmount(preview.getCashSummary().getManualInflowsAmount());
        cashSession.setManualOutflowsAmount(preview.getCashSummary().getManualOutflowsAmount());
        cashSession.setSaleRefundsAmount(preview.getCashSummary().getSaleRefundsAmount());
        cashSession.setSaleCancellationRefundsAmount(preview.getCashSummary().getSaleCancellationRefundsAmount());
        cashSession.setTotalInflows(preview.getCashSummary().getTotalInflows());
        cashSession.setTotalOutflows(preview.getCashSummary().getTotalOutflows());
        cashSession.setReturnsProcessedAmount(preview.getOperationsSummary().getReturnsProcessedAmount());
        cashSession.setCancellationsProcessedAmount(preview.getOperationsSummary().getCancellationsProcessedAmount());
        cashSession.setClosingNotes(notes);
        cashSession.setClosedAt(OffsetDateTime.now());
        cashSession.setClosedBy(user);
        cashSession.setStatus(CashSessionStatus.CLOSED);

        CashSession savedCashSession = cashSessionRepository.saveAndFlush(cashSession);
        return buildSnapshotSummary(savedCashSession);
    }

    @Override
    @Transactional(readOnly = true)
    public CashSessionClosingSummaryResponse getClosingSummary(Long sessionId) {
        CashSession cashSession = cashSessionRepository.findByIdWithUsers(sessionId)
                .orElseThrow(() -> new CashSessionNotFoundException(sessionId));
        if (cashSession.getStatus() != CashSessionStatus.CLOSED) {
            throw new CashSessionInconsistentStateException(sessionId);
        }
        validateClosedSnapshot(cashSession);
        return buildSnapshotSummary(cashSession);
    }

    @Override
    @Transactional(readOnly = true)
    public CashSessionResponse findById(Long id) {
        CashSession cashSession = cashSessionRepository.findById(id)
                .orElseThrow(() -> new CashSessionNotFoundException(id));
        return cashSessionMapper.toResponse(cashSession);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CashSessionResponse> findAll(Pageable pageable) {
        validatePageSize(pageable);

        Page<CashSession> cashSessionsPage = cashSessionRepository.findAll(pageable);
        List<CashSessionResponse> content = cashSessionMapper.toResponseList(cashSessionsPage.getContent());

        return PageResponse.<CashSessionResponse>builder()
                .content(content)
                .page(cashSessionsPage.getNumber())
                .size(cashSessionsPage.getSize())
                .totalElements(cashSessionsPage.getTotalElements())
                .totalPages(cashSessionsPage.getTotalPages())
                .first(cashSessionsPage.isFirst())
                .last(cashSessionsPage.isLast())
                .build();
    }

    private void validatePageSize(Pageable pageable) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("El tamano de pagina no debe superar " + MAX_PAGE_SIZE + " registros");
        }
    }

    private CashSessionClosingSummaryResponse buildLiveSummary(
            CashSession cashSession,
            BigDecimal countedAmount,
            BigDecimal differenceAmount
    ) {
        SalesClosingTotals salesTotals = saleRepository.sumClosingTotalsByCashSessionId(cashSession.getId());
        CashMovementClosingTotals cashTotals = cashMovementRepository.sumClosingTotalsByCashSessionId(cashSession.getId());
        OperationsClosingTotals returnTotals = saleReturnRepository.sumClosingTotalsByCashSessionId(cashSession.getId());
        OperationsClosingTotals cancellationTotals = saleCancellationRepository.sumClosingTotalsByCashSessionId(cashSession.getId());

        BigDecimal expectedAmount = cashSession.getOpeningAmount()
                .add(cashTotals.totalInflows())
                .subtract(cashTotals.totalOutflows());

        return CashSessionClosingSummaryResponse.builder()
                .sessionId(cashSession.getId())
                .status(cashSession.getStatus())
                .openedAt(cashSession.getOpenedAt())
                .closedAt(cashSession.getClosedAt())
                .openedByUsername(cashSession.getOpenedBy().getUsername())
                .closedByUsername(cashSession.getClosedBy() == null ? null : cashSession.getClosedBy().getUsername())
                .openingAmount(cashSession.getOpeningAmount())
                .salesSummary(buildSalesSummary(salesTotals))
                .operationsSummary(buildOperationsSummary(returnTotals, cancellationTotals))
                .cashSummary(buildCashSummary(cashTotals, expectedAmount))
                .countedAmount(countedAmount)
                .differenceAmount(differenceAmount)
                .notes(cashSession.getClosingNotes())
                .build();
    }

    private CashSessionClosingSummaryResponse buildSnapshotSummary(CashSession cashSession) {
        validateClosedSnapshot(cashSession);
        BigDecimal totalSalesAmount = cashSession.getCashSalesAmount().add(cashSession.getCreditSalesAmount());

        return CashSessionClosingSummaryResponse.builder()
                .sessionId(cashSession.getId())
                .status(cashSession.getStatus())
                .openedAt(cashSession.getOpenedAt())
                .closedAt(cashSession.getClosedAt())
                .openedByUsername(cashSession.getOpenedBy().getUsername())
                .closedByUsername(cashSession.getClosedBy().getUsername())
                .openingAmount(cashSession.getOpeningAmount())
                .salesSummary(CashSessionClosingSummaryResponse.SalesSummary.builder()
                        .cashSalesAmount(cashSession.getCashSalesAmount())
                        .creditSalesAmount(cashSession.getCreditSalesAmount())
                        .totalSalesAmount(totalSalesAmount)
                        .build())
                .operationsSummary(CashSessionClosingSummaryResponse.OperationsSummary.builder()
                        .returnsProcessedAmount(cashSession.getReturnsProcessedAmount())
                        .returnCashRefundAmount(cashSession.getSaleRefundsAmount())
                        .cancellationsProcessedAmount(cashSession.getCancellationsProcessedAmount())
                        .cancellationCashRefundAmount(cashSession.getSaleCancellationRefundsAmount())
                        .build())
                .cashSummary(CashSessionClosingSummaryResponse.CashSummary.builder()
                        .cashSalesAmount(cashSession.getCashSalesAmount())
                        .receivablePaymentsAmount(cashSession.getReceivablePaymentsAmount())
                        .manualInflowsAmount(cashSession.getManualInflowsAmount())
                        .totalInflows(cashSession.getTotalInflows())
                        .manualOutflowsAmount(cashSession.getManualOutflowsAmount())
                        .saleRefundsAmount(cashSession.getSaleRefundsAmount())
                        .saleCancellationRefundsAmount(cashSession.getSaleCancellationRefundsAmount())
                        .totalOutflows(cashSession.getTotalOutflows())
                        .expectedAmount(cashSession.getExpectedCash())
                        .build())
                .countedAmount(cashSession.getCountedCash())
                .differenceAmount(cashSession.getCashDifference())
                .notes(cashSession.getClosingNotes())
                .build();
    }

    private CashSessionClosingSummaryResponse.SalesSummary buildSalesSummary(SalesClosingTotals totals) {
        return CashSessionClosingSummaryResponse.SalesSummary.builder()
                .cashSalesAmount(totals.cashSalesAmount())
                .creditSalesAmount(totals.creditSalesAmount())
                .totalSalesAmount(totals.totalSalesAmount())
                .build();
    }

    private CashSessionClosingSummaryResponse.OperationsSummary buildOperationsSummary(
            OperationsClosingTotals returnTotals,
            OperationsClosingTotals cancellationTotals
    ) {
        return CashSessionClosingSummaryResponse.OperationsSummary.builder()
                .returnsProcessedAmount(returnTotals.processedAmount())
                .returnCashRefundAmount(returnTotals.cashRefundAmount())
                .cancellationsProcessedAmount(cancellationTotals.processedAmount())
                .cancellationCashRefundAmount(cancellationTotals.cashRefundAmount())
                .build();
    }

    private CashSessionClosingSummaryResponse.CashSummary buildCashSummary(
            CashMovementClosingTotals totals,
            BigDecimal expectedAmount
    ) {
        return CashSessionClosingSummaryResponse.CashSummary.builder()
                .cashSalesAmount(totals.cashSalesAmount())
                .receivablePaymentsAmount(totals.receivablePaymentsAmount())
                .manualInflowsAmount(totals.manualInflowsAmount())
                .totalInflows(totals.totalInflows())
                .manualOutflowsAmount(totals.manualOutflowsAmount())
                .saleRefundsAmount(totals.saleRefundsAmount())
                .saleCancellationRefundsAmount(totals.saleCancellationRefundsAmount())
                .totalOutflows(totals.totalOutflows())
                .expectedAmount(expectedAmount)
                .build();
    }

    private BigDecimal validateCountedAmount(CashSessionCloseRequest request) {
        if (request == null || request.getCountedAmount() == null) {
            throw new IllegalArgumentException("El efectivo contado es obligatorio");
        }
        BigDecimal countedAmount = request.getCountedAmount();
        if (countedAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El efectivo contado debe ser cero o positivo");
        }
        if (countedAmount.stripTrailingZeros().scale() > MAX_AMOUNT_SCALE) {
            throw new IllegalArgumentException("El efectivo contado debe tener hasta 2 decimales");
        }
        if (getIntegerDigits(countedAmount) > MAX_AMOUNT_INTEGER_DIGITS) {
            throw new IllegalArgumentException("El efectivo contado debe tener hasta 10 enteros");
        }
        return countedAmount;
    }

    private String normalizeClosingNotes(String notes) {
        String normalizedNotes = null;
        if (notes != null) {
            normalizedNotes = notes.trim();
            if (normalizedNotes.isEmpty()) {
                normalizedNotes = null;
            } else if (normalizedNotes.length() > 255) {
                throw new IllegalArgumentException("Las observaciones deben tener maximo 255 caracteres");
            }
        }
        return normalizedNotes;
    }

    private int getIntegerDigits(BigDecimal amount) {
        BigDecimal normalizedAmount = amount.stripTrailingZeros();
        return Math.max(normalizedAmount.precision() - normalizedAmount.scale(), 1);
    }

    private User findActiveUser(Long userId) {
        return userRepository.findByIdAndActiveTrue(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
    }

    private void validateClosedSnapshot(CashSession cashSession) {
        if (cashSession.getStatus() != CashSessionStatus.CLOSED
                || cashSession.getClosedAt() == null
                || cashSession.getClosedBy() == null
                || cashSession.getExpectedCash() == null
                || cashSession.getCountedCash() == null
                || cashSession.getCashDifference() == null
                || cashSession.getTotalInflows() == null
                || cashSession.getTotalOutflows() == null
                || cashSession.getCashSalesAmount() == null
                || cashSession.getCreditSalesAmount() == null
                || cashSession.getReceivablePaymentsAmount() == null
                || cashSession.getManualInflowsAmount() == null
                || cashSession.getManualOutflowsAmount() == null
                || cashSession.getSaleRefundsAmount() == null
                || cashSession.getSaleCancellationRefundsAmount() == null
                || cashSession.getReturnsProcessedAmount() == null
                || cashSession.getCancellationsProcessedAmount() == null) {
            throw new CashSessionInconsistentStateException(cashSession.getId());
        }
    }
}
