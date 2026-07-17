package com.angelica.pos.supplier.entry.service;

import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.supplier.entry.dto.SupplierEntryRequest;
import com.angelica.pos.supplier.entry.dto.SupplierEntryResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface SupplierEntryService {

    SupplierEntryResponse create(SupplierEntryRequest request, AuthenticatedUser authenticatedUser);

    PageResponse<SupplierEntryResponse> findAll(Long supplierId, LocalDate from, LocalDate to, Long productId, Pageable pageable);

    SupplierEntryResponse findById(Long id);
}
