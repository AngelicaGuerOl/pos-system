package com.angelica.pos.cash.movement.service;

import com.angelica.pos.cash.movement.dto.CashMovementResponse;
import com.angelica.pos.cash.movement.dto.CurrentCashSummaryResponse;
import com.angelica.pos.cash.movement.dto.ManualCashMovementRequest;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface CashMovementService {

    CashMovementResponse registerManualEntry(ManualCashMovementRequest request, AuthenticatedUser authenticatedUser);

    CashMovementResponse registerManualExit(ManualCashMovementRequest request, AuthenticatedUser authenticatedUser);

    PageResponse<CashMovementResponse> findCurrentSessionMovements(
            AuthenticatedUser authenticatedUser,
            Pageable pageable
    );

    CurrentCashSummaryResponse getCurrentSessionSummary(AuthenticatedUser authenticatedUser);

    PageResponse<CashMovementResponse> findSessionMovements(Long sessionId, Pageable pageable);
}
