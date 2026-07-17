package com.angelica.pos.supplier.service;

import com.angelica.pos.catalog.product.dto.ProductResponse;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.supplier.dto.SupplierRequest;
import com.angelica.pos.supplier.dto.SupplierResponse;
import org.springframework.data.domain.Pageable;

public interface SupplierService {

    SupplierResponse create(SupplierRequest request);

    PageResponse<SupplierResponse> findAll(String search, Boolean active, Pageable pageable);

    SupplierResponse findById(Long id);

    SupplierResponse update(Long id, SupplierRequest request);

    void deactivate(Long id);

    PageResponse<ProductResponse> findProducts(Long supplierId, String search, Pageable pageable);
}
