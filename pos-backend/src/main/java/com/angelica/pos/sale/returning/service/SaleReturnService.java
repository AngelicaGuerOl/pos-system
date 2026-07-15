package com.angelica.pos.sale.returning.service;

import com.angelica.pos.sale.returning.dto.SaleReturnDetailResponse;
import com.angelica.pos.sale.returning.dto.SaleReturnRequest;
import com.angelica.pos.sale.returning.dto.SaleReturnSummaryResponse;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface SaleReturnService {

    SaleReturnDetailResponse create(Long saleId, SaleReturnRequest request, AuthenticatedUser authenticatedUser);

    PageResponse<SaleReturnSummaryResponse> findBySale(
            Long saleId,
            AuthenticatedUser authenticatedUser,
            Pageable pageable
    );

    SaleReturnDetailResponse findById(Long returnId, AuthenticatedUser authenticatedUser);
}
