package com.angelica.pos.cash.movement.service;

import com.angelica.pos.cash.movement.dto.CashMovementResponse;
import com.angelica.pos.cash.movement.dto.CurrentCashSummaryResponse;
import com.angelica.pos.cash.movement.dto.ManualCashMovementRequest;
import com.angelica.pos.cash.movement.entity.CashMovement;
import com.angelica.pos.cash.movement.entity.CashMovementDirection;
import com.angelica.pos.cash.movement.entity.CashMovementType;
import com.angelica.pos.cash.movement.exception.OpenCashSessionRequiredException;
import com.angelica.pos.cash.movement.mapper.CashMovementMapper;
import com.angelica.pos.cash.movement.repository.CashMovementRepository;
import com.angelica.pos.cash.session.entity.CashSession;
import com.angelica.pos.cash.session.entity.CashSessionStatus;
import com.angelica.pos.cash.session.exception.CashSessionNotFoundException;
import com.angelica.pos.cash.session.repository.CashSessionRepository;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.exception.UserNotFoundException;
import com.angelica.pos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CashMovementServiceImpl implements CashMovementService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final int MAX_AMOUNT_INTEGER_DIGITS = 10;
    private static final int MAX_AMOUNT_SCALE = 2;

    private final CashMovementRepository cashMovementRepository;
    private final CashSessionRepository cashSessionRepository;
    private final UserRepository userRepository;
    private final CashMovementMapper cashMovementMapper;

    @Override
    @Transactional
    public CashMovementResponse registerManualEntry(
            ManualCashMovementRequest request,
            AuthenticatedUser authenticatedUser
    ) {
        return registerManualMovement(
                request,
                authenticatedUser,
                CashMovementDirection.INFLOW,
                CashMovementType.MANUAL_ENTRY
        );
    }

    @Override
    @Transactional
    public CashMovementResponse registerManualExit(
            ManualCashMovementRequest request,
            AuthenticatedUser authenticatedUser
    ) {
        return registerManualMovement(
                request,
                authenticatedUser,
                CashMovementDirection.OUTFLOW,
                CashMovementType.MANUAL_EXIT
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CashMovementResponse> findCurrentSessionMovements(
            AuthenticatedUser authenticatedUser,
            Pageable pageable
    ) {
        validatePageSize(pageable);
        CashSession cashSession = findOpenCashSession(authenticatedUser.getId());
        Page<CashMovement> movementsPage = cashMovementRepository.findByCashSessionIdOrderByCreatedAtDesc(
                cashSession.getId(),
                pageable
        );

        return toPageResponse(movementsPage);
    }

    @Override
    @Transactional(readOnly = true)
    public CurrentCashSummaryResponse getCurrentSessionSummary(AuthenticatedUser authenticatedUser) {
        CashSession cashSession = findOpenCashSession(authenticatedUser.getId());
        BigDecimal openingAmount = cashSession.getOpeningAmount();
        BigDecimal totalInflows = getTotalByDirection(cashSession.getId(), CashMovementDirection.INFLOW);
        BigDecimal totalOutflows = getTotalByDirection(cashSession.getId(), CashMovementDirection.OUTFLOW);
        BigDecimal expectedCash = openingAmount.add(totalInflows).subtract(totalOutflows);

        return CurrentCashSummaryResponse.builder()
                .sessionId(cashSession.getId())
                .openingAmount(openingAmount)
                .totalInflows(totalInflows)
                .totalOutflows(totalOutflows)
                .expectedCash(expectedCash)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CashMovementResponse> findSessionMovements(Long sessionId, Pageable pageable) {
        validatePageSize(pageable);
        if (!cashSessionRepository.existsById(sessionId)) {
            throw new CashSessionNotFoundException(sessionId);
        }

        Page<CashMovement> movementsPage = cashMovementRepository.findByCashSessionIdOrderByCreatedAtDesc(
                sessionId,
                pageable
        );

        return toPageResponse(movementsPage);
    }

    private CashMovementResponse registerManualMovement(
            ManualCashMovementRequest request,
            AuthenticatedUser authenticatedUser,
            CashMovementDirection direction,
            CashMovementType type
    ) {
        validateManualRequest(request);

        Long userId = authenticatedUser.getId();
        CashSession cashSession = findOpenCashSession(userId);
        User user = userRepository.findByIdAndActiveTrue(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        CashMovement cashMovement = cashMovementMapper.toEntity(request);
        cashMovement.setCashSession(cashSession);
        cashMovement.setCreatedBy(user);
        cashMovement.setDirection(direction);
        cashMovement.setType(type);
        cashMovement.setDescription(request.getDescription().trim());

        CashMovement savedMovement = cashMovementRepository.save(cashMovement);
        return cashMovementMapper.toResponse(savedMovement);
    }

    private CashSession findOpenCashSession(Long userId) {
        return cashSessionRepository.findByOpenedByIdAndStatus(userId, CashSessionStatus.OPEN)
                .orElseThrow(OpenCashSessionRequiredException::new);
    }

    private BigDecimal getTotalByDirection(Long cashSessionId, CashMovementDirection direction) {
        BigDecimal total = cashMovementRepository.sumAmountByCashSessionIdAndDirection(cashSessionId, direction);
        return total == null ? BigDecimal.ZERO : total;
    }

    private PageResponse<CashMovementResponse> toPageResponse(Page<CashMovement> movementsPage) {
        List<CashMovementResponse> content = cashMovementMapper.toResponseList(movementsPage.getContent());

        return PageResponse.<CashMovementResponse>builder()
                .content(content)
                .page(movementsPage.getNumber())
                .size(movementsPage.getSize())
                .totalElements(movementsPage.getTotalElements())
                .totalPages(movementsPage.getTotalPages())
                .first(movementsPage.isFirst())
                .last(movementsPage.isLast())
                .build();
    }

    private void validateManualRequest(ManualCashMovementRequest request) {
        if (request.getAmount() == null) {
            throw new IllegalArgumentException("Amount is required");
        }
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        if (request.getAmount().stripTrailingZeros().scale() > MAX_AMOUNT_SCALE) {
            throw new IllegalArgumentException("Amount must have up to 2 decimals");
        }
        if (getIntegerDigits(request.getAmount()) > MAX_AMOUNT_INTEGER_DIGITS) {
            throw new IllegalArgumentException("Amount must have up to 10 integer digits");
        }
        if (request.getDescription() == null || request.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Description is required");
        }
    }

    private int getIntegerDigits(BigDecimal amount) {
        BigDecimal normalizedAmount = amount.stripTrailingZeros();
        return Math.max(normalizedAmount.precision() - normalizedAmount.scale(), 1);
    }

    private void validatePageSize(Pageable pageable) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("El tamano de pagina no debe superar " + MAX_PAGE_SIZE + " registros");
        }
    }
}
