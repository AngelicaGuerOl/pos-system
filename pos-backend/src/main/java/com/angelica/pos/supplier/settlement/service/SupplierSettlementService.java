package com.angelica.pos.supplier.settlement.service;

import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.supplier.settlement.dto.SupplierSettlementCreateRequest;
import com.angelica.pos.supplier.settlement.dto.SupplierSettlementResponse;
import com.angelica.pos.supplier.settlement.dto.SupplierSettlementUpdateRequest;
import com.angelica.pos.supplier.settlement.entity.SupplierSettlementStatus;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface SupplierSettlementService {

    SupplierSettlementResponse create(SupplierSettlementCreateRequest request, AuthenticatedUser authenticatedUser);

    SupplierSettlementResponse update(Long id, SupplierSettlementUpdateRequest request);

    SupplierSettlementResponse finalize(Long id, AuthenticatedUser authenticatedUser);

    PageResponse<SupplierSettlementResponse> findAll(
            Long supplierId,
            SupplierSettlementStatus status,
            LocalDate from,
            LocalDate to,
            Pageable pageable
    );

    SupplierSettlementResponse findById(Long id);
}
