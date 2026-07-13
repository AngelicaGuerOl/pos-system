package com.angelica.pos.cash.session.service;

import com.angelica.pos.cash.session.dto.CashSessionOpenRequest;
import com.angelica.pos.cash.session.dto.CashSessionResponse;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface CashSessionService {

    CashSessionResponse open(CashSessionOpenRequest request, AuthenticatedUser authenticatedUser);

    Optional<CashSessionResponse> findCurrent(AuthenticatedUser authenticatedUser);

    CashSessionResponse findById(Long id);

    PageResponse<CashSessionResponse> findAll(Pageable pageable);
}
