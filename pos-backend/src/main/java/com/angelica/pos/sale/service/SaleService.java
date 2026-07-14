package com.angelica.pos.sale.service;

import com.angelica.pos.sale.dto.SaleDetailResponse;
import com.angelica.pos.sale.dto.SaleRequest;
import com.angelica.pos.sale.dto.SaleResponse;
import com.angelica.pos.sale.dto.SaleSummaryResponse;
import com.angelica.pos.sale.entity.SaleStatus;
import com.angelica.pos.sale.entity.SaleType;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.OffsetDateTime;

public interface SaleService {

    SaleResponse create(SaleRequest request, AuthenticatedUser authenticatedUser);

    SaleDetailResponse findById(Long id, AuthenticatedUser authenticatedUser);

    PageResponse<SaleSummaryResponse> findCurrentSession(AuthenticatedUser authenticatedUser, Pageable pageable);

    PageResponse<SaleSummaryResponse> findAll(
            Long id,
            Long customerId,
            Long createdByUserId,
            SaleStatus status,
            SaleType saleType,
            OffsetDateTime from,
            OffsetDateTime to,
            Pageable pageable
    );
}
