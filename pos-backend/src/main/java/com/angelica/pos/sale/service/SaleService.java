package com.angelica.pos.sale.service;

import com.angelica.pos.sale.dto.SaleRequest;
import com.angelica.pos.sale.dto.SaleResponse;
import com.angelica.pos.sale.entity.SaleStatus;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.OffsetDateTime;

public interface SaleService {

    SaleResponse create(SaleRequest request, AuthenticatedUser authenticatedUser);

    SaleResponse findById(Long id, AuthenticatedUser authenticatedUser);

    PageResponse<SaleResponse> findCurrentSession(AuthenticatedUser authenticatedUser, Pageable pageable);

    PageResponse<SaleResponse> findAll(
            Long id,
            Long customerId,
            Long createdByUserId,
            SaleStatus status,
            OffsetDateTime from,
            OffsetDateTime to,
            Pageable pageable
    );
}
