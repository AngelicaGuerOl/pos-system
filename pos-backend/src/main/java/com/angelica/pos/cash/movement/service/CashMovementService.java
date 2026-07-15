package com.angelica.pos.cash.movement.service;

import com.angelica.pos.cash.movement.dto.CashMovementResponse;
import com.angelica.pos.cash.movement.dto.CurrentCashSummaryResponse;
import com.angelica.pos.cash.movement.dto.ManualCashMovementRequest;
import com.angelica.pos.cash.movement.entity.CashMovement;
import com.angelica.pos.cash.session.entity.CashSession;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.user.entity.User;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface CashMovementService {

    CashMovementResponse registerManualEntry(ManualCashMovementRequest request, AuthenticatedUser authenticatedUser);

    CashMovementResponse registerManualExit(ManualCashMovementRequest request, AuthenticatedUser authenticatedUser);

    PageResponse<CashMovementResponse> findCurrentSessionMovements(
            AuthenticatedUser authenticatedUser,
            Pageable pageable
    );

    CurrentCashSummaryResponse getCurrentSessionSummary(AuthenticatedUser authenticatedUser);

    PageResponse<CashMovementResponse> findSessionMovements(Long sessionId, Pageable pageable);

    CashMovement registerCashSale(CashSession cashSession, User user, BigDecimal amount, Long saleId);

    CashMovement registerReceivablePayment(CashSession cashSession, User user, BigDecimal amount, Long paymentId);

    CashMovement registerSaleRefund(CashSession cashSession, User user, BigDecimal amount, Long saleReturnId);

    CashMovement registerSaleCancellationRefund(
            CashSession cashSession,
            User user,
            BigDecimal amount,
            Long saleCancellationId
    );
}
